"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const translations = {
  en: {
    appTitle: "StreamChat — Your AI workspace",
    loading: "Preparing your workspace...",
    closeNavigation: "Close navigation",
    brandCaption: "YOUR AI WORKSPACE",
    newConversation: "New conversation",
    recent: "RECENT",
    conversations: "Conversations",
    deleteConversation: "Delete conversation",
    emptyConversations: "Your conversations will appear here.",
    privateByDesign: "Private by design",
    modelSettings: "Model settings",
    openNavigation: "Open navigation",
    workspace: "WORKSPACE",
    noModel: "No model selected",
    currentModel: "Current model: {model}. Open model settings",
    openModelSettings: "Open model settings",
    clearConversation: "Clear conversation",
    openGithub: "Open GitHub",
    moreOptions: "More options",
    dismissError: "Dismiss error",
    connectModel: "Connect a model to start chatting.",
    setUpModel: "Set up model",
    missingModel:
      "Add a provider API key or choose the local Ollama preset in model settings.",
    requestFailed:
      "The model request failed. Check your settings and try again.",
    providerKeyRejected:
      "The model provider rejected the API key. Check your model settings.",
    providerRateLimited:
      "The model provider is rate-limiting requests. Try again shortly.",
    modelRejected:
      "The model rejected this request. Check the selected model and settings.",
    modelNotFound:
      "The model endpoint or model name was not found. Check your settings.",
    providerUnavailable: "The model provider could not complete the request.",
    connectionFailed: "Could not connect to the model provider.",
    requestTimedOut: "The model request timed out. Try again.",
    streamInterrupted: "The model stream ended unexpectedly. Try again.",
    streamBodyMissing:
      "The streaming response did not include a readable body.",
    invalidStream: "The server returned an invalid stream event.",
    malformedStream: "The server returned a malformed stream.",
    streamFailed: "The model stream failed.",
    streamEndedEarly: "The stream ended before the model finished replying.",
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Copy failed",
    loadingSaved: "Loading saved conversations",
    welcomeTitle: "A clearer way to think with AI.",
    welcomeDescription:
      "Bring your own model, explore ideas, and keep every conversation flowing.",
    suggestionOne: "Explain a complex idea in simple terms",
    suggestionTwo: "Turn rough notes into a clear action plan",
    suggestionThree: "Review a code snippet and suggest improvements",
    you: "You",
    assistant: "Assistant",
    generatingResponse: "Generating response",
    message: "Message",
    askAnything: "Ask anything...",
    stopGenerating: "Stop generating",
    sendMessage: "Send message",
    writeMessage: "Write a message first.",
    composerHint: "Enter to send · Shift + Enter for a new line",
    switchLanguage: "Switch to Chinese",
    themeDark: "Switch to dark theme",
    themeLight: "Switch to light theme",
    settingsEyebrow: "PERSONALIZE YOUR MODEL",
    closeSettings: "Close settings",
    providerSetup: "Provider setup",
    choosePreset: "Choose a preset",
    ollamaPreset: "Ollama (local, no API key)",
    groqPreset: "Groq (free tier may be available)",
    openrouterPreset: "OpenRouter (free models may be available)",
    ollamaInfo:
      "Run Ollama on this computer and pull llama3.2 first. This works with StreamChat's local development server (pnpm dev); the Vercel demo cannot access your computer's Ollama.",
    groqInfo: "Create your own key at ",
    groqAfterKey:
      ", then choose a currently available model from its model list. Free-tier limits and model availability can change.",
    openrouterInfo: "Create your own key at ",
    openrouterAfterKey: ", then choose an available model from its ",
    freeModels: "free models list",
    openrouterEnd: ". Free models have usage limits and may change.",
    apiKey: "API key",
    ollamaApiKey: "API key (not required by Ollama)",
    placeholderOnly: "Placeholder only; Ollama ignores it",
    pasteApiKey: "Paste your provider API key",
    apiKeyNote:
      "Your key is sent to this app's server route with each request and stored in this browser's localStorage.",
    ollamaKeyNote:
      "The preset fills in a placeholder; Ollama does not require or check a provider key.",
    enterApiKey: "Enter an API key.",
    baseUrl: "OpenAI-compatible base URL",
    validBaseUrl: "Enter a valid base URL.",
    modelId: "Model ID",
    providerModelId: "Provider model ID",
    enterModel: "Enter a model name.",
    modelHint:
      "Choose a suggestion or enter a model ID supported by your provider.",
    systemPrompt: "System prompt",
    temperature: "Temperature",
    maxOutputTokens: "Max output tokens",
    cancel: "Cancel",
    saveSettings: "Save settings",
    langEnglish: "EN",
    langChinese: "中",
    dark: "Dark",
    light: "Light",
  },
  zh: {
    appTitle: "StreamChat — AI 对话工作台",
    loading: "正在准备工作区…",
    closeNavigation: "关闭导航",
    brandCaption: "你的 AI 工作台",
    newConversation: "新建对话",
    recent: "最近对话",
    conversations: "对话列表",
    deleteConversation: "删除对话",
    emptyConversations: "你的对话将显示在这里。",
    privateByDesign: "隐私优先",
    modelSettings: "模型设置",
    openNavigation: "打开导航",
    workspace: "工作区",
    noModel: "未选择模型",
    currentModel: "当前模型：{model}。打开模型设置",
    openModelSettings: "打开模型设置",
    clearConversation: "清空对话",
    openGithub: "打开 GitHub",
    moreOptions: "更多选项",
    dismissError: "关闭错误提示",
    connectModel: "连接模型后即可开始对话。",
    setUpModel: "配置模型",
    missingModel: "请添加服务商 API Key，或在模型设置中选择本地 Ollama。",
    requestFailed: "模型请求失败，请检查设置后重试。",
    providerKeyRejected: "模型服务商拒绝了 API Key，请检查模型设置。",
    providerRateLimited: "模型服务商请求过于频繁，请稍后重试。",
    modelRejected: "模型拒绝了此请求，请检查所选模型和参数。",
    modelNotFound: "未找到模型接口或模型名称，请检查设置。",
    providerUnavailable: "模型服务商暂时无法完成请求。",
    connectionFailed: "无法连接到模型服务商。",
    requestTimedOut: "模型请求超时，请重试。",
    streamInterrupted: "模型响应流意外中断，请重试。",
    streamBodyMissing: "流式响应没有可读取的数据。",
    invalidStream: "服务端返回了无效的流事件。",
    malformedStream: "服务端返回了格式错误的数据流。",
    streamFailed: "模型响应流处理失败。",
    streamEndedEarly: "模型尚未完成回复，数据流就已结束。",
    copy: "复制",
    copied: "已复制",
    copyFailed: "复制失败",
    loadingSaved: "正在加载已保存的对话",
    welcomeTitle: "用 AI，让思考更清晰。",
    welcomeDescription: "连接你自己的模型，探索想法，让每场对话自然延续。",
    suggestionOne: "用简单语言解释一个复杂概念",
    suggestionTwo: "把零散笔记整理成清晰的行动计划",
    suggestionThree: "审查代码片段并提出改进建议",
    you: "你",
    assistant: "助手",
    generatingResponse: "正在生成回复",
    message: "消息",
    askAnything: "输入消息，开始提问…",
    stopGenerating: "停止生成",
    sendMessage: "发送消息",
    writeMessage: "请先输入消息。",
    composerHint: "Enter 发送 · Shift + Enter 换行",
    switchLanguage: "切换到英文",
    themeDark: "切换到深色主题",
    themeLight: "切换到浅色主题",
    settingsEyebrow: "个性化你的模型",
    closeSettings: "关闭设置",
    providerSetup: "服务商配置",
    choosePreset: "选择预设",
    ollamaPreset: "Ollama（本地，无需 API Key）",
    groqPreset: "Groq（可能提供免费额度）",
    openrouterPreset: "OpenRouter（可能有免费模型）",
    ollamaInfo:
      "请先在此电脑运行 Ollama 并下载 llama3.2。该配置仅适用于本机运行的 StreamChat 开发服务器（pnpm dev）；Vercel 在线演示无法访问你电脑上的 Ollama。",
    groqInfo: "前往 ",
    groqAfterKey:
      " 创建自己的 Key，再从模型列表选择当前可用模型。免费额度和模型可用性可能变化。",
    openrouterInfo: "前往 ",
    openrouterAfterKey: " 创建自己的 Key，再从 ",
    freeModels: "免费模型列表",
    openrouterEnd: " 选择可用模型。免费模型有使用限制，且可能变化。",
    apiKey: "API Key",
    ollamaApiKey: "API Key（Ollama 不需要）",
    placeholderOnly: "仅为占位值，Ollama 会忽略它",
    pasteApiKey: "粘贴服务商 API Key",
    apiKeyNote:
      "每次请求都会将 Key 发送到本应用服务端接口，并保存在此浏览器的 localStorage 中。",
    ollamaKeyNote: "预设会填写占位值；Ollama 不需要也不会校验服务商 API Key。",
    enterApiKey: "请输入 API Key。",
    baseUrl: "OpenAI 兼容接口地址",
    validBaseUrl: "请输入有效的接口地址。",
    modelId: "模型 ID",
    providerModelId: "服务商模型 ID",
    enterModel: "请输入模型名称。",
    modelHint: "选择建议项，或输入服务商支持的模型 ID。",
    systemPrompt: "系统提示词",
    temperature: "Temperature（温度）",
    maxOutputTokens: "最大输出 Token 数",
    cancel: "取消",
    saveSettings: "保存设置",
    langEnglish: "EN",
    langChinese: "中",
    dark: "深色",
    light: "浅色",
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof (typeof translations)["en"];
export type Theme = "light" | "dark";

interface UiPreferences {
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  localizeError: (message: string) => string;
  t: (key: TranslationKey) => string;
}

const UiPreferencesContext = createContext<UiPreferences | null>(null);

export function UiPreferencesProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("streamchat-language");
    const savedTheme = window.localStorage.getItem("streamchat-theme");
    if (savedLanguage === "en" || savedLanguage === "zh") {
      setLanguage(savedLanguage);
    }
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translations[language].appTitle;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        language === "zh"
          ? "支持流式响应、本地模型和丰富 Markdown 的开源 AI 对话工作台。"
          : "An open-source AI chat workspace with streaming responses and rich Markdown rendering.",
      );
    window.localStorage.setItem("streamchat-language", language);
  }, [language]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("streamchat-theme", theme);
  }, [theme]);

  const value = useMemo<UiPreferences>(
    () => ({
      language,
      theme,
      setLanguage,
      toggleLanguage: () =>
        setLanguage((current) => (current === "en" ? "zh" : "en")),
      toggleTheme: () =>
        setTheme((current) => (current === "light" ? "dark" : "light")),
      localizeError: (message) => {
        if (language === "en") {
          return message;
        }
        const errorTranslations: Record<string, TranslationKey> = {
          "The model provider rejected the API key. Check your model settings.":
            "providerKeyRejected",
          "The model provider is rate-limiting requests. Try again shortly.":
            "providerRateLimited",
          "The model rejected this request. Check the selected model and settings.":
            "modelRejected",
          "The model endpoint or model name was not found. Check your settings.":
            "modelNotFound",
          "The model provider could not complete the request.":
            "providerUnavailable",
          "Could not connect to the model provider.": "connectionFailed",
          "The model request timed out. Try again.": "requestTimedOut",
          "The model request failed. Check your settings and try again.":
            "requestFailed",
          "The model stream ended unexpectedly. Try again.":
            "streamInterrupted",
          "The streaming response did not include a readable body.":
            "streamBodyMissing",
          "The server returned an invalid stream event.": "invalidStream",
          "The server returned a malformed stream.": "malformedStream",
          "The model stream failed.": "streamFailed",
          "The stream ended before the model finished replying.":
            "streamEndedEarly",
        };
        const translationKey = errorTranslations[message];
        if (translationKey) {
          return translations[language][translationKey];
        }
        const statusMatch = message.match(
          /^The model request failed \((\d+)\)\.$/,
        );
        if (statusMatch) {
          return `模型请求失败（状态码：${statusMatch[1]}）。`;
        }
        return message;
      },
      t: (key) => translations[language][key],
    }),
    [language, theme],
  );

  return (
    <UiPreferencesContext.Provider value={value}>
      {children}
    </UiPreferencesContext.Provider>
  );
}

export function useUiPreferences(): UiPreferences {
  const context = useContext(UiPreferencesContext);
  if (!context) {
    throw new Error(
      "useUiPreferences must be used within UiPreferencesProvider.",
    );
  }
  return context;
}
