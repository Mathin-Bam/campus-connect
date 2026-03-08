import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Animated, Modal, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { apiFetch } from '../config/apiClient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ACTIVITIES = [
  { id: 'study', emoji: '📚', label: 'Study', color: '#3498DB' },
  { id: 'gym', emoji: '💪', label: 'Gym', color: '#8E44AD' },
  { id: 'food', emoji: '🍔', label: 'Food', color: '#F39C12' },
  { id: 'sports', emoji: '⚽', label: 'Sports', color: '#E74C3C' },
  { id: 'gaming', emoji: '🎮', label: 'Gaming', color: '#E67E22' },
  { id: 'social', emoji: '🎉', label: 'Social', color: '#1ABC9C' },
  { id: 'music', emoji: '🎵', label: 'Music', color: '#9B59B6' },
  { id: 'art', emoji: '🎨', label: 'Art', color: '#16A085' },
  { id: 'movies', emoji: '🎬', label: 'Movies', color: '#C0392B' },
  { id: 'other', emoji: '✨', label: 'Other', color: '#95A5A6' },
];

const DURATIONS = [
  { id: '30m', label: '30 min' },
  { id: '1h', label: '1 hour' },
  { id: '2h', label: '2 hours' },
  { id: 'open', label: 'Open ended' },
];

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onPosted?: () => void;
};

export default function StatusBottomSheet({ isVisible, onClose, onPosted }: Props) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [selectedActivity, setSelectedActivity] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('1h');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true,
        tension: 65, friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT, useNativeDriver: true, duration: 250,
      }).start();
    }
  }, [isVisible]);

  const handleActivitySelect = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedActivity(id);
  };

  const handlePost = async () => {
    if (!selectedActivity) return;
    setLoading(true);
    setError('');
    try {
      await apiFetch('/api/activity/status', {
        method: 'POST',
        body: JSON.stringify({
          activityType: selectedActivity,
          location: location.trim() || null,
          message: message.trim() || null,
          duration: selectedDuration || '1h',
        }),
      });
      setSelectedActivity('');
      setLocation('');
      setMessage('');
      setSelectedDuration('1h');
      onClose();
      onPosted?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedActivityData = ACTIVITIES.find(a => a.id === selectedActivity);

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.overlay}
      >
        <TouchableOpacity style={s.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={s.handle} />
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={s.header}>
              <Text style={s.title}>What are you up to? 🚀</Text>
              <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                <Text style={s.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>CHOOSE AN ACTIVITY</Text>
            <View style={s.grid}>
              {ACTIVITIES.map(activity => {
                const selected = selectedActivity === activity.id;
                return (
                  <TouchableOpacity
                    key={activity.id}
                    onPress={() => handleActivitySelect(activity.id)}
                    style={[s.tile, selected && { backgroundColor: activity.color + '22', borderColor: activity.color }]}
                  >
                    <Text style={s.tileEmoji}>{activity.emoji}</Text>
                    <Text style={[s.tileLabel, selected && { color: activity.color }]}>{activity.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={s.label}>WHERE ARE YOU? <Text style={s.optional}>(optional)</Text></Text>
            <View style={[s.inputBox, selectedActivityData && { borderColor: selectedActivityData.color + '66' }]}>
              <Text style={s.inputIcon}>📍</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Main Library, Campus Gym..."
                placeholderTextColor="rgba(174,214,241,0.3)"
                value={location} onChangeText={setLocation} returnKeyType="done"
              />
            </View>

            <Text style={s.label}>ADD A MESSAGE <Text style={s.optional}>(optional)</Text></Text>
            <View style={[s.inputBox, s.inputTall, selectedActivityData && { borderColor: selectedActivityData.color + '66' }]}>
              <TextInput
                style={[s.input, { textAlignVertical: 'top' }]}
                placeholder="What's the vibe? Anyone welcome?"
                placeholderTextColor="rgba(174,214,241,0.3)"
                value={message} onChangeText={t => t.length <= 100 && setMessage(t)}
                multiline returnKeyType="done"
              />
            </View>
            <Text style={s.charCount}>{message.length}/100</Text>

            <Text style={s.label}>HOW LONG?</Text>
            <View style={s.durationRow}>
              {DURATIONS.map(d => {
                const active = selectedDuration === d.id;
                return (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedDuration(d.id); }}
                    style={[s.pill, active && { borderColor: selectedActivityData?.color || '#1B6CA8', backgroundColor: (selectedActivityData?.color || '#1B6CA8') + '22' }]}
                  >
                    <Text style={[s.pillText, active && { color: '#FFFFFF' }]}>{d.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={handlePost} disabled={!selectedActivity || loading} style={{ marginTop: 24, marginBottom: 32 }}>
              <LinearGradient
                colors={selectedActivity ? [selectedActivityData!.color, selectedActivityData!.color + 'AA'] : ['#1a2a3a', '#1a2a3a']}
                style={s.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={s.submitText}>
                    {selectedActivity ? `I'm Active ${selectedActivityData?.emoji}` : 'Pick an activity first'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            {error && <Text style={s.errorText}>{error}</Text>}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: { backgroundColor: '#0A1929', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_HEIGHT * 0.92, paddingHorizontal: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  label: { fontSize: 11, fontWeight: '700', color: 'rgba(174,214,241,0.5)', letterSpacing: 0.8, marginBottom: 10 },
  optional: { fontWeight: '400', fontSize: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tile: { width: '18%', aspectRatio: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(27,108,168,0.1)', borderWidth: 1.5, borderColor: 'rgba(27,108,168,0.2)', minWidth: 56, gap: 3 },
  tileEmoji: { fontSize: 20 },
  tileLabel: { fontSize: 9, color: 'rgba(174,214,241,0.5)', fontWeight: '600', textAlign: 'center' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(27,108,168,0.1)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(27,108,168,0.25)', paddingHorizontal: 12, height: 50, marginBottom: 14, gap: 8 },
  inputTall: { height: 80, alignItems: 'flex-start', paddingTop: 12 },
  inputIcon: { fontSize: 14 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  charCount: { fontSize: 10, color: 'rgba(174,214,241,0.3)', textAlign: 'right', marginTop: -10, marginBottom: 14 },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(27,108,168,0.1)', borderWidth: 1.5, borderColor: 'rgba(27,108,168,0.2)' },
  pillText: { fontSize: 13, color: 'rgba(174,214,241,0.5)', fontWeight: '600' },
  submitBtn: { height: 56, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  errorText: { fontSize: 12, color: '#E74C3C', textAlign: 'center', marginTop: 8 },
});
