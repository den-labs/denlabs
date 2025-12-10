import type { Metadata } from "next";
import "./globals.css";
import { Geist_Mono, Inter } from "next/font/google";
import ThemeInitializer from "@/components/ThemeInitializer";
import AppKitProvider from "@/providers/AppKitProvider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-den-sans",
  subsets: ["latin"],
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
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <ThemeInitializer />
        <AppKitProvider>{children}</AppKitProvider>
      </body>
    </html>
  );
}
