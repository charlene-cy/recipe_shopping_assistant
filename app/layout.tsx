import type { Metadata } from "next";
import { Montserrat, Alegreya, Fira_Code } from "next/font/google";
import "./globals.css";
import "@/src/styles/globals.css";
import { Toaster } from "@/src/components/ui/sonner";
import { CartButton } from "./components/CartButton";
import { ThemeProvider } from "next-themes";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const alegreya = Alegreya({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Recipe Shopping Assistant",
  description: "Discover recipes and shop for ingredients on Weee!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${alegreya.variable} ${firaCode.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <CartButton />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

