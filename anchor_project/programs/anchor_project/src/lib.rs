#![allow(unexpected_cfgs)]

use crate::instructions::*;
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;

declare_id!("9MFy53ajGDaY3EqidnZfyYhwXNa5rxjTahhyRpKv9ZWN");

#[program]
pub mod blog_dapp {
    use super::*; 

    pub fn init_blog(ctx: Context<InitializeBlog>, title: String, description: String) -> Result<()> {
        initialize_blog(ctx, title, description)
    }

    pub fn new_post(
        ctx: Context<CreatePost>, 
        title: String,
        tags: Vec<String>
    ) -> Result<()> {
        create_post(ctx, title, tags)
    }

    pub fn edit_post(
        ctx: Context<UpdatePost>, 
        title: Option<String>, 
        tags: Option<Vec<String>>
    ) -> Result<()> {
        update_post(ctx, title, tags)
    }

    pub fn edit_content(ctx: Context<UpdatePostContent>, content_chunk: String) -> Result<()> {
        update_post_content(ctx, content_chunk)   
    }

    pub fn remove_post(ctx: Context<DeletePost>) -> Result<()> {
        delete_post(ctx)
    }
}