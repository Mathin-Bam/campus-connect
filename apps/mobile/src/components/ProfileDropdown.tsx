import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '../config/apiClient';
import { useAuth } from '../context/AuthContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  navigation: any;
};

export default function ProfileDropdown({ visible, onClose, navigation }: Props) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const slideAnim = React.useRef(new Animated.Value(-400)).current;

  useEffect(() => {
    if (visible) {
      loadProfile();
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: -400, useNativeDriver: true, duration: 200 }).start();
    }
  }, [visible]);

  const loadProfile = async () => {
    try {
      const data = await apiFetch('/api/users/me');
      setProfile(data.user);
    } catch (e) {}
  };

  const menuItems = [
    { icon: '📬', label: 'Inbox', action: () => { onClose(); navigation.navigate('ChatList'); } },
    { icon: '👤', label: 'My Profile', action: () => { onClose(); navigation.navigate('MyProfile'); } },
    { icon: '⚙️', label: 'Settings', action: () => { onClose(); navigation.navigate('Settings'); } },
    { icon: '🚪', label: 'Sign Out', action: async () => { onClose(); await logout(); }, danger: true },
  ];

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} onPress={onClose} activeOpacity={1} />
      <Animated.View style={[s.dropdown, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={['#0A1929', '#0D2137']} style={s.inner}>
          {/* Profile header */}
          <View style={s.profileHeader}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{(profile?.displayName || user?.displayName || 'U')[0].toUpperCase()}</Text>
            </View>
            <View style={s.profileInfo}>
              <Text style={s.profileName}>{profile?.displayName || user?.displayName || 'User'}</Text>
              <Text style={s.profileEmail}>{profile?.email || user?.email || ''}</Text>
              <View style={s.profileIdBadge}>
                <Text style={s.profileIdText}>#{(profile?.profileId?.slice(-8) || '--------'}</Text>
              </View>
            </View>
          </View>
          <View style={s.divider} />

          {/* University badge */}
          {profile?.university && (
            <View style={s.uniBadge}>
              <Text style={s.uniText}>🎓 {profile.university.name}</Text>
            </View>
          )}

          <View style={s.divider} />

          {/* Menu items */}
          {menuItems.map((item) => (
            <TouchableOpacity key={item.label} style={s.menuItem} onPress={item.action}>
              <Text style={s.menuIcon}>{item.icon}</Text>
              <Text style={[s.menuLabel, item.danger && s.menuDanger]}>{item.label}</Text>
              {!item.danger && <Text style={s.menuArrow}>›</Text>}
            </TouchableOpacity>
          ))}
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  dropdown: { position: 'absolute', top: 0, left: 0, right: 0, maxHeight: '75%' },
  inner: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 24 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 56, gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1B6CA8', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(27,108,168,0.5)' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  profileEmail: { fontSize: 13, color: 'rgba(174,214,241,0.5)', marginBottom: 6 },
  profileIdBadge: { backgroundColor: 'rgba(27,108,168,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(27,108,168,0.3)' },
  profileIdText: { fontSize: 11, color: '#1B6CA8', fontWeight: '700', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: 'rgba(27,108,168,0.15)', marginHorizontal: 20, marginVertical: 8 },
  uniBadge: { paddingHorizontal: 20, paddingVertical: 8 },
  uniText: { fontSize: 14, color: 'rgba(174,214,241,0.6)', fontWeight: '500' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  menuIcon: { fontSize: 20, width: 28 },
  menuLabel: { flex: 1, fontSize: 16, color: '#FFFFFF', fontWeight: '600' },
  menuDanger: { color: '#E74C3C' },
  menuArrow: { fontSize: 20, color: 'rgba(174,214,241,0.3)' },
});
