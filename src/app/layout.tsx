import type {Metadata} from 'next';
import './globals.css?v=2';
import { Toaster } from "@/components/ui/toaster"
import { Roboto, Great_Vibes } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';

const fontSans = Roboto({
  subsets: ["latin"],
  weight: ['400', '700'],
  variable: "--font-sans",
})

const fontGreatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-great-vibes',
});

export const metadata: Metadata = {
  title: 'AirTrack: Aviation Project Tracker',
  description: 'A project tracker for the aviation industry.',
  icons: {
    icon: 'https://ik.imagekit.io/avmxsiusm/icon.png?v=2',
    shortcut: 'https://ik.imagekit.io/avmxsiusm/icon.png?v=2',
    apple: 'https://ik.imagekit.io/avmxsiusm/icon.png?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen font-sans antialiased", fontSans.variable, fontGreatVibes.variable)}>
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
