import express, { Router } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminAuth } from '../config/firebase';

const router = Router() as express.Router;

// POST /api/chat/initiate
router.post('/initiate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user?.userId;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot initiate chat with yourself' });
    }

    // Check if thread already exists (either direction)
    const existingThread = await prisma.chatThread.findFirst({
      where: {
        OR: [
          { participant1Id: currentUserId, participant2Id: targetUserId },
          { participant1Id: targetUserId, participant2Id: currentUserId },
        ],
      },
    });

    if (existingThread) {
      return res.json({ thread: existingThread });
    }

    // Create new thread
    const thread = await prisma.chatThread.create({
      data: {
        participant1Id: currentUserId,
        participant2Id: targetUserId,
      },
    });

    res.json({ thread });
  } catch (error) {
    console.error('Error initiating chat:', error);
    res.status(500).json({ error: 'Failed to initiate chat' });
  }
});

// GET /api/chat/threads
router.get('/threads', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user?.userId;

    const threads = await prisma.chatThread.findMany({
      where: {
        OR: [
          { participant1Id: currentUserId },
          { participant2Id: currentUserId },
        ],
      },
      include: {
        participant1: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        participant2: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const formattedThreads = threads.map(thread => {
      const otherParticipant = thread.participant1Id === currentUserId 
        ? thread.participant2 
        : thread.participant1;
      
      const lastMessage = thread.messages[0];

      return {
        id: thread.id,
        participant1Id: thread.participant1Id,
        participant2Id: thread.participant2Id,
        lastMessageAt: thread.lastMessageAt,
        createdAt: thread.createdAt,
        otherUser: otherParticipant,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
        } : null,
      };
    });

    res.json({ threads: formattedThreads });
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

// GET /api/chat/messages/:threadId
router.get('/messages/:threadId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { threadId } = req.params;
    const currentUserId = req.user?.userId;

    // Verify user is a participant in the thread
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        OR: [
          { participant1Id: currentUserId },
          { participant2Id: currentUserId },
        ],
      },
    });

    if (!thread) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await prisma.message.findMany({
      where: { threadId },
      include: {
        sender: {
          select: { id: true, displayName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/chat/messages/:threadId
router.post('/messages/:threadId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user?.userId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user is a participant in the thread
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        OR: [
          { participant1Id: currentUserId },
          { participant2Id: currentUserId },
        ],
      },
    });

    if (!thread) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: currentUserId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, displayName: true },
        },
      },
    });

    // Update thread's lastMessageAt
    await prisma.chatThread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });

    // Emit Socket.io event if available
    const io = req.app.get('io');
    if (io) {
      io.to(`thread_${threadId}`).emit('message_received', {
        threadId,
        message: {
          id: message.id,
          senderId: message.senderId,
          senderDisplayName: message.sender.displayName,
          content: message.content,
          createdAt: message.createdAt,
          readAt: null,
        },
      });
    }

    // Send push notification to recipient
    try {
      const recipientId = thread.participant1Id === currentUserId 
        ? thread.participant2Id 
        : thread.participant1Id;

      const recipient = await prisma.user.findFirst({
        where: {
          id: recipientId,
          NOT: { fcmToken: null },
        },
        select: { fcmToken: true, displayName: true },
      });

      if (recipient?.fcmToken) {
        await adminAuth.messaging().send({
          token: recipient.fcmToken,
          notification: {
            title: message.sender.displayName,
            body: content.length > 60 ? content.slice(0, 57) + '...' : content,
          },
          data: { threadId, type: 'new_message' },
          apns: { payload: { aps: { badge: 1, sound: 'default' } } },
        });
      }
    } catch (pushError) {
      console.error('Failed to send push notification:', pushError);
      // Don't fail the request if push notification fails
    }

    res.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
