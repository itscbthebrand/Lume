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
  getUserById: (userId: string) => api.get(`/user/id/${userId}`),
  getUserPosts: (userId: string) => api.get(`/posts/user/${userId}`),
  getMyFiles: () => api.get('/user/files'),
  searchUsers: (query: string) => api.get(`/user/search?query=${query}`),
  updateProfile: (data: any) => api.put('/user/profile', data),
  follow: (userId: string) => api.post(`/user/${userId}/follow`),
  requestVerification: () => api.post('/user/verification-request'),
  updatePrivacy: (data: { isPrivate?: boolean; twoFactorEnabled?: boolean }) => api.put('/user/privacy', data),
  getLoginActivity: () => api.get('/user/login-activity'),
  toggle2FA: (enabled: boolean) => api.post('/user/2fa/toggle', { enabled }),
};

export const postApi = {
  getPosts: () => api.get('/posts'),
  getSharedPosts: () => api.get('/posts/shared'),
  createPost: (data: any) => api.post('/posts', data),
  react: (postId: string, type: string) => api.post(`/posts/${postId}/react`, { type }),
  getReactions: (postId: string) => api.get(`/posts/${postId}/reactions`),
  saveSummary: (postId: string, summary: string) => api.post(`/posts/${postId}/summary`, { summary }),
  update: (postId: string, data: any) => api.put(`/posts/${postId}`, data),
  delete: (postId: string) => api.delete(`/posts/${postId}`),
  comment: (postId: string, content: string) => api.post(`/posts/${postId}/comments`, { content }),
  reactToComment: (postId: string, commentId: string, type: string) => api.post(`/posts/${postId}/comments/${commentId}/react`, { type }),
  getCommentReactions: (postId: string, commentId: string) => api.get(`/posts/${postId}/comments/${commentId}/reactions`),
  votePoll: (postId: string, optionId: string) => api.post(`/posts/${postId}/poll/vote`, { optionId }),
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
  startChat: (userId: string) => api.post('/chats/start', { userId }),
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
