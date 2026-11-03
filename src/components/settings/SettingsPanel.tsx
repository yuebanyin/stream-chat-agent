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
    formState: { errors },
  } = useForm<SettingsFormInput, undefined, SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    reset(settings);
  }, [reset, settings]);

  function onSubmit(values: SettingsFormValues) {
    updateSettings(values);
    onSaved();
    onClose();
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
            <span>API key</span>
            <input
              autoComplete="off"
              placeholder="Paste your provider API key"
              type="password"
              {...register("apiKey")}
            />
            {errors.apiKey && (
              <span className="field-error">{errors.apiKey.message}</span>
            )}
          </label>
          <p className="field-note">
            Your key is sent to this app&apos;s server route with each request
            and stored in this browser&apos;s localStorage.
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
              placeholder="gpt-4o-mini"
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
