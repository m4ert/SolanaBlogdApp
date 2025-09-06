use crate::states::*;
use crate::errors::*;

use anchor_lang::prelude::*;

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