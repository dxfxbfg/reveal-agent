import { registerWebSearchTool } from './web-search.js';
import { registerWebScrapeTool } from './web-scrape.js';
import { logger } from '../../utils/logger.js';

const log = logger.child('tools:init');

let initialized = false;

export function initTools() {
  if (initialized) return;
  registerWebSearchTool();
  registerWebScrapeTool();
  initialized = true;
  log.info('registered', { tools: ['web_search', 'web_scrape'] });
}
