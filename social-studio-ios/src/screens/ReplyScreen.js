import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../auth/AuthContext';
import { callAPI } from '../api/anthropic';
import { fetchXSearch, hoursAgo } from '../api/twitter';
import { REPLY_SYSTEM, TRENDING_SYSTEM, buildSystemPrompt } from '../constants/prompts';
import TovSelector from '../components/TovSelector';
import { WATCH_ACCOUNTS } from '../constants/watchAccounts';
import { colors, topicColors } from '../constants/theme';

const TRENDING_QUERIES = [
  { q: '(AI OR "artificial intelligence") min_faves:200', topic: 'Tech & AI' },
  { q: '(marketing OR branding OR "brand strategy") min_faves:200', topic: 'Brand & Marketing' },
  { q: '(gaming OR "creator economy" OR "pop culture") min_faves:200', topic: 'Culture & Media' },
];

function getTimeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function cleanTweetText(text, entities) {
  if (!entities?.urls?.length) return text;
  let cleaned = text;
  for (const u of entities.urls) cleaned = cleaned.replace(u.url, '');
  return cleaned.trim();
}

// ── Tweet card ────────────────────────────────────────────────────────────────

function TweetCard({ tweet, isSelected, onPress }) {
  const topicColor = topicColors[tweet.topic] || colors.muted;
  const engStr = tweet.likes > 0 ? `${tweet.likes.toLocaleString()} likes` : 'Recent';
  const timeStr = tweet.created_at ? getTimeAgo(tweet.created_at) : '';

  return (
    <TouchableOpacity
      style={[styles.tweetCard, isSelected && styles.tweetCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.tweetMeta}>
        <Text style={styles.tweetAuthor}>{tweet.author}</Text>
        <View style={[styles.topicPill, { borderColor: topicColor }]}>
          <Text style={[styles.topicPillText, { color: topicColor }]}>{tweet.topic}</Text>
        </View>
        {tweet.tier === 2 && (
          <Text style={styles.tier2Label}>tier 2</Text>
        )}
      </View>
      <Text style={styles.tweetText} numberOfLines={5}>{tweet.tweet}</Text>
      <Text style={styles.tweetEng}>{timeStr ? `${timeStr} · ` : ''}{engStr}</Text>
    </TouchableOpacity>
  );
}

// ── Reply card ────────────────────────────────────────────────────────────────

function ReplyCard({ card }) {
  const [text, setText]     = useState(card.tweet);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied]   = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <View style={styles.replyCard}>
      <View style={styles.replyAnglePill}>
        <Text style={styles.replyAngleText}>{card.angle}</Text>
      </View>

      {editing ? (
        <TextInput
          style={styles.replyEditInput}
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          selectionColor={colors.blue}
          textAlignVertical="top"
        />
      ) : (
        <Text style={styles.replyText}>{text}</Text>
      )}

      {!!card.why && !editing && (
        <View style={styles.replyWhyWrap}>
          <Text style={styles.replyWhyText}>{card.why}</Text>
        </View>
      )}

      <View style={styles.replyActions}>
        <TouchableOpacity
          style={styles.replyEditBtn}
          onPress={() => setEditing(e => !e)}
          activeOpacity={0.7}
        >
          <Text style={styles.replyEditBtnText}>{editing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.replyCopyBtn, copied && styles.replyCopiedBtn]}
          onPress={handleCopy}
          activeOpacity={0.7}
        >
          <Text style={[styles.replyCopyBtnText, copied && styles.replyCopiedBtnText]}>
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ReplyScreen() {
  const { bearerToken } = useAuth();
  const [mode, setMode] = useState('watchlist');

  const [watchTweets, setWatchTweets]         = useState([]);
  const [trendTweets, setTrendTweets]         = useState([]);
  const [watchSelectedId, setWatchSelectedId] = useState(null); // tweet.id — stable through re-sorts
  const [trendIdx, setTrendIdx]               = useState(null); // index OK: Trending arrives all at once
  const [pasteText, setPasteText]     = useState('');
  const [replyCards, setReplyCards]   = useState([]);

  const [fetchLoading, setFetchLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [fetchError, setFetchError]     = useState('');
  const [replyError, setReplyError]     = useState('');
  const [tov, setTov]                   = useState(null);

  function switchMode(m) {
    setMode(m);
    setReplyCards([]);
    setReplyError('');
    setFetchError('');
  }

  const currentTweets = mode === 'watchlist' ? watchTweets : trendTweets;
  // Watch List: look up by ID so progressive re-sorts don't shift the selection.
  // Trending: index-safe (full list arrives atomically; Claude fallback lacks IDs).
  const selected =
    mode === 'watchlist' ? (watchTweets.find(t => t.id === watchSelectedId) ?? null)
    : mode === 'trending' ? (trendTweets[trendIdx] ?? null)
    : null;
  const canDraft = mode === 'paste' ? pasteText.trim().length > 0 : selected !== null;

  async function fetchWatchList() {
    setFetchLoading(true);
    setFetchError('');
    setWatchTweets([]);
    setWatchSelectedId(null);
    setReplyCards([]);

    const since = hoursAgo(24);
    let totalFound = 0;

    // Fire all 10 account fetches in parallel. Each one updates the list
    // immediately as it resolves so results appear progressively.
    const promises = WATCH_ACCOUNTS.map(acct =>
      fetchXSearch(`from:${acct.handle}`, bearerToken, 5, since)
        .then(data => {
          if (!data.data?.length) return;
          const items = data.data.slice(0, 5).map(t => ({
            id:         t.id,
            tweet:      cleanTweetText(t.text, t.entities),
            author:     `@${acct.handle}`,
            topic:      acct.topic,
            tier:       acct.tier,
            likes:      t.public_metrics?.like_count || 0,
            replies:    t.public_metrics?.reply_count || 0,
            created_at: t.created_at,
          }));
          totalFound += items.length;
          setWatchTweets(prev => {
            const merged = [...prev, ...items];
            merged.sort((a, b) => {
              if (a.tier !== b.tier) return a.tier - b.tier;
              return (b.likes + b.replies * 2) - (a.likes + a.replies * 2);
            });
            return merged;
          });
        })
        .catch(e => console.log('[WatchList] Failed for', acct.handle, e.message))
    );

    await Promise.allSettled(promises);

    if (totalFound === 0) {
      setFetchError('No tweets found in the last 24 hours. Try again later.');
    }
    setFetchLoading(false);
  }

  async function fetchTrending() {
    setFetchLoading(true);
    setFetchError('');
    setTrendTweets([]);
    setTrendIdx(null);
    setReplyCards([]);

    try {
      const all = [];
      for (const q of TRENDING_QUERIES) {
        try {
          const data = await fetchXSearch(q.q, bearerToken, 5);
          if (data.data?.length) {
            const users = {};
            (data.includes?.users || []).forEach(u => { users[u.id] = u; });
            data.data.forEach(t => {
              all.push({
                id:      t.id,
                tweet:   cleanTweetText(t.text, t.entities),
                author:  users[t.author_id] ? `@${users[t.author_id].username}` : '@unknown',
                topic:   q.topic,
                likes:   t.public_metrics?.like_count || 0,
                replies: t.public_metrics?.reply_count || 0,
              });
            });
          }
        } catch (e) {
          console.log('[Trending] Query failed:', q.topic, e.message);
        }
      }

      if (all.length > 0) {
        all.sort((a, b) => (b.likes + b.replies * 2) - (a.likes + a.replies * 2));
        setTrendTweets(all.slice(0, 8));
      } else {
        console.log('[Trending] X API empty, falling back to Claude');
        const results = await callAPI(
          TRENDING_SYSTEM,
          'Search the web RIGHT NOW for the hottest conversations and debates in Tech & AI, Culture & Media, and Brand & Marketing. What are people arguing about, reacting to, or talking about today?'
        );
        setTrendTweets(results);
      }
    } catch (e) {
      setFetchError(e.message.includes('timed out') ? 'Request timed out — try again.' : 'Could not load tweets. Check your connection and try again.');
      console.error('[Trending] Error:', e);
    }
    setFetchLoading(false);
  }

  async function draftReply() {
    if (!canDraft) return;
    setReplyLoading(true);
    setReplyError('');
    setReplyCards([]);

    try {
      const sourceText   = mode === 'paste' ? pasteText.trim() : selected.tweet;
      const sourceAuthor = mode === 'paste' ? '' : selected.author;
      const msg = sourceAuthor
        ? `Write 3 reply options to this:\n\n"${sourceText}"\n\nSource: ${sourceAuthor}`
        : `Write 3 reply options to this tweet:\n\n"${sourceText}"`;

      const system = buildSystemPrompt(REPLY_SYSTEM, { tov });
      const results = await callAPI(system, msg, false);
      setReplyCards(results);
    } catch (e) {
      setReplyError(e.message === 'Request timed out — try again.' ? e.message : 'Generation failed. Check your connection and try again.');
      console.error('[Reply] Error:', e);
    }
    setReplyLoading(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.eyebrow}>
              <View style={styles.dot} />
              <Text style={styles.eyebrowText}>REPLY</Text>
            </View>
            <Text style={styles.heading}>
              Reply in{'\n'}<Text style={styles.headingAccent}>your voice</Text>
            </Text>
            <Text style={styles.subtitle}>
              Find tweets worth replying to. Draft 3 sharp options instantly.
            </Text>
          </View>

          {/* Mode selector */}
          <View style={styles.modeSelector}>
            {[
              { key: 'watchlist', label: 'Watch List' },
              { key: 'trending',  label: 'Trending'   },
              { key: 'paste',     label: 'Paste'      },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.modeTab, mode === key && styles.modeTabActive]}
                onPress={() => switchMode(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeTabText, mode === key && styles.modeTabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Watch List & Trending ── */}
          {(mode === 'watchlist' || mode === 'trending') && (
            <View>
              <TouchableOpacity
                style={[styles.button, fetchLoading && styles.buttonDisabled]}
                onPress={mode === 'watchlist' ? fetchWatchList : fetchTrending}
                disabled={fetchLoading}
                activeOpacity={0.85}
              >
                {fetchLoading ? (
                  <View style={styles.buttonInner}>
                    <ActivityIndicator color={colors.bg} size="small" />
                    <Text style={styles.buttonText}>
                      {mode === 'watchlist' ? 'Fetching tweets...' : 'Finding trending...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>
                    {mode === 'watchlist' ? 'Fetch Watch List Tweets' : 'Find Trending Tweets'}
                  </Text>
                )}
              </TouchableOpacity>

              {!!fetchError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{fetchError}</Text>
                </View>
              )}

              {fetchLoading && (
                <Text style={styles.loadingHint}>
                  {mode === 'watchlist'
                    ? 'Fetching from your watch list...'
                    : 'Searching X for trending conversations...'}
                </Text>
              )}

              {currentTweets.length > 0 && (
                <View>
                  <Text style={styles.sectionLabel}>TAP A TWEET TO REPLY TO IT</Text>
                  {currentTweets.map((tweet, i) => (
                    <TweetCard
                      key={tweet.id || i}
                      tweet={tweet}
                      isSelected={mode === 'watchlist' ? tweet.id === watchSelectedId : trendIdx === i}
                      onPress={() => {
                        if (mode === 'watchlist') setWatchSelectedId(tweet.id);
                        else setTrendIdx(i);
                        setReplyCards([]);
                        setReplyError('');
                      }}
                    />
                  ))}
                </View>
              )}

              {selected && (
                <View style={styles.selectedPreview}>
                  <Text style={styles.selectedLabel}>REPLYING TO {selected.author}</Text>
                  <Text style={styles.selectedText}>{selected.tweet}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Paste ── */}
          {mode === 'paste' && (
            <View>
              <Text style={styles.sectionLabel}>PASTE ANY TWEET</Text>
              <TextInput
                style={styles.pasteInput}
                value={pasteText}
                onChangeText={t => { setPasteText(t); setReplyCards([]); setReplyError(''); }}
                placeholder="Paste tweet text here..."
                placeholderTextColor="#2a2a2a"
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

          {/* TOV selector */}
          <TovSelector value={tov} onChange={setTov} />

          {/* Draft Reply button */}
          {(mode === 'paste' || selected) && (
            <TouchableOpacity
              style={[styles.replyButton, (!canDraft || replyLoading) && styles.buttonDisabled]}
              onPress={draftReply}
              disabled={!canDraft || replyLoading}
              activeOpacity={0.85}
            >
              {replyLoading ? (
                <View style={styles.buttonInner}>
                  <ActivityIndicator color={colors.bg} size="small" />
                  <Text style={styles.buttonText}>Drafting reply...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Draft Reply in My Voice</Text>
              )}
            </TouchableOpacity>
          )}

          {!!replyError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{replyError}</Text>
            </View>
          )}

          {/* Reply cards */}
          {replyCards.length > 0 && (
            <View style={styles.replySection}>
              <Text style={styles.sectionLabel}>3 REPLY OPTIONS</Text>
              {replyCards.map((card, i) => (
                <ReplyCard key={i} card={card} />
              ))}
              <Text style={styles.footer}>
                Copy → paste into X/Twitter to reply
              </Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

  // Header
  header: {
    marginBottom: 24,
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

  // Mode selector — segmented control
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
    marginBottom: 24,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: colors.blue,
  },
  modeTabText: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 10,
    letterSpacing: 1,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  modeTabTextActive: {
    color: colors.bg,
  },

  // Buttons
  button: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 16,
  },
  replyButton: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
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

  // Error box
  errorBox: {
    backgroundColor: '#1a0808',
    borderWidth: 1,
    borderColor: '#ff4b2b44',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.red,
    lineHeight: 19,
  },

  // Loading hint
  loadingHint: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingVertical: 24,
  },

  // Section label
  sectionLabel: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Tweet cards
  tweetCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  tweetCardSelected: {
    borderColor: colors.blue,
    backgroundColor: '#0d1f2e',
  },
  tweetMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  tweetAuthor: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#f472b6',
  },
  topicPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  topicPillText: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tier2Label: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 9,
    color: '#333',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tweetText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 22,
    marginBottom: 10,
  },
  tweetEng: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 10,
    color: '#333',
  },

  // Selected preview
  selectedPreview: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  selectedLabel: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  selectedText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#aaaaaa',
    lineHeight: 22,
  },

  // Paste input
  pasteInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 23,
    minHeight: 130,
    marginBottom: 16,
  },

  // Reply section
  replySection: {
    marginTop: 8,
  },
  replyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  replyAnglePill: {
    backgroundColor: `${colors.blue}1A`,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  replyAngleText: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 9,
    letterSpacing: 1,
    color: colors.blue,
    textTransform: 'uppercase',
  },
  replyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#e0e0e0',
    lineHeight: 26,
    marginBottom: 10,
  },
  replyEditInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    minHeight: 90,
    textAlignVertical: 'top',
    backgroundColor: '#0a0a0a',
  },
  replyWhyWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginBottom: 14,
  },
  replyWhyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#383838',
    lineHeight: 17,
  },
  replyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  replyEditBtn: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  replyEditBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.muted,
  },
  replyCopyBtn: {
    flex: 1,
    backgroundColor: '#0d2137',
    borderWidth: 1,
    borderColor: '#1d9bf022',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  replyCopiedBtn: {
    backgroundColor: '#0a2a15',
    borderColor: '#2ec4b622',
  },
  replyCopyBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.blue,
  },
  replyCopiedBtnText: {
    color: colors.green,
  },

  footer: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 10,
    color: '#2a2a2a',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 20,
  },
});
