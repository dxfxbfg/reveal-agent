/**
 * Agent Context Loader v3 — 去掉 RAG/ChromaDB 依赖
 *
 * 只做两件事：
 *   1. 加载 agent system prompt（从 skills/*.md 文件系统直接读）
 *   2. 加载 agent wiki（从 skills/*.md 文件系统直接读）
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, '..', '..', 'skills');

function readSkill(filename) {
  try {
    return readFileSync(join(SKILLS_DIR, filename), 'utf-8');
  } catch {
    return '';
  }
}

const AGENT_PROMPT_FILES = {
  'requirement-analyzer': 'requirement-analyzer-prompt.md',
  'info-collector': 'info-collector-prompt.md',
  'code-generator': 'code-generator-prompt.md',
};

const AGENT_WIKI_FILES = {
  'requirement-analyzer': 'requirement-analyzer.md',
  'pm-requirement-analyzer': 'pm-requirement-cleaner.md',
  'info-collector': null,
  'code-generator': 'code-generator.md',
};

export function getAgentSystemPrompt(agentName) {
  const filename = AGENT_PROMPT_FILES[agentName] || AGENT_PROMPT_FILES['code-generator'];
  return readSkill(filename);
}

export async function getAgentWiki(agentName) {
  const filename = AGENT_WIKI_FILES[agentName];
  if (!filename) return '';
  return readSkill(filename);
}

export async function initAgentContext(agentName, _ragQuery, _ragTopK = 5) {
  const [system, wiki] = await Promise.all([
    Promise.resolve(getAgentSystemPrompt(agentName)),
    getAgentWiki(agentName),
  ]);

  return { system, wiki, skill: '' };
}
