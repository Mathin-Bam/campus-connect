import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { io, Socket } from 'socket.io-client';
import StatusBottomSheet from '../../components/StatusBottomSheet';
import ProfileDropdown from '../../components/ProfileDropdown';
import { API_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../config/apiClient';

const FILTERS = [
  { id: 'all', label: 'All', emoji: '⚡' },
  { id: 'study', label: 'Study', emoji: '📚' },
  { id: 'gym', label: 'Gym', emoji: '💪' },
  { id: 'food', label: 'Food', emoji: '🍔' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'social', label: 'Social', emoji: '🎉' },
];

export default function ActivityFeedScreen({ navigation }: any) {
  const { idToken, user: currentUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeCount, setActiveCount] = useState(6);
  const [statusVisible, setStatusVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [feedItems, setFeedItems] = useState<any[]>([
    {
      id: '1',
      name: 'Omar K.',
      initials: 'OK',
      activity: 'Studying',
      activityId: 'study',
      emoji: '📚',
      location: 'Main Library',
      message: 'anyone want to study algorithms together?',
      minutesAgo: 2,
      color: '#3498DB',
    },
    {
      id: '2',
      name: 'Sarah M.',
      initials: 'SM',
      activity: 'At the Gym',
      activityId: 'gym',
      emoji: '💪',
      location: 'Student Rec Center',
      message: 'leg day 🦵 anyone else here?',
      minutesAgo: 5,
      color: '#8E44AD',
    },
    {
      id: '3',
      name: 'James L.',
      initials: 'JL',
      activity: 'Getting Food',
      activityId: 'food',
      emoji: '🍔',
      location: 'Campus Dining Hall',
      message: 'pizza is back on the menu today!',
      minutesAgo: 8,
      color: '#F39C12',
    },
    {
      id: '4',
      name: 'Aisha R.',
      initials: 'AR',
      activity: 'Playing Sports',
      activityId: 'sports',
      emoji: '⚽',
      location: 'North Field',
      message: 'pickup football game, need 2 more people',
      minutesAgo: 12,
      color: '#E74C3C',
    },
    {
      id: '5',
      name: 'Dev P.',
      initials: 'DP',
      activity: 'Gaming',
      activityId: 'gaming',
      emoji: '🎮',
      location: 'Student Lounge',
      message: 'smash bros tournament starting soon',
      minutesAgo: 15,
      color: '#E67E22',
    },
    {
      id: '6',
      name: 'Lena W.',
      initials: 'LW',
      activity: 'Being Social',
      activityId: 'social',
      emoji: '🎉',
      location: 'Campus Quad',
      message: 'hanging outside, weather is perfect rn',
      minutesAgo: 18,
      color: '#1ABC9C',
    },
  ]);

  const fetchActiveCount = async () => {
  try {
    const data = await apiFetch('/api/activity/active-count');
    setActiveCount(6 + (data.count || 0)); // 6 mock + real active users
  } catch {
    setActiveCount(6); // fallback to mock baseline
  }
};

// Fetch feed from API
const fetchFeed = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/activity/feed');
      const realItems = Array.isArray(data) ? data : Array.isArray(data?.feed) ? data.feed : [];
      console.log('REAL API ITEMS:', realItems.length);
      // Real items first, mock items after — filtered so mock doesn't duplicate real users
      const combined = [...realItems, ...feedItems];
      setFeedItems(combined);
      fetchActiveCount(); // Update count after fetching feed
    } catch (e: any) {
      console.log('Feed fetch error:', e.message);
      // Keep existing mock data on error
    } finally {
      setLoading(false);
    }
  };

  // Socket.io connection for real-time updates
  useEffect(() => {
    if (!idToken || !currentUser?.universityId) return;

    const socket = io('https://campus-connect-api-kq3u.onrender.com');
    
    socket.emit('join_university', { universityId: currentUser.universityId });
    
    socket.on('status_updated', (update) => {
      setFeedItems(prev => {
        const exists = prev.find(i => i.userId === update.userId);
        if (exists) {
          return prev.map(i => i.userId === update.userId ? { ...i, ...update } : i);
        }
        return [update, ...prev];
      });
    });

    socket.on('status_cleared', ({ userId }) => {
      setFeedItems(prev => prev.filter(i => i.userId !== userId));
    });

    socket.on('active_count', (data: { count: number }) => {
      setActiveCount(6 + data.count); // 6 mock + real
    });

    socket.on('new_status', () => {
      fetchFeed(); // auto-refresh feed when anyone posts
    });

    return () => {
      socket.disconnect();
    };
  }, [idToken, currentUser]);

  useEffect(() => {
    fetchFeed();
    fetchActiveCount();
  }, [idToken]);

  const handleSayHi = async (targetUserId: string, targetName: string) => {
  if (!targetUserId) return;
  try {
    const data = await apiFetch('/api/chat/initiate', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
    navigation.navigate('MessageScreen', {
      threadId: data.threadId || data.thread?.id,
      otherUser: { id: targetUserId, displayName: targetName },
    });
  } catch (e: any) {
    Alert.alert('Error', e.message);
  }
};

  const headerAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const fabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    Animated.spring(fabAnim, {
      toValue: 1,
      tension: 50,
      friction: 6,
      delay: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const filtered = activeFilter === 'all'
    ? feedItems
    : feedItems.filter(item => item.activityId === activeFilter);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1200));
    setRefreshing(false);
  };

  const handleFilterPress = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(id);
  };

  const handleFABPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(fabScale, { toValue: 0.9, useNativeDriver: true, speed: 60 }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
    setStatusVisible(true);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header gradient */}
      <LinearGradient
        colors={['#040B14', '#0D2137']}
        style={s.headerBg}
      />

      <SafeAreaView style={s.safe}>
        {/* Header */}
        <Animated.View style={[s.header, { opacity: headerAnim }]}>
          <View>
            <Text style={s.greeting}>Hey there 👋</Text>
            <Text style={s.subGreeting}>
              <Text style={s.liveCount}>● {activeCount !== null ? activeCount : '—'} people</Text>
              {' '}active on campus
            </Text>
          </View>
          <TouchableOpacity style={s.avatarBtn} onPress={() => setShowProfile(true)}>
            <LinearGradient colors={['#1B6CA8', '#0D3060']} style={s.headerAvatar}>
              <Text style={s.headerAvatarText}>{(currentUser?.displayName || 'MA')[0]}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterScroll}
          contentContainerStyle={s.filterContent}
        >
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => handleFilterPress(filter.id)}
              style={[
                s.filterChip,
                activeFilter === filter.id && s.filterChipActive,
              ]}
            >
              <Text style={s.filterEmoji}>{filter.emoji}</Text>
              <Text style={[
                s.filterLabel,
                activeFilter === filter.id && s.filterLabelActive,
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Feed */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => {
            console.log('FEED ITEM SHAPE:', JSON.stringify(item).slice(0, 300));
            return <ActivityCard item={item} index={index} onSayHi={handleSayHi} />;
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1B6CA8"
              colors={['#1B6CA8']}
            />
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>👀</Text>
              <Text style={s.emptyTitle}>Quiet out there...</Text>
              <Text style={s.emptySubtitle}>
                Be the first to set your status!
              </Text>
            </View>
          }
        />
      </SafeAreaView>

      {/* Profile Dropdown */}
      <ProfileDropdown
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        navigation={navigation}
      />

      {/* FAB — Set Status */}
      <Animated.View
        style={[
          s.fabWrap,
          {
            transform: [
              { scale: Animated.multiply(fabScale, fabAnim) },
            ],
          },
        ]}
      >
        <TouchableOpacity onPress={handleFABPress} activeOpacity={0.9}>
          <LinearGradient
            colors={['#1B6CA8', '#0D3060']}
            style={s.fab}
          >
            <Text style={s.fabEmoji}>⚡</Text>
            <Text style={s.fabText}>What are you up to?</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Status Sheet */}
      <StatusBottomSheet
        isVisible={statusVisible}
        onClose={() => setStatusVisible(false)}
        onPosted={() => {
          setStatusVisible(false);
          fetchFeed(); // This will also refresh active count
        }}
      />
    </View>
  );
}

function ActivityCard({ item, index, onSayHi }: { 
  item: any; 
  index: number; 
  onSayHi: (targetUserId: string, displayName: string) => Promise<void>;
}) {
  const entryAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();

    if (item.minutesAgo <= 5) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, speed: 60 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
  };

  const timeLabel = item.minutesAgo === 0
    ? 'just now'
    : item.minutesAgo < 60
    ? `${item.minutesAgo}m ago` 
    : `${Math.floor(item.minutesAgo / 60)}h ago`;

  return (
    <Animated.View
      style={{
        opacity: entryAnim,
        transform: [
          { scale: scaleAnim },
          {
            translateY: entryAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [24, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={1}>
        <View style={s.card}>
          {/* Left color bar */}
          <View style={[s.cardBar, { backgroundColor: item.color }]} />

          <View style={s.cardInner}>
            {/* Top row */}
            <View style={s.cardTop}>
              <View style={s.cardAvatarWrap}>
                <LinearGradient
                  colors={[item.color + '88', item.color + '44']}
                  style={s.cardAvatar}
                >
                  <Text style={s.cardAvatarText}>{item.initials}</Text>
                </LinearGradient>
                {item.minutesAgo <= 5 && (
                  <Animated.View
                    style={[s.onlineDot, { transform: [{ scale: pulseAnim }] }]}
                  />
                )}
              </View>
              <View style={s.cardMeta}>
                <Text style={s.cardName}>{item.name}</Text>
                <View style={s.cardActivityRow}>
                  <Text style={s.cardActivityEmoji}>{item.emoji}</Text>
                  <Text style={[s.cardActivity, { color: item.color }]}>
                    {item.activity}
                  </Text>
                </View>
              </View>
              <Text style={s.cardTime}>{timeLabel}</Text>
            </View>

            {/* Location */}
            <View style={s.cardLocationRow}>
              <Text style={s.cardLocationPin}>📍</Text>
              <Text style={s.cardLocation}>{item.location}</Text>
            </View>

            {/* Message */}
            {item.message && (
              <View style={s.cardMessageWrap}>
                <Text style={s.cardMessage}>"{item.message}"</Text>
              </View>
            )}

            {/* Join button */}
            <View style={s.cardFooter}>
              {item.userId && (
                <TouchableOpacity 
                  style={[s.joinBtn, { borderColor: item.color + '66' }]}
                  onPress={() => onSayHi(
                    item.user?.id || item.userId || 'unknown', 
                    item.user?.displayName || item.name || 'Unknown'
                  )}
                >
                  <Text style={[s.joinBtnText, { color: item.color }]}>
                    Say hi 👋
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#040B14' },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subGreeting: {
    fontSize: 13,
    color: 'rgba(174,214,241,0.6)',
    marginTop: 2,
  },
  liveCount: {
    color: '#27AE60',
    fontWeight: '700',
  },
  avatarBtn: { padding: 2 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterScroll: { maxHeight: 44 },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(27,108,168,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(27,108,168,0.2)',
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: '#1B6CA8',
    borderColor: '#1B6CA8',
  },
  filterEmoji: { fontSize: 13 },
  filterLabel: {
    fontSize: 13,
    color: 'rgba(174,214,241,0.6)',
    fontWeight: '500',
  },
  filterLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(27,108,168,0.07)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(27,108,168,0.15)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardBar: {
    width: 4,
    borderRadius: 4,
  },
  cardInner: { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardAvatarWrap: {
    marginRight: 12,
    position: 'relative',
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#27AE60',
    borderWidth: 2,
    borderColor: '#040B14',
  },
  cardMeta: { flex: 1 },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  cardActivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardActivityEmoji: { fontSize: 12 },
  cardActivity: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardTime: {
    fontSize: 12,
    color: 'rgba(174,214,241,0.4)',
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  cardLocationPin: { fontSize: 11 },
  cardLocation: {
    fontSize: 12,
    color: 'rgba(174,214,241,0.5)',
  },
  cardMessageWrap: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  cardMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
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
  fabWrap: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
  },
  fab: {
    flexDirection: 'row',
    height: 58,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1B6CA8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fabEmoji: { fontSize: 18 },
  fabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
