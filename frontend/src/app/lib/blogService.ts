import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import {
  getProgram,
  getBlogPda,
  getPostPda,
  Blog,
  Post
} from './program';

export class BlogService {
  private connection: Connection;
  private wallet: WalletContextState;

  constructor(connection: Connection, wallet: WalletContextState) {
    this.connection = connection;
    this.wallet = wallet;
  }

  async initializeBlog(title: string, description: string) {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const program = getProgram(this.connection, this.wallet);
    const [blogPda] = getBlogPda(this.wallet.publicKey);

    return await program.methods
      .initializeBlog(title, description)
      .accounts({
        // @ts-expect-error
        blog: blogPda,
        author: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async getBlog(author: PublicKey): Promise<Blog | null> {
    try {
      const program = getProgram(this.connection, this.wallet);
      const [blogPda] = getBlogPda(author);

      const blog = await program.account.blog.fetch(blogPda);
      return blog as Blog;
    } catch (error) {
      console.log('Blog not found:', error);
      return null;
    }
  }

  async createPost(title: string, content: string, tags: string[]) {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const program = getProgram(this.connection, this.wallet);
    const [blogPda] = getBlogPda(this.wallet.publicKey);

    // Get current blog to determine post count
    const blog = await this.getBlog(this.wallet.publicKey);
    if (!blog) throw new Error('Blog not found. Initialize blog first.');

    const postId = blog.postCount.toNumber();
    const [postPda] = getPostPda(blogPda, postId);

    // Validate tags length (max 2 tags)
    if (tags.length > 2) {
      throw new Error('Maximum 2 tags allowed');
    }

    // Create post with title and tags only (no content)
    await program.methods
      .createPost(title, tags)
      .accounts({
        // @ts-ignore
        post: postPda,
        blog: blogPda,
        author: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Add content in chunks if provided
    if (content && content.length > 0) {
      await this.updatePostContent(this.wallet.publicKey, postId, content);
    }

    return { postId, postPda };
  }

  async updatePostContent(blogAuthor: PublicKey, postId: number, content: string) {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');
    if (content.length > 5000) throw new Error('Content exceeds 5000 character limit');

    const program = getProgram(this.connection, this.wallet);
    const [blogPda] = getBlogPda(blogAuthor);
    const [postPda] = getPostPda(blogPda, postId);

    // Split content into chunks if needed (900 characters per chunk for safety)
    const chunkSize = 900;
    const chunks = [];

    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.substring(i, i + chunkSize));
    }

    // First, we need to reset the content by getting the current post and determining what needs to be cleared
    await program.methods
      .updatePostContent('')
      .accounts({
        post: postPda,
        author: this.wallet.publicKey,
      })
      .rpc();

    // Add content in chunks
    for (const chunk of chunks) {
      await program.methods
        .updatePostContent(chunk)
        .accounts({
          post: postPda,
          author: this.wallet.publicKey,
        })
        .rpc();
    }
  }

  async getPost(blogAuthor: PublicKey, postId: number): Promise<Post | null> {
    try {
      const program = getProgram(this.connection, this.wallet);
      const [blogPda] = getBlogPda(blogAuthor);
      const [postPda] = getPostPda(blogPda, postId);

      const post = await program.account.post.fetch(postPda);
      return post as Post;
    } catch (error) {
      console.log('Post not found:', error);
      return null;
    }
  }

  async getAllPosts(blogAuthor: PublicKey): Promise<Post[]> {
    const blog = await this.getBlog(blogAuthor);
    if (!blog) return [];

    const posts: Post[] = [];
    const postCount = blog.postCount.toNumber();

    for (let i = 0; i < postCount; i++) {
      try {
        const post = await this.getPost(blogAuthor, i);
        if (post) {
          posts.push(post);
        }
      } catch (error) {
        console.log(`Failed to fetch post ${i}:`, error);
        // Continue to next post if one fails
      }
    }

    return posts.sort((a, b) =>
      b.createdAt.toNumber() - a.createdAt.toNumber()
    );
  }

  async updatePost(
    blogAuthor: PublicKey,
    postId: number,
    title?: string,
    content?: string,
    tags?: string[]
  ) {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const program = getProgram(this.connection, this.wallet);
    const [blogPda] = getBlogPda(blogAuthor);
    const [postPda] = getPostPda(blogPda, postId);

    // Validate tags length if provided (max 2 tags)
    if (tags && tags.length > 2) {
      throw new Error('Maximum 2 tags allowed');
    }

    // Update title and tags
    if (title !== undefined || tags !== undefined) {
      await program.methods
        .updatePost(title || null, tags || null)
        .accounts({
          post: postPda,
          author: this.wallet.publicKey,
        })
        .rpc();
    }

    // Handle content update separately if provided
    if (content !== undefined) {
      // For content updates, we need to handle the chunked approach
      await this.updatePostContent(blogAuthor, postId, content);
    }
  }

  async deletePost(blogAuthor: PublicKey, postId: number) {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const program = getProgram(this.connection, this.wallet);
    const [blogPda] = getBlogPda(blogAuthor);
    const [postPda] = getPostPda(blogPda, postId);

    return await program.methods
      .deletePost()
      .accounts({
        post: postPda,
        author: this.wallet.publicKey,
      })
      .rpc();
  }
}