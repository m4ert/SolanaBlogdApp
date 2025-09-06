'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
//import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletButton from "./context/WalletButton";
import { BlogService } from './lib/blogService';
import { Blog, Post } from './lib/program';
import toast, { Toaster } from 'react-hot-toast';

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [blogService, setBlogService] = useState<BlogService | null>(null);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateBlog, setShowCreateBlog] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Form states
  const [blogTitle, setBlogTitle] = useState('');
  const [blogDescription, setBlogDescription] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('');

  useEffect(() => {
    if (connection && wallet) {
      setBlogService(new BlogService(connection, wallet));
    }
  }, [connection, wallet]);

  useEffect(() => {
    if (blogService && wallet.publicKey) {
      loadBlogAndPosts();
    }
  }, [blogService, wallet.publicKey]);

  const loadBlogAndPosts = async () => {
    if (!blogService || !wallet.publicKey) return;

    setLoading(true);
    try {
      const blogData = await blogService.getBlog(wallet.publicKey);
      setBlog(blogData);

      if (blogData) {
        const postsData = await blogService.getAllPosts(wallet.publicKey);
        setPosts(postsData);
      }
    } catch (error) {
      console.error('Failed to load blog:', error);
      toast.error('Failed to load blog data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogService || !blogTitle.trim() || !blogDescription.trim()) return;

    setLoading(true);
    try {
      await blogService.initializeBlog(blogTitle, blogDescription);
      toast.success('Blog created successfully!');
      setBlogTitle('');
      setBlogDescription('');
      setShowCreateBlog(false);
      await loadBlogAndPosts();
    } catch (error: any) {
      console.error('Failed to create blog:', error);
      toast.error(error?.message || 'Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogService || !postTitle.trim()) return;

    // Validate tags (max 2 tags)
    const tags = postTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    if (tags.length > 2) {
      toast.error('Maximum 2 tags allowed');
      return;
    }

    // Validate content length (max 5000 characters)
    if (postContent.length > 5000) {
      toast.error('Content exceeds 5000 character limit');
      return;
    }

    setLoading(true);
    try {
      await blogService.createPost(postTitle, postContent, tags);
      toast.success('Post created successfully!');
      setPostTitle('');
      setPostContent('');
      setPostTags('');
      setShowCreatePost(false);
      await loadBlogAndPosts();
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast.error(error?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogService || !wallet.publicKey || !editingPost) return;

    // Validate tags (max 2 tags)
    const tags = postTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    if (tags.length > 2) {
      toast.error('Maximum 2 tags allowed');
      return;
    }

    // Validate content length (max 5000 characters)
    if (postContent.length > 5000) {
      toast.error('Content exceeds 5000 character limit');
      return;
    }

    setLoading(true);
    try {
      await blogService.updatePost(
        wallet.publicKey,
        editingPost.id.toNumber(),
        postTitle || undefined,
        postContent || undefined,
        tags.length > 0 ? tags : undefined
      );
      toast.success('Post updated successfully!');
      setPostTitle('');
      setPostContent('');
      setPostTags('');
      setEditingPost(null);
      await loadBlogAndPosts();
    } catch (error: any) {
      console.error('Failed to update post:', error);
      toast.error(error?.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!blogService || !wallet.publicKey) return;
    
    if (!confirm('Are you sure you want to delete this post?')) return;

    setLoading(true);
    try {
      await blogService.deletePost(wallet.publicKey, postId);
      toast.success('Post deleted successfully!');
      await loadBlogAndPosts();
    } catch (error: any) {
      console.error('Failed to delete post:', error);
      toast.error(error?.message || 'Failed to delete post');
    } finally {
      setLoading(false);
    }
  };

  const startEditPost = (post: Post) => {
    setEditingPost(post);
    setPostTitle(post.title);
    setPostContent(post.content);
    setPostTags(post.tags.join(', '));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Solana Blog dApp
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect your wallet to start blogging on Solana
          </p>
          <WalletButton className="!bg-primary-600 hover:!bg-primary-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Solana Blog dApp
            </h1>
            <WalletButton className="!bg-primary-600 hover:!bg-primary-700" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        )}

        {/* Blog Creation */}
        {!blog && !loading && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create Your Blog</h2>
            <p className="text-gray-600 mb-4">
              You don't have a blog yet. Create one to start posting!
            </p>
            <button
              onClick={() => setShowCreateBlog(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium cursor-pointer"
            >
              Create Blog
            </button>
          </div>
        )}

        {/* Blog Header */}
        {blog && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {blog.title}
            </h2>
            <p className="text-gray-600 mb-4">{blog.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {blog.postCount.toString()} posts
              </span>
              <button
                onClick={() => setShowCreatePost(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium cursor-pointer"
              >
                New Post
              </button>
            </div>
          </div>
        )}

        {/* Posts */}
        {posts.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Posts</h3>
            {posts.map((post) => (
              <div key={post.id.toString()} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {post.title}
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditPost(post)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id.toNumber())}
                      className="text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                  {post.content}
                </p>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Created: {formatDate(post.createdAt.toNumber())}
                  {post.updatedAt.toNumber() !== post.createdAt.toNumber() && (
                    <> • Updated: {formatDate(post.updatedAt.toNumber())}</>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Posts Message */}
        {blog && posts.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">No posts yet. Create your first post!</p>
          </div>
        )}
      </main>

      {/* Create Blog Modal */}
      {showCreateBlog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Blog</h3>
            <form onSubmit={handleCreateBlog}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blog Title (max 100 characters)
                </label>
                <input
                  type="text"
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  maxLength={100}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (max 500 characters)
                </label>
                <textarea
                  value={blogDescription}
                  onChange={(e) => setBlogDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  maxLength={500}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateBlog(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
                >
                  Create Blog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Post Modal */}
      {(showCreatePost || editingPost) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </h3>
            <form onSubmit={editingPost ? handleUpdatePost : handleCreatePost}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Title (max 200 characters)
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  maxLength={200}
                  required={!editingPost}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content (max 5000 characters)
                </label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  rows={8}
                  maxLength={5000}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {postContent.length}/5000 characters
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated, max 2)
                </label>
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. solana, blockchain"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate tags with commas. Maximum 2 tags allowed.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePost(false);
                    setEditingPost(null);
                    setPostTitle('');
                    setPostContent('');
                    setPostTags('');
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
                >
                  {editingPost ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}