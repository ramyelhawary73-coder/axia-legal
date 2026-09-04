import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AXIA Legal",
  description: "Egyptian Legal Practice & Intelligence OS powered by RAJIH AI",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html dir="rtl" lang="ar">
      <body>{children}</body>
    </html>
  );
}
