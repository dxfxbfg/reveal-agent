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
2. **后端 PDF 导出 → 客户端 html2pdf**（中优 #4）
3. **ChatPanel 输入边界**（中优 #5）— 大段 markdown 粘贴节流
4. **workspace 切换状态保留**（中优 #6）