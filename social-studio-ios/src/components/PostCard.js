import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, typeColors, typeLabels, topicColors } from '../constants/theme';

// mode: "tweet" | "linkedin"
export default function PostCard({ card, mode }) {
  const content = mode === 'linkedin' ? card.post : card.tweet;
  const [editing, setEditing]   = useState(false);
  const [text, setText]         = useState(content);
  const [copied, setCopied]     = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const typeColor  = typeColors[card.type]   || colors.purple;
  const topicColor = topicColors[card.topic] || colors.muted;

  return (
    <View style={styles.card}>
      {/* Labels row */}
      <View style={styles.labels}>
        {card.type && (
          <View style={[styles.badge, { borderColor: typeColor }]}>
            <Text style={[styles.badgeText, { color: typeColor }]}>
              {typeLabels[card.type] || card.type}
            </Text>
          </View>
        )}
        {card.topic && (
          <View style={[styles.badge, { borderColor: topicColor }]}>
            <Text style={[styles.badgeText, { color: topicColor }]}>
              {card.topic}
            </Text>
          </View>
        )}
      </View>

      {/* Headline */}
      {card.headline && (
        <Text style={styles.headline}>{card.headline}</Text>
      )}

      {/* Post content — editable or static */}
      {editing ? (
        <TextInput
          style={styles.editInput}
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          selectionColor={colors.blue}
        />
      ) : (
        <Text style={styles.content}>{text}</Text>
      )}

      {/* Char count for tweets */}
      {mode === 'tweet' && !editing && (
        <Text style={[
          styles.charCount,
          text.length > 280 && styles.charCountOver,
        ]}>
          {text.length}/280
        </Text>
      )}

      {/* Angle / why */}
      {card.angle && !editing && (
        <Text style={styles.angle}>{card.angle}</Text>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setEditing(e => !e)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionText}>{editing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.copyBtn, copied && styles.copiedBtn]}
          onPress={handleCopy}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, styles.copyText]}>
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  labels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: 'DM_Mono_500Medium',
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: 'DM_Mono_500Medium',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  content: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  editInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: 'DM_Mono_500Medium',
    fontSize: 10,
    color: colors.muted,
    marginBottom: 8,
  },
  charCountOver: {
    color: colors.red,
  },
  angle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  copyBtn: {
    borderColor: colors.blue,
  },
  copiedBtn: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  copyText: {
    color: colors.blue,
  },
});
