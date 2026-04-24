import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Книга рецептов",
  description: "Управление продуктами и блюдами",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="topbar">
          <div className="container row-between">
            <Link href="/" className="brand">
              Книга рецептов
            </Link>
            <nav className="row">
              <Link href="/products" className="nav-link">
                <img src="/icons/products.svg" alt="" aria-hidden="true" className="nav-icon" />
                <span>Продукты</span>
              </Link>
              <Link href="/dishes" className="nav-link">
                <img src="/icons/dishes.svg" alt="" aria-hidden="true" className="nav-icon" />
                <span>Блюда</span>
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
