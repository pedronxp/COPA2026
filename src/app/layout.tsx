import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "COPA-ANT | Bolão Oficial da Copa do Mundo 2026",
  description: "Dê seus palpites, acumule pontos, suba no ranking da semana e prove que você entende de futebol na Copa de 2026!",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#090d16",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#090d16" />
      </head>
      <body className="h-full bg-dark-bg text-light-text font-sans">
        {children}
      </body>
    </html>
  );
}
