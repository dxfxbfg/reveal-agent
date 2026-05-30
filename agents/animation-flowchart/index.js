/**
 * Animation Flowchart Agent — HTML 内容 → 流程图风格重构
 *
 * 隔离策略：
 * - 独立 agent，不修改现有 5-agent 流水线
 * - 模板来自 AI-Animation-Skill-AI.1.1.0/assets/templates/Animation/
 * - 输出到 output/animation/
 */

import { callLLM } from '../../backend/utils/llm-client.js';
import { MINIMAX_MODELS } from '../../backend/utils/ai-client.js';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', '..', 'AI-Animation-Skill-AI.1.1.0', 'assets', 'templates', 'Animation');

function readSkillFile(filename) {
  try {
    return readFileSync(join(__dirname, '..', '..', 'skills', filename), 'utf-8');
  } catch {
    return '';
  }
}

function listAnimationTemplates() {
  if (!existsSync(TEMPLATES_DIR)) return [];
  return readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html'));
}

function readSummarySafe() {
  const p = join(TEMPLATES_DIR, 'SUMMARY.md');
  try {
    return readFileSync(p, 'utf-8');
  } catch {
    return '';
  }
}

export async function run({ html, message = '', modelConfig = null, templatePreference = 'RNN-3.html' }) {
  const systemPrompt = readSkillFile('animation-flowchart-prompt.md');
  const summaryMd = readSummarySafe();
  const templates = listAnimationTemplates();

  const templateList = templates.map(t => `  - ${t}`).join('\n');

  const defaultTemplate = templates.includes(templatePreference) ? templatePreference : (templates[0] || 'RNN-3.html');

  const prompt = [
    systemPrompt,
    '',
    '## 可用模板列表',
    templateList,
    '',
    `## 选定模板: ${defaultTemplate}`,
    '',
    '## 模板选择参考 (SUMMARY.md)',
    summaryMd.slice(0, 3000),
    '',
    '## 用户指令',
    message || '将内容按流程图风格呈现',
    '',
    '## 原始 HTML（需重构的内容来源）',
    html.length > 10000 ? html.slice(0, 10000) + '\n...(内容已截断)' : html,
    '',
    '请将原始 HTML 的内容按选定模板的平面 UI 样式重构。',
    '直接输出完整 HTML，不要包裹 markdown 代码块。',
  ].filter(Boolean).join('\n');

  const result = await callLLM({
    prompt,
    system: '你是流程图动画重构专家。只输出完整 HTML 代码。',
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
