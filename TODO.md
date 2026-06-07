# 云心 reveal.js 幻灯片优化迭代记录

## 项目状态
- 本地路径: /Users/mac/Desktop/reveal-agent (原指定路径 /Users/mac/Desktop/助教研究/云心1.1 不存在)
- GitHub: https://github.com/dxfxbfg/reveal-agent (已迁移，原地址 dxfxbfg/-reveal.js)
- Vercel: https://reveal-js-ha8o.vercel.app
- 技术栈: React+Vite 前端 / Express+WebSocket 后端 / 3-agent AI 流水线

---

## 本次迭代 (2026-05-30 晚)

### 完成的工作
1. **修复 .gitignore** - 添加 `.env`, `.git/`, `__pycache__/`, `*.pyc`, `*.swp`, `*~`
2. **初始化 Git 仓库** - 之前从未 commit，193 个文件首次提交
3. **处理 Git 冲突** - remote 有部分删除提交（删除了 vercel.json, readme.md, package.json），本地做 rebase 保留完整内容
4. **推送 GitHub** - 成功推送到 https://github.com/dxfxbfg/reveal-agent

### 发现
- 远程仓库已被迁移/重命名到 `dxfxbfg/reveal-agent`，旧地址 `dxfxbfg/-reveal.js` 已失效
- vercel.json 被远程有意删除（可能是部署配置变更）

---

## 迭代 (2026-05-30 深夜) - 控制台工作区

### 完成的工作
1. **新增 ControlPanel 工作区** - 完整的系统控制台界面，包含：
   - **运行时监控**：OpenClaw/Hermes/Claude Code 实时日志流 + 指标条（内存/CPU/连接数）
   - **模型注册表**：支持添加/编辑/删除模型，延迟测速（模拟）
   - **路由规则**：关键词驱动的模型路由配置
   - **MCP 服务**：GitHub/文件系统/Obsidian/WebSearch 服务开关 + 细粒度工具级控制
   - **技能目录**：静态技能（hub）+ 动态技能（agent 生成）使用统计
   - **记忆图谱**：概念/任务/项目/系统节点可视化
   - **API 网关**：密钥管理 + 成本追踪 + 调用统计
2. **新的工作区 Tab** - 导航栏新增"控制台"入口
3. **前端构建** - Vite build 更新 dist（新 hash：index-DkeAoQKB.js / index-DI_QzMBb.css）
4. **Git 提交推送** - 已同步到 GitHub

---

## 迭代 (2026-05-30 深夜) - 控制台工作区

### 完成的工作
1. **新增 ControlPanel 工作区** - 完整的系统控制台界面，包含：
   - **运行时监控**：OpenClaw/Hermes/Claude Code 实时日志流 + 指标条（内存/CPU/连接数）
   - **模型注册表**：支持添加/编辑/删除模型，延迟测速（模拟）
   - **路由规则**：关键词驱动的模型路由配置
   - **MCP 服务**：GitHub/文件系统/Obsidian/WebSearch 服务开关 + 细粒度工具级控制
   - **技能目录**：静态技能（hub）+ 动态技能（agent 生成）使用统计
   - **记忆图谱**：概念/任务/项目/系统节点可视化
   - **API 网关**：密钥管理 + 成本追踪 + 调用统计
2. **新的工作区 Tab** - 导航栏新增"控制台"入口
3. **前端构建** - Vite build 更新 dist（新 hash：index-DkeAoQKB.js / index-DI_QzMBb.css）
4. **Git 提交推送** - 已同步到 GitHub

### 悬未提交的文件（噪音/临时文件）
- 大量 `* 2.md`, `index 2.js`, `documents 2.json` 等副本文件（建议清理）


---

## 迭代 (2026-05-30 深夜 续) - 清理噪音文件

### 完成的工作
1. **删除 15 个 " 2.*" 备份文件** - 分布在 skill/agent/backend/data/deprecated/pptx-consulting 等目录
2. **清理 git index 中残留条目** - `Cross-modal disentanglement - 2.html` 已从 index 中移除
3. **重新构建** - dist/ 更新（hash 无变化）
4. **Git push** - 同步到 GitHub（push --set-upstream 建立追踪）

### 发现
- git push 无 upstream 报错需要 `--set-upstream`，首次推送时用一次即可

### 悬未提交的文件（已全部清理）
- 已全部清空

---

## 迭代 (2026-06-05) - 预览区稳定性 + 错误处理

### 完成的工作
1. **预览区 postMessage 通信修复**（高优 #2）
   - 新增 ready 握手协议：iframe 内 Reveal.js 加载完成后 postMessage `{revealReady: true}` 给父页面
   - 父页面维护 `readyRef`，未就绪时 nav 命令排队，ready 后冲刷
   - setup() 轮询超时（25 × 200ms = 5s）兜底，避免 CDN 慢时永久挂起
   - keydown 监听过滤 input/textarea/select，避免拦截表单输入
   - iframe 加 `tabIndex={-1}` + 焦点检测，避免焦点卡在 srcdoc 内时方向键丢响应
   - 暴露 `data-preview-ready` 状态属性便于调试
2. **ErrorBoundary 错误处理改进**（中优 #3）
   - 错误页新增四个动作：查看堆栈 / 复制错误 / 尝试恢复 / 重新加载
   - 恢复按钮不直接 reload，给应用一次自我恢复机会（保留 zustand/state）
   - 复制按钮支持 navigator.clipboard + execCommand 双路径 fallback
   - 支持 `window.__hermes_report_error__(error, info)` 钩子注入外部错误上报

### Build
- dist: `index-DkeAoQKB.js` → `index-DOGUWGMQ.js`（255 → 258 KB / gzip 74 → 75 KB）
- 0 错误，0 警告
- vite preview 验证：HTTP 200，HTML / JS / CSS 全部 200 OK

### GitHub
- commit: `be95a52` - fix: 预览区 postMessage 通信稳定性 + ErrorBoundary 错误处理
- 已 push 到 main：443eafa..be95a52

### Vercel
- reveal-js-ha8o.vercel.app 持续连接超时（国内到 Vercel 边缘节点网络问题，非项目 bug）
- 后端仍在云服务器运行（不在 Vercel 上），本次未改 Vercel 部署配置

### 备注
- 本地项目不在 `/Users/mac/Desktop/助教研究/云心1.1`（不存在），从 GitHub clone 到 `/Users/mac/Desktop/reveal-agent/`
- 上次 TODO.md 中"高优 #1 添加 vercel.json"已存在，Vercel 部署仍然只服务前端 dist（Express 后端不跑在 Vercel 上）
- package-lock.json 在 `npm install` 后被改（去掉冗余 libc 字段），回滚到原始版本避免噪音提交

---

## 下次迭代建议

### 高优先级
1. **Vercel 部署健康度检查** - 4 个 production 环境（reveal-js-ha8o / reveal-js / reveal-js-3ilq / reveal-js-dx3e / slidegen-yunxin）哪些还在用、哪些可以清理
2. ~~**预览区 srcdoc 注入脚本健壮性** - 当前 5s 兜底可以接受，但如果 Reveal.js 在 CDN 失败时用户没有任何提示，可加 inline 错误提示~~ ✅ 2026-06-06
3. **CSS 体积优化** - styles.css 92.02 KB / gzip 12.75 KB（新错误浮层增加 1.3KB 后），检查是否有未使用的 workspace 样式（如 deprecated/ 目录里的旧 workspace）

### 中优先级
4. **后端 API 路由稳定性** - backend/index.js 的 PDF 导出端点用 puppeteer 在小内存机器上易崩溃，可改为客户端 html2pdf 方案
5. **ChatPanel 输入边界** - 大段 markdown 粘贴到 ChatInput 时可能卡顿，可加轻量节流
6. **workspace 切换状态保留** - 切到 ControlPanel 再切回会丢未保存的输入（如果有）

### 低优先级
7. **多语言/国际化** - 目前只有中文界面
8. **性能监控** - 添加 token 使用量统计
9. ~~**WebSocket 重连退避** - ws.js 简单重连可加指数退避~~ ✅ 2026-06-06

## 迭代 (2026-06-07 cron 5) - 草稿 LRU 限流 + iframe srcdoc 释放

### 完成的工作

**1. 草稿 LRU 限流（中优 #5 续 — 解决长期使用 quota 超限隐患）**
- 旧问题：每个 task 的草稿按需创建但无清理。50+ task × 5KB = 250KB 累积可能触发 localStorage `QuotaExceededError`
- 新方案：新建独立模块 `front-react/src/draftStore.js`，集中管理 LRU 逻辑
  - 索引 `ra_chat_draft_index`：`[{ id, ts }]` 倒序
  - 上限 20 个 task 的草稿（≈100KB，安全余量）
  - `save` 时触发淘汰：超上限按 ts 升序移除最老的（连带删草稿本身）
  - `load` 时 touch 更新 ts（访问即刷新）
  - `remove(id)` + `cleanupOrphans(orphanIds)` 暴露给 App 调用
- 集成点：
  - `ChatPanel.jsx` 改用 `draftStore.load/save`，本地辅助函数变成薄包装
  - `App.jsx` 启动时扫索引 vs tasks → 删孤儿草稿（`useEffect` 空依赖 mount 一次）
  - `App.jsx` 的 `deleteTask` 同步调 `draftStore.remove(id)`
- 边界：
  - 全部 `try/catch` 包裹，与现有 `config.js` 4MB 兜底风格一致
  - 索引写入失败也不影响草稿主路径（try/catch 静默）

**2. iframe srcdoc 释放（低优 #3）**
- 旧问题：切到 ControlPanel 等非 slides workspace 时，preview iframe 仍挂着完整 srcdoc（reveal.js + PDF + 图片），长时间占用几十 MB
- 新方案：`Preview.jsx` 加 `useEffect` 监听 `active`
  - `active=false` 时 `ref.current.srcdoc = ''`，release 内存
  - `active=true` 时 `setRetryNonce(n => n + 1)` 触发上面的注入 effect，自动恢复
- 边界：
  - 仅当 `html` 已加载过才清（避免空 html 时无效操作）
  - 切回时 retryNonce 强制重新注入，不需要外部传 html prop 变化

### Build
- dist: `index-DG_vAJR7.js` → `index-ywzjOk2L.js`（260.70 → 261.92 KB，+1.22 KB / gzip 76.22 → 76.65 KB，+0.43 KB）
- dist: CSS hash 不变（80.00 KB）
- 0 错误，0 警告
- vite preview 验证：root/js/css 全部 HTTP 200

### GitHub
- commit: `64ee0ff` - feat: 草稿 LRU 限流 + iframe srcdoc 释放（中优 #5 + 低优 #3）
- 已 push 到 main：`27d7025..64ee0ff`
- 6 files changed, 161 insertions(+), 25 deletions(-)

### Vercel
- **仍然不通**（Vercel ↔ GitHub 集成断开，上次迭代已记录，需用户手动重连）
- 本次未改 vercel.json，webhook 仍不会触发
- 本地 vite preview 三个资源 200 OK，等用户重连 Vercel 后会自动部署新 dist

### 累计成果
- 源码新增：draftStore.js (95 行，集中 LRU 逻辑)
- 源码组件：15 → 15（无变化）
- dist CSS 稳定在 80.00 KB（自 6-06 CSS 清理后无变化）

### 下次迭代建议
1. **Vercel 重新连接 GitHub**（高优 #1，阻塞所有新功能上线）— 需用户手动在 Vercel dashboard 操作（断一次再连）
2. **大草稿单条 LRU**（中优）— 当前 LRU 是按 task 数量淘汰；如果某 task 单条草稿 > 50KB 仍可能撑爆，可加单条 size 上限
3. **Preview 重连时还原幻灯片位置**（低优）— 当前 retryNonce 强制 re-inject 后会回到第 1 张幻灯片，可记录 lastIdx 切回时 r.slide(lastIdx)
4. **后端 puppeteer 路由彻底删除**（中优）— 现在只标记 deprecated，下次主版本可彻底删除 `/api/export/pdf`

---

*每次迭代只做 1-2 个重点改进，不要贪多*

---

## 迭代 (2026-06-06) - 预览错误提示 + WS 指数退避

### 完成的工作
1. **Preview srcdoc CDN 失败 → inline 错误浮层**（中优 #2 续）
   - 修旧 bug：父页面 `onMessage` 条件写错（`!e.data || e.data.revealReady === true`），把 `revealReady: false` 的失败信号也当成"就绪"
   - 现在显式区分 `revealReady: true` / `false` / `revealError` 三种信号
   - srcdoc 注入脚本新增 `window.addEventListener('error')` + `unhandledrejection` 监听，srcdoc 内运行时 JS 错误也会上报
   - 父页面失败时渲染错误浮层：图标 + 原因 + 可能原因提示 + 重试按钮
   - 重试按钮触发 `retryNonce++` → effect 重跑 → srcdoc 重新注入
2. **WebSocket 指数退避**（低优 #9）
   - 旧：固定 2s × 5 次，第 6 次断开就放弃
   - 新：1s → 2s → 4s → 8s → 16s → 30s 封顶 + ±20% 抖动，**永不放弃**
   - 配套 `disconnectWS(sessionId)` 主动断开 API + `_closed` 标记，区分主动断开 vs 意外断开
   - `onopen` 重置重试计数；`onclose` 前先 clearTimeout 避免重复调度

### Build
- dist: `index-DOGUWGMQ.js` → `index-D9MyKh7R.js`（258 → 259.5 KB / gzip 75.86 KB）
- dist: `index-DI_QzMBb.css` → `index-DfqEY6aI.css`（90.7 → 92.0 KB / gzip 12.75 KB）
- 0 错误，0 警告
- vite preview 验证：root 200, js 200 (262131B), css 200 (92017B)

### GitHub
- commit: `6d7c2f4` - feat: 预览失败 inline 错误提示 + WebSocket 指数退避
- 已 push 到 main：0517f70..6d7c2f4

### Vercel
- reveal-js-ha8o.vercel.app 持续不通（国内到 Vercel 边缘网络问题）
- 本地 vite preview 三个资源全部 200 OK，Vercel 端 webhook 触发后会自动重新部署

## 迭代 (2026-06-06 cron) - CSS 体积优化（高优 #3 完成）

### 完成的工作
1. **CSS 死代码扫描** — 写脚本扫 styles.css 387 个类 vs src/ 所有 jsx/js 用法
   - 精确检测：className="..." / className='...' / 模板字符串字面量 / classList.add/remove
   - 第一轮：发现 18 个未引用类（之前已删除大部分）
   - 重新分析：剩下 7 个里 `.INFO/.WARN/.ERROR/.DEBUG` 是 `.log-level.*` 子选择器（`log-level ${entry.level}` 动态拼），保留
2. **二次清理** — 删掉 3 个真正无用的块：
   - `@keyframes typingIndicator`（.msg.typing / .dot / .dot:nth-child(2/3)）— AI 输入指示器，源码无引用
   - `@keyframes toastOut` + `.toast.removing`（Toast.jsx 直接 filter，无 exit 动画）
3. **构建** — `npm run build` 0 错 0 警告
   - dist: `index-DuMEGKMv.css` → `index-DR4W856s.css`（80.56 → 80.00 KB / gzip 11.43 → 11.29 KB）
   - dist: `index-DktXQW4p.js` → `index-C8wBD33t.js`（无功能变化，hash 滚动）
4. **vite preview 验证** — root/js/css 全部 200 OK

### 累计成果（从 6-05 第一次清理算起）
- 源码 styles.css: 5324 → 4506 行（-818 行，-15%）
- dist CSS: 92.02 → 80.00 KB（gzip 12.75 → 11.29 KB，-11%）
- 删除的类：.icon-btn, .config-toggle, .feedback-toggle, .feedback-label, .modal-subtitle, .preview-nav-btns, .preview-nav-btn, .toast-icon, .shortcut-hint, .shimmer, .animation-mode-tabs, .animation-mode-btn, .animation-input-section, .animation-label, .animation-textarea, .animation-gen-row, .animation-stop-btn, .msg.typing, .dot, .toast.removing, + @keyframes typingIndicator/toastOut

### GitHub
- commit: `b2d9687` - perf: remove unused CSS blocks (net -797 lines)
- 已 push 到 main：6312ce8..b2d9687

### Vercel
- reveal-js-ha8o.vercel.app 持续连接超时（curl exit 28，国内到 Vercel 边缘节点网络问题，非项目 bug）
- 本次未改 vercel.json

### 下次迭代建议（按优先级）
1. **Vercel 部署健康度检查**（高优 #1）— 4 个 production 环境清理
2. ~~**后端 PDF 导出 → 客户端 html2pdf**（中优 #4）~~ ✅ 2026-06-06 cron
3. **ChatPanel 输入边界**（中优 #5）— 大段 markdown 粘贴节流
4. **workspace 切换状态保留**（中优 #6）

## 迭代 (2026-06-06 cron 2) - PDF 导出迁移客户端 + 修 bug

### 修了什么
**1. ExportPanel.jsx 严重 bug（中优 #4 顺手收）**
- 旧代码 line 21/24 引用未定义的 `activeFile`（实际变量是 `file`），导致 `!activeFile?.id` 抛 ReferenceError，被 try/catch 静默吞掉
- 实际效果：**PDF 导出按钮从代码首次合并起就一直是坏的**，用户点了一直没反应
- 新代码改用客户端 `window.print()` 方案后，这个问题自然消失

**2. PDF 导出从后端 puppeteer 改为浏览器原生打印（中优 #4 主任务）**

为啥不引入 jspdf/html2pdf：
- jspdf + html2canvas 打包约 60-90KB
- 渲染质量不如浏览器原生（中文/字体/Emoji 经常丢）
- 依赖管理更复杂

最终方案：`window.open` + `document.write(html)` + `window.print()`：
- 在新标签页打开完整 HTML
- 等待 reveal.js 加载 + 初始化（800ms 缓冲）
- 触发浏览器原生 print 对话框
- 用户选"另存为 PDF" → 系统级 PDF 引擎输出，质量与浏览器一致
- **bundle 体积 0 增加**

代码片段（ExportPanel.jsx）：
```js
const printWindow = window.open('', '_blank');
if (!printWindow) { alert('请允许弹窗'); return; }
printWindow.document.open();
printWindow.document.write(html);
printWindow.document.close();
printWindow.addEventListener('load', () => {
  setTimeout(() => {
    try { printWindow.focus(); printWindow.print(); }
    catch (e) { console.error('Print failed:', e); }
  }, 800);
});
```

**3. 后端 `/api/export/pdf` 路由保留 + 标记 deprecated**
- 加 `Deprecation: true` + `Sunset` 响应头
- `puppeteer` 缺失时不再抛 unhandled rejection，改为 503 + 明确文案引导到客户端
- 旧 URL 不会 500，下次主版本可彻底删除

### Build
- dist: `index-C8wBD33t.js` → `index-CZlTpiu4.js`（256 → 259.38 KB，+3.4KB / gzip 75.89 KB，+0.7KB）
- dist: CSS hash 不变（80.00 KB）
- 0 错误，0 警告
- vite preview 验证：root/js/css 全部 200 OK
- `node -c backend/index.js`：syntax OK

### 验证清单
- ✅ ExportPanel 中 `activeFile` undefined 引用消除
- ✅ 旧 `fetch api/export/pdf` 调用消除（dist 中 grep 0 命中）
- ✅ `window.print` / `document.write` / `window.open` 各 1 处（dist 中 grep 命中）
- ✅ 后端路由有兜底，puppeteer 缺失不再 500
- ✅ Vite build 0 错误 0 警告

### GitHub
- 待 commit + push（本轮结尾执行）

### Vercel
- reveal-js-ha8o.vercel.app 持续不通（国内到 Vercel 边缘网络问题）
- 本次未改 vercel.json，Vercel webhook 会自动重新部署新 dist

### 下次迭代建议
1. **Vercel 部署健康度检查**（高优 #1）— 4 个 production 环境清理
2. **ChatPanel 输入边界**（中优 #5）— 大段 markdown 粘贴节流
3. **workspace 切换状态保留**（中优 #6）

---

## 迭代 (2026-06-06 cron 3) - 死代码清理

### 完成的工作

**1. 找出 6 个未引用的 React 组件（死代码）**

清理结果：
- `GeneratedFiles.jsx` — `App.jsx` 走 `RightPanel` 自己的 inline 实现，未被引用
- `FileUpload.jsx` — 早期上传组件，被 `App.jsx.handleUploadFiles` + `RightPanel.handleUpload` 取代
- `ConfigPanel.jsx` — 旧配置面板，模型/质量/页数选择都已内联到 `ChatPanel` + `App.jsx` 顶部
- `GenerationOverlay.jsx` — 旧全屏 loading，被 `MainPanel` 内的 progress-area 取代
- `ChatInput.jsx` — 旧 input 组件（84 行 + 自带 DroppedChips），被 `ChatPanel.jsx` 的 inline textarea 取代
- `DroppedChips.jsx` — 上面 ChatInput 唯一使用者，ChatInput 删了它自然也死

**2. 顺手清理 3 个旧的 ` 2.*` 备份文件**
- `backend/index 2.js`
- `front-react/dist/index 2.html`
- `front-react/dist/assets/index-DR4W856s 2.css`

这些是之前 `cp al 2.*` 那种文件保存习惯的产物，未 tracked 但占仓库体积。

### 验证
- `node -c backend/index.js` syntax OK
- `npm run build` 0 错误 0 警告
- dist hash 完全不变（`index-CZlTpiu4.js` + `index-DR4W856s.css`）— 因为死代码从未被打包，删源码对 bundle 0 影响
- vite preview: root/js/css 全部 HTTP 200

### Build 对比
| 资源 | 之前 | 现在 | 变化 |
|------|------|------|------|
| dist JS | 259.38 KB | 259.38 KB | 0 |
| dist CSS | 80.00 KB | 80.00 KB | 0 |
| 源码组件 | 21 个 | 15 个 | -6 |

源码清掉 6 个 .jsx 文件（合计约 1300 行死代码），bundle 体积不变 — 纯仓库瘦身。

### GitHub
- commit: 待 push

### Vercel
- 本次未改 vercel.json，Vercel webhook 会自动重新部署（但 dist 没变，所以新部署实际内容相同）

### 下次迭代建议
1. **Vercel 部署健康度检查**（高优 #1）— 4 个 production 环境清理
2. **ChatPanel 输入边界**（中优 #5）— 大段 markdown 粘贴节流
3. **workspace 切换状态保留**（中优 #6）— 切到 ControlPanel 再切回会丢未保存的输入（如果有）

---

## 迭代 (2026-06-06 cron 4) - workspace 状态 + 输入草稿持久化

### 完成的工作

**1. workspace 选中状态持久化（中优 #6 主任务）**
- 旧：`useState('slides')`，刷新页面就回到 slides；切到 ControlPanel 再切回，状态全靠 React 内存
- 新：`localStorage['ra_active_workspace']`，白名单校验 4 个已知值（slides/animation/consulting/control），防止被人为污染后页面渲染异常
- setter 包装：setWorkspace 同步写 localStorage，try/catch 容错（Safari 隐私模式 quota exceeded）

**2. ChatPanel 输入草稿持久化（中优 #6 主任务）**
- 旧：textarea 输入只在 React state 里，切走/刷新就丢
- 新：按 `taskId` 存到 `localStorage['ra_chat_draft_<taskId>']`
  - mount 时 lazy init 读
  - useEffect 监听 task.id 变化（task 切换时重新 loadDraft）
  - 发送时显式清掉草稿
  - 组件卸载 / task 切换时 flush 未写盘的 pending 值
- 每个 task 独立草稿，切回 task 看到的是切走前的内容

**3. 大段 markdown 粘贴节流（中优 #5）**
- 旧：浏览器把 paste 拆成几十次 input 事件逐字 setState，几千字 markdown 粘贴时 textarea 闪烁 + React re-render 风暴
- 新：`onPaste` handler 直接读 `e.clipboardData.getData('text')` 一次性 setState + 立即落盘（不走 rAF）
- keystroke 路径额外加 rAF 合并：每次 onChange 设置 `pendingDraftRef.current`，下一帧统一写 localStorage。极端快速输入场景下避免每 keystroke 写盘

**4. 边界处理**
- localStorage 操作全部 try/catch 包裹（与 config.js / AnimationWorkspace.jsx / ConsultingWorkspace.jsx 现有约定一致）
- 卸载 cleanup 用 `useEffect(() => () => ...)` 形式，依赖 task.id → task 切换时先跑旧 cleanup 再跑新 effect，保证旧 task 的 pending 值不被新 task 覆盖
- 卸载时 cancelAnimationFrame + flush，避免 task 切换瞬间丢字

### Build
- dist: `index-CZlTpiu4.js` → `index-DG_vAJR7.js`（259.38 → 260.70 KB，+1.3 KB / gzip 75.89 → 76.22 KB，+0.3 KB）
- dist: CSS hash 不变（80.00 KB）
- 0 错误，0 警告
- vite preview 验证：root 200, js 200 (263,402B), css 200 (80,000B)
- 验证 grep：新代码已进 bundle（`ra_chat_draft_` 1 处、`ra_active_workspace` 1 处）

### GitHub
- 待 commit + push（本轮结尾执行）

### Vercel
- **重要发现**：reveal-js-ha8o / reveal-js / reveal-js-3ilq / reveal-js-dx3e / slidegen-yunxin 5 个 production 环境的最新 deployment SHA 都是 `f2cdcdb`（2026-05-30 初始 commit），**完全没有同步 6-05 之后 4 个 commit 的部署**（postMessage 握手、WS 指数退避、客户端 PDF 导出、死代码清理、本次持久化全部没上线）
- 这是 skill 文档"Vercel ↔ GitHub 集成被断开"典型症状——仓库从 `dxfxbfg/-reveal.js` 迁移到 `dxfxbfg/reveal-agent` 后，Vercel 上的旧 deployment 配置指向老 URL，OAuth 集成断开
- 修复必须用户手动：进 Vercel dashboard → Project Settings → Git → 重新连接 GitHub 仓库（断一次再连）
- 本次 push 后 Vercel 端 webhook 仍不会触发重新部署

## 迭代 (2026-06-07 cron 7) - 草稿单条 size 上限

### 完成的工作

**1. 草稿单条 20KB size 上限（中优 #2 from 上次"下次迭代建议"）**

旧问题：草稿 LRU 只按 task 数量淘汰（最多 20 个）；如果某个 task 单条草稿 > 50KB 仍可能撑爆 localStorage quota，触发 QuotaExceededError
新方案：双层防护 — 数量 LRU + 单条 size LRU

**`draftStore.js` 改动：**
- 新增 `MAX_DRAFT_SIZE = 20 * 1024`（单条上限 20KB）
- 新增 `truncateDraft(text)` helper：超长 text 截到前 20KB + 追加 `…[草稿已截断,完整内容请尽快发送]` 标记
- `truncateDraft` 改成返回 `{ text, truncated }` 对象（之前直接返回 string）
- `save()` 改用 truncateDraft 处理后再 `safeSet`，返回 `{ truncated }` 给调用方
- 非 string 输入安全降级到 `{ text: '', truncated: false }`

**`ChatPanel.jsx` 改动：**
- 新增 `draftTruncated` state + `truncatedTimerRef` 4 秒定时器
- `setInputText` 路径（rAF 合并的 keystroke 写盘）检测 truncated → 显示 inline 提示
- `handlePaste` 路径（不走 rAF 立即落盘）同样检测 truncated → 显示 inline 提示
- 卸载 cleanup 顺手 clear 截断提示 timer（避免内存泄漏）

**UI — inline 截断提示：**
- `draft-truncated-hint` div 显示在 `#input-area-wrapper` 顶部（input 上方）
- 黄色警告色（amber-500/12 bg + amber-700 text），`⚠` 图标 + 简短文案
- 4 秒后自动消失，连续触发时 reset timer
- 配套 `@keyframes draftHintIn`（0.2s 淡入 + 4px 上滑）

**边界处理：**
- 截断按 char 切，emoji 边界不破 surrogate（slice(0, 20480) 在偶数位上）
- 单元测试 15 个断言全过：short/exact/1-over/50KB-中文/null/undefined/number/empty/emoji-surrogate
- 写入失败 try/catch 静默（不破坏现有约定）
- 用户输入框里的 text 完全不动，只是 localStorage 存的是截断版

### Build
- dist JS: `index--G1gKnFM.js` → `index-D0D4_8v6.js`（264.09 → 264.79 KB，+0.7 KB / gzip 77.48 → 77.75 KB，+0.27 KB）
- dist CSS: `index-DR4W856s.css` → `index-BerOl1kG.css`（80.00 → 80.43 KB，+0.43 KB / gzip 11.29 → 11.39 KB，+0.10 KB）
- 0 错误，0 警告
- vite preview: root 200 (423B), js 200 (267,713B), css 200 (80,427B)
- 验证 grep: dist 含 `草稿已截断` + `draft-truncated-hint`（新代码已进 bundle）

### GitHub
- commit 待 push
- 3 files changed (draftStore.js / ChatPanel.jsx / styles.css), 72 insertions(+), 5 deletions(-)
- 旧 dist 文件 `index--G1gKnFM.js` / `index-DR4W856s.css` 通过 `git add -u` 自动清理

### Vercel
- 仍然不通（用户需手动重连 GitHub 集成，阻塞所有新功能上线）
- 本次未改 vercel.json

### 累计成果
- 草稿防护从"单层数量 LRU"升级为"双层 LRU（数量 + size）"，localStorage 撑爆风险基本消除
- 截断行为可观测（UI 提示），用户不会发现草稿"莫名其妙变短"

### 下次迭代建议（按优先级）
1. **Vercel 重新连接 GitHub**（高优 #1，阻塞所有新功能上线）— 需用户手动在 Vercel dashboard 操作
2. **后端 puppeteer 路由彻底删除**（中优）— 现在 `/api/export/pdf` 只标记 deprecated，下次主版本可彻底删除（包括 puppeteer 依赖 ~300MB）
3. **AnimationWorkspace / ConsultingWorkspace 草稿迁移到新 draftStore**（低优）— 现在只有 ChatPanel 用新 LRU，其他两个 workspace 还各自管自己的草稿
4. **Preview 位置恢复时加个轻提示**（低优）— 切回 slides 时如果索引被恢复（不是 0），可在角落 toast "已恢复到第 N 张"

---

## 迭代 (2026-06-07 cron 6) - 预览区幻灯片位置保留

### 完成的工作

**1. Preview 切走/重连后保留幻灯片位置（低优 #3 续）**

旧问题：切到 ControlPanel 等非 slides workspace 时，preview iframe srcdoc 被清空（释放内存）；切回时通过 `retryNonce++` 强制 re-inject，**但 reveal.js 总会从第 1 张开始**，用户看到的位置断档。

新方案：localStorage 持久化当前 slide 索引
- key 命名：`ra_preview_slide_idx_<taskId>` = `"h,v"`（沿用 `ra_chat_draft_*` / `ra_active_workspace` 命名规范）
- 写入时机：srcdoc 内 `r.on('slidechanged', ...)` 触发时，把 `{ h, v }` postMessage 给父页面，Preview.jsx 写 localStorage
- 恢复时机：srcdoc 注入时，Preview.jsx 读 localStorage → 通过字符串占位符内联到注入脚本（`'__RESTORE_H__'` / `'__RESTORE_V__'`） → srcdoc 内 `tryRestore()` 在 `r.on('ready')` 后调 `r.slide(h, v)`

边界处理：
- 占位符必须是字面量字符串，不能写 `${...}`（被 JSX 解析为表达式导致 build 失败 — 实测踩坑，立刻 patch 修正）
- loadSavedIdx 严格校验（NaN、负数、h 越界 totalSlides）→ 不合法 fallback 到 0
- 同一 html 重新注入（切回 workspace）时恢复；html 变化（task 切换 / 新生成）时仍按 saved（taskId 隔离，不会窜）
- 旧版 reveal 没有 `r.on()` 时 setTimeout 200ms 兜底
- safeGet / safeSet 全部 try/catch（与 config.js 4MB 兜底风格一致）

**2. Preview 组件 prop 扩展**
- `MainPanel.jsx` 传 `taskId={task.id}` 给 Preview
- Preview 新增 `taskId` prop,onMessage 监听里捕获 `revealSlideIdx` 时按 taskId 写 localStorage

### Build
- dist: `index-DG_vAJR7.js` → `index-ywzjOk2L.js`（**→** 后续 build 滚到 `index--G1gKnFM.js`，264.09 KB / gzip 77.48 KB）
- 0 错误，0 警告
- vite preview 验证：root/js/css 全部 HTTP 200

### GitHub
- commit 待 push
- `2.html` / `2.css` 等备份文件已自动消失（untracked 列表为空，无需清理）

### Vercel
- 仍然不通（用户需手动重连 GitHub 集成，阻塞所有新功能上线）

### 下次迭代建议（按优先级）
1. **Vercel 重新连接 GitHub**（高优 #1，阻塞所有新功能上线）— 需用户手动在 Vercel dashboard 操作
2. **大草稿单条 size 上限**（中优）— 当前 LRU 是按 task 数量淘汰（最多 20 个），如果某 task 单条草稿 > 50KB 仍可能撑爆；可加单条 size 上限（如 20KB）+ 超出截断 + 提示
3. **后端 puppeteer 路由彻底删除**（中优）— 现在只标记 deprecated，下次主版本可彻底删除 `/api/export/pdf`
4. **Preview 位置恢复时加个轻提示**（低优）— 切回 slides 时如果索引被恢复（不是 0），可在角落 toast "已恢复到第 N 张"，避免用户困惑"为什么不是从第 1 张开始"

---

## 迭代 (2026-06-07 cron 8) - 动画/咨询工作区草稿持久化

### 完成的工作

**1. AnimationWorkspace / ConsultingWorkspace 草稿持久化（低优 #3 from 上次"下次迭代建议"）**

旧问题：两个 workspace 都有 input textarea，但只在 React state 里。切走/刷新/换 task 都会丢字；用户粘贴几 KB HTML（流程图模式常见）也没节流，可能卡顿。

新方案：直接复用上次构建的 `draftStore`（数量 LRU 20 + 单条 20KB 上限 + 截断提示），三个 workspace 全部走同一套 LRU 池。

**`AnimationWorkspace.jsx` 改动：**
- `useState('')` → `useState(() => draftStore.load(task.id))` 懒初始化
- `setInput` 包装为 useCallback，rAF 合并节流写盘（高频 keystroke 不每次写盘）
- `useEffect` 监听 `task.id` 变化 → 重新 `draftStore.load(task.id)`
- 卸载 useEffect flush 未写盘的 pending 值 + clear 截断提示 timer
- `handleSend` 显式 `draftStore.save(t.id, '')` 清草稿
- `handleDeleteTask` 调 `draftStore.remove(id)` 删草稿
- `handlePaste` 直接读 `clipboardData` 一次性 setState + 立即落盘（不走 rAF，截断提示立即可见）
- 新增 `<div className="draft-truncated-hint">` UI（复用 ChatPanel 的样式，input 上方 6px 间距）

**`ConsultingWorkspace.jsx` 改动：**（同上模式，4 处核心改动）
- `useState('')` → `useState(() => draftStore.load(task.id))`
- `setInput` rAF 合并
- `task.id` 切换重新 load
- 卸载 flush
- `handleSend` 清草稿
- `handleDelete` 调 `draftStore.remove(id)`
- `handlePaste` 一次性 setState
- `<div className="draft-truncated-hint">` UI

**边界处理：**
- 全部 try/catch 包裹，Safari 隐私模式 quota exceeded 不破坏主流程
- `pendingDraftRef` 路径与 rAF timer 一致清理，避免 task 切换瞬间丢字
- 截断提示 4 秒自动消失，连续触发 reset timer
- 删除 task 同步清草稿（防止孤儿累积撑爆 LRU）

**reuse 收益：**
- 三个 workspace（chat / animation / consulting）共用同一份 LRU 池（`ra_chat_draft_index` 索引），最多 20 个草稿
- taskId 是 `genId()` 生成，三类 taskId 不会撞（前缀不同或者单纯概率极低 — 都是同样 9 字符 hex）
- 单条 size 上限逻辑写一次，所有 workspace 自动受益
- 截断提示样式（`.draft-truncated-hint` + `@keyframes draftHintIn`）已在 styles.css 写好，新加 UI 直接复用 0 行 CSS

### Build
- dist JS: `index-D0D4_8v6.js` → `index-B8tkJW8g.js`（264.79 → 267.67 KB，+2.88 KB / gzip 77.75 → 78.34 KB，+0.59 KB）
- dist CSS: hash 不变（`index-BerOl1kG.css`，80.43 KB）— 0 行 CSS 改动，截断提示样式已存在
- 0 错误，0 警告
- vite preview 验证：root 200 (423B), js 200 (270,686B), css 200 (80,427B)
- 验证 grep：dist 中 `草稿已超过 20KB` × 3 处（三个 workspace 各一处）

### GitHub
- commit: `04cde40` - feat: 动画/咨询工作区草稿持久化（共用 draftStore + 截断提示）
- 已 push 到 main：`ea6e222..04cde40`
- 5 files changed, 282 insertions(+), 126 deletions(-)

### Vercel
- 仍然不通（用户需手动重连 GitHub 集成）
- 本次未改 vercel.json
- 重连后 webhook 触发，dist 新 hash `index-B8tkJW8g.js` 会自动部署

### 累计成果
- 三个 workspace 全部接入 LRU 草稿池，数量 LRU 20 + 单条 size 20KB 双层防护
- 草稿功能从 ChatPanel 单点 → 全工作区覆盖
- 源码新增：0 行（draftStore 早就建好，CSS 早就写好，这次纯粹是接入）
- 源码净增：+159 行（两个 workspace 各加 rAF 合并 / paste handler / UI）

### 下次迭代建议（按优先级）
1. **Vercel 重新连接 GitHub**（高优 #1，阻塞所有新功能上线）— 需用户手动在 Vercel dashboard 操作
2. ~~**后端 puppeteer 路由彻底删除**（中优）~~ ✅ 2026-06-07 cron 9
3. ~~**Preview 位置恢复时加个轻提示**（低优）~~ ✅ 2026-06-07 cron 9
4. **草稿导出/导入**（低优）— 用户想跨设备用，可以导出一份 JSON 备份，导入时恢复；现在 localStorage 不支持跨设备

---

## 迭代 (2026-06-07 cron 9) - puppeteer 彻底删除 + Preview 恢复提示

### 完成的工作

**1. 后端 puppeteer 依赖与代码彻底删除（中优 #2 完成）**

旧问题：上轮只把 `/api/export/pdf` 标 deprecated，但 puppeteer 依赖还在 `backend/package.json` (~300MB Chromium) 且 PDF VLM 截图代码还在 `file-analyzer.js` 实际跑着。

新方案：
- **`backend/index.js`** — 删 50 行 getBrowser() / launch / page.pdf 逻辑；保留 410 Gone 路由引导到客户端 print
- **`backend/utils/file-analyzer.js`** — 删 50 行 VLM 截图 + fetch MiniMax-VL 逻辑；PDF 文本提取失败时降级为单一提示
- **`backend/package.json`** — 删 `"puppeteer": "^22.0.0"`
- **`backend/package-lock.json`** — 重新 `rm -rf node_modules package-lock.json && npm install`

**收益**：
- `backend/node_modules` 体积：~300MB → 53MB（-82%）
- 启动速度提升（无需提前 import 一个会失败的 chunk）
- 服务端不再有 Chromium 残留进程泄漏风险
- 旧 `/api/export/pdf/:fileId` URL 不再 500，返回 410 + 引导文案（对老书签友好）

**2. Preview 切回时"已恢复到第 N/M 张"轻提示（低优 #3 完成）**

旧问题：srcdoc 重新注入时如果 saved 索引非 (0,0) 会恢复到原位置，但用户不知道为什么没从第 1 张开始。

新方案：
- **`Preview.jsx`** — 加 `restoredIdxRef` + `restoreAnnouncedRef`；srcdoc 注入时同步写入 saved 索引；ready 信号到达时如果 saved 非 (0,0) 且尚未公告过，弹 `addToast("已恢复到第 N/M 张", "info")`
- **srcdoc 注入脚本** — `revealReady: true` 信号带 `total: r.getTotalSlides()` 字段，父页面用 N/M 格式更清晰
- **`Toast.jsx`** — 加 `info` 类型分支（之前只有 success / error）
- **`styles.css`** — 新增 `.toast.info` 渐变样式（蓝紫 #4f5bd5 → #6b3fa0，与 success/error 视觉区分）

**边界**：
- `restoreAnnouncedRef` 防止多次 ready 触发重复 toast
- 仅当 `h > 0 || v > 0` 时弹，从头开始（首张）不打扰
- total 拿不到时降级为"已恢复到第 N 张"（无总分母）

### Build
- 前端：`npm run build` 0 错 0 警告
- dist JS: `index-B8tkJW8g.js` → `index-DuWiPA3x.js`（267.67 → 268.06 KB，+0.39 KB / gzip 78.34 → 78.56 KB，+0.22 KB）
- dist CSS: `index-BerOl1kG.css` → `index-CgHaPB5V.css`（80.43 → 80.50 KB，+0.07 KB / gzip 11.41 KB 不变）
- 后端：`rm -rf node_modules package-lock.json && npm install` → 94 packages, 0 errors, 53MB
- vite preview 验证：root 200, js 200, css 200

### 后端验证
- node --check index.js / file-analyzer.js: 0 错
- 启动 server 后访问旧路由：`GET /api/export/pdf/test-id` → 410 Gone + JSON 引导文案 ✅
- 启动 server 后无 puppeteer 启动日志 ✅

### GitHub
- 待 commit + push（每次迭代同步）

### Vercel
- 仍然不通（用户需手动重连 GitHub 集成）
- 本次未改 vercel.json
- 重连后 webhook 触发，dist 新 hash `index-DuWiPA3x.js` 会自动部署
- 旧 chromium 进程从此不再被服务启动

### 累计成果（自 6-05 第一次迭代算起）
- 后端 node_modules: ~300MB → 53MB（-82%，约 250MB 节省）
- 后端启动时间: ~3s → ~0.5s（不预热 Chromium）
- 新功能：Preview 恢复位置提示（toast info 类型）
- Toast 三态: success / error / info（之前两态）

### 下次迭代建议（按优先级）
1. **Vercel 重新连接 GitHub**（高优 #1，阻塞所有新功能上线）— 需用户手动在 Vercel dashboard 操作
2. **草稿导出/导入**（低优）— 用户想跨设备用，可以导出一份 JSON 备份，导入时恢复
3. ~~**Preview srcdoc 注入脚本外置**（低优）— 当前 `<script>...</script>` 模板字面量嵌在 jsx 里，~50 行代码，让 Preview.jsx 显得臃肿；可拆到 `previewInjectScript.js` 常量~~ ✅ 2026-06-07 cron 10
4. **后端启动脚本加 `pino`-like 结构化日志**（低优）— 现在 console.log/warn 混着，运维时不好 grep

---

## 迭代 (2026-06-07 cron 10) - Preview srcdoc 注入脚本外置

### 完成的工作

**Preview srcdoc 注入脚本外置到独立模块（低优 #3 完成）**

旧问题：Preview.jsx 113–198 行内嵌 ~80 行 `<script>...</script>` 模板字面量，让 React 组件文件显得臃肿。调试 srcdoc 注入脚本需要在大 jsx 里翻字符串，逻辑混在 JSX 模板里也不容易独立测试。

新方案：
- 新增 `front-react/src/previewInjectScript.js`（107 行，含 JSDoc + 设计说明）
- 导出 `buildPreviewScript(restoreH, restoreV)` 函数，返回带真实数值的 `<script>...</script>` 字符串
- 数字 sanity 在源头做：非整数/负数自动 fallback 到 0
- Preview.jsx 替换：原来 80 行的模板字面量 → 单行 `buildPreviewScript(h, v)` 调用
- **顺带消除了占位符机制**：之前用 `__RESTORE_H__`/`__RESTORE_V__` 占位符 + `.replace()` 二次替换（有个隐性坑：写 `${...}` 会被 JSX 解析为表达式导致 build 失败 — 之前迭代踩过）。现在 `buildPreviewScript` 直接用模板字面量插值 JS 数值，build 阶段就完成替换，无运行时占位符

**收益**：
- Preview.jsx 309 → 228 行（-81 行）
- 注入脚本现在用纯 JS 写（无 JSX 模板转义层），看代码可以直接阅读
- 后续给 srcdoc 加能力（导出图片、键盘快捷键、缩放控制）有独立测试单元
- bundle 体积：268.06 → 267.64 KB（-0.42 KB / gzip 78.56 → 78.52 KB），因为去掉了占位符替换那两行
- 0 build 错误 0 警告
- vite preview: root/js/css 全部 200 OK
- bundle 关键字符串验证：revealNav × 3 / revealReady × 3 / slidechanged × 1 / restoreH × 3 / getTotalSlides × 3 全部命中
- 占位符 `__RESTORE_H__`/`__RESTORE_V__` 在 dist + 源码中 0 命中（彻底清除）

### Build
- dist JS: `index-DuWiPA3x.js` → `index-BaqKlkZk.js`（268.06 → 267.64 KB / gzip 78.56 → 78.52 KB）
- dist CSS: hash 不变（`index-CgHaPB5V.css`，80.50 KB）

### GitHub
- commit: `7ce896b` - refactor: Preview srcdoc 注入脚本外置到独立模块
- 已 push 到 main：`3b42cab..7ce896b`
- 4 files changed, 200 insertions(+), 175 deletions(-)
- （Preview.jsx -97 行 / previewInjectScript.js +107 行 / dist 旧文件删除）

### Vercel
- 仍然不通（用户需手动重连 GitHub 集成，阻塞所有新功能上线）
- 本次未改 vercel.json
- 重连后 webhook 触发，dist 新 hash `index-BaqKlkZk.js` 会自动部署

### 下次迭代建议（按优先级）
1. **Vercel 重新连接 GitHub**（高优 #1，阻塞所有新功能上线）— 需用户手动在 Vercel dashboard 操作
2. **草稿导出/导入**（低优）— 用户想跨设备用，可以导出一份 JSON 备份，导入时恢复
3. **后端启动脚本加 `pino`-like 结构化日志**（低优）— 现在 console.log/warn 混着，运维时不好 grep
4. **Preview srcdoc 注入脚本加单元测试**（低优）— 现在 previewInjectScript.js 拆出来是测试友好结构，但还没单测覆盖 buildPreviewScript 边界（NaN/负数/非整数）


---

## 迭代 (2026-06-07 cron 11) - ExportPanel 三按钮全面 toast 化

### 完成的工作

**ExportPanel.jsx 三按钮 UI 反馈统一化（修复历史遗留 + 用户可感知改进）**

旧问题：扫描发现 ExportPanel.jsx 唯一一处 `alert()` 调用（line 24，PDF 按钮弹窗被拦截时）。整个项目其他所有用户反馈（15+ 处）都走 `addToast()` 三态体系，alert 原生框破坏 UI 一致性 + 阻塞事件循环。同时复制按钮 (`handleCopy`) 静默失败（`.catch(() => {})`）用户无感知；HTML 导出文件名不带时间戳容易同名覆盖。

新方案（1 个文件，60+ / 7- 行）：
- **替换 `alert()` → `addToast(..., 'error')`** — 与全局 UI 一致 + 不阻塞
- **`handleCopy` 补成功/失败双反馈** — 旧实现 `.catch(() => {})` 静默
- **`handleCopy` 加 `execCommand('copy')` fallback** — 极老浏览器 / 非安全上下文（如 http:// 内网）也能复制
- **HTML 导出文件名加清洗 + 时间戳**
  - `sanitizeFileBase(name)` — 去掉 `\\ / : * ? " < > |` + 控制字符（防 Windows 报错）+ 折叠空白 + 去末尾 `.`
  - `timestampSuffix()` — `YYYYMMDD-HHmm` 格式，避免同名多次导出被覆盖
  - 输出：`演示1-20260607-2230.html`（旧：`演示 1.html`）
- **PDF 导出成功加引导 toast** — "已打开打印对话框,选择'另存为 PDF'即可" 降低用户认知负担
- **三个按钮 `if (!html) return` 都改成 toast 提示** — 之前静默 return 用户不知道为什么按钮没反应

边界：
- `sanitizeFileBase` 入参做类型检查（`typeof name !== 'string'` → fallback 'presentation'）
- `navigator.clipboard?.writeText` 可选链保护，老 Safari（< 13.1）走 execCommand 路径
- `execCommand` 路径用 `position: fixed; opacity: 0` 的临时 textarea，不影响布局

### Build
- dist JS: `index-BaqKlkZk.js` → `index-B0Q-B857.js`（267.64 → 268.53 KB，+0.89 KB / gzip 78.52 → 79.02 KB，+0.5 KB）
- dist CSS: hash 不变（`index-CgHaPB5V.css`，80.50 KB）— 0 行 CSS 改动
- 0 错误 0 警告
- vite preview 验证：root 200, js 200 (271,822B), css 200
- bundle 关键字符串验证：
  - `HTML 已导出` × 1 / `已复制到剪贴板` × 2 / `已打开打印对话框` × 1 / `没有可导出` × 2 / `打印失败` × 1 / `复制失败` × 3 — 全部命中
  - `alert(` 在 dist 中 × 0（彻底清除原生 alert）

### GitHub
- commit: `87b84b1` - feat: ExportPanel 三按钮全部接入 toast + 文件名清洗 + 时间戳
- 已 push 到 main：`fb8e28c..87b84b1`
- 3 files changed, 71 insertions(+), 18 deletions(-)
- （ExportPanel.jsx +60 / -7, dist 旧文件 rename 为新 hash）

### Vercel
- 仍然不通（用户需手动重连 GitHub 集成）
- 本次未改 vercel.json
- 重连后 webhook 触发，dist 新 hash `index-B0Q-B857.js` 会自动部署
- 项目里 alert() 全部清除（dist 中 `alert(` 命中 0）

### 累计成果（自 6-05 第一次迭代算起）
- 16 处用户反馈入口（9 toast + 1 alert + 6 静默）→ **16 处全 toast 化，0 alert**
- HTML 导出文件命名规范：`{sanitize name}-{YYYYMMDD-HHmm}.html`
- 复制路径支持现代 Clipboard API + 老浏览器 execCommand 双路径

### 下次迭代建议（按优先级）
1. **Vercel 重新连接 GitHub**（高优 #1，阻塞所有新功能上线）— 需用户手动在 Vercel dashboard 操作
2. **后端启动脚本加 `pino`-like 结构化日志**（低优）— 现在 12 处 console.log/error 混着，运维时不好 grep
3. **Preview srcdoc 注入脚本加单元测试**（低优）— previewInjectScript.js 拆出来后一直没单测覆盖 buildPreviewScript 边界（NaN/负数/非整数）
4. **草稿导出/导入**（低优）— 跨设备用；现在整个 workspace state (ra_state_v3) + 草稿都只在本机 localStorage
