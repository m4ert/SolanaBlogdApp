use anchor_lang::prelude::*;

declare_id!("9MFy53ajGDaY3EqidnZfyYhwXNa5rxjTahhyRpKv9ZWN");

#[program]
pub mod blog_dapp {
    use super::*;

    pub fn initialize_blog(ctx: Context<InitializeBlog>, title: String, description: String) -> Result<()> {
        require!(title.len() <= 100, BlogError::TitleTooLong);
        require!(description.len() <= 500, BlogError::DescriptionTooLong);
        
        let blog = &mut ctx.accounts.blog;
        blog.author = ctx.accounts.author.key();
        blog.title = title;
        blog.description = description;
        blog.post_count = 0;
        blog.bump = ctx.bumps.blog;
        
        Ok(())
    }

    pub fn create_post(
        ctx: Context<CreatePost>, 
        title: String,
        tags: Vec<String>
    ) -> Result<()> {
        require!(title.len() <= 200, BlogError::TitleTooLong);
        require!(tags.len() <= 2, BlogError::TooManyTags);
        
        let blog = &mut ctx.accounts.blog;
        let post = &mut ctx.accounts.post;
        let clock = Clock::get()?;
        
        post.author = ctx.accounts.author.key();
        post.blog = blog.key();
        post.title = title;
        post.content = String::new(); // Inicia vacío
        post.tags = tags;
        post.created_at = clock.unix_timestamp;
        post.updated_at = clock.unix_timestamp;
        post.id = blog.post_count;
        post.bump = ctx.bumps.post;
        
        blog.post_count += 1;
        
        Ok(())
    }

    pub fn update_post(
        ctx: Context<UpdatePost>, 
        title: Option<String>, 
        tags: Option<Vec<String>>
    ) -> Result<()> {
        let post = &mut ctx.accounts.post;
        
        if let Some(new_title) = title {
            require!(new_title.len() <= 200, BlogError::TitleTooLong);
            post.title = new_title;
        }
        
        if let Some(new_tags) = tags {
            require!(new_tags.len() <= 2, BlogError::TooManyTags);
            post.tags = new_tags;
        }
        
        post.updated_at = Clock::get()?.unix_timestamp;
        
        Ok(())
    }

    pub fn update_post_content(ctx: Context<UpdatePostContent>, content_chunk: String) -> Result<()> {
        let post = &mut ctx.accounts.post;
        let clock = Clock::get()?;

        if content_chunk.is_empty() {
            post.content.clear();
        } else {
            require!(
                post.content.len() + content_chunk.len() <= 5000,
                BlogError::ContentTooLong
            );
            post.content.push_str(&content_chunk);
        }

        post.updated_at = clock.unix_timestamp;
        Ok(())
    }

    pub fn delete_post(_ctx: Context<DeletePost>) -> Result<()> {
        // The post account will be closed automatically due to the close constraint
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeBlog<'info> {
    #[account(
        init, 
        payer = author, 
        space = 8 + Blog::INIT_SPACE,
        seeds = [b"blog", author.key().as_ref()], 
        bump
    )]
    pub blog: Account<'info, Blog>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)] 
pub struct CreatePost<'info> {
    #[account(
        init,
        payer = author,
        space = 8 + Post::INIT_SPACE, 
        seeds = [b"post", blog.key().as_ref(), blog.post_count.to_le_bytes().as_ref()],
        bump
    )]
    pub post: Account<'info, Post>,
    #[account(
        mut, 
        has_one = author @ BlogError::UnauthorizedAuthor
    )]
    pub blog: Account<'info, Blog>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>, 
}

#[derive(Accounts)]
pub struct UpdatePost<'info> {
    #[account(
        mut,
        seeds = [b"post", post.blog.as_ref(), post.id.to_le_bytes().as_ref()],
        bump = post.bump,
        has_one = author @ BlogError::UnauthorizedAuthor
    )]
    pub post: Account<'info, Post>,
    pub author: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdatePostContent<'info> {
    #[account(
        mut,
        has_one = author @ BlogError::UnauthorizedAuthor,
        seeds = [b"post", post.blog.key().as_ref(), post.id.to_le_bytes().as_ref()],
        bump = post.bump
    )]
    pub post: Account<'info, Post>,
    #[account(mut)]
    pub author: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeletePost<'info> {
    #[account(
        mut,
        seeds = [b"post", post.blog.as_ref(), post.id.to_le_bytes().as_ref()],
        bump = post.bump,
        has_one = author @ BlogError::UnauthorizedAuthor,
        constraint = post.blog != Pubkey::default() @ BlogError::PostNotFound,
        close = author
    )]
    pub post: Account<'info, Post>,
    #[account(mut)]
    pub author: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Blog {
    pub author: Pubkey,
    #[max_len(100)]
    pub title: String,
    #[max_len(500)]
    pub description: String,
    pub post_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Post {
    pub author: Pubkey,
    pub blog: Pubkey,
    pub id: u64,
    #[max_len(200)]
    pub title: String,
    #[max_len(5000)]
    pub content: String,
    #[max_len(2, 10)]
    pub tags: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

#[error_code]
pub enum BlogError {
    #[msg("Title is too long")]
    TitleTooLong,
    #[msg("Description is too long")]
    DescriptionTooLong,
    #[msg("Content is too long")]
    ContentTooLong,
    #[msg("Too many tags")]
    TooManyTags,
    #[msg("Post not found or already deleted")]
    PostNotFound,
    #[msg("Unauthorized: Only the author can perform this action")]
    UnauthorizedAuthor,
}