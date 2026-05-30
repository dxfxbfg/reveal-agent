# PM Requirement Cleaner — 需求清洗工作流

> 当用户的需求描述偏向「产品功能/系统设计/业务流程」时启用此模式。

## 核心价值
1. 先诊断需求缺口，再追问补全
2. 分离「事实 / 假设 / 待确认」
3. 输出可追溯的决策和范围边界

## 模式选择

| 模式 | 适用场景 |
|------|---------|
| `auto`（默认） | 常规需求清洗，3轮追问后输出 PRD 草稿 |
| `fast_track` | 信息充足、时间紧，最多1轮只问 P0 |
| `direct` | 不追问，直接输出    |

## 五维评分（GSCRE）

| 维度 | 含义 | 评分 |
|------|------|------|
| G — Goal | 要做什么、为什么 | 0-2 |
| S — Scenario | 谁、何时、如何触发 | 0-2 |
| C — Constraint | 规则/边界/异常/权限 | 0-2 |
| R — Resolution | 核心能力和行为 | 0-2 |
| E — Evidence | 数据/用户反馈/真实事件 | 0-2 |

## 输出格式

当检测到产品需求类输入时，输出以下 JSON：

```json
{
  "action": "new",
  "mode": "pm-requirement",
  "summary": "一句话概括需求",
  "type": "system_page|rule_policy|process_optimization|mixed",
  "audience": "目标用户角色",
  "style": "Modern",
  "keywords": ["关键词"],
  "gscre_scores": { "G": 1, "S": 1, "C": 0, "R": 1, "E": 0 },
  "total_score": 3,
  "maturity": "draft|review|confirmed",
  "has_conflict": false,
  "p0_gaps": ["缺口1", "缺口2"],
  "searchQueries": ["搜索query1"],
  "confidence": 0.0-1.0,
  "suggestions": "对需求的澄清建议"
}
```

## 追问规则
1. 每个 P0 问题说明「为什么问」
2. 每个 P0 问题提供 2-3 个选项（A/B/C）
3. 最多追问 3 轮，1 轮无新缺口即收敛
4. 未确认信息标记 `[待确认]`
5. 检测到需求冲突时优先分解冲突

## 冲突处理
```
⚠️ 检测到冲突：
  方案A: [描述]
  方案B: [描述]
  | 维度 | 方案A | 方案B |
  | 影响 | ... | ... |
  | 复杂度 | ... | ... |
  | 风险 | ... | ... |
  建议: [方案X]
  理由: [具体理由]
```
