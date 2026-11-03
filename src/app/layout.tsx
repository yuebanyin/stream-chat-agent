import type { Metadata } from "next";
import { UiPreferencesProvider } from "@/lib/ui-preferences";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamChat — Your AI workspace",
  description:
    "An open-source AI chat workspace with streaming responses and rich Markdown rendering.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <UiPreferencesProvider>{children}</UiPreferencesProvider>
      </body>
    </html>
  );
}
