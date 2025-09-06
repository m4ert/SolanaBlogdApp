use crate::states::*;
use crate::errors::*;

use anchor_lang::prelude::*;

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