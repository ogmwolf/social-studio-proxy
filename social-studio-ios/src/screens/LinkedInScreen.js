import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { callAPI, callAPIHaiku } from '../api/anthropic';
import { LINKEDIN_SYSTEM, TOPIC_OPTIONS, buildSystemPrompt, buildCategoryResearchSystem, buildCategoryResearchMsg, pickLinkedInEnding } from '../constants/prompts';
import TovSelector from '../components/TovSelector';
import TopicSelector from '../components/TopicSelector';
import PostCard from '../components/PostCard';
import { colors } from '../constants/theme';

function buildGenerationPrompt(topics) {
  const count = topics.length === 1 ? '1 LinkedIn post' : `${topics.length} LinkedIn posts, one per topic`;
  const lines = topics.map((t, i) => `${i + 1}. [${t.topic}] ${t.headline}\nContext: ${t.context}`);
  return `Here are today's trending topics for LinkedIn:\n\n${lines.join('\n\n')}\n\nWrite ${count} in my voice. First line must hook. End with something inviting a response.`;
}

export default function LinkedInScreen() {
  const [cards, setCards]     = useState([]);
  const [phase, setPhase]     = useState(null); // null | 'researching' | 'drafting'
  const [error, setError]     = useState('');
  const [tov, setTov]         = useState(null);
  const [topic, setTopic]     = useState(null);

  const ALL_CATS = ['Tech & AI', 'Culture & Media', 'Brand & Marketing'];

  async function generate() {
    setPhase('researching');
    setError('');
    setCards([]);
    try {
      const cats = topic
        ? [TOPIC_OPTIONS.find(o => o.key === topic).value]
        : ALL_CATS;

      console.log('[LinkedIn] Researching categories:', cats);
      const settled = await Promise.all(
        cats.map(cat =>
          callAPIHaiku(buildCategoryResearchSystem(cat), buildCategoryResearchMsg(cat, tov))
            .catch(err => { console.warn(`[LinkedIn] Research failed for ${cat}:`, err.message); return null; })
        )
      );
      const topics = settled.filter(Boolean);
      if (topics.length === 0) throw new Error('All research calls failed');
      console.log('[LinkedIn] Research complete:', topics.map(t => t.topic).join(', '));

      setPhase('drafting');
      const ending = pickLinkedInEnding();
      const system = buildSystemPrompt(LINKEDIN_SYSTEM, { tov, topic })
        + `\n\nENDING STYLE FOR THIS GENERATION: ${ending.instruction} Follow this exactly for all ${topics.length} posts.`;
      const results = await callAPI(system, buildGenerationPrompt(topics), false);
      setCards(results);
    } catch (e) {
      setError(e.message === 'Request timed out — try again.' ? e.message : 'Generation failed. Check your connection and try again.');
      console.error('[LinkedIn] Error:', e);
    } finally {
      setPhase(null);
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
            <View style={[styles.dot, { backgroundColor: colors.linkedin }]} />
            <Text style={styles.eyebrowText}>LINKEDIN</Text>
          </View>
          <Text style={styles.heading}>
            Long-form{'\n'}<Text style={styles.headingAccent}>in your voice</Text>
          </Text>
          <Text style={styles.subtitle}>
            Researches today's news. Drafts LinkedIn posts in your voice.
          </Text>
        </View>

        <TovSelector value={tov} onChange={setTov} />
        <TopicSelector value={topic} onChange={setTopic} />

        <TouchableOpacity
          style={[styles.button, !!phase && styles.buttonDisabled]}
          onPress={generate}
          disabled={!!phase}
          activeOpacity={0.85}
        >
          {phase ? (
            <View style={styles.buttonInner}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.buttonText}>
                {phase === 'researching' ? 'Researching...' : 'Drafting...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Research & Draft Posts</Text>
          )}
        </TouchableOpacity>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!!phase && (
          <Text style={styles.loadingHint}>
            {phase === 'researching' ? "Finding today's stories..." : 'Writing your posts...'}
          </Text>
        )}

        {cards.length > 0 && (
          <View style={styles.cards}>
            {cards.map((card, i) => (
              <PostCard key={i} card={card} mode="linkedin" />
            ))}
          </View>
        )}

        {cards.length > 0 && (
          <Text style={styles.footer}>
            Copy → paste into LinkedIn → post when ready
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
    color: colors.linkedin,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
    lineHeight: 21,
  },

  button: {
    backgroundColor: colors.linkedin,
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
    color: '#ffffff',
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
