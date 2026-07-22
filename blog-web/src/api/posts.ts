import type { Post, Comment, Category, DashboardStats } from '../types';

// ==================== MOCK DATA ====================

const CATEGORIES: Category[] = [
  { id: 'c1', name: 'Teknoloji', slug: 'teknoloji', postCount: 0 },
  { id: 'c2', name: 'Tasarım', slug: 'tasarim', postCount: 0 },
  { id: 'c3', name: 'Yaşam', slug: 'yasam', postCount: 0 },
  { id: 'c4', name: 'Yazılım', slug: 'yazilim', postCount: 0 },
  { id: 'c5', name: 'Girişimcilik', slug: 'girisimcilik', postCount: 0 },
];

let mockPosts: Post[] = [];

let commentIdCounter = 10;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== POSTS ====================

export const getPosts = async (): Promise<Post[]> => {
  await delay(600);
  return [...mockPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPostById = async (id: string): Promise<Post | null> => {
  await delay(400);
  const post = mockPosts.find(p => p.id === id);
  if (post) post.views += 1;
  return post ? { ...post } : null;
};

export const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'readingTime' | 'views' | 'likes' | 'isLiked' | 'isBookmarked' | 'comments'>): Promise<Post> => {
  await delay(800);
  const wordsPerMinute = 200;
  const wordCount = postData.content.split(/\s+/).length;
  const newPost: Post = {
    ...postData,
    id: Math.random().toString(36).substring(2, 10),
    createdAt: new Date().toISOString(),
    readingTime: Math.max(1, Math.ceil(wordCount / wordsPerMinute)),
    views: 0,
    likes: 0,
    isLiked: false,
    isBookmarked: false,
    comments: [],
  };
  mockPosts.unshift(newPost);
  return newPost;
};

export const updatePost = async (id: string, postData: Partial<Post>): Promise<Post | null> => {
  await delay(800);
  const index = mockPosts.findIndex(p => p.id === id);
  if (index === -1) return null;
  const updatedPost = { ...mockPosts[index], ...postData };
  mockPosts[index] = updatedPost;
  return updatedPost;
};

export const deletePost = async (id: string): Promise<boolean> => {
  await delay(600);
  const initialLength = mockPosts.length;
  mockPosts = mockPosts.filter(p => p.id !== id);
  return mockPosts.length < initialLength;
};

// ==================== SEARCH & FILTER ====================

export const searchPosts = async (query: string): Promise<Post[]> => {
  await delay(400);
  const q = query.toLowerCase();
  return mockPosts.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.content.toLowerCase().includes(q) ||
    p.excerpt.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );
};

export const getPostsByCategory = async (category: string): Promise<Post[]> => {
  await delay(400);
  return mockPosts.filter(p => p.category.toLowerCase() === category.toLowerCase());
};

export const getPostsByTag = async (tag: string): Promise<Post[]> => {
  await delay(400);
  return mockPosts.filter(p => p.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
};

export const getPostsByAuthor = async (author: string): Promise<Post[]> => {
  await delay(400);
  return mockPosts.filter(p => p.author.toLowerCase() === author.toLowerCase());
};

export const getPopularPosts = async (limit = 5): Promise<Post[]> => {
  await delay(300);
  return [...mockPosts].sort((a, b) => b.views - a.views).slice(0, limit);
};

export const getAllTags = (): string[] => {
  const tagSet = new Set<string>();
  mockPosts.forEach(p => p.tags.forEach(t => tagSet.add(t)));
  return Array.from(tagSet);
};

// ==================== LIKES & BOOKMARKS ====================

export const toggleLike = async (id: string): Promise<{ likes: number; isLiked: boolean } | null> => {
  await delay(200);
  const post = mockPosts.find(p => p.id === id);
  if (!post) return null;
  post.isLiked = !post.isLiked;
  post.likes += post.isLiked ? 1 : -1;
  return { likes: post.likes, isLiked: post.isLiked };
};

export const toggleBookmark = async (id: string): Promise<boolean | null> => {
  await delay(200);
  const post = mockPosts.find(p => p.id === id);
  if (!post) return null;
  post.isBookmarked = !post.isBookmarked;
  return post.isBookmarked;
};

export const getBookmarkedPosts = async (): Promise<Post[]> => {
  await delay(400);
  return mockPosts.filter(p => p.isBookmarked);
};

// ==================== COMMENTS ====================

export const addComment = async (postId: string, author: string, content: string): Promise<Comment | null> => {
  await delay(600);
  const post = mockPosts.find(p => p.id === postId);
  if (!post) return null;
  const newComment: Comment = {
    id: `cm${commentIdCounter++}`,
    postId,
    author,
    content,
    createdAt: new Date().toISOString(),
    isApproved: true,
  };
  post.comments.push(newComment);
  return newComment;
};

export const deleteComment = async (postId: string, commentId: string): Promise<boolean> => {
  await delay(400);
  const post = mockPosts.find(p => p.id === postId);
  if (!post) return false;
  const initialLen = post.comments.length;
  post.comments = post.comments.filter(c => c.id !== commentId);
  return post.comments.length < initialLen;
};

export const getAllComments = async (): Promise<Comment[]> => {
  await delay(400);
  return mockPosts.flatMap(p => p.comments);
};

// ==================== CATEGORIES ====================

export const getCategories = async (): Promise<Category[]> => {
  await delay(300);
  return CATEGORIES.map(cat => ({
    ...cat,
    postCount: mockPosts.filter(p => p.category === cat.name).length,
  }));
};

// ==================== DASHBOARD STATS ====================

export const getDashboardStats = async (): Promise<DashboardStats> => {
  await delay(300);
  return {
    totalPosts: mockPosts.length,
    totalComments: mockPosts.reduce((sum, p) => sum + p.comments.length, 0),
    totalLikes: mockPosts.reduce((sum, p) => sum + p.likes, 0),
    totalViews: mockPosts.reduce((sum, p) => sum + p.views, 0),
  };
};
