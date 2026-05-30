# reveal.js 幻灯片设计指南

## 视觉设计原则

### 配色
- 每次选择一个主导色 + 一个强调色 + 辅助中性色
- 用 CSS 变量统一管理：--primary, --accent, --bg, --text, --muted
- 配色应与演示主题的情感匹配：
  - 金融/商业：深蓝 + 金色点缀 → 信任感
  - 医疗/健康：白 + 绿 + 浅灰 → 冷静清晰
  - 科技/AI：暗色底 + 霓虹点缀 → 未来感
  - 教育：暖色底 + 清晰对比 → 亲和力

### 排版
- 使用 Google Fonts，避免 Inter/Roboto/Arial
- 推荐的字体配对：
  - Playfair Display + Source Sans Pro → 优雅学术
  - Space Grotesk + Inter → 现代科技
  - Crimson Text + Lato → 传统报告
  - DM Serif Display + DM Sans → 杂志编辑风
- 字号：标题 48pt / 副标题 36pt / 正文 16-18pt / 标注 12pt

### 布局
- 不用绝对定位，用 grid/flexbox
- 每张幻灯片一个焦点
- 交替密集证据页和呼吸综合页

## reveal.js 5.x 快速参考

### CDN 引用
- CSS: https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css
- Reset: https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reset.css
- JS: https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js

### 初始化
```
Reveal.initialize({
  width: 1280, height: 720, margin: 0,
  controls: true, progress: true, hash: true,
  transition: 'none', center: false
});
```

### 常用功能
- Fragment: class="fragment" 让内容逐步出现
- data-background-color="#xxx" 设置页背景色
- data-auto-animate 相邻页元素过渡
- r-fit-text 标题自适应
- <aside class="notes"> 演讲者备注

### Chart.js 集成
```html
<canvas id="chart1" style="max-height:420px"></canvas>
<script>
function initCharts() {
  if (window.__chartsDone) return;
  window.__chartsDone = true;
  new Chart(document.getElementById('chart1'), {
    type: 'bar',
    data: { labels: [...], datasets: [{ data: [...] }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
}
Reveal.on('ready', initCharts);
setTimeout(initCharts, 500);
</script>
```

### 防溢出
- 1280×720 视口，可用高度约 620px（减去 padding）
- 每页最多 5-6 个要点
- 图片 max-height: 400px
- 表格最多 6-8 行 × 4-5 列
