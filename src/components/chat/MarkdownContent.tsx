"use client";

import { codeToHtml } from "shiki";
import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useState } from "react";
import { useUiPreferences } from "@/lib/ui-preferences";

interface MarkdownContentProps {
  content: string;
}

interface HighlightedCodeProps {
  content: string;
  language: string;
}

function getTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getTextContent).join("");
  }
  return "";
}

function MarkdownCodeBlock({ children }: { children?: ReactNode }) {
  const child = Children.toArray(children)[0];
  if (!isValidElement<{ children?: ReactNode; className?: string }>(child)) {
    return <pre className="code-fallback">{children}</pre>;
  }

  const language =
    child.props.className?.match(/language-([\w-]+)/)?.[1] ?? "text";
  const content = getTextContent(child.props.children).replace(/\n$/, "");

  return <HighlightedCode content={content} language={language} />;
}

function HighlightedCode({ content, language }: HighlightedCodeProps) {
  const { t } = useUiPreferences();
  const [html, setHtml] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    let active = true;
    void codeToHtml(content, {
      lang: language,
      theme: "github-dark",
    })
      .then((result) => {
        if (active) {
          setHtml(result);
        }
      })
      .catch(() => {
        if (active) {
          setHtml(null);
        }
      });

    return () => {
      active = false;
    };
  }, [content, language]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(content);
      setCopyStatus(t("copied"));
    } catch {
      setCopyStatus(t("copyFailed"));
    }
    window.setTimeout(() => setCopyStatus(""), 1_500);
  }

  return (
    <div className="code-frame">
      <div className="code-toolbar">
        <span>{language}</span>
        <button className="copy-button" onClick={copyCode} type="button">
          {copyStatus || t("copy")}
        </button>
      </div>
      {html ? (
        <div
          className="code-highlight"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="code-fallback">
          <code>{content}</code>
        </pre>
      )}
    </div>
  );
}

const markdownComponents: Components = {
  a: ({ children, href }) => (
    <a href={href} rel="noreferrer noopener" target="_blank">
      {children}
    </a>
  ),
  code: ({ children, className }) => (
    <code className={className}>{children}</code>
  ),
  pre: ({ children }) => {
    return <MarkdownCodeBlock>{children}</MarkdownCodeBlock>;
  },
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
