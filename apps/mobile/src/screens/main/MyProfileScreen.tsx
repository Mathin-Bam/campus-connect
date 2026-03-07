import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../../config/apiClient';
import { useAuth } from '../../context/AuthContext';

export default function MyProfileScreen({ navigation }: any) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/users/me')
      .then(d => setProfile(d.user))
      .catch(e => console.log(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <View style={s.root}>
      <LinearGradient colors={['#040B14','#0D2137']} style={StyleSheet.absoluteFill} />
      <ActivityIndicator color="#1B6CA8" style={{ flex: 1 }} />
    </View>
  );

  const initials = (profile?.displayName || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2);

  return (
    <View style={s.root}>
      <LinearGradient colors={['#040B14','#0D2137']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Avatar */}
          <View style={s.avatarWrap}>
            <LinearGradient colors={['#1B6CA8','#0D3060']} style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </LinearGradient>
            <Text style={s.name}>{profile?.displayName || 'User'}</Text>
            <Text style={s.email}>{profile?.email}</Text>
            <View style={s.idBadge}>
              <Text style={s.idText}>#{(profile?.profileId || '').slice(-8)}</Text>
            </View>
          </View>

          {/* University */}
          {profile?.university && (
            <View style={s.card}>
              <Text style={s.cardLabel}>UNIVERSITY</Text>
              <Text style={s.cardValue}>🎓 {profile.university.name}</Text>
              <Text style={s.cardSub}>@{profile.university.emailDomain}</Text>
            </View>
          )}

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statNum}>0</Text>
              <Text style={s.statLabel}>Chats</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statNum}>✓</Text>
              <Text style={s.statLabel}>Verified</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statNum}>{profile?.profileId ? '🆔' : '—'}</Text>
              <Text style={s.statLabel}>Profile ID</Text>
            </View>
          </View>

          <TouchableOpacity style={s.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Text style={s.settingsBtnText}>⚙️ Settings</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:'#040B14'},
  safe:{flex:1},
  header:{paddingHorizontal:20,paddingTop:8,paddingBottom:4},
  back:{color:'#1B6CA8',fontSize:15,fontWeight:'600'},
  scroll:{alignItems:'center',paddingBottom:60,paddingTop:16},
  avatarWrap:{alignItems:'center',marginBottom:28},
  avatar:{width:96,height:96,borderRadius:48,justifyContent:'center',alignItems:'center',marginBottom:14},
  avatarText:{fontSize:38,fontWeight:'900',color:'#FFFFFF'},
  name:{fontSize:26,fontWeight:'900',color:'#FFFFFF',marginBottom:4},
  email:{fontSize:14,color:'rgba(174,214,241,0.5)',marginBottom:10},
  idBadge:{backgroundColor:'rgba(27,108,168,0.2)',borderRadius:999,paddingHorizontal:14,paddingVertical:5,borderWidth:1,borderColor:'rgba(27,108,168,0.35)'},
  idText:{fontSize:12,color:'#1B6CA8',fontWeight:'700',letterSpacing:1.5},
  card:{width:'90%',backgroundColor:'rgba(27,108,168,0.08)',borderRadius:16,borderWidth:1,borderColor:'rgba(27,108,168,0.15)',padding:16,marginBottom:14},
  cardLabel:{fontSize:11,fontWeight:'700',color:'rgba(174,214,241,0.4)',letterSpacing:1,marginBottom:6},
  cardValue:{fontSize:16,color:'#FFFFFF',fontWeight:'600',marginBottom:2},
  cardSub:{fontSize:13,color:'rgba(174,214,241,0.4)'},
  statsRow:{flexDirection:'row',width:'90%',backgroundColor:'rgba(27,108,168,0.08)',borderRadius:16,borderWidth:1,borderColor:'rgba(27,108,168,0.15)',padding:16,marginBottom:14,justifyContent:'space-around'},
  stat:{alignItems:'center'},
  statNum:{fontSize:22,fontWeight:'900',color:'#FFFFFF',marginBottom:4},
  statLabel:{fontSize:12,color:'rgba(174,214,241,0.4)'},
  statDivider:{width:1,backgroundColor:'rgba(27,108,168,0.2)'},
  settingsBtn:{marginTop:8,paddingHorizontal:32,paddingVertical:14,backgroundColor:'rgba(27,108,168,0.12)',borderRadius:999,borderWidth:1,borderColor:'rgba(27,108,168,0.25)'},
  settingsBtnText:{color:'#AED6F1',fontSize:15,fontWeight:'600'},
});
