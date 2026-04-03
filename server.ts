import './cloudinary-config.ts';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

cloudinary.config({
  cloudinary_url: 'cloudinary://684835378833426:MAoOQXQhyW3yFvnQAEl4j03Ls-A@dowsi65rf'
});

// Helper to upload to Cloudinary
const uploadToCloudinary = async (base64: string, folder: string = 'images') => {
  if (!base64 || !base64.startsWith('data:')) return base64;
  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: folder,
      resource_type: 'auto'
    });
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return base64;
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'lume_secret_key_2026';

// Data Directories
const DATA_DIR = path.join(__dirname, 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const POSTS_DIR = path.join(DATA_DIR, 'posts');
const CHATS_DIR = path.join(DATA_DIR, 'chats');
const MESSAGES_DIR = path.join(DATA_DIR, 'messages');
const STORIES_DIR = path.join(DATA_DIR, 'stories');
const SETTINGS_DIR = path.join(DATA_DIR, 'settings');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure directories exist
[DATA_DIR, USERS_DIR, POSTS_DIR, CHATS_DIR, MESSAGES_DIR, STORIES_DIR, SETTINGS_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper Functions
const readJsonFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return null;
  }
};

const writeJsonFile = (filePath: string, data: any) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
    return false;
  }
};

const getAllFiles = (dir: string) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(file => file.endsWith('.json')).map(file => readJsonFile(path.join(dir, file)));
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.error('JWT Verification failed:', err.message);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.username !== 'adi') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const isOwner = (req: any, res: any, next: any) => {
  if (req.user.role !== 'owner' && req.user.username !== 'adi') {
    return res.status(403).json({ message: 'Owner access required' });
  }
  next();
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'connected', database: 'file-system' });
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, phone } = req.body;
    
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const users = getAllFiles(USERS_DIR);
    const existingUser = users.find(u => u.email === email.toLowerCase() || u.username === username.toLowerCase());

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const role = username.toLowerCase() === 'adi' ? 'owner' : 'user';
    const verificationStatus = username.toLowerCase() === 'adi' ? 'gold' : 'none';

    const newUser = {
      id,
      firstName,
      lastName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role,
      verificationStatus,
      profilePhoto: null,
      coverPhoto: null,
      bio: '',
      following: [],
      followers: [],
      isPrivate: false,
      twoFactorEnabled: false,
      loginActivity: [],
      isLocked: false,
      isDeactivated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    writeJsonFile(path.join(USERS_DIR, `${id}.json`), newUser);
    
    const token = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, JWT_SECRET);
    
    res.status(201).json({ 
      token, 
      user: { 
        id: newUser.id, 
        username: newUser.username, 
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        verificationStatus: newUser.verificationStatus,
        profilePhoto: newUser.profilePhoto,
        bio: newUser.bio
      } 
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error during signup: ' + err.message });
  }
});

app.post('/api/auth/guest', async (req, res) => {
  const { name } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: 'Name is required for guest login' });
    }

    const id = uuidv4();
    const guestUsername = `guest_${name.toLowerCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 10000)}`;
    
    const newUser = {
      id,
      firstName: name,
      lastName: '(Guest)',
      username: guestUsername,
      role: 'guest',
      verificationStatus: 'none',
      profilePhoto: null,
      coverPhoto: null,
      bio: '',
      following: [],
      followers: [],
      isPrivate: false,
      twoFactorEnabled: false,
      loginActivity: [],
      isLocked: false,
      isDeactivated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    writeJsonFile(path.join(USERS_DIR, `${id}.json`), newUser);
    
    const token = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role, isGuest: true }, JWT_SECRET);
    
    res.status(201).json({ 
      token, 
      user: { 
        id: newUser.id, 
        username: newUser.username, 
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        verificationStatus: newUser.verificationStatus,
        profilePhoto: newUser.profilePhoto,
        bio: newUser.bio
      } 
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error during guest login: ' + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { identifier, email, username, password } = req.body;
  const loginId = identifier || email || username;

  try {
    if (!loginId || !password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    const users = getAllFiles(USERS_DIR);
    const user = users.find(u => 
      u.email === loginId.toLowerCase() || 
      u.username === loginId.toLowerCase() || 
      u.phone === loginId
    );

    if (!user || !user.password) {
      return res.status(400).json({ message: 'User not found or invalid login type' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    
    // Track login activity
    const session = {
      id: uuidv4(),
      device: req.headers['user-agent'] || 'Unknown Device',
      location: 'Unknown Location',
      ip: req.ip || 'Unknown IP',
      lastActive: new Date().toISOString(),
      isCurrent: true
    };
    user.loginActivity = [session, ...(user.loginActivity || []).map(s => ({ ...s, isCurrent: false }))].slice(0, 10);
    writeJsonFile(path.join(USERS_DIR, `${user.id}.json`), user);

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        verificationStatus: user.verificationStatus,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        isPrivate: user.isPrivate,
        twoFactorEnabled: user.twoFactorEnabled,
        loginActivity: user.loginActivity
      } 
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error during login: ' + err.message });
  }
});

app.get('/api/user/me', authenticateToken, async (req: any, res) => {
  try {
    const user = readJsonFile(path.join(USERS_DIR, `${req.user.id}.json`));
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/user/profile', authenticateToken, async (req: any, res) => {
  try {
    const userPath = path.join(USERS_DIR, `${req.user.id}.json`);
    const user = readJsonFile(userPath);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { firstName, lastName, bio, work, education, profilePhoto, coverPhoto } = req.body;

    if (profilePhoto && profilePhoto.startsWith('data:')) {
      user.profilePhoto = await uploadToCloudinary(profilePhoto, 'profiles');
    }
    if (coverPhoto && coverPhoto.startsWith('data:')) {
      user.coverPhoto = await uploadToCloudinary(coverPhoto, 'covers');
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.bio = bio || user.bio;
    user.work = work || user.work;
    user.education = education || user.education;
    user.updatedAt = new Date().toISOString();

    writeJsonFile(userPath, user);
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/user/:userId/follow', authenticateToken, (req: any, res) => {
  try {
    const targetUserId = req.params.userId;
    if (targetUserId === req.user.id) return res.status(400).json({ message: 'Cannot follow yourself' });

    const currentUserPath = path.join(USERS_DIR, `${req.user.id}.json`);
    const targetUserPath = path.join(USERS_DIR, `${targetUserId}.json`);

    const currentUser = readJsonFile(currentUserPath);
    const targetUser = readJsonFile(targetUserPath);

    if (!currentUser || !targetUser) return res.status(404).json({ message: 'User not found' });

    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];
    if (!targetUser.followRequests) targetUser.followRequests = [];

    const index = currentUser.following.indexOf(targetUserId);
    const requestIndex = targetUser.followRequests.indexOf(req.user.id);

    if (index > -1) {
      // Unfollow
      currentUser.following.splice(index, 1);
      const followerIndex = targetUser.followers.indexOf(req.user.id);
      if (followerIndex > -1) targetUser.followers.splice(followerIndex, 1);
    } else if (requestIndex > -1) {
      // Cancel request
      targetUser.followRequests.splice(requestIndex, 1);
    } else {
      // Follow or Request
      if (targetUser.isPrivate) {
        targetUser.followRequests.push(req.user.id);
      } else {
        currentUser.following.push(targetUserId);
        targetUser.followers.push(req.user.id);
      }
    }

    writeJsonFile(currentUserPath, currentUser);
    writeJsonFile(targetUserPath, targetUser);

    res.json({ following: currentUser.following });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/user/files', authenticateToken, (req: any, res) => {
  try {
    const posts = getAllFiles(POSTS_DIR).filter(p => p.authorId === req.user.id);
    const messages = getAllFiles(MESSAGES_DIR).filter(m => m.senderId === req.user.id);
    
    const files: any[] = [];
    posts.forEach(p => {
      if (p.media) {
        p.media.forEach((m: any) => files.push({ ...m, source: 'post', postId: p.id, createdAt: p.createdAt }));
      }
    });
    messages.forEach(m => {
      if (m.media) {
        m.media.forEach((med: any) => files.push({ ...med, source: 'message', messageId: m.id, createdAt: m.createdAt }));
      }
    });

    res.json(files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/user/follow-requests', authenticateToken, (req: any, res) => {
  try {
    const user = readJsonFile(path.join(USERS_DIR, `${req.user.id}.json`));
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const requests = (user.followRequests || []).map((id: string) => {
      const u = readJsonFile(path.join(USERS_DIR, `${id}.json`));
      if (!u) return null;
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    }).filter(Boolean);
    
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/user/follow-requests/:userId/approve', authenticateToken, (req: any, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserPath = path.join(USERS_DIR, `${req.user.id}.json`);
    const targetUserPath = path.join(USERS_DIR, `${targetUserId}.json`);
    
    const currentUser = readJsonFile(currentUserPath);
    const targetUser = readJsonFile(targetUserPath);
    
    if (!currentUser || !targetUser) return res.status(404).json({ message: 'User not found' });
    
    const requestIndex = currentUser.followRequests.indexOf(targetUserId);
    if (requestIndex === -1) return res.status(400).json({ message: 'No follow request found' });
    
    // Remove from requests
    currentUser.followRequests.splice(requestIndex, 1);
    
    // Add to followers/following
    if (!currentUser.followers) currentUser.followers = [];
    if (!targetUser.following) targetUser.following = [];
    
    if (!currentUser.followers.includes(targetUserId)) currentUser.followers.push(targetUserId);
    if (!targetUser.following.includes(req.user.id)) targetUser.following.push(req.user.id);
    
    writeJsonFile(currentUserPath, currentUser);
    writeJsonFile(targetUserPath, targetUser);
    
    res.json({ message: 'Follow request approved' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/user/follow-requests/:userId/reject', authenticateToken, (req: any, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserPath = path.join(USERS_DIR, `${req.user.id}.json`);
    
    const currentUser = readJsonFile(currentUserPath);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });
    
    const requestIndex = currentUser.followRequests.indexOf(targetUserId);
    if (requestIndex === -1) return res.status(400).json({ message: 'No follow request found' });
    
    // Remove from requests
    currentUser.followRequests.splice(requestIndex, 1);
    
    writeJsonFile(currentUserPath, currentUser);
    
    res.json({ message: 'Follow request rejected' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/user/search', authenticateToken, (req: any, res) => {
  try {
    const query = (req.query.q as string || '').toLowerCase();
    if (!query) return res.json([]);
    
    const users = getAllFiles(USERS_DIR);
    const results = users.filter(u => 
      u.username?.toLowerCase().includes(query) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.phone?.includes(query)
    ).map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/user/id/:userId', async (req, res) => {
  try {
    const userPath = path.join(USERS_DIR, `${req.params.userId}.json`);
    const user = readJsonFile(userPath);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/user/:username', async (req, res) => {
  try {
    const users = getAllFiles(USERS_DIR);
    const user = users.find(u => u.username === req.params.username.toLowerCase());
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/posts/user/:userId', async (req, res) => {
  try {
    const posts = getAllFiles(POSTS_DIR)
      .filter(p => p.authorId === req.params.userId)
      .map(p => {
        const author = readJsonFile(path.join(USERS_DIR, `${p.authorId}.json`));
        return { 
          ...p, 
          authorUid: p.authorId,
          authorName: author ? `${author.firstName} ${author.lastName}` : 'Unknown User',
          authorUsername: author ? author.username : 'unknown',
          authorPhoto: author ? author.profilePhoto : null,
          authorVerificationStatus: author ? author.verificationStatus : 'none'
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(posts);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/posts', authenticateToken, (req: any, res) => {
  try {
    const posts = getAllFiles(POSTS_DIR);
    const users = getAllFiles(USERS_DIR);
    const currentUser = users.find(u => u.id === req.user.id);
    const following = currentUser?.following || [];

    const populatedPosts = posts
      .filter(post => {
        const author = users.find(u => u.id === post.authorId);
        const isFollowing = following.includes(post.authorId);
        const isSelf = post.authorId === req.user.id;
        const isPublic = post.audience === 'public';
        const isCustom = post.audience === 'custom' && post.customAudience?.includes(req.user.id);
        
        // If author is private, only show if following or self or custom
        if (author?.isPrivate && !isFollowing && !isSelf && !isCustom) return false;
        
        return isFollowing || isSelf || isPublic || isCustom;
      })
      .map(p => {
        const author = users.find(u => u.id === p.authorId);
        return { 
          ...p, 
          authorUid: p.authorId,
          authorName: author ? `${author.firstName} ${author.lastName}` : 'Unknown User',
          authorUsername: author ? author.username : 'unknown',
          authorPhoto: author ? author.profilePhoto : null,
          authorVerificationStatus: author ? author.verificationStatus : 'none'
        };
      })
      .sort((a, b) => {
        const isAFollowing = following.includes(a.authorId);
        const isBFollowing = following.includes(b.authorId);
        if (isAFollowing && !isBFollowing) return -1;
        if (!isAFollowing && isBFollowing) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    res.json(populatedPosts);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/posts/shared', authenticateToken, (req: any, res) => {
  try {
    const posts = getAllFiles(POSTS_DIR);
    const users = getAllFiles(USERS_DIR);
    const sharedPosts = posts
      .filter(post => post.audience === 'custom' && post.customAudience?.includes(req.user.id))
      .map(p => {
        const author = users.find(u => u.id === p.authorId);
        return { 
          ...p, 
          authorUid: p.authorId,
          authorName: author ? `${author.firstName} ${author.lastName}` : 'Unknown User',
          authorUsername: author ? author.username : 'unknown',
          authorPhoto: author ? author.profilePhoto : null,
          authorVerificationStatus: author ? author.verificationStatus : 'none'
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(sharedPosts);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});


app.post('/api/chats/start', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });
    
    const chats = getAllFiles(CHATS_DIR);
    // Check if direct chat already exists
    let chat = chats.find(c => 
      c.type === 'direct' && 
      c.participants.includes(req.user.id) && 
      c.participants.includes(userId)
    );
    
    if (!chat) {
      const chatId = uuidv4();
      chat = {
        id: chatId,
        type: 'direct',
        participants: [req.user.id, userId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessage: null
      };
      writeJsonFile(path.join(CHATS_DIR, `${chatId}.json`), chat);
    }
    
    res.json(chat);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/chats', authenticateToken, async (req: any, res) => {
  try {
    const chats = getAllFiles(CHATS_DIR)
      .filter(c => c.participants.includes(req.user.id))
      .map(c => {
        const participants = c.participants.map((pid: string) => {
          const u = readJsonFile(path.join(USERS_DIR, `${pid}.json`));
          return u ? { firstName: u.firstName, lastName: u.lastName, username: u.username, profilePhoto: u.profilePhoto } : null;
        });
        const lastMessage = c.lastMessage ? readJsonFile(path.join(MESSAGES_DIR, `${c.lastMessage}.json`)) : null;
        return { ...c, participants, lastMessage };
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json(chats);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/chats/:chatId', authenticateToken, async (req: any, res) => {
  try {
    const chat = readJsonFile(path.join(CHATS_DIR, `${req.params.chatId}.json`));
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    
    const participants = chat.participants.map((pid: string) => {
      const u = readJsonFile(path.join(USERS_DIR, `${pid}.json`));
      return u ? { firstName: u.firstName, lastName: u.lastName, username: u.username, profilePhoto: u.profilePhoto } : null;
    });
    
    res.json({ ...chat, participants });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/chats/:chatId/messages', authenticateToken, async (req: any, res) => {
  try {
    const messages = getAllFiles(MESSAGES_DIR)
      .filter(m => m.chatId === req.params.chatId)
      .map(m => {
        const sender = readJsonFile(path.join(USERS_DIR, `${m.senderId}.json`));
        return { ...m, senderId: sender ? { firstName: sender.firstName, lastName: sender.lastName, username: sender.username, profilePhoto: sender.profilePhoto } : null };
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/chats/:chatId/messages', authenticateToken, async (req: any, res) => {
  try {
    const id = uuidv4();
    const message = {
      id,
      chatId: req.params.chatId,
      senderId: req.user.id,
      content: req.body.content,
      media: req.body.media,
      isOneTimeView: false,
      seenBy: [req.user.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    writeJsonFile(path.join(MESSAGES_DIR, `${id}.json`), message);
    
    const chatPath = path.join(CHATS_DIR, `${req.params.chatId}.json`);
    const chat = readJsonFile(chatPath);
    if (chat) {
      chat.lastMessage = id;
      chat.updatedAt = new Date().toISOString();
      writeJsonFile(chatPath, chat);
    }
    
    res.status(201).json(message);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/posts', authenticateToken, async (req: any, res: any) => {
  try {
    const id = uuidv4();
    const { content, media, type, audience, customAudience, isAnonymous, anonymousNickname } = req.body;
    
    let uploadedMedia = media;
    if (media && Array.isArray(media)) {
      uploadedMedia = await Promise.all(media.map(async (m: any) => ({
        ...m,
        url: await uploadToCloudinary(m.url, 'posts')
      })));
    }

    const post = {
      id,
      content,
      media: uploadedMedia,
      type,
      pollData: type === 'poll' ? {
        question: req.body.pollData?.question || content,
        options: (req.body.pollData?.options || []).map((opt: string) => ({
          id: uuidv4(),
          text: opt,
          votes: []
        })),
        expiresAt: req.body.pollData?.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        totalVotes: 0
      } : undefined,
      audience: audience || 'public',
      customAudience: audience === 'custom' ? customAudience : undefined,
      isAnonymous: !!isAnonymous,
      anonymousNickname,
      authorId: req.user.id,
      reactions: [],
      reactionCount: 0,
      commentCount: 0,
      shareCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    writeJsonFile(path.join(POSTS_DIR, `${id}.json`), post);
    res.status(201).json(post);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Routes
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = getAllFiles(USERS_DIR).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/users/:userId/lock', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userPath = path.join(USERS_DIR, `${req.params.userId}.json`);
    const user = readJsonFile(userPath);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isLocked = !user.isLocked;
    user.updatedAt = new Date().toISOString();
    writeJsonFile(userPath, user);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/users/:userId/verify', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userPath = path.join(USERS_DIR, `${req.params.userId}.json`);
    const user = readJsonFile(userPath);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.verificationStatus = req.body.status;
    user.updatedAt = new Date().toISOString();
    writeJsonFile(userPath, user);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/posts/:postId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const postPath = path.join(POSTS_DIR, `${req.params.postId}.json`);
    if (fs.existsSync(postPath)) {
      fs.unlinkSync(postPath);
    }
    res.json({ message: 'Post deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/settings/:key', async (req, res) => {
  try {
    const setting = readJsonFile(path.join(SETTINGS_DIR, `${req.params.key}.json`));
    res.json(setting ? setting.value : null);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/settings/:key', authenticateToken, isOwner, async (req, res) => {
  try {
    const settingPath = path.join(SETTINGS_DIR, `${req.params.key}.json`);
    const setting = { key: req.params.key, value: req.body.value, updatedAt: new Date().toISOString() };
    writeJsonFile(settingPath, setting);
    res.json(setting);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Stories Routes
app.get('/api/stories', authenticateToken, (req: any, res) => {
  try {
    const stories = getAllFiles(STORIES_DIR);
    const users = getAllFiles(USERS_DIR);
    const currentUser = users.find(u => u.id === req.user.id);
    const following = currentUser?.following || [];
    
    // Filter out expired stories (older than 24 hours)
    const now = new Date().getTime();
    const activeStories = stories.filter(story => {
      const createdAt = new Date(story.createdAt).getTime();
      const isExpired = (now - createdAt) >= 24 * 60 * 60 * 1000;
      if (isExpired) return false;

      // Filter stories: only show from following or self
      const isFollowing = following.includes(story.authorId);
      const isSelf = story.authorId === req.user.id;
      return isFollowing || isSelf;
    });

    const populatedStories = activeStories.map(story => {
      const author = users.find(u => u.id === story.authorId);
      const isAuthor = req.user && req.user.id === story.authorId;
      
      let viewers = [];
      if (isAuthor && story.viewers) {
        viewers = story.viewers.map((v: any) => {
          const viewerUser = users.find(u => u.id === v.userId);
          const reaction = story.reactions?.find((r: any) => r.userId === v.userId);
          return viewerUser ? {
            id: viewerUser.id,
            name: `${viewerUser.firstName} ${viewerUser.lastName}`,
            photo: viewerUser.profilePhoto,
            reaction: reaction ? reaction.type : null
          } : null;
        }).filter(Boolean);
      }

      return {
        ...story,
        authorName: author ? `${author.firstName} ${author.lastName}` : 'Unknown User',
        authorPhoto: author ? author.profilePhoto : null,
        authorVerificationStatus: author ? author.verificationStatus : 'none',
        viewers: isAuthor ? viewers : []
      };
    });

    res.json(populatedStories);
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error fetching stories: ' + err.message });
  }
});

app.post('/api/stories/:storyId/view', authenticateToken, (req: any, res) => {
  try {
    const storyPath = path.join(STORIES_DIR, `${req.params.storyId}.json`);
    const story = readJsonFile(storyPath);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (!story.viewers) story.viewers = [];
    
    const alreadyViewed = story.viewers.some((v: any) => v.userId === req.user.id);
    if (!alreadyViewed && story.authorId !== req.user.id) {
      story.viewers.push({ userId: req.user.id, viewedAt: new Date().toISOString() });
      writeJsonFile(storyPath, story);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/stories', authenticateToken, async (req: any, res: any) => {
  const { media, mediaType } = req.body;
  try {
    const id = uuidv4();
    const uploadedMedia = await uploadToCloudinary(media, 'stories');
    const story = {
      id,
      authorId: req.user.id,
      media: uploadedMedia,
      mediaType,
      reactions: [],
      createdAt: new Date().toISOString()
    };

    writeJsonFile(path.join(STORIES_DIR, `${id}.json`), story);
    res.status(201).json(story);
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error creating story: ' + err.message });
  }
});

app.post('/api/posts/:postId/react', authenticateToken, (req: any, res) => {
  try {
    const postPath = path.join(POSTS_DIR, `${req.params.postId}.json`);
    const post = readJsonFile(postPath);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!post.reactions) post.reactions = [];
    
    const existingIndex = post.reactions.findIndex((r: any) => r.userId === req.user.id);
    if (existingIndex > -1) {
      if (post.reactions[existingIndex].type === req.body.type) {
        post.reactions.splice(existingIndex, 1);
      } else {
        post.reactions[existingIndex].type = req.body.type;
      }
    } else {
      post.reactions.push({ userId: req.user.id, type: req.body.type });
    }

    post.reactionCount = post.reactions.length;
    writeJsonFile(postPath, post);
    res.json(post);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/posts/:postId/summary', authenticateToken, (req: any, res) => {
  try {
    const postPath = path.join(POSTS_DIR, `${req.params.postId}.json`);
    const post = readJsonFile(postPath);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.aiSummary = req.body.summary;
    writeJsonFile(postPath, post);
    res.json(post);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/stories/:storyId/react', authenticateToken, (req: any, res) => {
  try {
    const storyPath = path.join(STORIES_DIR, `${req.params.storyId}.json`);
    const story = readJsonFile(storyPath);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (!story.reactions) story.reactions = [];
    
    const existingIndex = story.reactions.findIndex((r: any) => r.userId === req.user.id);
    if (existingIndex > -1) {
      if (story.reactions[existingIndex].type === req.body.type) {
        story.reactions.splice(existingIndex, 1);
      } else {
        story.reactions[existingIndex].type = req.body.type;
      }
    } else {
      story.reactions.push({ userId: req.user.id, type: req.body.type });
    }

    writeJsonFile(storyPath, story);
    res.json(story);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/stories/:storyId/reply', authenticateToken, (req: any, res) => {
  try {
    const story = readJsonFile(path.join(STORIES_DIR, `${req.params.storyId}.json`));
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const chats = getAllFiles(CHATS_DIR);
    let chat = chats.find(c => 
      c.type === 'direct' && 
      c.participants.includes(req.user.id) && 
      c.participants.includes(story.authorId)
    );

    if (!chat) {
      const chatId = uuidv4();
      chat = {
        id: chatId,
        type: 'direct',
        participants: [req.user.id, story.authorId],
        updatedAt: new Date().toISOString()
      };
      writeJsonFile(path.join(CHATS_DIR, `${chatId}.json`), chat);
    }

    const messageId = uuidv4();
    const message = {
      id: messageId,
      chatId: chat.id,
      senderId: req.user.id,
      content: `Replied to your story: ${req.body.content}`,
      media: [{ url: story.media, type: story.mediaType }],
      isOneTimeView: false,
      seenBy: [req.user.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    writeJsonFile(path.join(MESSAGES_DIR, `${messageId}.json`), message);
    
    chat.lastMessage = messageId;
    chat.updatedAt = new Date().toISOString();
    writeJsonFile(path.join(CHATS_DIR, `${chat.id}.json`), chat);
    
    res.status(201).json(message);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});


// Update post
app.put('/api/posts/:postId', authenticateToken, async (req: any, res: any) => {
  try {
    const { postId } = req.params;
    const { content, media, audience, isAnonymous } = req.body;
    const postPath = path.join(POSTS_DIR, `${postId}.json`);
    const post = readJsonFile(postPath);

    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Check authorization
    if (post.authorUid !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedPost = {
      ...post,
      content: content || post.content,
      media: media || post.media,
      audience: audience || post.audience,
      isAnonymous: isAnonymous !== undefined ? isAnonymous : post.isAnonymous,
      updatedAt: new Date().toISOString()
    };

    writeJsonFile(postPath, updatedPost);
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
app.delete('/api/posts/:postId', authenticateToken, async (req: any, res: any) => {
  try {
    const { postId } = req.params;
    const postPath = path.join(POSTS_DIR, `${postId}.json`);
    const post = readJsonFile(postPath);

    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Check authorization
    if (post.authorUid !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    fs.unlinkSync(postPath);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Poll voting
app.post('/api/posts/:postId/poll/vote', authenticateToken, (req: any, res) => {
  try {
    const { optionId } = req.body;
    const postPath = path.join(POSTS_DIR, `${req.params.postId}.json`);
    const post = readJsonFile(postPath);
    if (!post || !post.pollData) return res.status(404).json({ message: 'Poll not found' });

    // Check if user already voted
    const alreadyVoted = post.pollData.options.some((opt: any) => opt.votes.includes(req.user.id));
    if (alreadyVoted) return res.status(400).json({ message: 'Already voted' });

    const option = post.pollData.options.find((opt: any) => opt.id === optionId);
    if (!option) return res.status(404).json({ message: 'Option not found' });

    option.votes.push(req.user.id);
    post.pollData.totalVotes = (post.pollData.totalVotes || 0) + 1;
    
    writeJsonFile(postPath, post);
    res.json(post);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Comment reactions
app.post('/api/posts/:postId/comments/:commentId/react', authenticateToken, (req: any, res) => {
  try {
    const postPath = path.join(POSTS_DIR, `${req.params.postId}.json`);
    const post = readJsonFile(postPath);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments?.find((c: any) => c.id === req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (!comment.reactions) comment.reactions = [];
    
    const existingIndex = comment.reactions.findIndex((r: any) => r.userId === req.user.id);
    if (existingIndex > -1) {
      if (comment.reactions[existingIndex].type === req.body.type) {
        comment.reactions.splice(existingIndex, 1);
      } else {
        comment.reactions[existingIndex].type = req.body.type;
      }
    } else {
      comment.reactions.push({ userId: req.user.id, type: req.body.type });
    }
    
    comment.reactionCount = comment.reactions.length;
    writeJsonFile(postPath, post);
    res.json(post);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// View reactors
app.get('/api/posts/:postId/reactions', authenticateToken, (req: any, res) => {
  try {
    const post = readJsonFile(path.join(POSTS_DIR, `${req.params.postId}.json`));
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const reactors = (post.reactions || []).map((r: any) => {
      const u = readJsonFile(path.join(USERS_DIR, `${r.userId}.json`));
      return u ? { id: u.id, name: `${u.firstName} ${u.lastName}`, username: u.username, photo: u.profilePhoto, type: r.type } : null;
    }).filter(Boolean);
    
    res.json(reactors);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Verification request
app.post('/api/user/verification-request', authenticateToken, (req: any, res) => {
  try {
    const userPath = path.join(USERS_DIR, `${req.user.id}.json`);
    const user = readJsonFile(userPath);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.verificationRequest = {
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    
    writeJsonFile(userPath, user);
    res.json({ success: true, message: 'Verification request sent' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Privacy settings
app.put('/api/user/privacy', authenticateToken, (req: any, res) => {
  try {
    const userPath = path.join(USERS_DIR, `${req.user.id}.json`);
    const user = readJsonFile(userPath);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.isPrivate !== undefined) user.isPrivate = req.body.isPrivate;
    if (req.body.twoFactorEnabled !== undefined) user.twoFactorEnabled = req.body.twoFactorEnabled;
    
    writeJsonFile(userPath, user);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Add comment
app.post('/api/posts/:postId/comments', authenticateToken, (req: any, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const postPath = path.join(POSTS_DIR, `${postId}.json`);
    const post = readJsonFile(postPath);

    if (!post) return res.status(404).json({ error: 'Post not found' });

    const newComment = {
      id: uuidv4(),
      authorId: req.user.id,
      authorName: `${req.user.firstName} ${req.user.lastName}`,
      authorPhoto: req.user.profilePhoto,
      content,
      reactions: [],
      reactionCount: 0,
      createdAt: new Date().toISOString()
    };

    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    post.commentCount = (post.commentCount || 0) + 1;

    writeJsonFile(postPath, post);
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
