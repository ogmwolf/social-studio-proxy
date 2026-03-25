import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { callAPI } from '../api/anthropic';
import { ORIG_SYSTEM, buildSystemPrompt, buildResearchMsg } from '../constants/prompts';
import TovSelector from '../components/TovSelector';
import TopicSelector from '../components/TopicSelector';
import PostCard from '../components/PostCard';
import { colors } from '../constants/theme';

export default function TweetsScreen() {
  const [cards, setCards]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [tov, setTov]         = useState(null);
  const [topic, setTopic]     = useState(null);

  async function generate() {
    setLoading(true);
    setError('');
    setCards([]);
    try {
      const system = buildSystemPrompt(ORIG_SYSTEM, { tov, topic });
      const msg = buildResearchMsg(topic, tov) + ' Write tweets in my voice — mix of types. Punchy, human, worth reading.';
      const results = await callAPI(system, msg, true);
      setCards(results);
    } catch (e) {
      setError(e.message === 'Request timed out — try again.' ? e.message : 'Generation failed. Check your connection and try again.');
      console.error('[Tweets] Error:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.header}>
          <View style={styles.eyebrow}>
            <View style={styles.dot} />
            <Text style={styles.eyebrowText}>ORIGINAL TWEETS</Text>
          </View>
          <Text style={styles.heading}>
            What's worth{'\n'}<Text style={styles.headingAccent}>saying today</Text>
          </Text>
          <Text style={styles.subtitle}>
            Researches today's news. Drafts tweets in your voice across three categories.
          </Text>
        </View>

        <TovSelector value={tov} onChange={setTov} />
        <TopicSelector value={topic} onChange={setTopic} />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={generate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <View style={styles.buttonInner}>
              <ActivityIndicator color={colors.bg} size="small" />
              <Text style={styles.buttonText}>Searching the web...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Research & Draft Tweets</Text>
          )}
        </TouchableOpacity>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && (
          <Text style={styles.loadingHint}>
            Researching today's news and drafting in your voice...
          </Text>
        )}

        {cards.length > 0 && (
          <View style={styles.cards}>
            {cards.map((card, i) => (
              <PostCard key={i} card={card} mode="tweet" />
            ))}
          </View>
        )}

        {cards.length > 0 && (
          <Text style={styles.footer}>
            Copy → paste into X/Twitter → post when ready
          </Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },

  header: {
    marginBottom: 28,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.blue,
  },
  eyebrowText: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  heading: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 32,
    color: colors.text,
    lineHeight: 36,
    marginBottom: 10,
  },
  headingAccent: {
    color: colors.blue,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
    lineHeight: 21,
  },

  button: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: colors.bg,
  },

  errorBox: {
    backgroundColor: '#1a0808',
    borderWidth: 1,
    borderColor: '#ff4b2b44',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.red,
    lineHeight: 19,
  },

  loadingHint: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingVertical: 24,
  },

  cards: {
    gap: 14,
  },

  footer: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 10,
    color: '#2a2a2a',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 28,
  },
});
