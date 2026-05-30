# reveal.js Skill 知识库

## 完整模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>演示文稿</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/black.css">
  <!-- 可选：highlight.js 代码高亮 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/plugin/highlight/monokai.css">
</head>
<body>
  <div class="reveal">
    <div class="slides">

      <!-- 单页 -->
      <section data-transition="fade">
        <h2>标题</h2>
        <p>内容</p>
        <aside class="notes">演讲者备注</aside>
      </section>

    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5/plugin/highlight/highlight.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      controls: true,
      progress: true,
      center: true,
      transition: 'fade',
      plugins: [RevealHighlight, RevealNotes, RevealMarkdown, RevealKaTeX]
    });
    // 监听状态事件
    Reveal.on('customevent', () => console.log('customevent triggered'));
  </script>
</body>
</html>
```

## 空间矩阵（2D 嵌套幻灯片）

横向章节（左右切）+ 纵向子页（上下切）：

```html
<section>                              <!-- 横向：章节1 -->
  <section>章节1标题页</section>          <!-- 纵：子页入口 -->
  <section><h3>子页A</h3><p>内容</p></section>
  <section><h3>子页B</h3><p>内容</p></section>
</section>
<section>                              <!-- 横向：章节2 -->
  <section>章节2标题页</section>
  <section><h3>子页C</h3><p>内容</p></section>
</section>
```

导航：左右键横向、上下键纵向、ESC总览、F全屏、S演讲者模式。

## 自动动画（Auto-Animate）

相邻 `<section data-auto-animate>` 通过 data-id 匹配元素，自动补间。

### 基础用法

```html
<section data-auto-animate>
  <h2 data-id="title">初始</h2>
</section>
<section data-auto-animate>
  <h2 data-id="title">变化</h2>
</section>
```

### 精细控制

```html
<!-- 整页级别 -->
<section data-auto-animate
        data-auto-animate-easing="cubic-bezier(0.770, 0.000, 0.175, 1.000)"
        data-auto-animate-duration="0.8"
        data-auto-animate-unmatched="false">

  <!-- 元素级别延迟 -->
  <div data-id="box1" data-auto-animate-delay="0">先来</div>
  <div data-id="box2" data-auto-animate-delay="0.3">后来</div>
  <div data-id="box3" data-auto-animate-delay="0.6">最后</div>
</section>
```

### id + restart（分隔两组动画）

```html
<section data-auto-animate data-auto-animate-id="group-a">…</section>
<section data-auto-animate data-auto-animate-id="group-a">…</section>
<section data-auto-animate data-auto-animate-id="group-a" data-auto-animate-restart>…</section>
<section data-auto-animate data-auto-animate-id="group-a">…</section>
<!-- 第一组结束后，restart 分隔，第二组重新开始 -->
```

easing 可选：`ease`（默认）、`linear`、`ease-in`、`ease-out`、`ease-in-out`、``cubic-bezier(0.770, 0.000, 0.175, 1.000)`（弹性）

## 碎片化（Fragments）

### 标准用法（每页至少3个）

```html
<section>
  <p class="fragment">第一步</p>
  <p class="fragment">第二步</p>
  <p class="fragment">第三步</p>
</section>
```

### Fragment 变体（全部可用）

```html
<p class="fragment grow">放大渐入</p>
<p class="fragment shrink">缩小渐入</p>
<p class="fragment fade-out">渐出</p>
<p class="fragment fade-right">向右渐入</p>
<p class="fragment fade-up">向上渐入</p>
<p class="fragment fade-down">向下渐入</p>
<p class="fragment fade-left">向左渐入</p>
<p class="fragment fade-in-then-out">先入后出</p>
<p class="fragment fade-in-then-semi-out">先入后半透明</p>
<p class="fragment highlight-red">高亮红</p>
<p class="fragment highlight-blue">高亮蓝</p>
<p class="fragment highlight-green">高亮绿</p>
<p class="fragment highlight-current-red">当前红高亮</p>
<p class="fragment highlight-current-blue">当前蓝高亮</p>
<p class="fragment strike">删除线</p>
<p class="fragment semi-visible">半透明</p>
```

### Fragment 索引（控制顺序）

```html
<span class="fragment" data-fragment-index="3">最后出现</span>
<span class="fragment" data-fragment-index="1">第二出现</span>
<span class="fragment" data-fragment-index="2">第三出现</span>
```

## 代码高亮

```html
<pre><code data-line-numbers="3|7-9|12">const x = 1;
function foo() {
  return x;        // 高亮行3
}
function bar() {   // 高亮7-9
  return foo();
}                  // 高亮12
const y = 2;</code></pre>
```

可选 CDN：highlight.js@11 monokai.css（见模板）。

## 数学公式（KaTeX）

```html
<!-- 必须加载插件 -->
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5/plugin/math/katex.js"></script>

<section data-transition="fade">
  <p>行内公式：$E = mc^2$</p>
  <p>块级公式：$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$</p>
</section>
```

## 背景

### 颜色背景

```html
<section data-background-color="aquamarine">
  <p>纯色背景</p>
</section>
```

### 图片背景

```html
<section data-background-image="https://example.com/image.png"
         data-background-size="cover"
         data-background-repeat="no-repeat">
</section>

<!-- 重复平铺 -->
<section data-background-image="pattern.png"
         data-background-repeat="repeat"
         data-background-size="100px">
</section>
```

### 视频/GIF背景

```html
<section data-background-video="video.mp4,video.webm"
         data-background-color="#000000"
         data-background-loop>
</section>

<!-- GIF 直接用图片URL -->
<section data-background="http://i.giphy.com/90F8aUepslB84.gif">
</section>
```

### iframe背景（可交互）

```html
<section data-background-iframe="https://hakim.se"
         data-background-interactive>
  <!-- overlay 内容浮在上面 -->
  <div style="position:absolute; left:0; bottom:0; background:white; padding:10px;">
    iframe 上方的文字
  </div>
</section>
```

### 背景切换动画

```html
<section data-transition="slide"
        data-background="#4d7e65"
        data-background-transition="zoom">
  <!-- 本页 slide 切换，背景 zoom 动画 -->
</section>
```

data-background-transition 可选：`none` / `fade` / `slide` / `convex` / `concave` / `zoom`

## 过渡动画（transition）

```html
<section data-transition="fade">fade</section>
<section data-transition="slide">slide（默认）</section>
<section data-transition="convex">convex</section>
<section data-transition="concave">concave</section>
<section data-transition="zoom">zoom</section>
<section data-transition="none">无动画</section>
```

## 状态事件（data-state）

```html
<section data-state="intro">
  <h2>介绍</h2>
</section>
<section data-state="detail">
  <h2>详情</h2>
</section>
<section data-state="customevent">
  <h2>自定义事件</h2>
</section>
```

JavaScript 监听：

```javascript
Reveal.on('intro', () => console.log('进入 intro 状态'));
Reveal.on('detail', () => console.log('进入 detail 状态'));

// 任意 data-state 值都会触发对应事件
Reveal.on('customevent', () => {
  document.body.style.background = '#333';
});
```

## 自动大小文字（fit-text）

```html
<section>
  <h2 class="r-fit-text">自动适应文字</h2>
</section>
```

## Markdown 支持

```html
<section data-markdown>
  <script type="text/template">
    ## 标题

    - 列表项1
    - 列表项2

    ```javascript
    const x = 1;
    ```
  </script>
</section>
```

## 内部链接

```html
<a href="#/2/3">跳到第3章节的第4页</a>
<a href="#/3">跳到第4页</a>
```

## 布局辅助类

```html
<div class="r-hstack justify-center align-center">水平堆叠居中</div>
<div class="r-vstack justify-center align-center">垂直堆叠居中</div>
<div class="r-stack">堆叠（重叠）</div>
```

## 演讲者备注

```html
<section>
  <h2>标题</h2>
  <p>内容</p>
  <aside class="notes">
    这是演讲者备注，只在演讲者模式可见。
    按 S 键打开演讲者视图。
  </aside>
</section>
```

## 键盘快捷键

- 左右箭头：横向翻页
- 上下箭头：纵向翻页
- Space/Enter：下一项（fragment/动画）
- ESC：总览模式
- O：总览模式
- F：全屏
- S：演讲者模式
- B/. ：暂停（屏幕黑屏）
- Alt+click：zoom-js 放大点击的元素

## 配置选项

```javascript
Reveal.initialize({
  width: 1280,           // 幻灯片宽度
  height: 720,           // 幻灯片高度
  margin: 0.04,         // 内容边距
  controls: true,        // 显示导航箭头
  progress: true,        // 显示进度条
  center: true,          // 内容居中
  hash: true,            // URL 含幻灯片索引
  transition: 'fade',    // 默认过渡动画
  transitionSpeed: 'default', // 'default'/'fast'/'slow'
  backgroundTransition: 'fade', // 背景过渡
  autoSlide: 0,          // 自动播放（毫秒），0=关闭
  autoSlideStoppable: true,
  loop: false,           // 循环播放
  rtl: false,            // 从右到左
  shuffle: false,        // 随机顺序
  fragments: true,        // 启用 fragment
  embedded: false,        // 嵌入式模式
  help: true,            // 显示帮助
  showNotes: false,      // 同时显示备注
  showSlideNumber: 'all', // 'all'/'print'/'none'
  scrollable: true,      // 可滚动内容
  hideInactiveCursor: true,
  hideCursorTime: 3000,
  plugins: []             // 插件列表
});
```

## 常用 CDN 资源

```
reveal.css:    https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.css
reveal.js:     https://cdn.jsdelivr.net/npm/reveal.js@5
highlight.js:  https://cdn.jsdelivr.net/npm/reveal.js@5/plugin/highlight/highlight.js
monokai.css:   https://cdn.jsdelivr.net/npm/reveal.js@5/plugin/highlight/monokai.css
katex.js:      https://cdn.jsdelivr.net/npm/reveal.js@5/plugin/math/katex.js
katex.css:     https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css
katex.js:      https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js
chart.js:      https://cdn.jsdelivr.net/npm/chart.js
font:          https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700
```
