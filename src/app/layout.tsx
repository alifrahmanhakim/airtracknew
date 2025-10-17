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
    icon: 'https://i.postimg.cc/6qPgDcy2/faviconairtrack.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <link rel="icon" href="https://i.postimg.cc/6qPgDcy2/faviconairtrack.png" sizes="any" />
      </head>
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
