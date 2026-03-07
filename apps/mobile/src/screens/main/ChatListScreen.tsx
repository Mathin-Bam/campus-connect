import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '../../config/apiClient';

type Thread = {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string;
  createdAt: string;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
};

type RootStackParamList = {
  MessageScreen: {
    threadId: string;
    otherUser: {
      id: string;
      displayName: string;
      avatarUrl?: string;
    };
  };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function ChatListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      const load = async () => {
        try {
          const data = await apiFetch('/api/chat/threads');
          if (active) setThreads(Array.isArray(data.threads) ? data.threads : Array.isArray(data) ? data : []);
        } catch (e) {
          console.log('Chat threads error:', e);
        } finally {
          if (active) setLoading(false);
        }
      };
      load();
      return () => { active = false; };
    }, [])
  );

  const handleRefresh = useCallback(() => {
    setLoading(true);
    const load = async () => {
      try {
        const data = await apiFetch('/api/chat/threads');
        setThreads(Array.isArray(data.threads) ? data.threads : Array.isArray(data) ? data : []);
      } catch (e) {
        console.log('Chat threads error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleThreadPress = useCallback((thread: Thread) => {
    navigation.navigate('MessageScreen', {
      threadId: thread.id,
      otherUser: thread.otherUser,
    });
  }, [navigation]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderThreadItem = ({ item }: { item: Thread }) => (
    <TouchableOpacity
      style={s.threadCard}
      onPress={() => handleThreadPress(item)}
      activeOpacity={0.8}
    >
      <View style={s.avatarContainer}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {getInitials(item.otherUser.displayName)}
          </Text>
        </View>
        {/* Presence dot - would need to check user's current status */}
        <View style={s.presenceDot} />
      </View>
      
      <View style={s.threadContent}>
        <View style={s.threadHeader}>
          <Text style={s.displayName}>{item.otherUser.displayName}</Text>
          <Text style={s.timestamp}>
            {item.lastMessage ? formatTimeAgo(item.lastMessage.createdAt) : formatTimeAgo(item.createdAt)}
          </Text>
        </View>
        
        <Text style={s.lastMessage} numberOfLines={1}>
          {item.lastMessage?.content || 'No messages yet'}
        </Text>
      </View>
      
      {/* Unread badge - would need to implement unread count logic */}
      <View style={s.unreadBadge}>
        <Text style={s.unreadCount}>0</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSkeletonItem = () => (
    <View style={s.threadCard}>
      <View style={[s.avatar, s.skeleton]} />
      <View style={s.threadContent}>
        <View style={[s.skeleton, s.skeletonHeader]} />
        <View style={[s.skeleton, s.skeletonMessage]} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Messages 💬</Text>
          <Text style={s.headerSubtitle}>Your conversations</Text>
        </View>
        <View style={s.content}>
          {[1, 2, 3].map(i => (
            <View key={i} style={s.skeletonItem}>
              <View style={[s.avatar, s.skeleton]} />
              <View style={s.threadContent}>
                <View style={[s.skeleton, s.skeletonHeader]} />
                <View style={[s.skeleton, s.skeletonMessage]} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Messages 💬</Text>
        <Text style={s.headerSubtitle}>Your conversations</Text>
      </View>
      
      <FlatList
        data={threads}
        renderItem={renderThreadItem}
        keyExtractor={item => item.id}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor="#1B6CA8"
          />
        }
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>💬</Text>
            <Text style={s.emptyTitle}>No conversations yet</Text>
            <Text style={s.emptySubtitle}>Say hi to someone from the feed</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D2137',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0D2137',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(174,214,241,0.6)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2F45',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(27,108,168,0.2)',
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1B6CA8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  presenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#27AE60',
    borderWidth: 2,
    borderColor: '#0D2137',
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(174,214,241,0.5)',
  },
  lastMessage: {
    fontSize: 14,
    color: 'rgba(174,214,241,0.7)',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1B6CA8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(174,214,241,0.5)',
    textAlign: 'center',
  },
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2F45',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  skeletonHeader: {
    height: 16,
    width: 120,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonMessage: {
    height: 14,
    width: 180,
    borderRadius: 4,
  },
});
