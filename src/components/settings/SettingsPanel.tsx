"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useChatStore } from "@/lib/store/chat-store";

const settingsSchema = z.object({
  apiKey: z.string().trim().min(1, "Enter an API key."),
  baseUrl: z.string().trim().url("Enter a valid base URL."),
  model: z.string().trim().min(1, "Enter a model name."),
  systemPrompt: z.string().max(12_000),
  temperature: z.coerce.number().min(0).max(2),
  maxTokens: z.coerce.number().int().min(1).max(16_384),
});

type SettingsFormInput = z.input<typeof settingsSchema>;
type SettingsFormValues = z.output<typeof settingsSchema>;

const providerPresets = {
  ollama: {
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.2",
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
  },
} as const;

interface SettingsPanelProps {
  onClose: () => void;
  onSaved: () => void;
}

export function SettingsPanel({ onClose, onSaved }: SettingsPanelProps) {
  const settings = useChatStore((state) => state.settings);
  const updateSettings = useChatStore((state) => state.updateSettings);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsFormInput, undefined, SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });
  const baseUrl = watch("baseUrl");
  const selectedProvider = Object.entries(providerPresets).find(
    ([, preset]) => preset.baseUrl === baseUrl,
  )?.[0];
  const isOllama = selectedProvider === "ollama";

  useEffect(() => {
    reset(settings);
  }, [reset, settings]);

  function onSubmit(values: SettingsFormValues) {
    updateSettings(values);
    onSaved();
    onClose();
  }

  function selectProvider(provider: string) {
    if (provider === "ollama") {
      setValue("baseUrl", providerPresets.ollama.baseUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("model", providerPresets.ollama.model, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("apiKey", "ollama", {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    if (provider === "groq" || provider === "openrouter") {
      setValue("baseUrl", providerPresets[provider].baseUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="settings-title"
        aria-modal="true"
        className="settings-dialog"
        role="dialog"
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">PERSONALIZE YOUR MODEL</p>
            <h2 id="settings-title">Model settings</h2>
          </div>
          <button
            aria-label="Close settings"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="settings-form" onSubmit={handleSubmit(onSubmit)}>
          <label className="field">
            <span>Provider setup</span>
            <select
              onChange={(event) => selectProvider(event.target.value)}
              value={selectedProvider ?? ""}
            >
              <option value="">Choose a preset</option>
              <option value="ollama">Ollama (local, no API key)</option>
              <option value="groq">Groq (free tier may be available)</option>
              <option value="openrouter">
                OpenRouter (free models may be available)
              </option>
            </select>
          </label>
          {isOllama ? (
            <p className="field-note">
              Run Ollama on this computer and pull <code>llama3.2</code> first.
              This works with StreamChat&apos;s local development server (
              <code>pnpm dev</code>); the Vercel demo cannot access your
              computer&apos;s Ollama.
            </p>
          ) : selectedProvider === "groq" ? (
            <p className="field-note">
              Create your own key at{" "}
              <a
                href="https://console.groq.com/keys"
                rel="noreferrer"
                target="_blank"
              >
                Groq Console
              </a>
              , then choose a currently available model from its model list.
              Free-tier limits and model availability can change.
            </p>
          ) : selectedProvider === "openrouter" ? (
            <p className="field-note">
              Create your own key at{" "}
              <a
                href="https://openrouter.ai/keys"
                rel="noreferrer"
                target="_blank"
              >
                OpenRouter
              </a>
              , then choose an available model from its{" "}
              <a
                href="https://openrouter.ai/models?free=true"
                rel="noreferrer"
                target="_blank"
              >
                free models list
              </a>
              . Free models have usage limits and may change.
            </p>
          ) : null}

          <label className="field">
            <span>
              {isOllama ? "API key (not required by Ollama)" : "API key"}
            </span>
            <input
              autoComplete="off"
              placeholder={
                isOllama
                  ? "Placeholder only; Ollama ignores it"
                  : "Paste your provider API key"
              }
              type="password"
              {...register("apiKey")}
            />
            {errors.apiKey && (
              <span className="field-error">{errors.apiKey.message}</span>
            )}
          </label>
          <p className="field-note">
            {isOllama
              ? "The preset fills in a placeholder; Ollama does not require or check a provider key."
              : "Your key is sent to this app's server route with each request and stored in this browser's localStorage."}
          </p>

          <label className="field">
            <span>OpenAI-compatible base URL</span>
            <input
              autoCapitalize="none"
              autoComplete="url"
              placeholder="https://api.openai.com/v1"
              spellCheck="false"
              {...register("baseUrl")}
            />
            {errors.baseUrl && (
              <span className="field-error">{errors.baseUrl.message}</span>
            )}
          </label>

          <label className="field">
            <span>Model ID</span>
            <input
              autoCapitalize="none"
              autoComplete="off"
              list="model-suggestions"
              placeholder={isOllama ? "llama3.2" : "Provider model ID"}
              spellCheck="false"
              {...register("model")}
            />
            <datalist id="model-suggestions">
              <option value="gpt-4o-mini" />
              <option value="gpt-4.1-mini" />
              <option value="gpt-4.1" />
              <option value="o4-mini" />
              <option value="llama-3.3-70b-versatile" />
              <option value="openai/gpt-oss-20b" />
              <option value="openai/gpt-oss-120b" />
              <option value="qwen/qwen3-32b" />
            </datalist>
            <span className="field-note">
              Choose a suggestion or enter a model ID supported by your
              provider.
            </span>
            {errors.model && (
              <span className="field-error">{errors.model.message}</span>
            )}
          </label>

          <label className="field">
            <span>System prompt</span>
            <textarea rows={4} {...register("systemPrompt")} />
            {errors.systemPrompt && (
              <span className="field-error">{errors.systemPrompt.message}</span>
            )}
          </label>

          <div className="settings-row">
            <label className="field">
              <span>Temperature</span>
              <input
                max="2"
                min="0"
                step="0.1"
                type="number"
                {...register("temperature")}
              />
              {errors.temperature && (
                <span className="field-error">
                  {errors.temperature.message}
                </span>
              )}
            </label>
            <label className="field">
              <span>Max output tokens</span>
              <input
                max="16384"
                min="1"
                step="1"
                type="number"
                {...register("maxTokens")}
              />
              {errors.maxTokens && (
                <span className="field-error">{errors.maxTokens.message}</span>
              )}
            </label>
          </div>

          <div className="dialog-actions">
            <button
              className="button button-secondary"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button className="button button-primary" type="submit">
              Save settings
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
