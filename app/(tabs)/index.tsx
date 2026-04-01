import { getTuneReferences, searchFakebook } from '@/utils/fakebook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

type Genre = {
  id: string;
  label: string;
  tunes: string[];
};

type AppData = {
  genres: Genre[];
  randomKeyEnabled: boolean;
};

type Result = {
  tune: string;
  key: string | null;
};

type Panel = 'none' | 'list' | 'add';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'jazz_data';
const ALL_GENRES_ID = 'all';

const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const DEFAULT_GENRES: Genre[] = [
  {
    id: 'bossa',
    label: 'Bossa',
    tunes: [
      'The Girl from Ipanema',
      'Corcovado (Quiet Nights)',
      'Wave',
      'Desafinado',
      'Triste',
      'So Danco Samba',
      'Dindi',
      'How Insensitive',
      'Once I Loved',
      'Meditation',
      'O Grande Amor',
      'Doralice',
      'Waters of March',
      'Black Orpheus',
      'Aguas de Marco',
      '500 Miles High'
    ],
  },
  {
    id: 'bebop',
    label: 'Bebop/Burners',
    tunes: [
      'Donna Lee',
      'Anthropology',
      'Ornithology',
      'Confirmation',
      'Ko-Ko',
      'Scrapple from the Apple',
      'Moose the Mooche',
      'Hot House',
      'Groovin High',
      'Milestones (old)',
      'Half Nelson',
      'Celia',
      "Dexterity",
      'Leap Frog',
      'Little Willie Leaps',
      'Relaxin at Camarillo',
      'Segment'
    ],
  },
  {
    id: 'ballad',
    label: 'Ballad',
    tunes: [
      'Misty',
      'My Funny Valentine',
      'Round Midnight',
      'Naima',
      'In a Sentimental Mood',
      'Beautiful Love',
      'The Very Thought of You',
      'Lush Life',
      'Skylark',
      'But Beautiful',
      'Beautiful Love',
      'Over the Rainbow',
      'Body and Soul',
      'Darn That Dream',
      'When I Fall in Love',
      'Tenderly',
      'My One and Only Love',
      'Peace',

    ],
  },
  {
    id: 'medium_swing',
    label: 'Medium Swing',
    tunes: [
      'All The Things You Are',
      'There Will Never Be Another You',
      'Stella by Starlight',
      'Afternoon in Paris',
      'On Green Dolphin Street',
      'Just Friends',
      'Have You Met Miss Jones',
      'The Days of Wine and Roses',
      'Like Someone in Love',
      'It Could Happen to You',
      'My Romance',
      'I Love You',
      'Autumn Leaves',
      'Like Someone in Love',
      'Out of Nowhere'
    ],
  },
  {
    id: 'straight_8ths',
    label: 'Straight 8ths',
    tunes: [
      'Footprints',
      'Little Sunflower',
      'Maiden Voyage',
      'Cantaloupe Island',
      'Dolphin Dance',
      'One Finger Snap',
      'Speak No Evil',
      'The Sidewinder',
      'Mercy Mercy Mercy',
      'The Chicken',
      'Freedom Jazz Dance',
      'Spain',
      'La Fiesta',
    ],
  },
  {
    id: 'modern',
    label: 'Modern',
    tunes: [
      'Nardis',
      'E.S.P.',
      'Eighty One',
      'Pinocchio',
      'Fall',
      'Iris',
      'Fee-Fi-Fo-Fum',
      'Inner Urge',
      'Infant Eyes',
      '672',
      'Conception',
      'Tom Thumb',
      'Isotope'
    ],
  },
  {
    id: 'funk',
    label: 'Funk',
    tunes: [
      'Butterfly',
      'Watermelon Man',
      'The Chicken',
      'Cold Duck Time',
    ],
  },
  {
    id: 'pop',
    label: 'Pop',
    tunes: [
      "Isn't She Lovely",
      'Just the Two of Us',
      'Killing Me Softly',
      "Let's Stay Together",
      "Ain't No Sunshine",
      'How Deep is Your Love'
    ],
  },
  {
    id: 'new_orleans',
    label: 'New Orleans',
    tunes: [
      'St. James Infirmary',
      'St. Louis Blues',
      'Basin Street Blues',
      'The Preacher'
    ],
  },
  {
    id: 'gypsy',
    label: 'Gypsy',
    tunes: [
      'Minor Swing',
      'Nuages',
      'Django',
      'Douce Ambiance',
      'Swing Gitanes',
      'Place de Brouckère',
      'Sweet Georgia Brown',
      "After You've Gone",
      'All of Me',
      "I'll See You in My Dreams",
      'Belleville',
      'Les Yeux Noirs',
      'Brazil',
    ],
  },
  {
    id: 'three_four',
    label: '3/4',
    tunes: [
      'Someday My Prince Will Come',
      'Bluesette',
      'Tenderly',
      'Waltz for Debby',
      'Alice in Wonderland',
      'My Favorite Things',
      'Up Jumped Spring',
      'Moonlight in Vermont',
      'Beautiful Love',
      'Django (3/4)',
      'Skating',
      'Smile',
      'Stockholm Sweetnin',
    ],
  },
  {
    id: 'beatles',
    label: 'Beatles',
    tunes: [
      'Here, There and Everywhere',
      'Michelle',
      'Yesterday',
      'Blackbird',
      'Something',
      'In My Life',
      'Norwegian Wood',
      'Fool on the Hill',
      'Eleanor Rigby',
      'And I Love Her',
      'Julia',
      'The Long and Winding Road',
      'Golden Slumbers',
      'Across the Universe',
    ],
  },
];

const DEFAULT_DATA: AppData = {
  genres: DEFAULT_GENRES,
  randomKeyEnabled: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GeneratorScreen() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [selectedGenreId, setSelectedGenreId] = useState<string>(DEFAULT_GENRES[0].id);
  const [result, setResult] = useState<Result | null>(null);
  const [panel, setPanel] = useState<Panel>('none');
  const [newTune, setNewTune] = useState('');
  const [newGenreInput, setNewGenreInput] = useState('');
  const [showAddGenre, setShowAddGenre] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingToGenre, setAddingToGenre] = useState<string | null>(null);
  const newTuneRef = useRef<TextInput>(null);
  const newGenreRef = useRef<TextInput>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed: AppData = JSON.parse(raw);
          setData(parsed);
          if (parsed.genres.length > 0) {
            setSelectedGenreId(parsed.genres[0].id);
          }
        } catch {
          // corrupted — use defaults
        }
      }
    });
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────

  const save = useCallback((next: AppData) => {
    setData(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      Alert.alert('Save Error', 'Could not save data.');
    });
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const isAllGenres = selectedGenreId === ALL_GENRES_ID;
  const selectedGenre = data.genres.find((g) => g.id === selectedGenreId) ?? data.genres[0];
  const allTunes = data.genres.flatMap((g) => g.tunes);

  const searchResults = searchFakebook(searchQuery);

  // ── Actions ───────────────────────────────────────────────────────────────

  function handlePickRandom() {
    const pool = isAllGenres ? allTunes : selectedGenre?.tunes ?? [];
    if (pool.length === 0) {
      Alert.alert('No tunes', 'Add some tunes to a genre first.');
      return;
    }
    const tune = pickRandom(pool);
    const key = data.randomKeyEnabled ? pickRandom(KEYS) : null;
    setResult({ tune, key });
    setPanel('none');
  }

  function handleNewKey() {
    if (!result) return;
    setResult({ ...result, key: pickRandom(KEYS) });
  }

  function handleToggleKey(val: boolean) {
    save({ ...data, randomKeyEnabled: val });
  }

  function handleAddTune() {
    const title = newTune.trim();
    if (!title) return;
    const updated: AppData = {
      ...data,
      genres: data.genres.map((g) =>
        g.id === selectedGenreId ? { ...g, tunes: [...g.tunes, title] } : g,
      ),
    };
    save(updated);
    setNewTune('');
    setPanel('list'); // switch to list so user sees the added tune
  }

  function handleAddGenre() {
    const label = newGenreInput.trim();
    if (!label) return;
    const id = `custom_${Date.now()}`;
    const updated: AppData = {
      ...data,
      genres: [...data.genres, { id, label, tunes: [] }],
    };
    save(updated);
    setSelectedGenreId(id);
    setNewGenreInput('');
    setShowAddGenre(false);
    setPanel('none');
    setResult(null);
  }

  function handleDeleteTune(tune: string) {
    Alert.alert('Remove tune', `Remove "${tune}" from ${selectedGenre.label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated: AppData = {
            ...data,
            genres: data.genres.map((g) =>
              g.id === selectedGenreId
                ? { ...g, tunes: g.tunes.filter((t) => t !== tune) }
                : g,
            ),
          };
          save(updated);
        },
      },
    ]);
  }

  function handleSelectSearchResult(tune: string) {
    const key = data.randomKeyEnabled ? pickRandom(KEYS) : null;
    setResult({ tune, key });
    setSearchQuery('');
    setAddingToGenre(null);
    setPanel('none');
  }

  function handleAddToGenre(tune: string, genreId: string) {
    const genre = data.genres.find((g) => g.id === genreId);
    if (!genre || genre.tunes.includes(tune)) {
      setAddingToGenre(null);
      return;
    }
    const updated: AppData = {
      ...data,
      genres: data.genres.map((g) =>
        g.id === genreId ? { ...g, tunes: [...g.tunes, tune] } : g,
      ),
    };
    save(updated);
    setAddingToGenre(null);
  }

  function togglePanel(p: Panel) {
    setPanel((prev) => (prev === p ? 'none' : p));
    if (p === 'add') {
      setNewTune('');
      setTimeout(() => newTuneRef.current?.focus(), 100);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">

          {/* ── Title ── */}
          <Text style={styles.title}>🎷 Gig Tune Generator</Text>

          {/* ── Genre Chips ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipRow}
            contentContainerStyle={styles.chipRowContent}>
            {/* All genres chip */}
            <Pressable
              key={ALL_GENRES_ID}
              style={[styles.chip, isAllGenres && styles.chipActive]}
              onPress={() => {
                setSelectedGenreId(ALL_GENRES_ID);
                setResult(null);
                setPanel('none');
              }}>
              <Text style={[styles.chipText, isAllGenres && styles.chipTextActive]}>
                All
              </Text>
            </Pressable>

            {data.genres.map((g) => (
              <Pressable
                key={g.id}
                style={[styles.chip, selectedGenreId === g.id && styles.chipActive]}
                onPress={() => {
                  setSelectedGenreId(g.id);
                  setResult(null);
                  setPanel('none');
                }}>
                <Text
                  style={[
                    styles.chipText,
                    selectedGenreId === g.id && styles.chipTextActive,
                  ]}>
                  {g.label}
                </Text>
              </Pressable>
            ))}

            {/* + Add Genre chip */}
            <Pressable
              style={[styles.chip, styles.chipAdd]}
              onPress={() => {
                setShowAddGenre((v) => !v);
                if (!showAddGenre) {
                  setTimeout(() => newGenreRef.current?.focus(), 100);
                }
              }}>
              <Text style={styles.chipAddText}>＋ Genre</Text>
            </Pressable>
          </ScrollView>

          {/* ── Search ── */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search all tunes…"
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((r, i) => (
                <View key={`${r.name}-${i}`}>
                  <View style={styles.searchResultRow}>
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={() => handleSelectSearchResult(r.name)}>
                      <Text style={styles.searchResultTune}>{r.name}</Text>
                      {r.refs[0] && (
                        <Text style={styles.searchResultGenre}>
                          {r.refs[0].book} p.{r.refs[0].page}
                        </Text>
                      )}
                    </Pressable>
                    <Pressable
                      style={styles.addToGenreBtn}
                      onPress={() =>
                        setAddingToGenre((prev) =>
                          prev === r.name ? null : r.name,
                        )
                      }>
                      <Text style={styles.addToGenreBtnText}>＋</Text>
                    </Pressable>
                  </View>
                  {addingToGenre === r.name && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.genrePickerRow}
                      contentContainerStyle={styles.genrePickerContent}>
                      {data.genres.map((g) => (
                        <Pressable
                          key={g.id}
                          style={styles.genrePickerChip}
                          onPress={() => handleAddToGenre(r.name, g.id)}>
                          <Text style={styles.genrePickerChipText}>{g.label}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* ── Add Genre Inline Input ── */}
          {showAddGenre && (
            <View style={styles.inlineInputRow}>
              <TextInput
                ref={newGenreRef}
                style={styles.textInput}
                placeholder="New genre name…"
                placeholderTextColor="#999"
                value={newGenreInput}
                onChangeText={setNewGenreInput}
                returnKeyType="done"
                onSubmitEditing={handleAddGenre}
              />
              <Pressable style={styles.inlineBtn} onPress={handleAddGenre}>
                <Text style={styles.inlineBtnText}>Add</Text>
              </Pressable>
              <Pressable
                style={[styles.inlineBtn, styles.inlineBtnCancel]}
                onPress={() => {
                  setShowAddGenre(false);
                  setNewGenreInput('');
                }}>
                <Text style={styles.inlineBtnText}>✕</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.divider} />

          {/* ── Random Key Toggle ── */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>🎲 Random key</Text>
            <Switch
              value={data.randomKeyEnabled}
              onValueChange={handleToggleKey}
              trackColor={{ false: '#ccc', true: '#4F46E5' }}
              thumbColor="#fff"
            />
          </View>

          {/* ── Pick Random Button ── */}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            onPress={handlePickRandom}>
            <Text style={styles.primaryBtnText}>Pick Random Tune</Text>
          </Pressable>

          {/* ── Result ── */}
          {result && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTune}>{result.tune}</Text>
              {getTuneReferences(result.tune).slice(0, 3).map((ref, i) => (
                <Text key={i} style={styles.refText}>{ref.book}  p.{ref.page}</Text>
              ))}
              {data.randomKeyEnabled && (
                <View style={styles.keyRow}>
                  <Text style={styles.resultKey}>
                    {result.key ? `Key of ${result.key}` : '—'}
                  </Text>
                  <Pressable style={styles.newKeyBtn} onPress={handleNewKey}>
                    <Text style={styles.newKeyBtnText}>↻ New Key</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          <View style={styles.divider} />

          {/* ── Secondary Actions ── */}
          <View style={styles.secondaryRow}>
            <Pressable
              style={[styles.secondaryBtn, panel === 'list' && styles.secondaryBtnActive]}
              onPress={() => togglePanel('list')}>
              <Text
                style={[
                  styles.secondaryBtnText,
                  panel === 'list' && styles.secondaryBtnTextActive,
                ]}>
                View All Tunes
              </Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, panel === 'add' && styles.secondaryBtnActive]}
              onPress={() => togglePanel('add')}>
              <Text
                style={[
                  styles.secondaryBtnText,
                  panel === 'add' && styles.secondaryBtnTextActive,
                ]}>
                Add a Tune
              </Text>
            </Pressable>
          </View>

          {/* ── Add Tune Panel (specific genre only) ── */}
          {panel === 'add' && !isAllGenres && (
            <View style={styles.panel}>
              <View style={styles.inlineInputRow}>
                <TextInput
                  ref={newTuneRef}
                  style={styles.textInput}
                  placeholder={`Tune title for ${selectedGenre?.label}…`}
                  placeholderTextColor="#999"
                  value={newTune}
                  onChangeText={setNewTune}
                  returnKeyType="done"
                  onSubmitEditing={handleAddTune}
                />
                <Pressable style={styles.inlineBtn} onPress={handleAddTune}>
                  <Text style={styles.inlineBtnText}>Add</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Add Tune Panel ── */}
          {panel === 'add' && isAllGenres && (
            <View style={styles.panel}>
              <Text style={styles.emptyText}>Select a specific genre to add a tune.</Text>
            </View>
          )}

          {/* ── Tune List Panel ── */}
          {panel === 'list' && (
            <View style={styles.panel}>
              {isAllGenres ? (
                allTunes.length === 0 ? (
                  <Text style={styles.emptyText}>No tunes in any genre yet.</Text>
                ) : (
                  allTunes.map((tune, i) => (
                    <View key={`${tune}-${i}`} style={styles.tuneRow}>
                      <Text style={styles.tuneName}>{tune}</Text>
                    </View>
                  ))
                )
              ) : !selectedGenre || selectedGenre.tunes.length === 0 ? (
                <Text style={styles.emptyText}>No tunes yet — add one!</Text>
              ) : (
                selectedGenre.tunes.map((tune) => (
                  <View key={tune} style={styles.tuneRow}>
                    <Text style={styles.tuneName}>{tune}</Text>
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteTune(tune)}>
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
  },

  // Title
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F5F5F5',
    marginBottom: 20,
  },

  // Genre chips
  chipRow: {
    marginBottom: 4,
  },
  chipRowContent: {
    paddingBottom: 4,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFF',
  },
  chipAdd: {
    backgroundColor: '#1A1A2E',
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
  },
  chipAddText: {
    color: '#818CF8',
    fontSize: 14,
    fontWeight: '600',
  },

  // Add genre inline
  inlineInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F5F5F5',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  inlineBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  inlineBtnCancel: {
    backgroundColor: '#2A2A2A',
  },
  inlineBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },

  divider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 20,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: {
    color: '#CCC',
    fontSize: 16,
    fontWeight: '600',
  },

  // Primary button
  primaryBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Result card
  resultCard: {
    marginTop: 20,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#4F46E5',
    alignItems: 'center',
  },
  resultTune: {
    color: '#F5F5F5',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  resultKey: {
    color: '#818CF8',
    fontSize: 18,
    fontWeight: '600',
  },
  newKeyBtn: {
    backgroundColor: '#2E2B5F',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  newKeyBtnText: {
    color: '#818CF8',
    fontWeight: '700',
    fontSize: 14,
  },

  // Search
  searchRow: {
    marginTop: 12,
  },
  searchInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F5F5F5',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchResults: {
    marginTop: 6,
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  searchResultTune: {
    color: '#DDD',
    fontSize: 15,
    flex: 1,
  },
  searchResultGenre: {
    color: '#555',
    fontSize: 12,
    marginTop: 2,
  },
  addToGenreBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  addToGenreBtnText: {
    color: '#818CF8',
    fontSize: 20,
    fontWeight: '700',
  },
  genrePickerRow: {
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#0D0D0D',
  },
  genrePickerContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  genrePickerChip: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genrePickerChipText: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '600',
  },

  refText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  // Secondary buttons
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
  },
  secondaryBtnActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#1A1A2E',
  },
  secondaryBtnText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryBtnTextActive: {
    color: '#818CF8',
  },

  // Panel
  panel: {
    marginTop: 16,
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 14,
  },
  tuneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tuneName: {
    flex: 1,
    color: '#DDD',
    fontSize: 15,
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteBtnText: {
    color: '#555',
    fontSize: 16,
  },
});