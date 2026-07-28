import type { Post, Comment, Category, DashboardStats } from '../types';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  type DocumentData
} from 'firebase/firestore';

// ==================== MOCK FALLBACK DATA ====================

const CATEGORIES: Category[] = [
  { id: 'c1', name: 'Teknoloji', slug: 'teknoloji', postCount: 0 },
  { id: 'c2', name: 'Tasarım', slug: 'tasarim', postCount: 0 },
  { id: 'c3', name: 'Yaşam', slug: 'yasam', postCount: 0 },
  { id: 'c4', name: 'Yazılım', slug: 'yazilim', postCount: 0 },
  { id: 'c5', name: 'Girişimcilik', slug: 'girisimcilik', postCount: 0 },
];

let mockPosts: Post[] = [];
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mapDocToPost = (id: string, data: DocumentData): Post => {
  return {
    id,
    title: data.title || '',
    content: data.content || '',
    excerpt: data.excerpt || '',
    author: data.author || '',
    authorAvatar: data.authorAvatar || '',
    coverImage: data.coverImage || '',
    category: data.category || '',
    tags: data.tags || [],
    createdAt: data.createdAt || new Date().toISOString(),
    readingTime: data.readingTime || 1,
    views: data.views || 0,
    likes: data.likes || 0,
    isLiked: data.isLiked || false,
    isBookmarked: data.isBookmarked || false,
    comments: data.comments || []
  };
};

// ==================== POSTS ====================

export const getPosts = async (): Promise<Post[]> => {
  if (db) {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => mapDocToPost(d.id, d.data()));
    } catch (e) {
      console.error('Firestore getPosts failed, using fallback:', e);
    }
  }
  await delay(200);
  return [...mockPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPostById = async (id: string): Promise<Post | null> => {
  if (db) {
    try {
      const postRef = doc(db, 'posts', id);
      const snapshot = await getDoc(postRef);
      if (snapshot.exists()) {
        const currentData = snapshot.data();
        const updatedViews = (currentData.views || 0) + 1;
        await updateDoc(postRef, { views: updatedViews });
        return mapDocToPost(snapshot.id, { ...currentData, views: updatedViews });
      }
      return null;
    } catch (e) {
      console.error('Firestore getPostById failed:', e);
    }
  }
  await delay(200);
  const post = mockPosts.find(p => p.id === id);
  if (post) post.views += 1;
  return post ? { ...post } : null;
};

export const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'readingTime' | 'views' | 'likes' | 'isLiked' | 'isBookmarked' | 'comments'>): Promise<Post> => {
  const wordsPerMinute = 200;
  const wordCount = postData.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  
  const rawPost = {
    ...postData,
    createdAt: new Date().toISOString(),
    readingTime,
    views: 0,
    likes: 0,
    isLiked: false,
    isBookmarked: false,
    comments: []
  };

  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'posts'), rawPost);
      return { ...rawPost, id: docRef.id };
    } catch (e) {
      console.error('Firestore createPost failed:', e);
    }
  }

  await delay(300);
  const newPost: Post = {
    ...rawPost,
    id: Math.random().toString(36).substring(2, 10)
  };
  mockPosts.unshift(newPost);
  return newPost;
};

export const updatePost = async (id: string, postData: Partial<Post>): Promise<Post | null> => {
  if (db) {
    try {
      const postRef = doc(db, 'posts', id);
      await updateDoc(postRef, postData);
      const snapshot = await getDoc(postRef);
      return snapshot.exists() ? mapDocToPost(snapshot.id, snapshot.data()) : null;
    } catch (e) {
      console.error('Firestore updatePost failed:', e);
    }
  }
  await delay(300);
  const index = mockPosts.findIndex(p => p.id === id);
  if (index === -1) return null;
  const updatedPost = { ...mockPosts[index], ...postData };
  mockPosts[index] = updatedPost;
  return updatedPost;
};

export const deletePost = async (id: string): Promise<boolean> => {
  if (db) {
    try {
      await deleteDoc(doc(db, 'posts', id));
      return true;
    } catch (e) {
      console.error('Firestore deletePost failed:', e);
      return false;
    }
  }
  await delay(200);
  const initialLength = mockPosts.length;
  mockPosts = mockPosts.filter(p => p.id !== id);
  return mockPosts.length < initialLength;
};

// ==================== SEARCH & FILTER ====================

export const searchPosts = async (queryStr: string): Promise<Post[]> => {
  const postsList = await getPosts();
  const q = queryStr.toLowerCase();
  return postsList.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.content.toLowerCase().includes(q) ||
    p.excerpt.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );
};

export const getPostsByCategory = async (category: string): Promise<Post[]> => {
  if (db) {
    try {
      const q = query(
        collection(db, 'posts'), 
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => mapDocToPost(d.id, d.data()));
    } catch (e) {
      console.error('Firestore getPostsByCategory failed:', e);
    }
  }
  return (await getPosts()).filter(p => p.category.toLowerCase() === category.toLowerCase());
};

export const getPostsByTag = async (tag: string): Promise<Post[]> => {
  if (db) {
    try {
      const q = query(
        collection(db, 'posts'), 
        where('tags', 'array-contains', tag),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => mapDocToPost(d.id, d.data()));
    } catch (e) {
      console.error('Firestore getPostsByTag failed:', e);
    }
  }
  return (await getPosts()).filter(p => p.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
};

export const getPostsByAuthor = async (author: string): Promise<Post[]> => {
  if (db) {
    try {
      const q = query(
        collection(db, 'posts'), 
        where('author', '==', author),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => mapDocToPost(d.id, d.data()));
    } catch (e) {
      console.error('Firestore getPostsByAuthor failed:', e);
    }
  }
  return (await getPosts()).filter(p => p.author.toLowerCase() === author.toLowerCase());
};

export const getPopularPosts = async (limitVal = 5): Promise<Post[]> => {
  if (db) {
    try {
      const q = query(collection(db, 'posts'), orderBy('views', 'desc'), limit(limitVal));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => mapDocToPost(d.id, d.data()));
    } catch (e) {
      console.error('Firestore getPopularPosts failed:', e);
    }
  }
  const all = await getPosts();
  return [...all].sort((a, b) => b.views - a.views).slice(0, limitVal);
};

export const getAllTags = async (): Promise<string[]> => {
  const postsList = await getPosts();
  const tagSet = new Set<string>();
  postsList.forEach(p => p.tags.forEach(t => tagSet.add(t)));
  return Array.from(tagSet);
};

// ==================== LIKES & BOOKMARKS ====================

export const toggleLike = async (id: string): Promise<{ likes: number; isLiked: boolean } | null> => {
  if (db) {
    try {
      const postRef = doc(db, 'posts', id);
      const snapshot = await getDoc(postRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const nextLiked = !data.isLiked;
        const nextLikes = (data.likes || 0) + (nextLiked ? 1 : -1);
        await updateDoc(postRef, { isLiked: nextLiked, likes: nextLikes });
        return { likes: nextLikes, isLiked: nextLiked };
      }
    } catch (e) {
      console.error('Firestore toggleLike failed:', e);
    }
  }
  const post = mockPosts.find(p => p.id === id);
  if (!post) return null;
  post.isLiked = !post.isLiked;
  post.likes += post.isLiked ? 1 : -1;
  return { likes: post.likes, isLiked: post.isLiked };
};

export const toggleBookmark = async (id: string): Promise<boolean | null> => {
  if (db) {
    try {
      const postRef = doc(db, 'posts', id);
      const snapshot = await getDoc(postRef);
      if (snapshot.exists()) {
        const nextBookmarked = !snapshot.data().isBookmarked;
        await updateDoc(postRef, { isBookmarked: nextBookmarked });
        return nextBookmarked;
      }
    } catch (e) {
      console.error('Firestore toggleBookmark failed:', e);
    }
  }
  const post = mockPosts.find(p => p.id === id);
  if (!post) return null;
  post.isBookmarked = !post.isBookmarked;
  return post.isBookmarked;
};

export const getBookmarkedPosts = async (): Promise<Post[]> => {
  if (db) {
    try {
      const q = query(collection(db, 'posts'), where('isBookmarked', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => mapDocToPost(d.id, d.data()));
    } catch (e) {
      console.error('Firestore getBookmarkedPosts failed:', e);
    }
  }
  return (await getPosts()).filter(p => p.isBookmarked);
};

// ==================== COMMENTS ====================

export const addComment = async (postId: string, author: string, content: string): Promise<Comment | null> => {
  const newComment: Comment = {
    id: `cm${Date.now()}`,
    postId,
    author,
    content,
    createdAt: new Date().toISOString(),
    isApproved: true,
  };

  if (db) {
    try {
      const postRef = doc(db, 'posts', postId);
      const snapshot = await getDoc(postRef);
      if (snapshot.exists()) {
        const currentComments = snapshot.data().comments || [];
        await updateDoc(postRef, { comments: [...currentComments, newComment] });
        return newComment;
      }
    } catch (e) {
      console.error('Firestore addComment failed:', e);
    }
  }

  const post = mockPosts.find(p => p.id === postId);
  if (!post) return null;
  post.comments.push(newComment);
  return newComment;
};

export const deleteComment = async (postId: string, commentId: string): Promise<boolean> => {
  if (db) {
    try {
      const postRef = doc(db, 'posts', postId);
      const snapshot = await getDoc(postRef);
      if (snapshot.exists()) {
        const currentComments = snapshot.data().comments || [];
        const filtered = currentComments.filter((c: any) => c.id !== commentId);
        await updateDoc(postRef, { comments: filtered });
        return true;
      }
    } catch (e) {
      console.error('Firestore deleteComment failed:', e);
    }
  }
  const post = mockPosts.find(p => p.id === postId);
  if (!post) return false;
  const initialLen = post.comments.length;
  post.comments = post.comments.filter(c => c.id !== commentId);
  return post.comments.length < initialLen;
};

export const getAllComments = async (): Promise<Comment[]> => {
  const postsList = await getPosts();
  return postsList.flatMap(p => p.comments);
};

// ==================== CATEGORIES ====================

export const getCategories = async (): Promise<Category[]> => {
  const postsList = await getPosts();
  return CATEGORIES.map(cat => ({
    ...cat,
    postCount: postsList.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length,
  }));
};

// ==================== DASHBOARD STATS ====================

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const postsList = await getPosts();
  return {
    totalPosts: postsList.length,
    totalComments: postsList.reduce((sum, p) => sum + (p.comments?.length || 0), 0),
    totalLikes: postsList.reduce((sum, p) => sum + (p.likes || 0), 0),
    totalViews: postsList.reduce((sum, p) => sum + (p.views || 0), 0),
  };
};

// ==================== ROLE REQUESTS & APPROVALS ====================

export interface AdminRequest {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  adminRequestStatus: 'none' | 'pending' | 'approved' | 'rejected';
  role: 'admin' | 'user';
}

export const requestAdminRole = async (userId: string): Promise<boolean> => {
  if (db) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { adminRequestStatus: 'pending' });
      return true;
    } catch (e) {
      console.error('Firestore requestAdminRole failed:', e);
    }
  }
  return false;
};

export const getPendingAdminRequests = async (): Promise<AdminRequest[]> => {
  if (db) {
    try {
      const q = query(collection(db, 'users'), where('adminRequestStatus', '==', 'pending'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          email: data.email || '',
          avatar: data.avatar || '',
          adminRequestStatus: data.adminRequestStatus || 'none',
          role: data.role || 'user'
        };
      });
    } catch (e) {
      console.error('Firestore getPendingAdminRequests failed:', e);
    }
  }
  return [];
};

export const approveAdminRequest = async (userId: string): Promise<boolean> => {
  if (db) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        role: 'admin', 
        adminRequestStatus: 'approved' 
      });
      return true;
    } catch (e) {
      console.error('Firestore approveAdminRequest failed:', e);
    }
  }
  return false;
};

export const rejectAdminRequest = async (userId: string): Promise<boolean> => {
  if (db) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        adminRequestStatus: 'rejected' 
      });
      return true;
    } catch (e) {
      console.error('Firestore rejectAdminRequest failed:', e);
    }
  }
  return false;
};

export const getUserProfile = async (userId: string): Promise<any | null> => {
  if (db) {
    try {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
    } catch (e) {
      console.error('Firestore getUserProfile failed:', e);
    }
  }
  return null;
};

