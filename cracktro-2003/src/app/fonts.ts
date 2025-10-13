import { Inter } from "next/font/google";
import localFont from "next/font/local";

export const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const plexMono = localFont({
  src: [
    { path: "../public/fonts/IBMPlexMono-Regular.woff2", weight: "400" },
    { path: "../public/fonts/IBMPlexMono-SemiBold.woff2", weight: "600" },
  ],
  variable: "--font-plexmono",
});
