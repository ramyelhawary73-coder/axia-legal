import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AXIA Legal",
  description: "Egyptian Legal Practice & Intelligence OS with automated daily summary snapshot export & cloud sync powered by RAJIH AI",
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
