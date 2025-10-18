import type {Metadata} from 'next';
import './globals.css?v=2';
import { Toaster } from "@/components/ui/toaster"
import { Roboto } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';

const fontSans = Roboto({
  subsets: ["latin"],
  weight: ['400', '700'],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: 'AirTrack: Aviation Project Tracker',
  description: 'A project tracker for the aviation industry.',
  icons: {
    icon: 'https://i.postimg.cc/6qPgDcy2/faviconairtrack.png',
    shortcut: 'https://i.postimg.cc/6qPgDcy2/faviconairtrack.png',
    apple: 'https://i.postimg.cc/6qPgDcy2/faviconairtrack.png',
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
