# Project Description

**Deployed Frontend URL:** 
https://program-m4ert.vercel.app/

**Solana Program ID:** 
9MFy53ajGDaY3EqidnZfyYhwXNa5rxjTahhyRpKv9ZWN


## Project Overview

### Description
This is a dApp for a decentralized blog on the Solana blockchain. It allows users to create a blog, write posts with titles, content, and tags, update their existing posts, and delete posts they no longer want. All the data for the blog and its posts is stored on-chain in Solana accounts. The dApp uses Program Derived Addresses (PDAs) to manage the ownership and storage of the blog and post data, ensuring that only the authorized user (the author) can make changes.

### Key Features
- Create Blog: A user can initialize a single blog account tied to their public key, specifying a title and a description.

- Create Post: Users can add new posts to their blog, including a title, content, and a list of tags. Each post is given a unique ID and a timestamp for creation.

- Update Post: The dApp allows the author to modify the title, content, and/or tags of an existing post. The update action also records a new timestamp.

- Delete Post: An author can delete a post, which closes the associated on-chain account and returns the SOL rent to the author.
  
### How to Use the dApp

1. **Connect Wallet**
2. **Create a blog**: Click on the "Create Blog" button and enter the blog title and description.
3. **Create a post**: Click on the "New Post" button and enter the post title, content, and tags.
4. **Update a post**: Click on the "Edit" button and enter the new post title, content, and/or tags.
5. **Delete a post**: Click on the "Delete" button to delete the post.

## Program Architecture
The program's architecture is built around a set of instructions that interact with specific account structures. It leverages PDAs to manage data ownership and uses the Anchor framework for simplified development. The data flow begins with a user's transaction invoking an instruction, which then interacts with and modifies the state of the blog and post accounts.


### PDA Usage
PDAs are used to create and manage the blog and post accounts, ensuring they are owned by the program and not by a private key. This allows the program to control the accounts and enforce specific rules, like ensuring only the original author can modify a post.

**PDAs Used:**
- Blog PDA: The blog account is a PDA. It's derived using the seeds `[b"blog", author.key().as_ref()]`. This ensures each author has a unique, program-controlled blog account.

- Post PDA: Each post is a separate PDA. The seeds used are `[b"post", blog.key().as_ref(), blog.post_count.to_le_bytes().as_ref()]`. This system guarantees that each post has a unique address based on its parent blog and its sequential ID (`post_count`).

### Program Instructions

**Instructions Implemented:**
- `initialize_blog`: This instruction creates and initializes a new `Blog` account as a PDA. It requires a title and description, and sets the author, post count (to 0), and bump value.

- `create_post`: This instruction creates a new `Post` account as a PDA. It links the new post to an existing blog, assigns it a unique ID based on the blog's `post_count`, and stores the provided title, content, and tags. It also increments the blog's `post_count`.

- `update_post`: This instruction allows an author to modify an existing `Post` account. It takes optional parameters for the title, content, and tags, updating only the fields that are provided. It also updates the post's `updated_at` timestamp.

- `delete_post`: This instruction closes a `Post` account. The funds stored in the account for rent exemption are returned to the author. The account is automatically closed due to the `close` constraint in the `DeletePost` context.

### Account Structure
```rust
#[account]
#[derive(InitSpace)]
pub struct Blog {
    // The public key of the blog's author.
    pub author: Pubkey,
    // The title of the blog, with a max length of 50 characters.
    #[max_len(50)]
    pub title: String,
    // A description of the blog, with a max length of 200 characters.
    #[max_len(200)]
    pub description: String,
    // A counter to keep track of the number of posts created on this blog.
    pub post_count: u64,
    // The bump seed used to derive the PDA for this account.
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Post {
    // The public key of the post's author.
    pub author: Pubkey,
    // The public key of the blog this post belongs to.
    pub blog: Pubkey,
    // The unique ID of the post within the blog.
    pub id: u64,
    // The title of the post, with a max length of 200 characters.
    #[max_len(200)]
    pub title: String,
    // The content of the post, with a max length of 5000 characters.
    #[max_len(5000)]
    pub content: String,
    // A vector of strings for tags, with a maximum of 3 tags and each tag having a max length of 20 characters.
    #[max_len(3, 20)]
    pub tags: Vec<String>,
    // The Unix timestamp when the post was created.
    pub created_at: i64,
    // The Unix timestamp when the post was last updated.
    pub updated_at: i64,
    // The bump seed used to derive the PDA for this account.
    pub bump: u8,
}
```

## Testing

### Test Coverage
The testing approach covers both the happy path (successful execution) and the unhappy path (error handling) for all four program instructions: `initialize_blog`, `create_post`, `update_post`, and `delete_post`. The tests use the Anchor framework, which simplifies the process of sending transactions and fetching account data. Before each test, new keypairs are generated and airdropped SOL to ensure a clean slate. Program Derived Addresses (PDAs) are derived locally in the tests to match the on-chain logic, allowing for accurate account fetching and validation.

**Happy Path Tests:**
- `initialize_blog`: Tests if a blog account is successfully created with the correct author, title, description, and an initial post count of zero.

- `create_post`: Verifies that a post is created with the correct author, blog key, title, content, tags, and a unique ID. It also checks if the `post_count` on the blog account is correctly incremented.

- `update_post`: Includes multiple tests to ensure that a post can be updated successfully. This covers scenarios where only the title, only the content, only the tags, or all fields are updated simultaneously. It also verifies that the `updated_at` timestamp is correctly changed.

- `delete_post`: Confirms that a post account is successfully closed and can no longer be fetched from the chain after the `deletePost` instruction is executed.

- Integration Tests: A multi-step test that checks the overall functionality by creating a blog, adding multiple posts, updating one of them, and then deleting another. This ensures the program handles a sequence of operations correctly.

**Unhappy Path Tests:**

`initialize_blog`:

- Tests for failure when the provided blog title exceeds the maximum length of 100 characters.

- Tests for failure when the description is too long (over 500 characters).

- Tests for failure when attempting to initialize a blog account that already exists for the same author.

`create_post`:

- Tests for failure when the post title is too long (over 200 characters).

- Tests for failure when the post content is too long (over 5000 characters).

- Tests for failure when the number of tags exceeds the limit of 5.

- Tests for a has_one constraint violation when an unauthorized author keypair attempts to create a post for an existing blog.

`update_post`:

- Tests for failure when the updated title, content, or tags exceed their respective length/count limits.

- Tests for a has_one constraint violation when an unauthorized author tries to update a post that doesn't belong to them.

`delete_post`:

- Tests for a has_one constraint violation when an unauthorized author attempts to delete a post.

- Tests for an "Account does not exist" error when attempting to delete a post that has already been deleted or never existed.

### Running Tests
```bash
anchor test
```
