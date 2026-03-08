import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiFetch } from '../../config/apiClient';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

type Message = {
  id: string;
  senderId: string;
  senderDisplayName: string;
  content: string;
  createdAt: string;
  readAt?: string;
};

type RouteParams = {
  threadId: string;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
};

type RootStackParamList = {
  MessageScreen: RouteParams;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function MessageScreen() {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { threadId, otherUser } = route.params as RouteParams;
  const { idToken, user } = useAuth();
  
  if (!otherUser) {
    return (
      <View style={s.loadingContainer}>
        <Text style={s.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch(`/api/chat/messages/${threadId}`);
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch (e) {
        console.log('Messages error:', e);
      }
    };
    load();
  }, [threadId]);

  useEffect(() => {
    if (!idToken) return;
    const socket = io('https://campus-connect-api-kq3u.onrender.com', {
      auth: { token: idToken },
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.emit('join_chat', threadId);
    socket.on('message_received', (msg: any) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => {
      socket.disconnect();
    };
  }, [threadId, idToken]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      const data = await apiFetch(`/api/chat/messages/${threadId}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      setMessages(prev => [...prev, data.message || data]);
    } catch (e) {
      console.log('Send error:', e);
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isMyMessage = (message: any) => message.senderId === user?.id;

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isMine = isMyMessage(item);
    const showReadReceipt = isMine && index === messages.length - 1;
    
    return (
      <View style={[s.messageContainer, isMine && s.myMessageContainer]}>
        <View style={[s.messageBubble, isMine && s.myMessage]}>
          <Text style={[s.messageText, isMine && s.myMessageText]}>
            {item.content}
          </Text>
          <Text style={[s.timestamp, isMine && s.myTimestamp]}>
            {formatTime(item.createdAt)}
          </Text>
          {showReadReceipt && (
            <Text style={s.readReceipt}>
              {item.readAt ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    return (
      <View style={s.messageContainer}>
        <View style={s.messageBubble}>
          <View style={s.typingIndicator}>
            <View style={[s.typingDot, { backgroundColor: '#FFFFFF' }]} />
            <View style={[s.typingDot, { backgroundColor: '#FFFFFF' }]} />
            <View style={[s.typingDot, { backgroundColor: '#FFFFFF' }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {(otherUser?.displayName ?? 'U')[0]?.toUpperCase() ?? ''}
            </Text>
          </View>
          <View>
            <Text style={s.headerName}>{otherUser?.displayName ?? 'Chat'}</Text>
            <Text style={s.headerSub}>Campus Connect</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={s.messagesList}
          contentContainerStyle={s.messagesContainer}
          inverted={false}
          ListFooterComponent={renderTypingIndicator}
        />
        
        {/* Input Area */}
        <View style={s.inputContainer}>
          <View style={s.inputWrapper}>
            <TextInput
              style={s.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Message..."
              placeholderTextColor="rgba(174,214,241,0.5)"
              multiline
              maxLength={500}
              textAlignVertical="center"
            />
            <TouchableOpacity
              style={[s.sendButton, !text.trim() && s.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={s.sendButtonText}>→</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1929',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1B6CA8',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(27,108,168,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D3060',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '70%',
    backgroundColor: '#1A2F45',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: 12,
    paddingHorizontal: 16,
  },
  myMessage: {
    backgroundColor: '#1B6CA8',
    borderRadius: 18,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(174,214,241,0.5)',
    marginTop: 4,
  },
  myTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  readReceipt: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  inputContainer: {
    backgroundColor: '#0A1929',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2F45',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(27,108,168,0.2)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
    paddingHorizontal: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1B6CA8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(27,108,168,0.3)',
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
