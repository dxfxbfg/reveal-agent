/**
 * Tool Registry — 全局工具注册中心
 *
 * 注册工具 → Agent 声明所需工具 → Engine 调度执行
 */

class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  register(definition, handler) {
    if (this.tools.has(definition.name)) {
      console.warn(`[registry] 覆盖已注册工具: ${definition.name}`);
    }
    this.tools.set(definition.name, { definition, handler });
    console.log(`[registry] 注册工具: ${definition.name}`);
  }

  getDefinitions(names = null) {
    const tools = names
      ? names.map(n => this.tools.get(n)).filter(Boolean)
      : [...this.tools.values()];

    return tools.map(t => ({
      type: 'function',
      function: {
        name: t.definition.name,
        description: t.definition.description,
        parameters: t.definition.parameters,
      },
    }));
  }

  async execute(name, args) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`工具未注册: ${name}`);
    return tool.handler(args);
  }

  has(name) {
    return this.tools.has(name);
  }

  list() {
    return [...this.tools.keys()];
  }
}

export const registry = new ToolRegistry();