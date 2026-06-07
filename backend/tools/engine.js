/**
 * Tool Execution Engine — Agent 工具调用循环
 *
 * 核心循环:
 *   1. 构造 messages（system + user prompt）
 *   2. 调 LLM（携带 tools 定义）
 *   3. 如果 LLM 返回 tool_calls → 执行工具 → 结果追加到 messages → 回到 2
 *   4. 如果 LLM 返回普通文本 → 终止，返回结果
 */

import { callLLMWithTools, callLLM } from '../utils/llm-client.js';
import { MINIMAX_MODELS } from '../utils/ai-client.js';
import { registry } from './registry.js';
import { logger } from '../utils/logger.js';

const log = logger.child('tools:engine');
const DEFAULT_MAX_ITERATIONS = 6;

export async function runAgentWithTools({
  model = MINIMAX_MODELS.m27,
  system = '',
  prompt,
  toolNames = [],
  maxTokens = 8000,
  maxIterations = DEFAULT_MAX_ITERATIONS,
}) {
  const tools = toolNames.map(name => registry.tools.get(name)).filter(Boolean);

  if (tools.length === 0 && toolNames.length > 0) {
    const missing = toolNames.filter(n => !registry.has(n));
    throw new Error(`工具未注册: ${missing.join(', ')}`);
  }

  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const toolDefs = tools.map(t => t.definition);

  for (let i = 0; i < maxIterations; i++) {
    const msg = toolDefs.length > 0
      ? await callLLMWithTools({ messages, model, maxTokens, tools: toolDefs })
      : { content: await callLLM({ prompt, system, model, maxTokens }) };

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      messages.push({
        role: 'assistant',
        content: msg.content || '',
        tool_calls: msg.tool_calls,
      });

      for (const tc of msg.tool_calls) {
        let args = {};
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = {};
        }

        log.info('tool_call', { iteration: i, name: tc.function.name });

        let result;
        try {
          result = await registry.execute(tc.function.name, args);
        } catch (err) {
          result = `工具执行错误: ${err.message}`;
        }

        const content = typeof result === 'string' ? result : JSON.stringify(result);
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content,
        });
      }
    } else {
      return msg.content || '';
    }
  }

  return messages[messages.length - 1]?.content || '';
}

export async function runAgentWithToolsStreaming({
  model = MINIMAX_MODELS.m27,
  system = '',
  prompt,
  toolNames = [],
  maxTokens = 8000,
  maxIterations = DEFAULT_MAX_ITERATIONS,
  onToolCall = null,
}) {
  const tools = toolNames.map(name => registry.tools.get(name)).filter(Boolean);
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const toolDefs = tools.map(t => t.definition);
  const toolCallLog = [];

  for (let i = 0; i < maxIterations; i++) {
    const msg = toolDefs.length > 0
      ? await callLLMWithTools({ messages, model, maxTokens, tools: toolDefs })
      : { content: await callLLM({ prompt, system, model, maxTokens }) };

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      messages.push({
        role: 'assistant',
        content: msg.content || '',
        tool_calls: msg.tool_calls,
      });

      for (const tc of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }

        let result;
        try {
          result = await registry.execute(tc.function.name, args);
        } catch (err) {
          result = `工具执行错误: ${err.message}`;
        }

        const content = typeof result === 'string' ? result : JSON.stringify(result);
        const entry = { name: tc.function.name, args, result: content.slice(0, 1000) };

        toolCallLog.push(entry);

        if (onToolCall) {
          onToolCall(entry);
        }

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content,
        });
      }
    } else {
      return { content: msg.content || '', toolCalls: toolCallLog };
    }
  }

  const lastMsg = messages[messages.length - 1];
  return { content: lastMsg?.content || '', toolCalls: toolCallLog };
}