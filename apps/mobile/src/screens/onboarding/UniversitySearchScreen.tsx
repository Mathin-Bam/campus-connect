import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../../config/api';

type University = {
  id: string;
  name: string;
  emailDomain: string;
  city: string;
  country: string;
};

export default function UniversitySearchScreen({ navigation }: any) {
  console.log('UniversitySearchScreen rendering');
  const [query, setQuery] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<any>(null);

  const search = async (text: string) => {
    if (text.length < 2 && text.length > 0) { setUniversities([]); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://campus-connect-api-kq3u.onrender.com/api/universities?q=${encodeURIComponent(text)}`);
      const data = await res.json();
      setUniversities(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Could not load universities. Check your connection.');
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 300);
  };

  useEffect(() => {
    // Load some initial universities when component mounts
    fetch('https://campus-connect-api-kq3u.onrender.com/api/universities?q=')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setUniversities(data);
      })
      .catch(() => {});
  }, []);

  const handleSelect = (uni: University) => {
    navigation.navigate('OTP', {
      university: {
        id: uni.id,
        name: uni.name,
        emailDomain: uni.emailDomain,
        city: uni.city,
      },
    });
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#040B14', '#0D2137']} style={s.bg} />
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Find your university 🎓</Text>
          <Text style={s.subtitle}>Search by name or email domain</Text>
        </View>

        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="e.g. Oxford, MIT, Stanford..."
            placeholderTextColor="rgba(174,214,241,0.4)"
            value={query}
            onChangeText={handleChange}
            autoFocus
            returnKeyType="search"
          />
          {loading && <ActivityIndicator size="small" color="#1B6CA8" />}
        </View>

        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {query.length < 2 && (
          <View style={s.hint}>
            <Text style={s.hintText}>Type at least 2 characters to search</Text>
          </View>
        )}

        <FlatList
          data={universities}
          keyExtractor={item => item.id}
          style={s.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => handleSelect(item)}>
              <View style={s.cardLeft}>
                <Text style={s.uniName}>{item.name}</Text>
                <Text style={s.uniMeta}>{item.city} · @{item.emailDomain}</Text>
              </View>
              <Text style={s.arrow}>→</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            query.length >= 2 && !loading ? (
              <View style={s.hint}>
                <Text style={s.hintText}>No universities found for "{query}"</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#040B14' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#1B6CA8', fontSize: 15, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  subtitle: { fontSize: 14, color: 'rgba(174,214,241,0.5)' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(27,108,168,0.12)',
    borderRadius: 14, borderWidth: 1.5,
    borderColor: 'rgba(27,108,168,0.3)',
    marginHorizontal: 20, paddingHorizontal: 14,
    height: 52, gap: 10, marginBottom: 12,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 16 },
  list: { flex: 1, paddingHorizontal: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(27,108,168,0.08)',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(27,108,168,0.2)',
    padding: 16, marginBottom: 10,
  },
  cardLeft: { flex: 1 },
  uniName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  uniMeta: { fontSize: 12, color: 'rgba(174,214,241,0.5)' },
  arrow: { fontSize: 18, color: '#1B6CA8', fontWeight: '700' },
  hint: { alignItems: 'center', paddingTop: 40 },
  hintText: { fontSize: 14, color: 'rgba(174,214,241,0.4)', textAlign: 'center' },
  errorBox: { marginHorizontal: 20, padding: 12, backgroundColor: 'rgba(231,76,60,0.15)', borderRadius: 10, marginBottom: 10 },
  errorText: { color: '#E74C3C', fontSize: 13, textAlign: 'center' },
});
