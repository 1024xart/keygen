import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEQUENCE — Independent Art Distribution",
  description: "SEQUENCE-1024x. TR01 / BMR08 / BR09.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
