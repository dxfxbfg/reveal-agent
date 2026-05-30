/**
 * Quality Router v3 — 简化版
 *
 * 两级：
 *   fast:   仅 code-generator（跳过研究和反馈，最快速度）
 *   normal: 研究（requirement-analyzer + info-collector）+ 生成 + 反馈
 */

const QUALITY_TIERS = {
  fast:   { label: '快速', agents: [] },
  normal: { label: '完整', agents: ['requirement-analyzer', 'info-collector'] },
};

const MAX_TOKENS = 32000;

export function resolveConfig(qualityTier = 'normal') {
  const quality = QUALITY_TIERS[qualityTier] || QUALITY_TIERS.normal;
  return {
    agents: quality.agents,
    maxTokens: MAX_TOKENS,
  };
}
