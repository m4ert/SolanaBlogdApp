use crate::states::*;
use crate::errors::*;

use anchor_lang::prelude::*;

pub fn delete_post(_ctx: Context<DeletePost>) -> Result<()> {
    // The post account will be closed automatically due to the close constraint
    Ok(())
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