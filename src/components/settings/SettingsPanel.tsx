"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useChatStore } from "@/lib/store/chat-store";
import { useUiPreferences } from "@/lib/ui-preferences";

function createSettingsSchema(messages: {
  enterApiKey: string;
  validBaseUrl: string;
  enterModel: string;
}) {
  return z.object({
    apiKey: z.string().trim().min(1, messages.enterApiKey),
    baseUrl: z.string().trim().url(messages.validBaseUrl),
    model: z.string().trim().min(1, messages.enterModel),
    systemPrompt: z.string().max(12_000),
    temperature: z.coerce.number().min(0).max(2),
    maxTokens: z.coerce.number().int().min(1).max(16_384),
  });
}

type SettingsFormInput = z.input<ReturnType<typeof createSettingsSchema>>;
type SettingsFormValues = z.output<ReturnType<typeof createSettingsSchema>>;

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
  const { t } = useUiPreferences();
  const settingsSchema = createSettingsSchema({
    enterApiKey: t("enterApiKey"),
    validBaseUrl: t("validBaseUrl"),
    enterModel: t("enterModel"),
  });
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
      if (watch("apiKey") === "ollama") {
        setValue("apiKey", "", { shouldDirty: true });
      }
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
            <p className="eyebrow">{t("settingsEyebrow")}</p>
            <h2 id="settings-title">{t("modelSettings")}</h2>
          </div>
          <button
            aria-label={t("closeSettings")}
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="settings-form" onSubmit={handleSubmit(onSubmit)}>
          <label className="field">
            <span>{t("providerSetup")}</span>
            <select
              onChange={(event) => selectProvider(event.target.value)}
              value={selectedProvider ?? ""}
            >
              <option value="">{t("choosePreset")}</option>
              <option value="ollama">{t("ollamaPreset")}</option>
              <option value="groq">{t("groqPreset")}</option>
              <option value="openrouter">{t("openrouterPreset")}</option>
            </select>
          </label>
          {isOllama ? (
            <p className="field-note">{t("ollamaInfo")}</p>
          ) : selectedProvider === "groq" ? (
            <p className="field-note">
              {t("groqInfo")}
              <a
                href="https://console.groq.com/keys"
                rel="noreferrer"
                target="_blank"
              >
                Groq Console
              </a>
              {t("groqAfterKey")}
            </p>
          ) : selectedProvider === "openrouter" ? (
            <p className="field-note">
              {t("openrouterInfo")}
              <a
                href="https://openrouter.ai/keys"
                rel="noreferrer"
                target="_blank"
              >
                OpenRouter
              </a>
              {t("openrouterAfterKey")}
              <a
                href="https://openrouter.ai/models?free=true"
                rel="noreferrer"
                target="_blank"
              >
                {t("freeModels")}
              </a>
              {t("openrouterEnd")}
            </p>
          ) : null}

          <label className="field">
            <span>{isOllama ? t("ollamaApiKey") : t("apiKey")}</span>
            <input
              autoComplete="off"
              placeholder={isOllama ? t("placeholderOnly") : t("pasteApiKey")}
              type="password"
              {...register("apiKey")}
            />
            {errors.apiKey && (
              <span className="field-error">{errors.apiKey.message}</span>
            )}
          </label>
          <p className="field-note">
            {isOllama ? t("ollamaKeyNote") : t("apiKeyNote")}
          </p>

          <label className="field">
            <span>{t("baseUrl")}</span>
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
            <span>{t("modelId")}</span>
            <input
              autoCapitalize="none"
              autoComplete="off"
              list="model-suggestions"
              placeholder={isOllama ? "llama3.2" : t("providerModelId")}
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
            <span className="field-note">{t("modelHint")}</span>
            {errors.model && (
              <span className="field-error">{errors.model.message}</span>
            )}
          </label>

          <label className="field">
            <span>{t("systemPrompt")}</span>
            <textarea rows={4} {...register("systemPrompt")} />
            {errors.systemPrompt && (
              <span className="field-error">{errors.systemPrompt.message}</span>
            )}
          </label>

          <div className="settings-row">
            <label className="field">
              <span>{t("temperature")}</span>
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
              <span>{t("maxOutputTokens")}</span>
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
              {t("cancel")}
            </button>
            <button className="button button-primary" type="submit">
              {t("saveSettings")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
