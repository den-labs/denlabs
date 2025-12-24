import type { Metadata } from "next";
import "./globals.css";
import { Geist_Mono, Quicksand } from "next/font/google";
import ThemeInitializer from "@/components/ThemeInitializer";
import AppKitProvider from "@/providers/AppKitProvider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-den-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Wolf Den",
  description: "Control center for the Wolf Den builder collective.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body
        className={`${quicksand.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeInitializer />
        <AppKitProvider>{children}</AppKitProvider>
      </body>
    </html>
  );
}
