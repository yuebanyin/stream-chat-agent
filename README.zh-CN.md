# StreamChat

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-3b8067)

**开源 AI 对话工作台，支持流式响应、Markdown 渲染、本地 Ollama、中英文界面和深色主题。**

[在线体验](https://stream-chat-agent.vercel.app) · [GitHub 源码](https://github.com/yuebanyin/stream-chat-agent) · [English README](./README.md)

在线 Demo 使用 BYOK（自带 API Key）模式，不提供共享 API Key。无需第三方 Key 时，可在本机运行应用并连接本地 Ollama。

## 功能特性

- 通过 Next.js Route Handler 连接兼容 OpenAI Chat Completions 的模型服务，并以 SSE 流式返回内容。
- 支持 Ollama 本地模型；对话、模型设置和 Provider Key 保存在浏览器 `localStorage`。
- 支持 GFM Markdown、表格、任务列表、链接，以及 Shiki 代码高亮和复制。
- 可随时停止生成；对无效凭证、请求限额及流中断提供错误提示。
- 适配手机屏幕，可在设置中切换简体中文/英文及浅色/深色主题；偏好会保存在浏览器中。

## 技术栈

Next.js 15 App Router · React 18 · TypeScript strict mode · Tailwind CSS v4 · Zustand · React Hook Form · Zod · `react-markdown` · `remark-gfm` · Shiki · SSE

## 环境要求

- Node.js 20.11 或更高版本
- pnpm 10
- 兼容 OpenAI API 的服务商 Key，或本地运行的 [Ollama](https://ollama.com/download)

## 本地启动

```bash
git clone https://github.com/yuebanyin/stream-chat-agent.git
cd stream-chat-agent
pnpm install
cp .env.example .env.local
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)，在侧边栏底部可切换界面语言和主题。

### 使用 Ollama（本地免 API Key）

1. 安装并启动 [Ollama](https://ollama.com/download)。
2. 下载一个模型，例如：

   ```bash
   ollama pull llama3.2
   ```

3. 确认 StreamChat 在本机以开发模式运行（`pnpm dev`）。
4. 打开模型设置，选择 **Ollama（本地，无需 API Key）** 并保存。

Ollama 预设会填写本机地址、模型名和非真实的占位凭证。在线 Vercel Demo 或生产服务器无法访问访客电脑上的 `localhost`，因此本机 Ollama 仅适用于本地开发。

### 使用免费额度 Provider

Groq 和 OpenRouter 的免费额度、可用模型及限额会由服务商调整；免费额度通常仍需要账号和个人 API Key。

- **Groq**：在 [Groq Console](https://console.groq.com/keys) 创建个人 Key，设置中选择 Groq 预设，再输入服务商当前支持的模型 ID。
- **OpenRouter**：在 [OpenRouter](https://openrouter.ai/keys) 创建个人 Key，选择 OpenRouter 预设，并使用其[免费模型列表](https://openrouter.ai/models?free=true)中的可用模型 ID。

应用不会提供共享 Provider Key。不要把自己的 Key 配置到未认证的公开部署中。

## 自定义 Provider

自定义 Provider 需在服务端配置允许的精确主机名：

```dotenv
# 仅填写可信 Provider 的精确域名，多个域名用逗号分隔
LLM_ALLOWED_HOSTS=api.example.com

# 项目公开源码地址
NEXT_PUBLIC_GITHUB_URL=https://github.com/yuebanyin/stream-chat-agent
```

服务端默认允许 OpenAI、Groq 和 OpenRouter。自定义 Provider 必须使用 HTTPS；开发环境的 Ollama 除外。接口会拒绝未列入白名单的地址，降低 SSRF 风险。

## 隐私与安全

- API Key 不会打包进服务端环境变量或公开构建变量。请求时，Key 从浏览器发往同源接口，再由服务端转发给所选模型 Provider。
- 为方便使用，模型设置（包括 API Key）和对话记录保存在浏览器 `localStorage`。有权访问此浏览器配置文件或在同源页面执行脚本的人可能读取这些数据。请勿在共享或不可信设备上使用；不再需要时及时撤销 Key。
- 服务端校验请求大小、模型参数、请求来源和 Provider 主机；不会持久化请求或回复。
- Markdown 不启用原始 HTML；外部链接使用 `noopener` 和 `noreferrer`。
- 未认证的公开 Demo 应保持 BYOK 模式，不要配置共享服务端 Provider Key。

## 质量检查

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

GitHub Actions 会在 Push 和 Pull Request 时运行这些检查。

## 部署

1. 将仓库推送到 GitHub。
2. 在 [Vercel](https://vercel.com/new) 导入仓库。
3. 如使用自定义 Provider，配置 `LLM_ALLOWED_HOSTS`；并将 `NEXT_PUBLIC_GITHUB_URL` 设置为仓库地址。
4. 部署后，每位访客需在应用内配置自己的 Provider Key。

## 许可证

MIT，详见 [LICENSE](./LICENSE)。
