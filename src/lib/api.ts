import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lume_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const authApi = {
  signup: (data: any) => api.post('/auth/signup', data),
  login: (data: any) => api.post('/auth/login', data),
  guestLogin: (name: string) => api.post('/auth/guest', { name }),
  getMe: () => api.get('/user/me'),
  getUser: (username: string) => api.get(`/user/${username}`),
  getUserPosts: (userId: string) => api.get(`/posts/user/${userId}`),
  updateProfile: (data: any) => api.put('/user/profile', data),
};

export const postApi = {
  getPosts: () => api.get('/posts'),
  createPost: (data: any) => api.post('/posts', data),
  react: (postId: string, type: string) => api.post(`/posts/${postId}/react`, { type }),
  saveSummary: (postId: string, summary: string) => api.post(`/posts/${postId}/summary`, { summary }),
  update: (postId: string, data: any) => api.put(`/posts/${postId}`, data),
  delete: (postId: string) => api.delete(`/posts/${postId}`),
  comment: (postId: string, content: string) => api.post(`/posts/${postId}/comments`, { content }),
};

export const storyApi = {
  getStories: () => api.get('/stories'),
  createStory: (data: any) => api.post('/stories', data),
  react: (storyId: string, type: string) => api.post(`/stories/${storyId}/react`, { type }),
  reply: (storyId: string, content: string) => api.post(`/stories/${storyId}/reply`, { content }),
  view: (storyId: string) => api.post(`/stories/${storyId}/view`),
};

export const chatApi = {
  getChats: () => api.get('/chats'),
  getChat: (chatId: string) => api.get(`/chats/${chatId}`),
  getMessages: (chatId: string) => api.get(`/chats/${chatId}/messages`),
  sendMessage: (chatId: string, data: any) => api.post(`/chats/${chatId}/messages`, data),
};

export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  lockUser: (userId: string) => api.put(`/admin/users/${userId}/lock`),
  verifyUser: (userId: string, status: string) => api.put(`/admin/users/${userId}/verify`, { status }),
  deletePost: (postId: string) => api.delete(`/admin/posts/${postId}`),
  getSetting: (key: string) => api.get(`/admin/settings/${key}`),
  updateSetting: (key: string, value: any) => api.put(`/admin/settings/${key}`, { value }),
};
