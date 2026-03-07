import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { API_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'ProfileSetup'>;
  route: RouteProp<RootStackParamList, 'ProfileSetup'>;
};

const ACTIVITIES = [
  { id: 'study', emoji: '📚', label: 'Study' },
  { id: 'gym', emoji: '💪', label: 'Gym' },
  { id: 'food', emoji: '🍔', label: 'Food' },
  { id: 'sports', emoji: '⚽', label: 'Sports' },
  { id: 'gaming', emoji: '🎮', label: 'Gaming' },
  { id: 'social', emoji: '🎉', label: 'Social' },
  { id: 'music', emoji: '🎵', label: 'Music' },
  { id: 'art', emoji: '🎨', label: 'Art' },
  { id: 'movies', emoji: '🎬', label: 'Movies' },
  { id: 'other', emoji: '✨', label: 'Other' },
];

export default function ProfileSetupScreen({ navigation, route }: Props) {
  const { userId, email, token } = route.params;
  const { setAuth } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [avatarInitials, setAvatarInitials] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (displayName.trim()) {
      const parts = displayName.trim().split(' ');
      const initials = parts.length >= 2
        ? `${parts[0]?.[0] || ''}${parts[parts.length - 1]?.[0] || ''}`.toUpperCase()
        : displayName.slice(0, 2).toUpperCase();
      setAvatarInitials(initials);
    } else {
      setAvatarInitials('');
    }
  }, [displayName]);

  const toggleActivity = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleAvatarPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(avatarScale, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 60,
      }),
      Animated.spring(avatarScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
      }),
    ]).start();
    // TODO Sprint 3: expo-image-picker
  };

  const handleLetsGo = async () => {
    if (!displayName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Update profile via API
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      
      // Set auth context - this will automatically navigate to main screens
      setAuth({
        id: userId,
        email,
        displayName: displayName.trim(),
        universityId: data.user?.universityId || '',
        verified: true,
      }, token);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Profile setup error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pressIn = () =>
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 60 }).start();
  const pressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 60 }).start();

  const canProceed = displayName.trim().length >= 2 && selectedActivities.length >= 1;

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
                <View style={s.step} />
                <View style={s.step} />
                <View style={[s.step, s.stepActive]} />
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.scrollContent}
            >
              {/* Title */}
              <Text style={s.titleEmoji}>🚀</Text>
              <Text style={s.title}>Set up your profile</Text>
              <Text style={s.subtitle}>This is how other students will see you</Text>

              {/* Avatar */}
              <View style={s.avatarSection}>
                <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
                  <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.9}>
                    <LinearGradient
                      colors={['#1B6CA8', '#0D3060']}
                      style={s.avatar}
                    >
                      {avatarInitials ? (
                        <Text style={s.avatarInitials}>{avatarInitials}</Text>
                      ) : (
                        <Text style={s.avatarPlaceholder}>👤</Text>
                      )}
                    </LinearGradient>
                    <View style={s.avatarEditBadge}>
                      <Text style={s.avatarEditIcon}>📷</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
                <Text style={s.avatarHint}>Tap to add a photo</Text>
              </View>

              {/* Display name */}
              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>Your name</Text>
                <View style={[s.inputBox, displayName.length > 0 && s.inputBoxActive]}>
                  <TextInput
                    style={s.input}
                    placeholder="How should we call you?"
                    placeholderTextColor="rgba(174,214,241,0.35)"
                    value={displayName}
                    onChangeText={setDisplayName}
                    maxLength={30}
                    returnKeyType="done"
                  />
                </View>
                <Text style={s.charCount}>{displayName.length}/30</Text>
              </View>

              {/* Email display */}
              <View style={s.emailRow}>
                <Text style={s.emailIcon}>✉️</Text>
                <Text style={s.emailText}>{email}</Text>
                <View style={s.verifiedBadge}>
                  <Text style={s.verifiedText}>✓ Verified</Text>
                </View>
              </View>

              {/* Activity preferences */}
              <View style={s.activitiesSection}>
                <Text style={s.activitiesLabel}>What are you into?</Text>
                <Text style={s.activitiesSubtitle}>
                  Pick at least one · helps others find you
                </Text>
                <View style={s.activitiesGrid}>
                  {ACTIVITIES.map(activity => (
                    <ActivityChip
                      key={activity.id}
                      activity={activity}
                      selected={selectedActivities.includes(activity.id)}
                      onPress={() => toggleActivity(activity.id)}
                    />
                  ))}
                </View>
              </View>

              {/* CTA */}
              <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 32, marginBottom: 16 }}>
                <TouchableOpacity
                  onPressIn={pressIn}
                  onPressOut={pressOut}
                  onPress={handleLetsGo}
                  activeOpacity={1}
                  disabled={!canProceed}
                >
                  <LinearGradient
                    colors={canProceed ? ['#FFFFFF', '#D6EAF8'] : ['#1a2a3a', '#1a2a3a']}
                    style={s.primaryBtn}
                  >
                    <Text style={[s.primaryBtnText, !canProceed && s.primaryBtnTextDisabled]}>
                      {canProceed ? "Let's Go 🚀" : 'Fill in your details first'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {!canProceed && (
                <Text style={s.hint}>
                  {displayName.trim().length < 2
                    ? '👆 Enter your name above'
                    : '👆 Select at least one activity'}
                </Text>
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function ActivityChip({
  activity,
  selected,
  onPress,
}: {
  activity: { id: string; emoji: string; label: string };
  selected: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.88,
        useNativeDriver: true,
        speed: 80,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={[s.chip, selected && s.chipSelected]}
      >
        <Text style={s.chipEmoji}>{activity.emoji}</Text>
        <Text style={[s.chipLabel, selected && s.chipLabelSelected]}>
          {activity.label}
        </Text>
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
  headerSteps: { flexDirection: 'row', gap: 6 },
  step: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(174,214,241,0.2)',
  },
  stepActive: { backgroundColor: '#1B6CA8', width: 32 },
  scrollContent: { paddingBottom: 40 },
  titleEmoji: { fontSize: 36, marginBottom: 10, marginTop: 16 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(174,214,241,0.6)',
    lineHeight: 22,
    marginBottom: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(27,108,168,0.5)',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  avatarPlaceholder: { fontSize: 32 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1B6CA8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#040B14',
  },
  avatarEditIcon: { fontSize: 12 },
  avatarHint: {
    fontSize: 12,
    color: 'rgba(174,214,241,0.4)',
    marginTop: 8,
  },
  inputWrap: { marginBottom: 16 },
  inputLabel: {
    fontSize: 13,
    color: 'rgba(174,214,241,0.6)',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  inputBox: {
    backgroundColor: 'rgba(27,108,168,0.1)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(27,108,168,0.25)',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  inputBoxActive: {
    borderColor: '#1B6CA8',
    backgroundColor: 'rgba(27,108,168,0.15)',
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  charCount: {
    fontSize: 11,
    color: 'rgba(174,214,241,0.3)',
    textAlign: 'right',
    marginTop: 4,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27,168,100,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(27,168,100,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
    gap: 8,
  },
  emailIcon: { fontSize: 14 },
  emailText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(174,214,241,0.7)',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(39,174,96,0.2)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(39,174,96,0.3)',
  },
  verifiedText: {
    fontSize: 11,
    color: '#27AE60',
    fontWeight: '700',
  },
  activitiesSection: { marginBottom: 8 },
  activitiesLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activitiesSubtitle: {
    fontSize: 13,
    color: 'rgba(174,214,241,0.5)',
    marginBottom: 16,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(27,108,168,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(27,108,168,0.25)',
    gap: 6,
  },
  chipSelected: {
    backgroundColor: '#0D2137',
    borderColor: '#1B6CA8',
    shadowColor: '#1B6CA8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: {
    fontSize: 14,
    color: 'rgba(174,214,241,0.6)',
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  primaryBtn: {
    height: 58,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0D2137',
    letterSpacing: 0.3,
  },
  primaryBtnTextDisabled: {
    color: 'rgba(174,214,241,0.4)',
  },
  hint: {
    fontSize: 13,
    color: 'rgba(174,214,241,0.4)',
    textAlign: 'center',
    marginTop: -8,
  },
});
