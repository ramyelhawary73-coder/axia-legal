import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AXIA Legal",
  description: "Egyptian Legal Practice & Intelligence OS with global search (Ctrl+K) across matters, clients, and documents, keyboard shortcuts (Ctrl+N for rapid task creation), Legal Document Templates library, and RAJIH AI",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html dir="rtl" lang="ar" suppressHydrationWarning>
      <body className="antialiased selection:bg-[var(--gold)] selection:text-white">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
