import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, '..', '..', 'skills');

function readSkill(filename) {
  try {
    return readFileSync(join(SKILLS_DIR, filename), 'utf-8');
  } catch {
    return `[${filename} 未找到]`;
  }
}

const AGENT_PROMPT_FILES = {
  'requirement-analyzer': 'requirement-analyzer-prompt.md',
  'info-collector': 'info-collector-prompt.md',
  'visual-designer': 'visual-designer-prompt.md',
  'synthesizer': 'synthesizer-prompt.md',
  'code-generator': 'code-generator-prompt.md',
};

const AGENT_WIKI_FILES = {
  'requirement-analyzer': 'requirement-analyzer.md',
  'pm-requirement-analyzer': 'pm-requirement-cleaner.md',
  'info-collector': null,
  'visual-designer': 'visual-designer.md',
  'synthesizer': 'synthesizer.md',
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
