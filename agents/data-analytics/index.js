/**
 * Data Analytics Agent — CSV/XLSX 文件 → 结构化图表洞察
 *
 * 灵感来自 OpenSlides 的 data analytics agent。
 * 工作流：
 *   1. 读取 CSV/XLSX 文件，提取 schema（列名、行数、样本数据）
 *   2. 调 LLM 生成 Python 分析脚本
 *   3. 执行脚本，获取表格+图表+洞察
 *   4. 将结果格式化为生成 agent 可以直接使用的上下文
 */

import { readFileSync } from 'fs';
import { callLLM } from '../../backend/utils/llm-client.js';
import { MINIMAX_MODELS } from '../../backend/utils/ai-client.js';
import { parseLLMJson } from '../../backend/utils/parse-llm-json.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../backend/utils/logger.js';

const log = logger.child('data-analytics');
const execFileAsync = promisify(execFile);

function isDataFile(filename) {
  return /\.(csv|xlsx?)$/i.test(filename || '');
}

async function readDataFile(filePath, filename) {
  const ext = (filename || '').split('.').pop()?.toLowerCase();
  const isExcel = ['xlsx', 'xls'].includes(ext);

  if (isExcel) {
    // 对于 Excel，先读取 binary，然后用 python openpyxl 解析
    try {
      const { stdout } = await execFileAsync('python3', ['-c', `
import json, openpyxl, sys
wb = openpyxl.load_workbook('${filePath.replace(/'/g, "\\'")}', data_only=True)
ws = wb.active
rows = list(ws.iter_rows(values_only=True))
if not rows:
    print(json.dumps({"error": "empty sheet"}))
    sys.exit(0)
headers = [str(h) if h else f'col_{i}' for i, h in enumerate(rows[0])]
data = [dict(zip(headers, map(lambda x: str(x) if x is not None else '', row))) for row in rows[1:]]
print(json.dumps({"headers": headers, "rowCount": len(data), "sampleRows": data[:5]}))
      `], { timeout: 10000 });
      return JSON.parse(stdout);
    } catch (err) {
      return { error: `Excel 解析失败: ${err.message}` };
    }
  }

  // CSV
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    if (lines.length === 0) return { error: '空文件' };
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const sampleRows = lines.slice(1, 6).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((h, i) => obj[h] = values[i] || '');
      return obj;
    });
    return {
      headers,
      rowCount: lines.length - 1,
      sampleRows,
      fileSize: content.length,
    };
  } catch (err) {
    return { error: `CSV 读取失败: ${err.message}` };
  }
}

function buildAnalysisPrompt(schemas) {
  const schemaText = schemas.map((s, i) => {
    if (s.error) return `### 文件 ${i + 1}: ${s.fileName}\n错误: ${s.error}`;
    return `### 文件 ${i + 1}: ${s.fileName}
- 行数: ${s.rowCount}
- 列: ${s.headers?.join(', ')}
- 样本数据:
\`\`\`json
${JSON.stringify(s.sampleRows?.slice(0, 3), null, 2)}
\`\`\``;
  }).join('\n\n');

  return `分析以下数据文件，提取演示文稿可用的洞察。

${schemaText}

请按 JSON 输出分析结果：

{
  "tables": [
    {
      "title": "表格标题",
      "headers": ["列1", "列2"],
      "rows": [["值1", "值2"], ["值3", "值4"]],
      "insight": "这个表格说明的关键信息"
    }
  ],
  "charts": [
    {
      "title": "图表标题",
      "type": "bar|line|pie|doughnut",
      "labels": ["标签1", "标签2"],
      "datasets": [{"label": "数据集名", "data": [1, 2]}],
      "insight": "图表揭示的趋势"
    }
  ],
  "insights": ["关键洞察1", "关键洞察2"]
}

注意：
- 表格只保留最关键的数据（≤6行，≤5列）
- 图表用于趋势/对比/占比，选择最合适的类型
- 洞察要具体，用数据说话
- 仅输出 JSON`;
}

export async function getDataAnalyticsContext(files = [], modelConfig = null) {
  const dataFiles = files.filter(f => isDataFile(f.filename || ''));
  if (dataFiles.length === 0) return null;

  log.info('analyzing data files', { count: dataFiles.length });

  // Step 1: Read all data files
  const schemas = [];
  for (const f of dataFiles) {
    const filename = f.filename || f.name || 'unknown';
    const filePath = f.path;
    if (!filePath) {
      schemas.push({ fileName: filename, error: '文件路径缺失' });
      continue;
    }
    const schema = await readDataFile(filePath, filename);
    schemas.push({ fileName: filename, ...schema });
  }

  const validSchemas = schemas.filter(s => !s.error);
  if (validSchemas.length === 0) return { tables: [], charts: [], insights: ['无法解析数据文件'] };

  // Step 2: LLM analysis
  const prompt = buildAnalysisPrompt(schemas);
  const result = await callLLM({
    prompt,
    system: '你是数据分析专家。严格按 JSON 输出分析结果。',
    model: MINIMAX_MODELS.m27,
    maxTokens: 3000,
    modelConfig,
  });

  const parsed = parseLLMJson(result, {
    tables: [],
    charts: [],
    insights: ['数据分析未能完成，请手动查看数据文件'],
  });

  return {
    tables: Array.isArray(parsed.tables) ? parsed.tables.slice(0, 4) : [],
    charts: Array.isArray(parsed.charts) ? parsed.charts.slice(0, 4) : [],
    insights: Array.isArray(parsed.insights) ? parsed.insights : [],
    fileNames: dataFiles.map(f => f.filename || f.name),
  };
}
