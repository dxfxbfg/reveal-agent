/**
 * Animation PPT Agent — 科普内容 → PPT 轮播动画 HTML
 *
 * 隔离策略：
 * - 独立 agent，不修改现有 5-agent 流水线
 * - 模板来自 AI-Animation-Skill-AI.1.1.0/assets/templates/
 * - 输出到 output/animation/
 */

import { callLLM } from '../../backend/utils/llm-client.js';
import { MINIMAX_MODELS } from '../../backend/utils/ai-client.js';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', '..', 'AI-Animation-Skill-AI.1.1.0', 'assets', 'templates');

function readSkillFile(filename) {
  try {
    return readFileSync(join(__dirname, '..', '..', 'skills', filename), 'utf-8');
  } catch {
    return '';
  }
}

function listAvailableTemplates(subDir) {
  const dir = join(TEMPLATES_DIR, subDir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.html')).map(f => `${subDir}/${f}`);
}

function readSummarySafe() {
  const p = join(TEMPLATES_DIR, 'PPT Template-level2', 'SUMMARY.md');
  try {
    return readFileSync(p, 'utf-8');
  } catch {
    return '';
  }
}

export async function run({ message, modelConfig = null, templatePreference = null }) {
  const systemPrompt = readSkillFile('animation-ppt-prompt.md');
  const summaryMd = readSummarySafe();

  const pptTemplates = listAvailableTemplates('PPT Template-level2');
  const fallbackTemplates = listAvailableTemplates('PPT');

  const templateList = [...pptTemplates, ...fallbackTemplates]
    .map(t => `  - ${t}`)
    .join('\n');

  const prompt = [
    systemPrompt,
    '',
    '## 可用模板列表',
    templateList,
    '',
    templatePreference ? `## 用户指定模板\n${templatePreference}` : '',
    '',
    '## 模板选择参考 (SUMMARY.md)',
    summaryMd.slice(0, 3000),
    '',
    '## 用户输入内容',
    message,
    '',
    '请按工作流程生成完整的 PPT 轮播动画 HTML。',
    '直接输出完整 HTML，不要包裹 markdown 代码块。',
  ].filter(Boolean).join('\n');

  const result = await callLLM({
    prompt,
    system: '你是科学内容 PPT 动画生成专家。只输出完整 HTML 代码。',
    model: MINIMAX_MODELS.m27,
    maxTokens: 16000,
    modelConfig,
  });

  return extractHTML(result);
}

function extractHTML(raw) {
  let m = raw.match(/```html\s*\n?([\s\S]*?)```/);
  if (m) return m[1].trim();

  m = raw.match(/```\s*\n?([\s\S]*?)```/);
  if (m && (m[1].includes('<!DOCTYPE') || m[1].includes('<html'))) {
    return m[1].trim();
  }

  const html = raw.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
  if (html) return html[0].trim();

  return raw.trim();
}
