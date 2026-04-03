export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  phone?: string;
  bio?: string;
  profilePhoto?: string;
  coverPhoto?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'LGBTQIA+' | 'rather not say';
  work?: string;
  education?: string;
  relationshipStatus?: string;
  role: 'user' | 'moderator' | 'admin' | 'owner' | 'guest';
  verificationStatus: 'none' | 'blue' | 'gold';
  verificationExpiry?: string;
  isLocked: boolean;
  isDeactivated: boolean;
  isPrivate: boolean;
  twoFactorEnabled: boolean;
  loginActivity: {
    id: string;
    device: string;
    location: string;
    ip: string;
    lastActive: string;
    isCurrent: boolean;
  }[];
  pendingVerification: boolean;
  following: string[];
  followers: string[];
  followRequests: string[];
  verificationRequest?: {
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type ReactionType = 'love' | 'care' | 'haha' | 'sad' | 'wow' | 'angry' | 'smile';

export interface Reaction {
  userId: string;
  type: ReactionType;
}

export interface Post {
  id: string;
  authorUid: string;
  authorName: string;
  authorUsername: string;
  authorPhoto?: string;
  authorVerificationStatus?: 'none' | 'blue' | 'gold';
  content: string;
  media?: { url: string; type: 'image' | 'video' | 'file' }[];
  type: 'text' | 'image' | 'video' | 'file' | 'poll' | 'gif' | 'question';
  pollData?: {
    question: string;
    options: { id: string; text: string; votes: string[] }[];
    expiresAt: string;
    totalVotes: number;
  };
  audience: 'public' | 'friends' | 'private' | 'custom';
  isAnonymous: boolean;
  anonymousNickname?: string;
  reactions: Reaction[];
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  comments?: {
    id: string;
    authorId: string;
    authorName: string;
    authorUsername: string;
    authorPhoto?: string;
    content: string;
    reactions: Reaction[];
    reactionCount: number;
    createdAt: string;
  }[];
  aiSummary?: string;
  aiAnswer?: string;
  factCheck?: {
    status: 'pending' | 'verified' | 'false' | 'misleading';
    summary: string;
    sources: string[];
  };
  location?: {
    name: string;
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  authorId: string;
  media: string;
  mediaType: 'image' | 'video';
  createdAt: string;
  authorName: string;
  authorPhoto: string | null;
  authorVerificationStatus: string;
  reactions: Reaction[];
  viewers?: {
    id: string;
    name: string;
    photo: string | null;
  }[];
}

export interface Comment {
  id: string;
  postId: string;
  parentCommentId?: string;
  authorUid: string;
  authorName: string;
  authorUsername: string;
  authorPhoto?: string;
  content: string;
  reactions: Reaction[];
  reactionCount: number;
  createdAt: string;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  media?: { url: string; type: 'image' | 'video' | 'file' | 'audio' };
  isOneTimeView: boolean;
  seenBy: string[];
  createdAt: string;
}
