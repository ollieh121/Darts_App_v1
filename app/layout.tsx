import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "100K Darts Challenge",
  description: "12-hour, 100k point darts challenge - live scoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-sans antialiased bg-slate-950 text-white min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
