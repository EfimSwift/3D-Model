import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import { ModelViewerScript } from "@/components/ModelViewerScript";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StudioAmbientBackground } from "@/components/StudioAmbientBackground";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Figurki.studio — 3D модели и фигурки на заказ",
  description: "Цифровые модели для скачивания и авторские фигурки под заказ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="relative min-h-full text-studio-text">
        <StudioAmbientBackground />
        <div className="relative z-[1] flex min-h-full flex-col">
          <ModelViewerScript />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
