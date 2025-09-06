import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlogDapp } from "../target/types/blog_dapp";
import { expect } from "chai";
import { PublicKey, Keypair } from "@solana/web3.js";

describe("blog_dapp", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.BlogDapp as Program<BlogDapp>;
  const provider = anchor.getProvider();

  // Test accounts
  let author: Keypair;
  let blogPda: PublicKey;
  let blogBump: number;

  before(async () => {
    author = Keypair.generate();

    // Airdrop SOL to author
    const airdropSig = await provider.connection.requestAirdrop(
      author.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    const latestBlockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropSig,
    });


    // Derive blog PDA
    [blogPda, blogBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("blog"), author.publicKey.toBuffer()],
      program.programId
    );
  });


  describe("initialize_blog", () => {
    it("should initialize a blog successfully", async () => {
      const title = "My Awesome Blog";
      const description = "This is a blog about blockchain development";

      await program.methods
        .initializeBlog(title, description)
        .accounts({
          blog: blogPda,
          author: author.publicKey,
        })
        .signers([author])
        .rpc();

      // Verify blog account data
      const blogAccount = await program.account.blog.fetch(blogPda);
      expect(blogAccount.author.toString()).to.equal(author.publicKey.toString());
      expect(blogAccount.title).to.equal(title);
      expect(blogAccount.description).to.equal(description);
      expect(blogAccount.postCount.toNumber()).to.equal(0);
      expect(blogAccount.bump).to.equal(blogBump);
    });

    it("should fail with title too long", async () => {
      const anotherAuthor = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        anotherAuthor.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      );
      const latestBlockHash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSig,
      });


      const [anotherBlogPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("blog"), anotherAuthor.publicKey.toBuffer()],
        program.programId
      );

      const longTitle = "a".repeat(101); // Exceeds 100 character limit
      const description = "Valid description";

      try {
        await program.methods
          .initializeBlog(longTitle, description)
          .accounts({
            blog: anotherBlogPda,
            author: anotherAuthor.publicKey,
          })
          .signers([anotherAuthor])
          .rpc();
        expect.fail("Should have failed with title too long");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Title is too long");
      }
    });

    it("should fail with description too long", async () => {
      const anotherAuthor = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        anotherAuthor.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      );
      const latestBlockHash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSig,
      });


      const [anotherBlogPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("blog"), anotherAuthor.publicKey.toBuffer()],
        program.programId
      );

      const title = "Valid title";
      const longDescription = "a".repeat(501); // Exceeds 500 character limit

      try {
        await program.methods
          .initializeBlog(title, longDescription)
          .accounts({
            blog: anotherBlogPda,
            author: anotherAuthor.publicKey,
          })
          .signers([anotherAuthor])
          .rpc();
        expect.fail("Should have failed with description too long");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Description is too long");
      }
    });

    it("should fail when trying to initialize the same blog twice", async () => {
      const title = "Another Blog";
      const description = "Another description";

      try {
        await program.methods
          .initializeBlog(title, description)
          .accounts({
            blog: blogPda,
            author: author.publicKey,
          })
          .signers([author])
          .rpc();
        expect.fail("Should have failed with account already initialized");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });
  });

  describe("create_post", () => {
    let postPda: PublicKey;
    let postBump: number;

    // Limpiamos y creamos un post fresco para este bloque de tests
    before(async () => {
      const blogAccount = await program.account.blog.fetch(blogPda);
      const postId = blogAccount.postCount;

      [postPda, postBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("post"),
          blogPda.toBuffer(),
          postId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
    });

    it("should create a post successfully", async () => {
      const title = "My First Post";
      const tags = ["solana", "anchor"];

      // Ahora `createPost` no recibe `content`
      await program.methods
        .createPost(title, tags)
        .accounts({
          post: postPda,
          blog: blogPda,
          author: author.publicKey,
        })
        .signers([author])
        .rpc();

      // Verify post account data
      const postAccount = await program.account.post.fetch(postPda);
      expect(postAccount.author.toString()).to.equal(author.publicKey.toString());
      expect(postAccount.blog.toString()).to.equal(blogPda.toString());
      expect(postAccount.title).to.equal(title);
      expect(postAccount.content).to.equal(""); // El contenido debe estar vacío
      expect(postAccount.tags).to.deep.equal(tags);
      expect(postAccount.id.toNumber()).to.equal(0);
      expect(postAccount.bump).to.equal(postBump);
      expect(postAccount.createdAt.toNumber()).to.be.greaterThan(0);
      expect(postAccount.updatedAt.toNumber()).to.equal(postAccount.createdAt.toNumber());

      // Verify blog post count updated
      const blogAccount = await program.account.blog.fetch(blogPda);
      expect(blogAccount.postCount.toNumber()).to.equal(1);
    });

    it("should create a second post successfully", async () => {
      const blogAccountBefore = await program.account.blog.fetch(blogPda);
      const secondPostId = blogAccountBefore.postCount; // ID será 1

      const [secondPostPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("post"),
          blogPda.toBuffer(),
          secondPostId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const title = "My Second Post";
      const tags = ["development"];

      await program.methods
        .createPost(title, tags)
        .accounts({
          post: secondPostPda,
          blog: blogPda,
          author: author.publicKey,
        })
        .signers([author])
        .rpc();

      // Verify post account data
      const postAccount = await program.account.post.fetch(secondPostPda);
      expect(postAccount.id.toNumber()).to.equal(1);

      // Verify blog post count updated
      const blogAccountAfter = await program.account.blog.fetch(blogPda);
      expect(blogAccountAfter.postCount.toNumber()).to.equal(2);
    });

    it("should create a post with long title and tags successfully", async () => {
      const blogAccountBefore = await program.account.blog.fetch(blogPda);
      const secondPostId = blogAccountBefore.postCount; // ID será 1

      const [secondPostPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("post"),
          blogPda.toBuffer(),
          secondPostId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const longTitle = "a".repeat(99);
      const tags = ["1234567890", "1234567890"];

      await program.methods
        .createPost(longTitle, tags)
        .accounts({
          post: secondPostPda,
          blog: blogPda,
          author: author.publicKey,
        })
        .signers([author])
        .rpc();

      // Verify post account data
      const postAccount = await program.account.post.fetch(secondPostPda);
      expect(postAccount.author.toString()).to.equal(author.publicKey.toString());
      expect(postAccount.blog.toString()).to.equal(blogPda.toString());
      expect(postAccount.title).to.equal(longTitle);
      expect(postAccount.content).to.equal(""); // El contenido debe estar vacío
      expect(postAccount.tags).to.deep.equal(tags);
    });

    it("should create a post with long content successfully", async () => {
      const blogAccountBefore = await program.account.blog.fetch(blogPda);
      const postId = blogAccountBefore.postCount;
      const [anotherPostPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("post"),
          blogPda.toBuffer(),
          postId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const title = "My Post's Title";
      const longContent = "a".repeat(4000);
      const tags = ["solana", "anchor"];

      await program.methods
        .createPost(title, tags)
        .accounts({
          post: anotherPostPda,
          blog: blogPda,
          author: author.publicKey,
        })
        .signers([author])
        .rpc();

      let postAccount = await program.account.post.fetch(anotherPostPda);
      expect(postAccount.title).to.equal(title);
      expect(postAccount.content).to.equal("");

      const chunkSize = 900;
      for (let i = 0; i < longContent.length; i += chunkSize) {
        const chunk = longContent.substring(i, i + chunkSize);
        await program.methods
          .updatePostContent(chunk)
          .accounts({
            post: anotherPostPda,
            author: author.publicKey,
          })
          .signers([author])
          .rpc();
      }

      postAccount = await program.account.post.fetch(anotherPostPda);
      expect(postAccount.content).to.equal(longContent);

      const blogAccountAfter = await program.account.blog.fetch(blogPda);
      expect(blogAccountAfter.postCount.toNumber()).to.equal(blogAccountBefore.postCount.toNumber() + 1);
    });

    it("should fail with title too long", async () => {
      const blogAccount = await program.account.blog.fetch(blogPda);
      const postId = blogAccount.postCount;
      const [anotherPostPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("post"),
          blogPda.toBuffer(),
          postId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const longTitle = "a".repeat(201);
      const tags = ["tag"];

      try {
        await program.methods
          .createPost(longTitle, tags)
          .accounts({
            post: anotherPostPda,
            blog: blogPda,
            author: author.publicKey,
          })
          .signers([author])
          .rpc();
        expect.fail("Should have failed with title too long");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Title is too long");
      }
    });

    it("should fail with too many tags", async () => {
      const blogAccount = await program.account.blog.fetch(blogPda);
      const postId = blogAccount.postCount;
      const [anotherPostPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("post"),
          blogPda.toBuffer(),
          postId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const title = "Valid title";
      const tags = ["tag1", "tag2", "tag3"];

      try {
        await program.methods
          .createPost(title, tags)
          .accounts({
            post: anotherPostPda,
            blog: blogPda,
            author: author.publicKey,
          })
          .signers([author])
          .rpc();
        expect.fail("Should have failed with too many tags");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Too many tags");
      }
    });

    it("should fail when wrong author tries to create post", async () => {
      const wrongAuthor = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        wrongAuthor.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      );
      const latestBlockHash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSig,
      });


      const blogAccount = await program.account.blog.fetch(blogPda);
      const postId = blogAccount.postCount;
      const [anotherPostPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("post"),
          blogPda.toBuffer(),
          postId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const title = "Valid title";
      const tags = ["tag"];

      try {
        await program.methods
          .createPost(title, tags)
          .accounts({
            post: anotherPostPda,
            blog: blogPda,
            author: wrongAuthor.publicKey,
          })
          .signers([wrongAuthor])
          .rpc();
        expect.fail("Should have failed with wrong author");
      } catch (error) {
        // El error ahora será por la constraint `has_one`
        const errorMessage = error.error?.errorMessage || error.message || "";
        const hasExpectedError = errorMessage.includes("A has_one constraint was violated") ||
          errorMessage.includes("Unauthorized: Only the author can perform this action");
        expect(hasExpectedError).to.be.true;
      }
    });
  });

  describe("update_post and update_post_content", () => {
    let postPda: PublicKey;

    before(() => {
      // Usamos el primer post creado (ID 0)
      [postPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("post"),
          blogPda.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
    });

    it("should update post title successfully", async () => {
      const newTitle = "Updated First Post Title";

      const postBefore = await program.account.post.fetch(postPda);
      const originalUpdatedAt = postBefore.updatedAt.toNumber();

      await new Promise(resolve => setTimeout(resolve, 1200)); // Esperar para asegurar cambio en timestamp

      await program.methods
        .updatePost(newTitle, null) // `updatePost` ahora solo tiene 2 args
        .accounts({
          post: postPda,
          author: author.publicKey,
        })
        .signers([author])
        .rpc();

      const postAfter = await program.account.post.fetch(postPda);
      expect(postAfter.title).to.equal(newTitle);
      expect(postAfter.updatedAt.toNumber()).to.be.greaterThan(originalUpdatedAt);
    });

    it("should update post tags successfully", async () => {
      const newTags = ["updated", "tags"];

      await program.methods
        .updatePost(null, newTags) // Solo actualizamos los tags
        .accounts({
          post: postPda,
          author: author.publicKey,
        })
        .signers([author])
        .rpc();

      const postAfter = await program.account.post.fetch(postPda);
      expect(postAfter.tags).to.deep.equal(newTags);
    });

    it("should update both title and tags successfully", async () => {
      const newTitle = "Completely Updated Post";
      const newTags = ["complete", "update"];

      await program.methods
        .updatePost(newTitle, newTags) // Actualizamos ambos
        .accounts({
          post: postPda,
          author: author.publicKey,
        })
        .signers([author])
        .rpc();

      const postAfter = await program.account.post.fetch(postPda);
      expect(postAfter.title).to.equal(newTitle);
      expect(postAfter.tags).to.deep.equal(newTags);
    });

    it("should update content using updatePostContent", async () => {
      const content = "This is the new content.";

      await program.methods.updatePostContent(content).accounts({
        post: postPda,
        author: author.publicKey,
      }).signers([author]).rpc();

      const updatedAccount = await program.account.post.fetch(postPda);
      expect(updatedAccount.content).to.equal(content);
    });

    it("should update (replace) content using updatePostContent", async () => {
      const content = "Totally new content";

      // First, reset the content to an empty string
      await program.methods.updatePostContent('').accounts({
        post: postPda,
        author: author.publicKey,
      }).signers([author]).rpc();

      await program.methods.updatePostContent(content).accounts({
        post: postPda,
        author: author.publicKey,
      }).signers([author]).rpc();

      const updatedAccount = await program.account.post.fetch(postPda);
      expect(updatedAccount.content).to.equal(content);
    });

    it("should fail to update title (title too long)", async () => {
      const longTitle = "a".repeat(201);

      try {
        await program.methods
          .updatePost(longTitle, null)
          .accounts({
            post: postPda,
            author: author.publicKey,
          })
          .signers([author])
          .rpc();
        expect.fail("Should have failed with title too long");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Title is too long");
      }
    });

    it("should fail to update content (content too long)", async () => {
      const blogAccountBefore = await program.account.blog.fetch(blogPda);
      const postId = blogAccountBefore.postCount;
      const [anotherPostPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("post"),
          blogPda.toBuffer(),
          postId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const title = "My Post's Title";
      const longContent = "a".repeat(5000);
      const tags = ["solana", "anchor"];

      await program.methods
        .createPost(title, tags)
        .accounts({
          post: anotherPostPda,
          blog: blogPda,
          author: author.publicKey,
        })
        .signers([author])
        .rpc();

      let postAccount = await program.account.post.fetch(anotherPostPda);
      expect(postAccount.title).to.equal(title);
      expect(postAccount.content).to.equal("");

      const chunkSize = 900;
      for (let i = 0; i < longContent.length; i += chunkSize) {
        try {
          const chunk = longContent.substring(i, i + chunkSize);
          await program.methods
            .updatePostContent(chunk)
            .accounts({
              post: anotherPostPda,
              author: author.publicKey,
            })
            .signers([author])
            .rpc();
        } catch (error) {
          expect(error.error.errorMessage).to.include("Content is too long");
        }
      }

    });

    it("should fail to update tags (too many tags)", async () => {
      const tooManyTags = ["1", "2", "3"];

      try {
        await program.methods
          .updatePost(null, tooManyTags)
          .accounts({
            post: postPda,
            author: author.publicKey,
          })
          .signers([author])
          .rpc();
        expect.fail("Should have failed with too many tags");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Too many tags");
      }
    });

    it("should fail when wrong author tries to update", async () => {
      const wrongAuthor = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        wrongAuthor.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      );
      const latestBlockHash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSig,
      });


      try {
        await program.methods
          .updatePost("New title", null)
          .accounts({
            post: postPda,
            author: wrongAuthor.publicKey,
          })
          .signers([wrongAuthor])
          .rpc();
        expect.fail("Should have failed with wrong author");
      } catch (error) {
        const errorMessage = error.error?.errorMessage || error.message || "";
        const hasExpectedError = errorMessage.includes("A has_one constraint was violated") ||
          errorMessage.includes("Unauthorized: Only the author can perform this action");
        expect(hasExpectedError).to.be.true;
      }
    });
  });

  describe("delete_post", () => {
    let postToDeletePda: PublicKey;

    before(async () => {
      // Creamos un post para borrarlo (usando el contador actual del blog)
      const blogAccount = await program.account.blog.fetch(blogPda);
      const postId = blogAccount.postCount; // El ID del siguiente post

      [postToDeletePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("post"),
          blogPda.toBuffer(),
          postId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .createPost("Post to be deleted", ["delete", "test"]) // Sin content
        .accounts({
          post: postToDeletePda,
          blog: blogPda,
          author: author.publicKey,
        })
        .signers([author])
        .rpc();
    });

    it("should delete post successfully", async () => {
      const authorBalanceBefore = await provider.connection.getBalance(author.publicKey);

      await program.methods
        .deletePost()
        .accounts({
          post: postToDeletePda,
          author: author.publicKey,
        })
        .signers([author])
        .rpc();

      try {
        await program.account.post.fetch(postToDeletePda);
        expect.fail("Post account should be closed");
      } catch (error) {
        expect(error.message).to.include("Account does not exist");
      }

      const authorBalanceAfter = await provider.connection.getBalance(author.publicKey);
      expect(authorBalanceAfter).to.be.greaterThan(authorBalanceBefore);
    });

    it("should fail when trying to delete already deleted post", async () => {
      try {
        await program.methods
          .deletePost()
          .accounts({
            post: postToDeletePda,
            author: author.publicKey,
          })
          .signers([author])
          .rpc();
        expect.fail("Should have failed with account not found");
      } catch (error) {
        const errorMessage = error.error?.errorMessage || error.message || "";
        const hasExpectedError = errorMessage.includes("Account does not exist") ||
          errorMessage.includes("The program expected this account to be already initialized");
        expect(hasExpectedError).to.be.true;
      }
    });
  });
});