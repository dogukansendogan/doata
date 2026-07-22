import { Post } from '../types/post';

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: 'Hello World',
    content: 'This is my first post on this blog!',
    author: 'Dogukan',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Expo Router is awesome',
    content: 'File based routing makes navigation so much easier in React Native.',
    author: 'Dogukan',
    createdAt: new Date().toISOString(),
  }
];

export const fetchPosts = async (): Promise<Post[]> => {
  // Simulate network delay
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_POSTS), 500));
};

export const fetchPostById = async (id: string): Promise<Post | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_POSTS.find(post => post.id === id));
    }, 500);
  });
};

export const createPost = async (postData: Omit<Post, 'id' | 'createdAt'>): Promise<Post> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newPost: Post = {
        ...postData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      };
      MOCK_POSTS.unshift(newPost);
      resolve(newPost);
    }, 500);
  });
};
