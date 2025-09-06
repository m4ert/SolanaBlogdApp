use crate::states::*;
use crate::errors::*;

use anchor_lang::prelude::*;

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