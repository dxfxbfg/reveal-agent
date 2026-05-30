import { registerWebSearchTool } from './web-search.js';
import { registerWebScrapeTool } from './web-scrape.js';

let initialized = false;

export function initTools() {
  if (initialized) return;
  registerWebSearchTool();
  registerWebScrapeTool();
  initialized = true;
  console.log('[tools] registered: web_search, web_scrape');
}
