import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

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
  onSubmit: (status: {
    activityId: string;
    emoji: string;
    label: string;
    location: string;
    message: string;
    duration: string;
  }) => void;
};

export default function SimpleStatusSheet({ isVisible, onClose, onSubmit }: Props) {
  const [selectedActivity, setSelectedActivity] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('1h');
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 300,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const handleActivitySelect = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedActivity(id);
  };

  const handleDurationSelect = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDuration(id);
  };

  const handleSubmit = async () => {
    if (!selectedActivity) return;
    const activity = ACTIVITIES.find(a => a.id === selectedActivity)!;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit({
      activityId: selectedActivity,
      emoji: activity.emoji,
      label: activity.label,
      location,
      message,
      duration: selectedDuration,
    });
    onClose();
  };

  const selectedActivityData = ACTIVITIES.find(a => a.id === selectedActivity);
  const canSubmit = selectedActivity.length > 0;

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={s.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            s.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={s.header}>
                <Text style={s.title}>What are you up to? 🚀</Text>
                <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                  <Text style={s.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.sectionLabel}>Choose an activity</Text>

              {/* Activity grid */}
              <View style={s.activityGrid}>
                {ACTIVITIES.map(activity => (
                  <ActivityTile
                    key={activity.id}
                    activity={activity}
                    selected={selectedActivity === activity.id}
                    onPress={() => handleActivitySelect(activity.id)}
                  />
                ))}
              </View>

              {/* Location */}
              <Text style={s.sectionLabel}>Where are you? <Text style={s.optional}>(optional)</Text></Text>
              <View style={[
                s.inputBox,
                selectedActivityData && { borderColor: selectedActivityData.color + '66' }
              ]}>
                <Text style={s.inputIcon}>📍</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. Main Library, Campus Gym..."
                  placeholderTextColor="rgba(174,214,241,0.3)"
                  value={location}
                  onChangeText={setLocation}
                  returnKeyType="done"
                />
              </View>

              {/* Message */}
              <Text style={s.sectionLabel}>Add a message <Text style={s.optional}>(optional)</Text></Text>
              <View style={[
                s.inputBox,
                s.inputBoxTall,
                selectedActivityData && { borderColor: selectedActivityData.color + '66' }
              ]}>
                <TextInput
                  style={[s.input, s.inputMultiline]}
                  placeholder="What's the vibe? Anyone welcome?"
                  placeholderTextColor="rgba(174,214,241,0.3)"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={100}
                  returnKeyType="done"
                />
              </View>
              <Text style={s.charCount}>{message.length}/100</Text>

              {/* Duration */}
              <Text style={s.sectionLabel}>How long?</Text>
              <View style={s.durationRow}>
                {DURATIONS.map(d => (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => handleDurationSelect(d.id)}
                    style={[
                      s.durationPill,
                      selectedDuration === d.id && s.durationPillActive,
                      selectedActivityData && selectedDuration === d.id && {
                        backgroundColor: selectedActivityData.color + '22',
                        borderColor: selectedActivityData.color,
                      }
                    ]}
                  >
                    <Text style={[
                      s.durationText,
                      selectedDuration === d.id && s.durationTextActive,
                    ]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Submit */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={{ marginTop: 24, marginBottom: 8 }}
              >
                <LinearGradient
                  colors={canSubmit
                    ? (selectedActivityData
                        ? [selectedActivityData.color, selectedActivityData.color + 'AA']
                        : ['#1B6CA8', '#0D3060'])
                    : ['#1a2a3a', '#1a2a3a']
                  }
                  style={s.submitBtn}
                >
                  <Text style={s.submitBtnText}>
                    {canSubmit
                      ? `I'm Active ${selectedActivityData?.emoji || '⚡'}` 
                      : 'Pick an activity first'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

function ActivityTile({
  activity,
  selected,
  onPress,
}: {
  activity: typeof ACTIVITIES[0];
  selected: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true, speed: 80 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={[
          s.activityTile,
          selected && {
            backgroundColor: activity.color + '22',
            borderColor: activity.color,
          },
        ]}
      >
        <View style={{
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <Text style={s.tileEmoji}>{activity.emoji}</Text>
        </View>
        <Text style={[s.tileLabel, selected && { color: activity.color }]}>
          {activity.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0A1929',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    marginHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(174,214,241,0.6)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  optional: {
    fontWeight: '400',
    textTransform: 'none',
    color: 'rgba(174,214,241,0.35)',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  activityTile: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(27,108,168,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(27,108,168,0.2)',
    gap: 4,
    minWidth: 58,
  },
  tileEmoji: { fontSize: 22 },
  tileLabel: {
    fontSize: 10,
    color: 'rgba(174,214,241,0.5)',
    fontWeight: '600',
    textAlign: 'center',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27,108,168,0.1)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(27,108,168,0.25)',
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 16,
    gap: 8,
    marginHorizontal: 20,
  },
  inputBoxTall: {
    height: 80,
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputIcon: { fontSize: 14 },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  inputMultiline: {
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: 'rgba(174,214,241,0.3)',
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  durationPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(27,108,168,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(27,108,168,0.2)',
  },
  durationPillActive: {
    backgroundColor: 'rgba(27,108,168,0.2)',
    borderColor: '#1B6CA8',
  },
  durationText: {
    fontSize: 13,
    color: 'rgba(174,214,241,0.5)',
    fontWeight: '600',
  },
  durationTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    height: 58,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
