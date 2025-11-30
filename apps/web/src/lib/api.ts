import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/v1/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    displayName: string;
    universityId?: string;
    campusId?: string;
    programId?: string;
    year?: number;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data),

  verifyEmail: (token: string) => 
    api.post('/auth/verify-email', { token }),

  logout: (refreshToken: string) => 
    api.post('/auth/logout', { refreshToken }),
};

// Users API
export const usersApi = {
  getById: (id: string) => api.get(`/users/${id}`),
  
  search: (params: {
    q?: string;
    universityId?: string;
    campusId?: string;
    limit?: number;
    cursor?: string;
  }) => api.get('/users', { params }),

  update: (id: string, data: {
    displayName?: string;
    bio?: string;
    interests?: string[];
  }) => api.patch(`/users/${id}`, data),

  follow: (id: string) => api.post(`/users/${id}/follow`),

  getFollowers: (id: string, limit?: number, cursor?: string) =>
    api.get(`/users/${id}/followers`, { params: { limit, cursor } }),

  getFollowing: (id: string, limit?: number, cursor?: string) =>
    api.get(`/users/${id}/following`, { params: { limit, cursor } }),
};

// Posts API
export const postsApi = {
  create: (data: {
    content?: string;
    mediaIds?: string[];
    isAcademic?: boolean;
    visibility?: string;
    tags?: string[];
  }) => api.post('/posts', data),

  getById: (id: string) => api.get(`/posts/${id}`),

  update: (id: string, data: {
    content?: string;
    visibility?: string;
    tags?: string[];
  }) => api.patch(`/posts/${id}`, data),

  delete: (id: string) => api.delete(`/posts/${id}`),

  like: (id: string) => api.post(`/posts/${id}/like`),

  comment: (id: string, content: string, parentId?: string) =>
    api.post(`/posts/${id}/comment`, { content, parentId }),

  getComments: (id: string, limit?: number, cursor?: string) =>
    api.get(`/posts/${id}/comments`, { params: { limit, cursor } }),

  share: (id: string, content?: string) =>
    api.post(`/posts/${id}/share`, { content }),

  save: (id: string) => api.post(`/posts/${id}/save`),

  report: (id: string, reason: string, details?: string) =>
    api.post(`/posts/${id}/report`, { reason, details }),
};

// Feeds API
export const feedsApi = {
  getCampus: (campusId: string, limit?: number, cursor?: string) =>
    api.get('/feeds/campus', { params: { campusId, limit, cursor } }),

  getUniversity: (universityId: string, limit?: number, cursor?: string) =>
    api.get('/feeds/university', { params: { universityId, limit, cursor } }),

  getProvince: (province: string, limit?: number, cursor?: string) =>
    api.get('/feeds/province', { params: { province, limit, cursor } }),

  getNational: (limit?: number, cursor?: string) =>
    api.get('/feeds/national', { params: { limit, cursor } }),

  getPersonalized: (limit?: number, cursor?: string) =>
    api.get('/feeds/personalized', { params: { limit, cursor } }),
};

// Media API
export const mediaApi = {
  getPresignedUrl: (filename: string, contentType: string) =>
    api.post('/media/presign', { filename, contentType }),
};

// Chat API
export const chatApi = {
  create: (memberIds: string[], isGroup?: boolean, name?: string) =>
    api.post('/chats', { memberIds, isGroup, name }),

  getChats: (limit?: number, cursor?: string) =>
    api.get('/chats', { params: { limit, cursor } }),

  getById: (id: string) => api.get(`/chats/${id}`),

  getMessages: (id: string, limit?: number, cursor?: string) =>
    api.get(`/chats/${id}/messages`, { params: { limit, cursor } }),

  sendMessage: (id: string, content?: string, mediaUrl?: string) =>
    api.post(`/chats/${id}/messages`, { content, mediaUrl }),

  markAsRead: (id: string) => api.post(`/chats/${id}/read`),

  leave: (id: string) => api.post(`/chats/${id}/leave`),
};

// Events API
export const eventsApi = {
  create: (data: {
    title: string;
    description?: string;
    startAt: string;
    endAt?: string;
    campusId?: string;
    locationLat?: number;
    locationLng?: number;
    address?: string;
    imageUrl?: string;
    tags?: string[];
  }) => api.post('/events', data),

  search: (params: {
    campusId?: string;
    universityId?: string;
    from?: string;
    to?: string;
    limit?: number;
    cursor?: string;
  }) => api.get('/events', { params }),

  getById: (id: string) => api.get(`/events/${id}`),

  delete: (id: string) => api.delete(`/events/${id}`),
};

// Opportunities API
export const opportunitiesApi = {
  search: (params: {
    type?: string;
    fieldTags?: string;
    province?: string;
    yearMin?: number;
    yearMax?: number;
    limit?: number;
    cursor?: string;
  }) => api.get('/opportunities', { params }),

  getMatched: () => api.get('/opportunities/match'),

  getById: (id: string) => api.get(`/opportunities/${id}`),
};

// Admin API
export const adminApi = {
  getStats: () => api.get('/admin/stats'),

  getModerationQueue: (status?: string, limit?: number, cursor?: string) =>
    api.get('/admin/moderation/queue', { params: { status, limit, cursor } }),

  takeAction: (id: string, action: string) =>
    api.post(`/admin/moderation/${id}/action`, { action }),

  getVerificationQueue: (limit?: number, cursor?: string) =>
    api.get('/admin/verification/queue', { params: { limit, cursor } }),

  handleVerification: (id: string, action: string, notes?: string) =>
    api.post(`/admin/verification/${id}/action`, { action, notes }),
};

export default api;
