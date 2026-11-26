import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaProvider } from "@/components/pwa-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AXIA Legal",
  appleWebApp: { capable: true, title: "AXIA Legal", statusBarStyle: "default" },
  icons: { apple: [{ url: "/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
  description: "Egyptian Legal Practice & Intelligence OS with global search (Ctrl+K) across matters, clients, and documents, keyboard shortcuts (Ctrl+N for rapid task creation), Legal Document Templates library, and RAJIH AI",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0B0C10" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html dir="rtl" lang="ar" suppressHydrationWarning>
      <body className="antialiased selection:bg-[var(--gold)] selection:text-white">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PwaProvider preview={process.env.VERCEL_ENV === "preview"}>{children}</PwaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
