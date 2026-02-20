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
      <body className="font-sans antialiased min-h-screen bg-gradient-to-b from-[#003820] via-[#008B57] to-[#002111] text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
