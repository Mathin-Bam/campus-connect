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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { API_URL } from '../../config/api';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'OTP'>;
  route: RouteProp<RootStackParamList, 'OTP'>;
};

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OTPScreen({ navigation, route }: Props) {
  const { university } = route.params;
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [devOtp, setDevOtp] = useState<string>(''); // For dev testing display
  const [error, setError] = useState('');

  const otpRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const validateEmail = () => {
    const domain = email.split('@')[1];
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address');
      return false;
    }
    if (domain !== university.emailDomain) {
      Alert.alert(
        'Wrong email domain',
        `Your email must end with @${university.emailDomain}` 
      );
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validateEmail()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const res = await fetch('https://campus-connect-api-kq3u.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          universityId: university.id,
          displayName: 'User',
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      if (data.otp) setDevOtp(String(data.otp)); // show OTP on screen for testing
      setStep('otp');
      startCountdown();
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send verification code');
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      otpRefs.current[nextIndex]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError(false);
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const shakeError = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < OTP_LENGTH) return;
    setIsVerifying(true);
    setOtpError(false);

    try {
      const res = await fetch('https://campus-connect-api-kq3u.onrender.com/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: String(otp),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid OTP'); return; }
      
      // Success - navigate to ProfileSetup
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // TODO: Sign in to Firebase with custom token
      // For now, navigate to ProfileSetup
      // @ts-ignore
      navigation.navigate('ProfileSetup', {
        userId: data.userId || data.uid || 'unknown',
        email: email,
        token: data.customToken || data.token || '',
      });
    } catch (error: any) {
      setOtpError(true);
      setIsVerifying(false);
      setError(error.message || 'Verification failed');
      // Shake animation on error
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOtp(['', '', '', '', '', '']);
    setOtpError(false);
    startCountdown();
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const pressIn = () =>
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 60 }).start();
  const pressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 60 }).start();

  const otpComplete = otp.every(d => d !== '');

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
                onPress={() => step === 'otp' ? setStep('email') : navigation.goBack()}
                style={s.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={s.backArrow}>←</Text>
              </TouchableOpacity>
              <View style={s.headerSteps}>
                <View style={s.step} />
                <View style={[s.step, s.stepActive]} />
                <View style={s.step} />
              </View>
            </View>

            {/* University badge */}
            <View style={s.uniBadge}>
              <Text style={s.uniBadgeText}>🎓 {university.name}</Text>
              <Text style={s.uniBadgeDomain}>@{university.emailDomain}</Text>
            </View>

            {step === 'email' ? (
              // ── EMAIL STEP ──
              <View style={s.stepContent}>
                <Text style={s.titleEmoji}>✉️</Text>
                <Text style={s.title}>Enter your university email</Text>
                <Text style={s.subtitle}>
                  We'll send a 6-digit code to verify you're a real student
                </Text>

                <View style={s.inputWrap}>
                  <Text style={s.inputLabel}>University email</Text>
                  <View style={s.inputBox}>
                    <TextInput
                      style={s.input}
                      placeholder={`yourname@${university.emailDomain}`}
                      placeholderTextColor="rgba(174,214,241,0.35)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                    />
                  </View>
                  <Text style={s.inputHint}>
                    Must end with @{university.emailDomain}
                  </Text>
                </View>

                <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 32 }}>
                  <TouchableOpacity
                    onPressIn={pressIn}
                    onPressOut={pressOut}
                    onPress={handleSendOTP}
                    activeOpacity={1}
                    disabled={!email.includes('@')}
                  >
                    <LinearGradient
                      colors={email.includes('@') ? ['#1B6CA8', '#0D4A7A'] : ['#1a2a3a', '#1a2a3a']}
                      style={s.primaryBtn}
                    >
                      <Text style={s.primaryBtnText}>Send verification code →</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            ) : (
              // ── OTP STEP ──
              <View style={s.stepContent}>
                <Text style={s.titleEmoji}>🔐</Text>
                <Text style={s.title}>Check your inbox</Text>
                <Text style={s.subtitle}>
                  We sent a 6-digit code to{'\n'}
                  <Text style={s.emailHighlight}>{email}</Text>
                </Text>

                {/* OTP boxes */}
                <Animated.View
                  style={[
                    s.otpRow,
                    { transform: [{ translateX: shakeAnim }] },
                  ]}
                >
                  {otp.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={ref => { otpRefs.current[i] = ref; }}
                      style={[
                        s.otpBox,
                        digit ? s.otpBoxFilled : null,
                        otpError ? s.otpBoxError : null,
                      ]}
                      value={digit}
                      onChangeText={val => handleOtpChange(val, i)}
                      onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                      keyboardType="numeric"
                      maxLength={6}
                      selectTextOnFocus
                      textAlign="center"
                    />
                  ))}
                </Animated.View>

                {otpError && (
                  <Text style={s.otpErrorText}>
                    ✕ Incorrect code — please try again
                  </Text>
                )}

                {/* Verify button */}
                <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 28 }}>
                  <TouchableOpacity
                    onPressIn={pressIn}
                    onPressOut={pressOut}
                    onPress={handleVerify}
                    activeOpacity={1}
                    disabled={!otpComplete || isVerifying}
                  >
                    <LinearGradient
                      colors={otpComplete ? ['#1B6CA8', '#0D4A7A'] : ['#1a2a3a', '#1a2a3a']}
                      style={s.primaryBtn}
                    >
                      <Text style={s.primaryBtnText}>
                        {isVerifying ? 'Verifying...' : 'Verify email ✓'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Resend */}
                <View style={s.resendRow}>
                  <Text style={s.resendText}>Didn't get it? </Text>
                  <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
                    <Text style={[s.resendLink, countdown > 0 && s.resendDisabled]}>
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Dev OTP Display */}
                {devOtp ? (
                  <View style={s.devHint}>
                    <Text style={s.devHintText}>📱 Dev OTP: {devOtp}</Text>
                  </View>
                ) : null}

              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
  uniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(27,108,168,0.15)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(27,108,168,0.3)',
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  uniBadgeText: { fontSize: 13, color: '#AED6F1', fontWeight: '600' },
  uniBadgeDomain: {
    fontSize: 12,
    color: 'rgba(174,214,241,0.6)',
    backgroundColor: 'rgba(27,108,168,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  stepContent: { flex: 1, paddingTop: 24 },
  titleEmoji: { fontSize: 36, marginBottom: 12 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    lineHeight: 32,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(174,214,241,0.7)',
    lineHeight: 22,
    marginBottom: 8,
  },
  emailHighlight: {
    color: '#AED6F1',
    fontWeight: '600',
  },
  inputWrap: { marginTop: 24 },
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
    borderColor: 'rgba(27,108,168,0.3)',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  inputHint: {
    fontSize: 12,
    color: 'rgba(174,214,241,0.4)',
    marginTop: 6,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(27,108,168,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(27,108,168,0.25)',
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: '#1B6CA8',
    backgroundColor: 'rgba(27,108,168,0.2)',
  },
  otpBoxError: {
    borderColor: '#E74C3C',
    backgroundColor: 'rgba(231,76,60,0.1)',
  },
  otpErrorText: {
    color: '#E74C3C',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  primaryBtn: {
    height: 56,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: { fontSize: 14, color: 'rgba(174,214,241,0.5)' },
  resendLink: { fontSize: 14, color: '#1B6CA8', fontWeight: '600' },
  resendDisabled: { color: 'rgba(174,214,241,0.3)' },
  devHint: {
    marginTop: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255,193,7,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  devHintText: {
    fontSize: 12,
    color: 'rgba(255,193,7,0.7)',
    fontWeight: '500',
  },
});
