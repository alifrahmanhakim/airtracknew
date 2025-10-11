import type {Metadata} from 'next';
import './globals.css?v=2';
import { Toaster } from "@/components/ui/toaster"
import { Barlow } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';

const fontSans = Barlow({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ['400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'AirTrack: Aviation Project Tracker',
  description: 'A project tracker for the aviation industry.',
  icons: {
    icon: 'https://firebasestorage.googleapis.com/v0/b/aoc-insight.firebasestorage.app/o/icon%2Ffavicon.ico?alt=media&token=c444a435-f3b5-4850-b0b1-eb4a1dd15810',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen font-sans antialiased", fontSans.variable)}>
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
