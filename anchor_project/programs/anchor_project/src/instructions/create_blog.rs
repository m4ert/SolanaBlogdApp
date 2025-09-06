use crate::states::*;
use crate::errors::*;

use anchor_lang::prelude::*;


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
    post.content = String::new(); 
    post.tags = tags;
    post.created_at = clock.unix_timestamp;
    post.updated_at = clock.unix_timestamp;
    post.id = blog.post_count;
    post.bump = ctx.bumps.post;
        
    blog.post_count += 1;
        
    Ok(())
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