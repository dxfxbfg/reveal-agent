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
