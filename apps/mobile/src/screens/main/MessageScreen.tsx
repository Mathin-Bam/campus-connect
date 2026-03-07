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
import { API_URL } from '../../config/api';
import { useChat } from '../../hooks/useChat';

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
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { sendMessage, sendTyping, markMessageAsRead } = useChat(
    threadId,
    (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    }
  );

  useEffect(() => {
    // Get user token and ID from storage (you'll need to implement this)
    const getAuthData = async () => {
      // For now, using placeholders - you should get these from your auth state
      const token = 'your_firebase_jwt_token'; // Replace with actual token retrieval
      const userId = 'current_user_id'; // Replace with actual user ID retrieval
      setUserToken(token);
      setCurrentUserId(userId);
    };
    getAuthData();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: otherUser.displayName,
      headerStyle: { backgroundColor: '#0A1929' },
      headerTintColor: '#FFFFFF',
    });
  }, [navigation, otherUser.displayName]);

  const fetchMessages = useCallback(async () => {
    if (!userToken) return;
    
    try {
      const response = await fetch(`${API_URL}/api/chat/messages/${threadId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await response.json();
      setMessages(data.messages || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [userToken, threadId, scrollToBottom]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !currentUserId || sending) return;
    
    const messageText = inputText.trim();
    setInputText('');
    setSending(true);
    
    try {
      // Send via socket
      sendMessage(messageText, currentUserId);
      
      // Also send via REST as fallback
      const response = await fetch(`${API_URL}/api/chat/messages/${threadId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: messageText }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore input if failed
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  }, [inputText, currentUserId, sending, sendMessage, userToken, threadId]);

  const handleTyping = useCallback((text: string) => {
    setInputText(text);
    
    if (currentUserId) {
      sendTyping(currentUserId);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  }, [currentUserId, sendTyping]);

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

  const isMyMessage = (message: Message) => message.senderId === currentUserId;

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
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
    if (!isTyping) return null;
    
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

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#1B6CA8" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
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
              value={inputText}
              onChangeText={handleTyping}
              placeholder="Message..."
              placeholderTextColor="rgba(174,214,241,0.5)"
              multiline
              maxLength={500}
              textAlignVertical="center"
            />
            <TouchableOpacity
              style={[s.sendButton, !inputText.trim() && s.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
