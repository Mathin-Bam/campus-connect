import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { API_URL } from '../config/api'

export function useChat(threadId: string, onMessageReceived: (msg: any) => void) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = io(API_URL)
    socketRef.current = socket

    socket.emit('join_chat', { threadId })

    socket.on('message_received', (data) => {
      if (data.threadId === threadId) {
        onMessageReceived(data.message)
      }
    })

    socket.on('message_read_receipt', (data) => {
      // Handle read receipts if needed
      console.log('Message read receipt:', data)
    })

    socket.on('typing_indicator', (data) => {
      // Handle typing indicators if needed
      console.log('User typing:', data)
    })

    socket.on('message_error', (data) => {
      console.error('Message error:', data.error)
    })

    return () => {
      socket.disconnect()
    }
  }, [threadId, onMessageReceived])

  const sendMessage = useCallback((content: string, senderId: string) => {
    socketRef.current?.emit('send_message', { threadId, content, senderId })
  }, [threadId])

  const sendTyping = useCallback((userId: string) => {
    socketRef.current?.emit('user_typing', { threadId, userId })
  }, [threadId])

  const markMessageAsRead = useCallback((messageId: string) => {
    socketRef.current?.emit('message_read', { threadId, messageId })
  }, [threadId])

  return { sendMessage, sendTyping, markMessageAsRead }
}
