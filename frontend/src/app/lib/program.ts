import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Program, web3, BN } from '@coral-xyz/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { BlogDapp } from '../types/blog_dapp';
import IDL from '../types/blog_dapp.json';

const idl_string = JSON.stringify(IDL);
const idl_object = JSON.parse(idl_string);

// Replace with your actual program ID
export const PROGRAM_ID = new PublicKey(idl_object.address);

export function getProgram(
  connection: Connection,
  wallet: WalletContextState
): Program<BlogDapp> {

  const provider = new AnchorProvider(
    connection,
    wallet as any,
    AnchorProvider.defaultOptions()
  );

  return new Program(idl_object as any, provider as any);
}

export function getBlogPda(author: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('blog'), author.toBuffer()],
    PROGRAM_ID
  );
}

export function getPostPda(blog: PublicKey, postId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('post'),
      blog.toBuffer(),
      new BN(postId).toArrayLike(Buffer, 'le', 8),
    ],
    PROGRAM_ID
  );
}

export interface Blog {
  author: PublicKey;
  title: string;
  description: string;
  postCount: BN;
  bump: number;
}

export interface Post {
  author: PublicKey;
  blog: PublicKey;
  id: BN;
  title: string;
  content: string;
  tags: string[];
  createdAt: BN;
  updatedAt: BN;
  bump: number;
}