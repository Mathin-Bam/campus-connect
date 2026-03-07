import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: Props) {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.8)).current;
  const pulse2Scale = useRef(new Animated.Value(1)).current;
  const pulse2Opacity = useRef(new Animated.Value(0.5)).current;
  const blobAnim = useRef(new Animated.Value(0)).current;
  const blob2Anim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const btn2Scale = useRef(new Animated.Value(1)).current;
  const emojiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade + slide in on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Emoji row stagger fade in
    Animated.timing(emojiAnim, {
      toValue: 1,
      duration: 1200,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // Primary pulse ring
    const primaryPulse = () => {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.8);
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 2.6,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]).start(() => primaryPulse());
    };

    // Secondary pulse ring — offset timing
    const secondaryPulse = () => {
      pulse2Scale.setValue(1);
      pulse2Opacity.setValue(0.5);
      Animated.parallel([
        Animated.timing(pulse2Scale, {
          toValue: 2.0,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse2Opacity, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]).start(() => secondaryPulse());
    };

    // Start secondary pulse with delay for stagger effect
    setTimeout(() => primaryPulse(), 0);
    setTimeout(() => secondaryPulse(), 900);

    // Blob 1 — slow float up/down
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(blobAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Blob 2 — opposite direction
    Animated.loop(
      Animated.sequence([
        Animated.timing(blob2Anim, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(blob2Anim, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const blob1Translate = blobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const blob2Translate = blob2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25],
  });

  const pressIn = (ref: Animated.Value) => {
    Animated.spring(ref, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();
  };

  const pressOut = (ref: Animated.Value) => {
    Animated.spring(ref, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();
  };

  const handleGetStarted = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('UniversitySearch');
  };

  const handleLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Login screen Sprint 2
  };

  const ACTIVITIES = [
    { emoji: '📚', label: 'Study' },
    { emoji: '💪', label: 'Gym' },
    { emoji: '🍔', label: 'Food' },
    { emoji: '⚽', label: 'Sports' },
    { emoji: '🎮', label: 'Gaming' },
  ];

  const STATS = [
    { value: '500+', label: 'Students' },
    { value: 'Live', label: 'Activity' },
    { value: '10+', label: 'Campuses' },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Deep background gradient */}
      <LinearGradient
        colors={['#040B14', '#0D2137', '#0F2D4A']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient blob 1 — top left */}
      <Animated.View
        style={[
          s.blob1,
          { transform: [{ translateY: blob1Translate }] },
        ]}
      >
        <LinearGradient
          colors={['#1B6CA8', '#0D4080', '#040B14']}
          style={{ flex: 1, borderRadius: width * 0.65 }}
        />
      </Animated.View>

      {/* Ambient blob 2 — bottom right */}
      <Animated.View
        style={[
          s.blob2,
          { transform: [{ translateY: blob2Translate }] },
        ]}
      >
        <LinearGradient
          colors={['#0A3A6B', '#1B6CA8', '#040B14']}
          style={{ flex: 1, borderRadius: width * 0.5 }}
        />
      </Animated.View>

      <SafeAreaView style={s.safe}>
        <Animated.View
          style={[
            s.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* ── TOP SECTION ── */}
          <View style={s.top}>

            {/* Pulsing location icon */}
            <View style={s.iconWrap}>
              {/* Outer pulse ring */}
              <Animated.View
                style={[
                  s.pulseRing,
                  {
                    transform: [{ scale: pulseScale }],
                    opacity: pulseOpacity,
                  },
                ]}
              />
              {/* Inner pulse ring */}
              <Animated.View
                style={[
                  s.pulseRing2,
                  {
                    transform: [{ scale: pulse2Scale }],
                    opacity: pulse2Opacity,
                  },
                ]}
              />
              {/* Icon circle */}
              <LinearGradient
                colors={['rgba(27,108,168,0.6)', 'rgba(13,48,96,0.4)']}
                style={s.iconCircle}
              >
                <Text style={s.iconEmoji}>📍</Text>
              </LinearGradient>
            </View>

            {/* App name */}
            <Text style={s.titleTop}>CAMPUS</Text>
            <Text style={s.titleBottom}>CONNECT</Text>

            {/* Divider */}
            <View style={s.divider} />

            {/* Tagline */}
            <Text style={s.tagline}>Find your people. Right now.</Text>

            {/* Activity pills */}
            <Animated.View style={[s.activityRow, { opacity: emojiAnim }]}>
              {ACTIVITIES.map((item, i) => (
                <View key={i} style={s.activityPill}>
                  <Text style={s.activityEmoji}>{item.emoji}</Text>
                  <Text style={s.activityLabel}>{item.label}</Text>
                </View>
              ))}
            </Animated.View>

            {/* Stats row */}
            <View style={s.statsRow}>
              {STATS.map((stat, i) => (
                <View key={i} style={s.statCard}>
                  <Text style={s.statValue}>{stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── BOTTOM SECTION ── */}
          <View style={s.bottom}>

            {/* Primary CTA */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                onPressIn={() => pressIn(btnScale)}
                onPressOut={() => pressOut(btnScale)}
                onPress={handleGetStarted}
                activeOpacity={1}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#D6EAF8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.primaryBtn}
                >
                  <Text style={s.primaryBtnText}>Get Started</Text>
                  <Text style={s.primaryBtnArrow}> →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <View style={{ height: 12 }} />

            {/* Sign in link */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(174,214,241,0.5)', fontSize: 14 }}>
                Already have an account? <Text style={{ color: '#1B6CA8', fontWeight: '700' }}>Sign in</Text>
              </Text>
            </TouchableOpacity>

            {/* Trust badge */}
            <View style={s.trustRow}>
              <View style={s.trustDot} />
              <Text style={s.trustText}>Verified university emails only</Text>
              <View style={s.trustDot} />
            </View>
          </View>

        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#040B14',
  },
  safe: {
    flex: 1,
  },
  blob1: {
    position: 'absolute',
    top: -height * 0.15,
    left: -width * 0.25,
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: width * 0.55,
    opacity: 0.45,
    overflow: 'hidden',
  },
  blob2: {
    position: 'absolute',
    bottom: -height * 0.1,
    right: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    opacity: 0.25,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingTop: 8,
  },
  top: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  pulseRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: '#1B6CA8',
  },
  pulseRing2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#AED6F1',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(27,108,168,0.6)',
  },
  iconEmoji: {
    fontSize: 28,
  },
  titleTop: {
    fontSize: 46,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 8,
    lineHeight: 50,
  },
  titleBottom: {
    fontSize: 46,
    fontWeight: '900',
    color: '#AED6F1',
    letterSpacing: 8,
    lineHeight: 54,
  },
  divider: {
    width: 56,
    height: 1.5,
    backgroundColor: 'rgba(174,214,241,0.3)',
    marginVertical: 18,
  },
  tagline: {
    fontSize: 16,
    color: '#AED6F1',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textAlign: 'center',
    lineHeight: 24,
  },
  activityRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 8,
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27,108,168,0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(27,108,168,0.3)',
    gap: 4,
  },
  activityEmoji: {
    fontSize: 13,
  },
  activityLabel: {
    fontSize: 11,
    color: '#AED6F1',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 10,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(27,108,168,0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(27,108,168,0.22)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 11,
    color: '#AED6F1',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  bottom: {
    paddingBottom: 4,
  },
  primaryBtn: {
    height: 58,
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#AED6F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0D2137',
    letterSpacing: 0.3,
  },
  primaryBtnArrow: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B6CA8',
  },
  secondaryBtn: {
    height: 58,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(174,214,241,0.25)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.2,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    gap: 8,
  },
  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(174,214,241,0.4)',
  },
  trustText: {
    fontSize: 12,
    color: 'rgba(174,214,241,0.55)',
    letterSpacing: 0.3,
  },
});
