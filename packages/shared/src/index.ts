// Common types and utilities for Campus Vibe

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  cursor?: string;
}

// Auth types
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  universityId?: string;
  campusId?: string;
  programId?: string;
  year?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

// User types
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  universityId?: string;
  campusId?: string;
  programId?: string;
  year?: number;
  verified: boolean;
  verificationType?: string;
  bio?: string;
  interests: string[];
  role: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  interests?: string[];
  universityId?: string;
  campusId?: string;
  programId?: string;
  year?: number;
}

// Post types
export interface CreatePostRequest {
  content?: string;
  mediaIds?: string[];
  isAcademic?: boolean;
  visibility?: 'CAMPUS' | 'UNIVERSITY' | 'PROVINCE' | 'NATIONAL';
  tags?: string[];
}

export interface PostResponse {
  id: string;
  authorId: string;
  content?: string;
  isAcademic: boolean;
  campusId?: string;
  universityId?: string;
  province?: string;
  visibility: string;
  tags: string[];
  viewCount: number;
  createdAt: string;
  author: UserProfile;
  media: MediaResponse[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

// Media types
export interface MediaResponse {
  id: string;
  url: string;
  mime: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO';
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
}

export interface PresignedUrlRequest {
  filename: string;
  contentType: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  mediaId: string;
  key: string;
}

// Feed types
export interface FeedRequest {
  limit?: number;
  cursor?: string;
}

export interface CampusFeedRequest extends FeedRequest {
  campusId: string;
}

export interface UniversityFeedRequest extends FeedRequest {
  universityId: string;
}

export interface ProvinceFeedRequest extends FeedRequest {
  province: string;
}

// Chat types
export interface CreateChatRequest {
  memberIds: string[];
  isGroup?: boolean;
  name?: string;
}

export interface ChatResponse {
  id: string;
  isGroup: boolean;
  name?: string;
  avatarUrl?: string;
  members: UserProfile[];
  lastMessage?: MessageResponse;
  createdAt: string;
}

export interface MessageResponse {
  id: string;
  chatId: string;
  senderId: string;
  content?: string;
  mediaUrl?: string;
  readBy: string[];
  createdAt: string;
  sender: UserProfile;
}

export interface SendMessageRequest {
  content?: string;
  mediaUrl?: string;
}

// Socket events
export enum SocketEvents {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  
  // Chat
  JOIN_CHAT = 'chat:join',
  LEAVE_CHAT = 'chat:leave',
  SEND_MESSAGE = 'chat:message:send',
  NEW_MESSAGE = 'chat:message:new',
  MESSAGE_READ = 'chat:message:read',
  TYPING_START = 'chat:typing:start',
  TYPING_END = 'chat:typing:end',
  
  // Presence
  PRESENCE_UPDATE = 'presence:update',
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  
  // Notifications
  NOTIFICATION = 'notification',
}

// Constants
export const PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
] as const;

export const FEED_DEFAULT_LIMIT = 20;
export const FEED_MAX_LIMIT = 100;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_VIDEO_DURATION = 60; // seconds

// Utility functions
export function isInstitutionalEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }
  const domain = parts[1]?.toLowerCase();
  return domain?.endsWith('.ac.za') || false;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function generateCursor(id: string, timestamp: Date): string {
  return Buffer.from(`${id}:${timestamp.toISOString()}`).toString('base64');
}

export function parseCursor(cursor: string): { id: string; timestamp: Date } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [id, timestamp] = decoded.split(':');
    return { id, timestamp: new Date(timestamp) };
  } catch {
    return null;
  }
}
