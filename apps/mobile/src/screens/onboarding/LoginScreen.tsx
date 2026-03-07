import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../../config/apiClient';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';
import { signInWithCustomToken } from 'firebase/auth';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [userId, setUserId] = useState('');
  const { signInWithToken } = useAuth();

  const handleRequestOTP = async () => {
    if (!email.trim()) return;
    setLoading(true); setError('');
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      setDevOtp(String(data.otp));
      setUserId(data.userId);
      setStep('otp');
    } catch (e: any) {
      setError(e.message || 'No account found');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setLoading(true); setError('');
    try {
      const data = await apiFetch('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase().trim(), otp }),
      });
      await signInWithToken(data.customToken, data.user?.id, email.toLowerCase().trim(), data.user?.universityId);
    } catch (e: any) {
      setError(e.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#040B14', '#0D2137']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={s.safe}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={s.content}>
          <Text style={s.title}>Welcome back 👋</Text>
          <Text style={s.subtitle}>Sign in to your account</Text>
          {step === 'email' ? (
            <>
              <TextInput style={s.input} placeholder="Your university email" placeholderTextColor="rgba(174,214,241,0.4)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              {error ? <Text style={s.error}>{error}</Text> : null}
              <TouchableOpacity onPress={handleRequestOTP} disabled={loading}>
                <LinearGradient colors={['#1B6CA8', '#0D3060']} style={s.btn}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send Code →</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {devOtp ? <View style={s.devBox}><Text style={s.devText}>🔧 Dev OTP: {devOtp}</Text></View> : null}
              <TextInput style={[s.input, s.otpInput]} placeholder="000000" placeholderTextColor="rgba(174,214,241,0.4)" value={otp} onChangeText={t => setOtp(t.replace(/\D/g,'').slice(0,6))} keyboardType="number-pad" maxLength={6} />
              {error ? <Text style={s.error}>{error}</Text> : null}
              <TouchableOpacity onPress={handleVerify} disabled={loading}>
                <LinearGradient colors={['#1B6CA8', '#0D3060']} style={s.btn}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In →</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#040B14' },
  safe: { flex: 1 },
  back: { padding: 20 },
  backText: { color: '#1B6CA8', fontSize: 15, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(174,214,241,0.5)', marginBottom: 32 },
  input: { backgroundColor: 'rgba(27,108,168,0.12)', borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(27,108,168,0.3)', paddingHorizontal: 16, height: 54, color: '#FFFFFF', fontSize: 16, marginBottom: 12 },
  otpInput: { fontSize: 28, textAlign: 'center', letterSpacing: 10, fontWeight: '700' },
  btn: { height: 56, borderRadius: 999, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  btnText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  error: { color: '#E74C3C', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  devBox: { backgroundColor: 'rgba(39,174,96,0.15)', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(39,174,96,0.3)' },
  devText: { color: '#27AE60', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
