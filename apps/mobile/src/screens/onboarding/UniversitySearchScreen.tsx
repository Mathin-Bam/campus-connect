import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { API_URL } from '../../config/api';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'UniversitySearch'>;
};

const MOCK_UNIVERSITIES = [
  { id: '1', name: 'MIT', emailDomain: 'mit.edu', city: 'Cambridge, MA', country: 'USA', emoji: '🔬' },
  { id: '2', name: 'Stanford University', emailDomain: 'stanford.edu', city: 'Stanford, CA', country: 'USA', emoji: '🌲' },
  { id: '3', name: 'UCLA', emailDomain: 'ucla.edu', city: 'Los Angeles, CA', country: 'USA', emoji: '🐻' },
  { id: '4', name: 'University of Oxford', emailDomain: 'ox.ac.uk', city: 'Oxford', country: 'UK', emoji: '📚' },
  { id: '5', name: 'University of Cambridge', emailDomain: 'cam.ac.uk', city: 'Cambridge', country: 'UK', emoji: '🎓' },
  { id: '6', name: 'Harvard University', emailDomain: 'harvard.edu', city: 'Cambridge, MA', country: 'USA', emoji: '🏛️' },
  { id: '7', name: 'UC Berkeley', emailDomain: 'berkeley.edu', city: 'Berkeley, CA', country: 'USA', emoji: '⚡' },
  { id: '8', name: 'NYU', emailDomain: 'nyu.edu', city: 'New York, NY', country: 'USA', emoji: '🗽' },
];

export default function UniversitySearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const searchUniversities = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUniversities([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/universities?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setUniversities(data);
    } catch (error) {
      console.error('University search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUniversities(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchUniversities]);

  const handleSelect = async (uni: typeof MOCK_UNIVERSITIES[0]) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('OTP', { university: uni });
  };

  const renderItem = ({ item, index }: { item: typeof universities[0]; index: number }) => (
    <UniCard
      item={item}
      index={index}
      onPress={() => handleSelect(item)}
    />
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#040B14', '#0D2137', '#0F2D4A']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          style={s.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View
            style={[
              s.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Header */}
            <View style={s.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={s.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={s.backArrow}>←</Text>
              </TouchableOpacity>
              <View style={s.headerSteps}>
                <View style={[s.step, s.stepActive]} />
                <View style={s.step} />
                <View style={s.step} />
              </View>
            </View>

            {/* Title */}
            <View style={s.titleSection}>
              <Text style={s.titleEmoji}>🎓</Text>
              <Text style={s.title}>Find your university</Text>
              <Text style={s.subtitle}>
                Search by name or .edu domain
              </Text>
            </View>

            {/* Search box */}
            <View style={s.searchWrap}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={s.searchInput}
                placeholder="e.g. MIT, Stanford, oxford..."
                placeholderTextColor="rgba(174,214,241,0.4)"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={s.clearBtn}>
                  <Text style={s.clearText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Loading indicator */}
            {loading && (
              <View style={s.loadingContainer}>
                <ActivityIndicator size="large" color="#1B6CA8" />
                <Text style={s.loadingText}>Searching universities...</Text>
              </View>
            )}

            {/* Results count */}
            {!loading && (
              <Text style={s.resultsCount}>
                {universities.length > 0
                  ? `${universities.length} result${universities.length !== 1 ? 's' : ''} found`
                  : 'No universities found'}
              </Text>
            )}

            {/* List */}
            {!loading && (
              <FlatList
                data={universities}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={s.emptyState}>
                    <Text style={s.emptyEmoji}>🔭</Text>
                    <Text style={s.emptyTitle}>No universities found</Text>
                    <Text style={s.emptySubtitle}>
                      Try a different search term
                    </Text>
                  </View>
                }
                contentContainerStyle={s.listContent}
              />
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Animated card component
function UniCard({
  item,
  index,
  onPress,
}: {
  item: typeof MOCK_UNIVERSITIES[0];
  index: number;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const entryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const pressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 60,
    }).start();

  const pressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
    }).start();

  return (
    <Animated.View
      style={{
        opacity: entryAnim,
        transform: [
          { scale: scaleAnim },
          {
            translateY: entryAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        activeOpacity={1}
      >
        <View style={s.uniCard}>
          <View style={s.uniCardLeft}>
            <View style={s.uniEmojiWrap}>
              <Text style={s.uniEmoji}>{item.emoji}</Text>
            </View>
          </View>
          <View style={s.uniCardMid}>
            <Text style={s.uniName}>{item.name}</Text>
            <View style={s.uniMeta}>
              <Text style={s.uniCity}>📍 {item.city}</Text>
              <View style={s.uniDomainPill}>
                <Text style={s.uniDomain}>@{item.emailDomain}</Text>
              </View>
            </View>
          </View>
          <Text style={s.uniArrow}>›</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#040B14' },
  safe: { flex: 1 },
  kav: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(27,108,168,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(27,108,168,0.25)',
  },
  backArrow: { fontSize: 20, color: '#FFFFFF', lineHeight: 24 },
  headerSteps: {
    flexDirection: 'row',
    gap: 6,
  },
  step: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(174,214,241,0.2)',
  },
  stepActive: {
    backgroundColor: '#1B6CA8',
    width: 32,
  },
  titleSection: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  titleEmoji: { fontSize: 32, marginBottom: 10 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(174,214,241,0.7)',
    marginTop: 6,
    lineHeight: 22,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27,108,168,0.12)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(27,108,168,0.3)',
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  resultsCount: {
    fontSize: 12,
    color: 'rgba(174,214,241,0.5)',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  listContent: { paddingBottom: 32 },
  uniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27,108,168,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(27,108,168,0.18)',
    padding: 16,
    marginBottom: 10,
  },
  uniCardLeft: { marginRight: 14 },
  uniEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(27,108,168,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(27,108,168,0.3)',
  },
  uniEmoji: { fontSize: 22 },
  uniCardMid: { flex: 1 },
  uniName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  uniMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  uniCity: { fontSize: 12, color: 'rgba(174,214,241,0.6)' },
  uniDomainPill: {
    backgroundColor: 'rgba(27,108,168,0.25)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(27,108,168,0.4)',
  },
  uniDomain: { fontSize: 11, color: '#AED6F1', fontWeight: '600' },
  uniArrow: { fontSize: 24, color: 'rgba(174,214,241,0.4)', marginLeft: 8 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(174,214,241,0.5)',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(174,214,241,0.7)',
    marginTop: 12,
  },
});
