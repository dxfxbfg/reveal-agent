export function parseLLMJson(raw, fallback = {}) {
  try {
    let jsonStr = raw;

    let jsonMatch = raw.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      jsonMatch = raw.match(/```\s*\n?([\s\S]*?)```/);
      if (jsonMatch) {
        const extracted = jsonMatch[1].trim();
        if (extracted.startsWith('{')) {
          jsonStr = extracted;
        }
      }
    }

    return JSON.parse(jsonStr.trim());
  } catch (err) {
    console.warn('[parseLLMJson] JSON parse failed, using fallback:', err.message);
    return fallback;
  }
}
