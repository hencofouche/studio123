
"use client"

import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';

// This is a static export, but we have client components.
// export const metadata: Metadata = {
//   title: 'TPSA Calculator',
//   description: 'The TPSA Calculator.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Selah Creations Calculator</title>
        <meta name="description" content="A calculator for all your forging needs." />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F0F4EF" />
        <link rel="apple-touch-icon" href="/icons/icon.jpg"></link>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
