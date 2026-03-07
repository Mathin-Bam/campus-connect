import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../../config/apiClient';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSetPassword = async () => {
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await apiFetch('/api/users/set-password', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setSuccess('Password set! You can now use it to sign in.');
      setPassword(''); setConfirm('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#040B14', '#0D2137']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Settings ⚙️</Text>
        </View>
        <ScrollView style={s.scroll}>
          <View style={s.card}>
            <Text style={s.cardTitle}>SET A PASSWORD</Text>
            <Text style={s.cardSub}>Set a password so you can sign in without OTP next time</Text>
            <TextInput style={s.input} placeholder="New password (min 6 chars)" placeholderTextColor="rgba(174,214,241,0.3)" value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput style={s.input} placeholder="Confirm password" placeholderTextColor="rgba(174,214,241,0.3)" value={confirm} onChangeText={setConfirm} secureTextEntry />
            {error ? <Text style={s.error}>{error}</Text> : null}
            {success ? <Text style={s.successText}>{success}</Text> : null}
            <TouchableOpacity onPress={handleSetPassword} disabled={loading}>
              <LinearGradient colors={['#1B6CA8', '#0D3060']} style={s.btn}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Set Password</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>ACCOUNT</Text>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Email</Text>
              <Text style={s.infoValue}>{user?.email || '—'}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <Text style={s.logoutText}>🚪 Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#040B14' },
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  back: { marginBottom: 12 },
  backText: { color: '#1B6CA8', fontSize: 15, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  card: { backgroundColor: 'rgba(27,108,168,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(27,108,168,0.15)', padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(174,214,241,0.4)', letterSpacing: 1, marginBottom: 6 },
  cardSub: { fontSize: 13, color: 'rgba(174,214,241,0.5)', marginBottom: 16, lineHeight: 18 },
  input: { backgroundColor: 'rgba(27,108,168,0.12)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(27,108,168,0.25)', paddingHorizontal: 14, height: 50, color: '#FFFFFF', fontSize: 15, marginBottom: 10 },
  btn: { height: 50, borderRadius: 999, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  error: { color: '#E74C3C', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  successText: { color: '#27AE60', fontSize: 13, marginBottom: 8, textAlign: 'center', fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  infoLabel: { fontSize: 14, color: 'rgba(174,214,241,0.5)' },
  infoValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  logoutBtn: { backgroundColor: 'rgba(231,76,60,0.1)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(231,76,60,0.2)', padding: 16, alignItems: 'center', marginBottom: 40 },
  logoutText: { fontSize: 16, color: '#E74C3C', fontWeight: '700' },
});
