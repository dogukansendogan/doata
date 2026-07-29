// ============ POST ============
export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  authorAvatar?: string;
  coverImage?: string;      // Hero/kapak görseli
  category: string;
  tags: string[];
  createdAt: string;
  readingTime: number;   // minutes
  views: number;
  likes: number;
  isLiked: boolean;
  isBookmarked: boolean;
  comments: Comment[];
  reactions?: {
    love: number;
    unicorn: number;
    mindblown: number;
    idea: number;
  };
}

// ============ COMMENT ============
export interface Comment {
  id: string;
  postId: string;
  author: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  isApproved: boolean;
}

// ============ CATEGORY ============
export interface Category {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

// ============ STATS ============
export interface DashboardStats {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalViews: number;
}
