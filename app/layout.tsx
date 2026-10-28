import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Undercover — A game of little lies",
  description: "One secret word. Someone is bluffing. A free private-room party game for your browser.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
