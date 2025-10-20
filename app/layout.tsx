import type { Metadata } from "next";
import "./globals.css";
import 'react-spring-bottom-sheet/dist/style.css'
import Providers from "./provider";
import font from "./fonts"

const { averia, bricolage, geist, inter, canela, georgia, ebGaramond, azeretMono } = font

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </head>
      <body
        className={`${bricolage.variable} ${averia.variable} ${geist.variable} ${inter.variable} ${canela.variable} ${georgia.variable} ${ebGaramond.variable} ${azeretMono.variable} h-full`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  applicationName: "Memento",
  title: "Memento",
  icons: [
    { url: "/favicon.ico", type: "image/ico" },
    { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { url: "/apple-touch-icon.png", type: "image/png" },
    { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
  ],
};
