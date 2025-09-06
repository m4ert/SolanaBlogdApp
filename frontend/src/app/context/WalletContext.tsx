'use client';

import React, { useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';
//import './globals.css';

export default function WalletContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use localhost for development
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => {

     if (process.env.NEXT_PUBLIC_SOLANA_NETWORK == 'localnet') {
      console.log('Using localnet');
        return 'http://127.0.0.1:8899'; // Local validator
      }
    
      console.log('Using devnet');
    return clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}