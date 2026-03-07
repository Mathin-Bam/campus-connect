import express, { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { auth, messaging } from '../lib/firebase';

const router = Router() as express.Router;

// POST /api/chat/initiate
router.post('/initiate', requireAuth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user?.id;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if thread already exists
    const existingThread = await prisma.chatThread.findFirst({
      where: {
        OR: [
          { participant1Id: currentUserId!, participant2Id: targetUserId },
          { participant1Id: targetUserId, participant2Id: currentUserId! },
        ],
      },
    } as any);

    if (existingThread) {
      return res.json({ thread: existingThread });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, displayName: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create new thread
    const thread = await prisma.chatThread.create({
      data: {
        participant1Id: currentUserId!,
        participant2Id: targetUserId,
      },
    } as any);

    return res.json({ thread });
  } catch (error) {
    console.error('Error initiating chat:', error);
    return res.status(500).json({ error: 'Failed to initiate chat' });
  }
});

// GET /api/chat/threads
router.get('/threads', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const threads = await prisma.chatThread.findMany({
      where: {
        OR: [
          { participant1Id: currentUserId! },
          { participant2Id: currentUserId! },
        ],
      },
      include: {
        participant1: {
          select: { id: true, displayName: true },
        },
        participant2: {
          select: { id: true, displayName: true },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
    } as any);

    const formattedThreads = threads.map((thread: any) => {
      const otherUser = thread.participant1Id === currentUserId ? thread.participant2 : thread.participant1;
      const lastMessage = thread.messages?.[0];
      
      return {
        id: thread.id,
        otherUser: {
          id: otherUser?.id || '',
          displayName: otherUser?.displayName || '',
        },
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt?.toISOString() || '',
        } : null,
        updatedAt: thread.lastMessageAt?.toISOString() || '',
        unreadCount: thread._count || 0,
      };
    });

    return res.json({ threads: formattedThreads });
  } catch (error) {
    console.error('Error fetching threads:', error);
    return res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

// GET /api/chat/messages/:threadId
router.get('/messages/:threadId', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify user is a participant in the thread
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId!,
        OR: [
          { participant1Id: currentUserId! },
          { participant2Id: currentUserId! },
        ],
      },
      include: {
        participant1: {
          select: { id: true, displayName: true },
        },
        participant2: {
          select: { id: true, displayName: true },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    } as any);

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const messages = await prisma.message.findMany({
      where: { 
        threadId: threadId!,
        deletedAt: null 
      },
      orderBy: { createdAt: 'asc' },
    } as any);

    return res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/chat/messages/:threadId
router.post('/messages/:threadId', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user is a participant in the thread
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId!,
        OR: [
          { participant1Id: currentUserId! },
          { participant2Id: currentUserId! },
        ],
      },
    } as any);

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const message = await prisma.message.create({
      data: {
        threadId: threadId!,
        senderId: currentUserId!,
        content: content.trim(),
      },
    } as any);

    // Update thread's lastMessageAt
    await prisma.chatThread.update({
      where: { id: threadId! },
      data: { lastMessageAt: new Date() },
    } as any);

    // Get recipient for push notification
    const recipientId = thread.participant1Id === currentUserId 
      ? thread.participant2Id 
      : thread.participant1Id;

    const recipient = await prisma.user.findFirst({
      where: {
        id: recipientId,
        NOT: { pushToken: null },
      },
      select: { pushToken: true, displayName: true },
    } as any);

    // Send push notification
    if (recipient?.pushToken) {
      try {
        await messaging.send({
          token: recipient.pushToken,
          notification: {
            title: req.user!.displayName,
            body: content.length > 60 ? content.slice(0, 57) + '...' : content,
          },
          data: { threadId: threadId || '', type: 'new_message' },
          apns: { payload: { aps: { badge: 1, sound: 'default' } } },
        });
      } catch (pushError) {
        console.error('Failed to send push notification:', pushError);
        // Don't fail the request if push notification fails
      }
    }

    return res.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
