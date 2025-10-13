import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Keep your current fonts:
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEQUENCE",
  description: "Interactive keygen art",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" translate="no">
      <head>
        <meta httpEquiv="content-language" content="en" />
        <meta name="google" content="notranslate" />
      </head>

      {/* 
        seq-ui applies the UI font + base sizing from globals.css.
        Keep your Geist vars so everything else still works.
        'antialiased notranslate' are your existing classes.
      */}
      <body className={`${geistSans.variable} ${geistMono.variable} seq-ui antialiased notranslate`}>
        {children}
      </body>
    </html>
  );
}
