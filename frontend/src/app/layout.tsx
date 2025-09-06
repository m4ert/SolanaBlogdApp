import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import WalletContextProvider from './context/WalletContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Solana Blog dApp',
  description: 'A decentralized blog application built on Solana',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}