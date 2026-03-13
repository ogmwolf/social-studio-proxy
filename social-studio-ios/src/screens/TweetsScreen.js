import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { callAPI } from '../api/anthropic';
import { ORIG_SYSTEM } from '../constants/prompts';
import PostCard from '../components/PostCard';
import { colors } from '../constants/theme';

const PROMPT_MSG = `Search the web for the most interesting stories from TODAY across Tech & AI, Culture & Media, and Brand & Marketing. Write 5 tweets in my voice — mix of types. Punchy, human, worth reading.`;

export default function TweetsScreen() {
  const [cards, setCards]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function generate() {
    setLoading(true);
    setError('');
    setCards([]);
    try {
      const results = await callAPI(ORIG_SYSTEM, PROMPT_MSG, true);
      setCards(results);
    } catch (e) {
      setError('Something went wrong — try again.');
      console.error('TweetsScreen error:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
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
            Researches today's news. Drafts 5 tweets in your voice across three categories.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={generate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? (
              <View style={styles.buttonInner}>
                <ActivityIndicator color={colors.bg} size="small" />
                <Text style={styles.buttonText}>Researching...</Text>
              </View>
            )
            : <Text style={styles.buttonText}>Generate Tweets</Text>
          }
        </TouchableOpacity>

        {!!error && <Text style={styles.error}>{error}</Text>}

        {cards.length > 0 && (
          <View style={styles.cards}>
            {cards.map((card, i) => (
              <PostCard key={i} card={card} mode="tweet" />
            ))}
          </View>
        )}

        {cards.length > 0 && (
          <Text style={styles.footer}>
            Copy → paste into X/Twitter → schedule or post when ready
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 24,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.blue,
  },
  eyebrowText: {
    fontFamily: 'DM_Mono_500Medium',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  heading: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 28,
    color: colors.text,
    lineHeight: 32,
    marginBottom: 8,
  },
  headingAccent: {
    color: colors.blue,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.blue,
    borderRadius: 10,
    paddingVertical: 16,
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
  error: {
    fontFamily: 'DM_Mono_500Medium',
    fontSize: 11,
    color: colors.red,
    marginBottom: 16,
  },
  cards: {
    gap: 12,
  },
  footer: {
    fontFamily: 'DM_Mono_500Medium',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 24,
  },
});
