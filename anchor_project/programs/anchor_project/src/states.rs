use anchor_lang::prelude::*;

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