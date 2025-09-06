use anchor_lang::prelude::*;

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