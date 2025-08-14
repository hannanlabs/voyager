import { Geist, Geist_Mono } from 'next/font/google';

import type { Metadata } from 'next';
import type { JSX } from 'react';
import './globals.css';

import { WebSocketProvider } from './globe/websocket';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Voyager',
  description: 'A Global Air Traffic Simulation Orchestrated via Kubernetes',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
}
