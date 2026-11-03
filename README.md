# StreamChat

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-3b8067)
![Demo](https://img.shields.io/badge/demo-not%20deployed-lightgrey)

**A developer-first, open-source AI chat workspace with incremental streaming, rich Markdown, and bring-your-own-model credentials.**

> The public demo has not been deployed yet. This project intentionally does not ship with a shared provider key; configure your own model credentials to use it.

<!-- Add a captured UI image at docs/screenshots/chat-workspace.png before the first public release. -->

## What it does

- Stream responses from OpenAI-compatible Chat Completions APIs through a Next.js Route Handler.
- Keep conversations, model settings, and provider credentials in browser `localStorage`; no application database is required.
- Render GFM Markdown, tables, task lists, links, and Shiki-highlighted fenced code with a copy control.
- Stop an in-progress response and show actionable errors for invalid credentials, limits, and interrupted streams.
- Adapt the conversation sidebar and composer for mobile screens.

## Stack

Next.js 15 App Router · React 18 · TypeScript strict mode · Tailwind CSS v4 · Zustand · React Hook Form · Zod · `react-markdown` · `remark-gfm` · Shiki · SSE

## Requirements

- Node.js 20.11 or later
- pnpm 10
- An API key from an OpenAI-compatible provider, or a local Ollama instance for development

## Quick start

```bash
git clone https://github.com/<your-account>/stream-chat-agent.git
cd stream-chat-agent
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), choose **Model settings**, and add a provider API key, base URL, and model name. No provider key is needed in `.env.local`; the user-supplied key is sent to the same-origin chat route for each request.

### Provider examples

| Provider                         | Base URL                         | Notes                                                                                                           |
| -------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Groq                             | `https://api.groq.com/openai/v1` | Create your own key in the provider dashboard. Free-plan limits can change.                                     |
| OpenRouter                       | `https://openrouter.ai/api/v1`   | Choose an available model in your OpenRouter account.                                                           |
| Ollama                           | `http://localhost:11434/v1`      | Development only; start Ollama and pull a model first. The route accepts loopback HTTP only outside production. |
| Other OpenAI-compatible provider | Your provider's HTTPS `/v1` URL  | Add its exact hostname to `LLM_ALLOWED_HOSTS` on the server.                                                    |

Ollama and provider free tiers are subject to each provider's availability, terms, and rate limits. A Vercel-hosted app cannot reach Ollama running on a visitor's computer.

## Configuration

Copy `.env.example` to `.env.local` when using a custom provider:

```dotenv
# Comma-separated exact hostnames for trusted OpenAI-compatible providers.
LLM_ALLOWED_HOSTS=api.example.com

# Set this after creating the public GitHub repository.
NEXT_PUBLIC_GITHUB_URL=https://github.com/<your-account>/stream-chat-agent
```

The route allows the built-in OpenAI, Groq, and OpenRouter hosts. It rejects non-HTTPS custom hosts, credentials embedded in URLs, and unlisted destinations to reduce server-side request forgery risk. Localhost is allowed only in development for Ollama. Do not add a hostname you do not control or trust.

## Security and privacy

- The API key is never embedded in the deployed server environment or exposed as a build-time public variable. It is sent from the browser to the app's same-origin route and then to the configured model provider.
- For convenience, settings and chat history—including the API key—are stored in browser `localStorage`. Anyone with access to this browser profile or same-origin script execution may read that key. Do not use this app on a shared or untrusted device; revoke keys you no longer need.
- The server validates request sizes, model settings, origin, and provider host. It does not persist requests or responses.
- Markdown HTML is not enabled. External links open in a new tab with `noopener` and `noreferrer`.
- A public demo should remain bring-your-own-key (BYOK). Never configure a shared server-side provider key on an unauthenticated deployment.

## Quality checks

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

GitHub Actions runs the same checks on pushes and pull requests. A pre-commit hook formats and lints staged files.

## Deployment

1. Push this repository to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. Configure `LLM_ALLOWED_HOSTS` if you use a custom provider and set `NEXT_PUBLIC_GITHUB_URL` to the repository URL.
4. Deploy. Each visitor configures their own provider key in the app.

No live demo URL is listed until a deployment is configured and verified.

## Roadmap

- [ ] Add a verified public demo and representative screenshots.
- [ ] Add focused component and API-route integration tests.
- [ ] Connect the typed tool registry to model tool calling behind explicit user consent.
- [ ] Explore document upload and retrieval-augmented generation (RAG).
- [ ] Add configurable retention and export/import for local conversations.

## Contributing

Issues and pull requests are welcome. Before opening a pull request, run the quality checks above and describe the behavior you verified. Please do not include API keys, personal chat history, or provider credentials in issues, logs, screenshots, or commits.

## License

MIT. See [LICENSE](./LICENSE).
