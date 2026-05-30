# Design System

Use this reference when creating the HTML file.

## Base Structure

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Deck Title</title>
  <style>
    :root {
      --b0:#EFF6FF; --b1:#DBEAFE; --b2:#BFDBFE; --b6:#2563EB; --b7:#1D4ED8; --b8:#1E40AF; --b9:#1E3A8A;
      --g0:#F9FAFB; --g1:#F3F4F6; --g2:#E5E7EB; --g4:#9CA3AF; --g5:#6B7280; --g6:#4B5563; --g7:#374151; --g8:#1F2937; --g9:#111827;
      --r:#DC2626; --r-bg:#FEF2F2; --r-bd:#FECACA;
      --gn:#059669; --gn-bg:#ECFDF5; --gn-bd:#A7F3D0;
      --au:#D97706; --au-bg:#FFFBEB; --au-bd:#FDE68A;
      --tl:#0D9488; --tl-bg:#F0FDFA; --tl-bd:#99F6E4;
      --pp:#7C3AED; --pp-bg:#F5F3FF; --pp-bd:#DDD6FE;
      --bw:1px; --radius:6px;
    }
    *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
    body {
      font-family:"PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif;
      background:#E5E7EB; color:var(--g8); line-height:1.5;
    }
    .S {
      width:1080px; height:608px; margin:24px auto; background:#FFF;
      position:relative; overflow:hidden; display:flex; flex-direction:column;
      print-color-adjust:exact; -webkit-print-color-adjust:exact;
    }
    .TB { height:32px; background:var(--b9); color:#FFF; display:flex; align-items:center; justify-content:space-between; padding:0 32px; flex-shrink:0; }
    .TB .logo { font-size:11px; font-weight:800; letter-spacing:1px; }
    .TB .meta { font-size:9px; color:rgba(255,255,255,.65); }
    .TS { padding:14px 40px 10px; border-bottom:var(--bw) solid var(--g2); flex-shrink:0; }
    .TS h1 { font-size:24px; line-height:1.25; color:var(--g9); font-weight:900; letter-spacing:0; }
    .TS .sub { margin-top:4px; font-size:11px; color:var(--g5); }
    .BA { flex:1; padding:12px 40px 28px; overflow:hidden; }
    .PF { position:absolute; bottom:7px; height:16px; font-size:8.5px; color:var(--g4); display:flex; align-items:center; }
    .PFL { left:40px; } .PFR { right:40px; }
    @media print { body{background:#FFF;} .S{margin:0; page-break-after:always;} }
  </style>
</head>
<body>
  <section class="S" id="p01">
    <div class="TB"><div class="logo">BRAND</div><div class="meta">SECTION</div></div>
    <div class="TS"><h1>结论式标题</h1><div class="sub">副标题补充背景和范围。</div></div>
    <div class="BA"></div>
    <div class="PF PFL">文档名称</div><div class="PF PFR">PAGE 01/01</div>
  </section>
</body>
</html>
```

## Typography

- Main title: 20-26px.
- Section title/card title: 12-15px.
- Body: 10.5-12px.
- Small labels: 8.5-10px.
- Avoid text below 8px.
- Letter spacing should be `0` except small uppercase labels.

## Components

### Card

```html
<div class="card">
  <div class="card-title">模块标题</div>
  <div class="card-body">一句话说明，保留为可编辑文本。</div>
</div>
```

```css
.card { border:var(--bw) solid var(--g2); border-radius:var(--radius); background:#FFF; overflow:hidden; }
.card-title { padding:7px 10px; background:var(--b0); color:var(--b8); font-size:12px; font-weight:800; border-bottom:var(--bw) solid var(--b2); }
.card-body { padding:9px 10px; font-size:10.5px; color:var(--g7); }
```

### Native PPT Table

Use when the user should edit the result as one PowerPoint table: add/delete rows, resize columns, copy cells, or adjust table formatting. The HTML must use a real `<table>`.

```html
<table class="ppt-table" data-pptx-role="native-table">
  <colgroup>
    <col style="width:28%">
    <col style="width:24%">
    <col style="width:24%">
    <col style="width:24%">
  </colgroup>
  <thead>
    <tr><th>任务</th><th>负责人</th><th>输出</th><th>状态</th></tr>
  </thead>
  <tbody>
    <tr><td>数据口径确认</td><td>业务 owner</td><td>字段清单</td><td class="good">完成</td></tr>
    <tr><td>试点场景选择</td><td>项目经理</td><td>场景清单</td><td>进行中</td></tr>
  </tbody>
</table>
```

```css
.ppt-table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:9.5px; line-height:1.3; }
.ppt-table th,.ppt-table td { border:var(--bw) solid var(--g2); padding:6px 8px; vertical-align:middle; color:var(--g7); }
.ppt-table th { background:var(--g1); color:var(--g8); font-weight:900; text-align:left; }
.ppt-table td.key { background:var(--g0); color:var(--g8); font-weight:800; }
.ppt-table td.good { background:var(--gn-bg); color:var(--gn); font-weight:800; }
.ppt-table td.warn { background:var(--au-bg); color:var(--au); font-weight:800; }
.ppt-table td.risk { background:var(--r-bg); color:var(--r); font-weight:800; }
```

Rules:

- Use for action boards, assumptions, financial models, risk mitigation, capability comparisons, scorecards, and appendix data.
- Keep content simple: text, numbers, symbols, and cell fills. Do not put nested div charts inside native table cells.
- Use `colgroup` widths when column proportions matter.

### Visual Matrix / Shape Grid

Use div-based grids only when shape-level editing is acceptable. These convert to multiple PowerPoint shapes, not one table object.

```html
<div class="cmp" data-pptx-role="shape-matrix">
  <div class="cmp-h">维度</div><div class="cmp-h">现状</div><div class="cmp-h">建议</div>
  <div class="cmp-k">交付</div><div class="cmp-c">人工跟踪</div><div class="cmp-c good">统一看板</div>
</div>
```

```css
.cmp { display:grid; grid-template-columns:1fr 1.4fr 1.4fr; border:var(--bw) solid var(--g2); border-radius:var(--radius); overflow:hidden; }
.cmp > div { padding:7px 9px; border-right:var(--bw) solid var(--g2); border-bottom:var(--bw) solid var(--g2); font-size:10px; }
.cmp > div:nth-child(3n) { border-right:0; }
.cmp-h { background:var(--g1); color:var(--g7); font-weight:800; }
.cmp-k { background:var(--g0); color:var(--g8); font-weight:800; }
.cmp-c { color:var(--g7); }
.cmp-c.good { color:var(--gn); font-weight:700; }
```

Rules:

- Use for heatmaps, ownership matrices, 2x2 labels, score badges, and compact visual comparison blocks.
- Do not use when the user needs PowerPoint table operations such as row insertion, column resizing, or cell copy/paste.

### Process Flow

```html
<div class="flow">
  <div class="step"><b>01</b><span>输入 HTML</span></div>
  <div class="arr">→</div>
  <div class="step"><b>02</b><span>自动识别页</span></div>
</div>
```

```css
.flow { display:flex; align-items:stretch; gap:8px; }
.step { flex:1; border:var(--bw) solid var(--b2); background:var(--b0); border-radius:var(--radius); padding:9px 10px; }
.step b { display:block; color:var(--b8); font-size:10px; margin-bottom:4px; }
.step span { font-size:11px; color:var(--g8); font-weight:700; }
.arr { display:flex; align-items:center; color:var(--g4); font-size:18px; }
```

### Heatmap

Use for maturity assessment and multi-plant comparison. Keep every cell as real text.

```html
<div class="heat" data-pptx-role="shape-matrix">
  <div class="heat-h">维度</div><div class="heat-h">现状</div><div class="heat-h">目标</div>
  <div class="heat-k">数据</div><div class="heat-c amber">系统分散</div><div class="heat-c green">统一口径</div>
</div>
```

```css
.heat { display:grid; grid-template-columns:1.1fr 1fr 1fr; border:var(--bw) solid var(--g2); border-radius:var(--radius); overflow:hidden; }
.heat > div { padding:7px 8px; border-right:var(--bw) solid var(--g2); border-bottom:var(--bw) solid var(--g2); font-size:9.5px; }
.heat > div:nth-child(3n) { border-right:0; }
.heat-h { background:var(--g1); font-weight:800; color:var(--g7); }
.heat-k { background:var(--g0); font-weight:800; color:var(--g8); }
.heat-c.red { background:var(--r-bg); color:var(--r); }
.heat-c.amber { background:var(--au-bg); color:var(--au); }
.heat-c.green { background:var(--gn-bg); color:var(--gn); }
```

### Scenario Closed Loop

Use for manufacturing scenarios. The bottom row keeps systems, data, and KPI visible without using images.

```html
<div class="loop">
  <div class="loop-step"><b>触发</b><span>质检失败</span></div>
  <div class="loop-arrow">→</div>
  <div class="loop-step"><b>隔离</b><span>冻结批次</span></div>
  <div class="loop-arrow">→</div>
  <div class="loop-step"><b>反馈</b><span>NCR闭环</span></div>
</div>
<div class="evidence-row">
  <div><b>系统</b> QMS / WMS / MES</div>
  <div><b>数据</b> lot_id / inspection_result</div>
  <div><b>KPI</b> 追溯时间</div>
</div>
```

```css
.loop { display:flex; align-items:stretch; gap:7px; }
.loop-step { flex:1; border:var(--bw) solid var(--b2); background:var(--b0); border-radius:var(--radius); padding:8px 9px; }
.loop-step b { display:block; color:var(--b8); font-size:10px; margin-bottom:4px; }
.loop-step span { font-size:10.5px; color:var(--g8); font-weight:700; }
.loop-arrow { display:flex; align-items:center; color:var(--g4); font-size:16px; }
.evidence-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:8px; }
.evidence-row > div { border:var(--bw) solid var(--g2); border-radius:var(--radius); padding:7px 8px; background:var(--g0); font-size:9.5px; color:var(--g7); }
.evidence-row b { color:var(--b8); }
```

### Capability Boundary Matrix

Use to explain system ownership without drawing complex architecture.

```html
<div class="boundary" data-pptx-role="shape-matrix">
  <div class="bd-h">能力</div><div class="bd-h">ERP</div><div class="bd-h">MES</div><div class="bd-h">WMS</div>
  <div class="bd-k">工单</div><div class="bd-c">计划</div><div class="bd-c own">执行</div><div class="bd-c">领料</div>
</div>
```

```css
.boundary { display:grid; grid-template-columns:1.2fr repeat(3,1fr); border:var(--bw) solid var(--g2); border-radius:var(--radius); overflow:hidden; }
.boundary > div { padding:7px 8px; border-right:var(--bw) solid var(--g2); border-bottom:var(--bw) solid var(--g2); font-size:9.5px; }
.boundary > div:nth-child(4n) { border-right:0; }
.bd-h { background:var(--g1); color:var(--g7); font-weight:800; }
.bd-k { background:var(--g0); color:var(--g8); font-weight:800; }
.bd-c { color:var(--g7); }
.bd-c.own { background:var(--gn-bg); color:var(--gn); font-weight:800; }
```

### KPI Tree

Use to connect operational levers to business outcomes.

```html
<div class="kpi-tree">
  <div class="kpi-root">交付稳定性提升</div>
  <div class="kpi-branches">
    <div class="kpi-branch"><b>OTIF</b><span>准交率</span></div>
    <div class="kpi-branch"><b>齐套率</b><span>物料可用</span></div>
    <div class="kpi-branch"><b>异常闭环</b><span>处理周期</span></div>
  </div>
</div>
```

```css
.kpi-tree { display:flex; flex-direction:column; gap:10px; }
.kpi-root { border:var(--bw) solid var(--b2); background:var(--b0); color:var(--b8); border-radius:var(--radius); padding:10px; text-align:center; font-size:14px; font-weight:900; }
.kpi-branches { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.kpi-branch { border:var(--bw) solid var(--g2); border-radius:var(--radius); padding:8px; background:#FFF; text-align:center; }
.kpi-branch b { display:block; font-size:12px; color:var(--gn); }
.kpi-branch span { display:block; margin-top:3px; font-size:9.5px; color:var(--g6); }
```

### Exhibit Note

Use for source, assumption, confidence, and formula notes. Keep as real text.

```html
<div class="ex-note"><b>Source:</b> customer interview, ERP extract, team estimate. <b>Confidence:</b> medium.</div>
```

```css
.ex-note { border-top:var(--bw) solid var(--g2); padding-top:6px; font-size:8.5px; color:var(--g5); line-height:1.35; }
.ex-note b { color:var(--g7); }
```

### Editable Bar Chart

Use for market sizing, benchmark, ranking, or KPI comparisons. Widths are CSS percentages so the labels remain editable.

```html
<div class="bar-chart">
  <div class="bar-row"><span>华东</span><div class="bar-track"><i style="width:72%"></i></div><b>72</b></div>
  <div class="bar-row"><span>华南</span><div class="bar-track"><i style="width:54%"></i></div><b>54</b></div>
</div>
```

```css
.bar-chart { display:flex; flex-direction:column; gap:8px; }
.bar-row { display:grid; grid-template-columns:72px 1fr 42px; gap:8px; align-items:center; font-size:9.5px; color:var(--g7); }
.bar-row span { font-weight:700; color:var(--g8); }
.bar-row b { text-align:right; color:var(--b8); font-size:10px; }
.bar-track { height:14px; background:var(--g1); border:var(--bw) solid var(--g2); border-radius:3px; overflow:hidden; }
.bar-track i { display:block; height:100%; background:var(--b7); }
.bar-row.good .bar-track i { background:var(--gn); }
.bar-row.risk .bar-track i { background:var(--r); }
```

### Waterfall / Value Bridge

Use for baseline-to-target movement. Keep every label and number editable.

```html
<div class="bridge">
  <div class="bridge-step base"><b>基线</b><span>100</span><i style="height:58%"></i></div>
  <div class="bridge-step up"><b>齐套率</b><span>+18</span><i style="height:24%"></i></div>
  <div class="bridge-step up"><b>排程</b><span>+12</span><i style="height:16%"></i></div>
  <div class="bridge-step target"><b>目标</b><span>130</span><i style="height:75%"></i></div>
</div>
```

```css
.bridge { height:190px; display:grid; grid-template-columns:repeat(4,1fr); gap:12px; align-items:end; border-bottom:var(--bw) solid var(--g4); padding:8px 4px 0; }
.bridge-step { height:100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; gap:4px; }
.bridge-step b { font-size:9px; color:var(--g7); text-align:center; }
.bridge-step span { font-size:11px; font-weight:900; color:var(--g9); }
.bridge-step i { display:block; width:42px; min-height:12px; background:var(--g4); border-radius:3px 3px 0 0; }
.bridge-step.up i { background:var(--gn); }
.bridge-step.down i { background:var(--r); }
.bridge-step.target i { background:var(--b8); }
```

### 2x2 Priority Matrix

Use for impact/feasibility, value/complexity, urgency/readiness. Points are editable labels.

```html
<div class="matrix2">
  <div class="axis y">High impact</div>
  <div class="axis x">High feasibility</div>
  <div class="quad q1">优先试点</div><div class="quad q2">战略储备</div>
  <div class="quad q3">谨慎推进</div><div class="quad q4">暂缓</div>
  <div class="dot" style="left:68%; top:28%">质量追溯</div>
  <div class="dot alt" style="left:42%; top:58%">APS</div>
</div>
```

```css
.matrix2 { position:relative; height:260px; display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; border:var(--bw) solid var(--g2); border-radius:var(--radius); overflow:hidden; background:#FFF; }
.quad { padding:9px; border-right:var(--bw) solid var(--g2); border-bottom:var(--bw) solid var(--g2); font-size:9.5px; color:var(--g5); font-weight:800; }
.quad:nth-child(2n+1) { border-right:0; }
.q1 { background:var(--gn-bg); color:var(--gn); }
.q2 { background:var(--b0); color:var(--b8); }
.q3 { background:var(--au-bg); color:var(--au); }
.q4 { background:var(--g0); }
.axis { position:absolute; font-size:8.5px; color:var(--g5); font-weight:800; }
.axis.y { left:8px; top:8px; }
.axis.x { right:8px; bottom:8px; }
.dot { position:absolute; padding:4px 7px; border-radius:999px; background:var(--b8); color:#FFF; font-size:8.5px; font-weight:800; white-space:nowrap; }
.dot.alt { background:var(--au); }
```

### Scorecard

Use when strategic options need comparable criteria.

```html
<div class="score" data-pptx-role="shape-matrix">
  <div class="score-h">方案</div><div class="score-h">价值</div><div class="score-h">难度</div><div class="score-h">建议</div>
  <div class="score-k">先做质量追溯</div><div class="score-c high">高</div><div class="score-c mid">中</div><div class="score-c high">推荐</div>
</div>
```

```css
.score { display:grid; grid-template-columns:1.7fr repeat(3,1fr); border:var(--bw) solid var(--g2); border-radius:var(--radius); overflow:hidden; }
.score > div { padding:7px 8px; border-right:var(--bw) solid var(--g2); border-bottom:var(--bw) solid var(--g2); font-size:9.5px; }
.score > div:nth-child(4n) { border-right:0; }
.score-h { background:var(--g1); color:var(--g7); font-weight:800; }
.score-k { background:var(--g0); color:var(--g8); font-weight:800; }
.score-c { text-align:center; color:var(--g7); }
.score-c.high { background:var(--gn-bg); color:var(--gn); font-weight:800; }
.score-c.mid { background:var(--au-bg); color:var(--au); font-weight:800; }
.score-c.low { background:var(--r-bg); color:var(--r); font-weight:800; }
```

### Risk Heatmap

Use with a mitigation table. Do not use risk dots without owners/actions.

```html
<div class="riskmap" data-pptx-role="shape-matrix">
  <div class="risk-cell low">低</div><div class="risk-cell mid">中</div><div class="risk-cell high">高</div>
  <div class="risk-cell mid">数据质量</div><div class="risk-cell high">跨厂复制</div><div class="risk-cell high">写操作审批</div>
</div>
```

```css
.riskmap { display:grid; grid-template-columns:repeat(3,1fr); border:var(--bw) solid var(--g2); border-radius:var(--radius); overflow:hidden; }
.risk-cell { min-height:50px; padding:8px; border-right:var(--bw) solid var(--g2); border-bottom:var(--bw) solid var(--g2); font-size:10px; font-weight:800; color:var(--g7); display:flex; align-items:center; justify-content:center; text-align:center; }
.risk-cell:nth-child(3n) { border-right:0; }
.risk-cell.low { background:var(--gn-bg); color:var(--gn); }
.risk-cell.mid { background:var(--au-bg); color:var(--au); }
.risk-cell.high { background:var(--r-bg); color:var(--r); }
```

### Native Appendix Table

Use for model assumptions and detailed calculations. Dense is allowed, but keep it as a native `<table>` when row/column editing matters.

```html
<table class="ppt-table appendix-table" data-pptx-role="native-table">
  <colgroup>
    <col style="width:24%">
    <col style="width:34%">
    <col style="width:24%">
    <col style="width:18%">
  </colgroup>
  <thead>
    <tr><th>项目</th><th>假设</th><th>来源</th><th>置信度</th></tr>
  </thead>
  <tbody>
    <tr><td class="key">良率提升</td><td>+1.5-2.0pp</td><td>试点访谈</td><td class="warn">中</td></tr>
    <tr><td class="key">追溯时间</td><td>小时级降至分钟级</td><td>业务估算</td><td class="warn">中</td></tr>
  </tbody>
</table>
```

```css
.appendix-table { font-size:8.8px; line-height:1.25; }
.appendix-table th,.appendix-table td { padding:5px 7px; }
```
