# code-generator Wiki

## HTML 生成模式库

### 完整 HTML 模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>演示标题</title>

  <!-- Reveal.js -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reset.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/white.css">

  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=标题字体&family=正文字体&display=swap" rel="stylesheet">

  <!-- 插件 CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/highlight/monokai.css">

  <style>
    :root {
      --primary: #2563EB;
      --secondary: #1E40AF;
      --background: #0F172A;
      --text: #F1F5F9;
      --accent: #38BDF8;

      --heading-font: '标题字体', sans-serif;
      --body-font: '正文字体', sans-serif;
    }

    .reveal { font-family: var(--body-font); }
    .reveal h1, .reveal h2, .reveal h3 { font-family: var(--heading-font); }
    .reveal-viewport { background: var(--background); }
    .reveal .slides section {
      height: 100%;
      padding: 60px !important;
      box-sizing: border-box;
      /* 不给 section 设 display:flex — reveal.js 自行管理 display */
    }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <!-- 幻灯片内容 -->
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/highlight/highlight.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/notes/notes.js"></script>
  <script>
    Reveal.initialize({
      width: 1280, height: 720, margin: 0.04,
      controls: true, progress: true, hash: true,
      transition: 'none',
      plugins: [RevealHighlight, RevealNotes]
    });
  </script>
</body>
</html>
```

### 常见布局模式

**单栏文字布局**
```html
<section>
  <h2>标题</h2>
  <div class="content" style="flex:1;display:flex;align-items:center;justify-content:center;">
    <p style="font-size:24pt;text-align:center;max-width:900px;">正文内容</p>
  </div>
</section>
```

**双栏对比布局**
```html
<section>
  <h2>对比</h2>
  <div style="display:flex;gap:40px;flex:1;">
    <div style="flex:1;">左侧内容</div>
    <div style="flex:1;">右侧内容</div>
  </div>
</section>
```

**卡片网格布局**
```html
<section>
  <h2>功能特点</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;flex:1;">
    <div class="card">卡片1</div>
    <div class="card">卡片2</div>
    <div class="card">卡片3</div>
  </div>
</section>
```

### 防溢出规则

1. 每页最多：6 行文字 OR 3-4 张卡片 OR 1 图 + 3 行文字
2. 字号下限：14pt（正文），10pt（注释）
3. 图片最大高度：360px
4. 使用 overflow:hidden 保护容器

### 响应式策略

reveal.js 固定 1280×720 视口，前端 iframe 自适应缩放。生成时严格遵循此尺寸，内容不得超出。
