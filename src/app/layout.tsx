import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { DM_Serif_Display, Inter, JetBrains_Mono } from "next/font/google";
import { LanguageProvider } from "@/context/LanguageContext";
import Nav from "@/components/Nav";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maximiliano Farias — QA Tester Semi-Senior",
  description:
    "Portfolio de Maximiliano Farias, QA Tester Semi-Senior especializado en testing funcional, manual y automatización. Buenos Aires, Argentina.",
  keywords: ["QA", "QA Tester", "Testing", "Automatización", "Cypress", "Playwright", "AWS"],
  authors: [{ name: "Maximiliano Farias" }],
  openGraph: {
    title: "Maximiliano Farias — QA Tester Semi-Senior",
    description:
      "Portfolio de Maximiliano Farias, QA Tester Semi-Senior especializado en Fintech y plataformas financieras.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${dmSerifDisplay.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body min-h-screen flex flex-col">
        <LanguageProvider>
          <Nav />
          <PageTransition>
            <main className="flex-1">{children}</main>
          </PageTransition>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
