import type { Metadata } from 'next';
import { Geist, Geist_Mono, Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Echo Registry - Dependency Version Registry',
  description:
    'Where dependency versions resonate - Latest Forge, NeoForge, Fabric, and popular mod versions for Minecraft',
  keywords: ['Minecraft', 'Forge', 'NeoForge', 'Fabric', 'dependencies', 'versions', 'mods'],
  authors: [{ name: 'Echo Registry' }],
  openGraph: {
    title: 'Echo Registry',
    description: 'Where dependency versions resonate - Latest Minecraft mod dependency versions',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${geistSans.variable} ${geistMono.variable} font-nunito antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
