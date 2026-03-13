import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, typeColors, typeLabels, topicColors } from '../constants/theme';

// mode: "tweet" | "linkedin"
export default function PostCard({ card, mode }) {
  const content = mode === 'linkedin' ? card.post : card.tweet;
  const [editing, setEditing] = useState(false);
  const [text, setText]       = useState(content);
  const [copied, setCopied]   = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const typeColor  = typeColors[card.type]   || colors.purple;
  const topicColor = topicColors[card.topic] || colors.muted;

  return (
    <View style={styles.card}>

      {/* Tags — pill shape */}
      <View style={styles.tags}>
        {card.type && (
          <View style={[styles.tag, { borderColor: typeColor }]}>
            <Text style={[styles.tagText, { color: typeColor }]}>
              {typeLabels[card.type] || card.type}
            </Text>
          </View>
        )}
        {card.topic && (
          <View style={[styles.tag, { borderColor: topicColor }]}>
            <Text style={[styles.tagText, { color: topicColor }]}>
              {card.topic}
            </Text>
          </View>
        )}
      </View>

      {/* Headline — very dim, editorial */}
      {card.headline && (
        <Text style={styles.headline}>{card.headline}</Text>
      )}

      {/* Content */}
      {editing ? (
        <TextInput
          style={styles.editInput}
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          selectionColor={colors.blue}
          textAlignVertical="top"
        />
      ) : (
        <Text style={styles.content}>{text}</Text>
      )}

      {/* Char count — tweets only */}
      {mode === 'tweet' && !editing && (
        <Text style={[styles.charCount, text.length > 280 && styles.charCountOver]}>
          {text.length}/280
        </Text>
      )}

      {/* Angle — rule separator + very dim text */}
      {card.angle && !editing && (
        <View style={styles.angleWrap}>
          <Text style={styles.angleText}>{card.angle}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setEditing(e => !e)}
          activeOpacity={0.7}
        >
          <Text style={styles.editBtnText}>{editing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.copyBtn, copied && styles.copiedBtn]}
          onPress={handleCopy}
          activeOpacity={0.7}
        >
          <Text style={[styles.copyBtnText, copied && styles.copiedBtnText]}>
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
    borderRadius: 16,
    padding: 20,
  },

  // Tags — pill shaped, matching web
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Headline — very dim
  headline: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 10,
    color: '#3a3a3a',
    letterSpacing: 0.5,
    lineHeight: 15,
    marginBottom: 12,
  },

  // Body
  content: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#e0e0e0',
    lineHeight: 26,
    marginBottom: 10,
  },
  editInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#0a0a0a',
  },

  // Char count
  charCount: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 10,
    color: '#3a3a3a',
    marginBottom: 10,
  },
  charCountOver: {
    color: colors.red,
  },

  // Angle — rule + very dim text, matching web `.angle`
  angleWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginBottom: 14,
  },
  angleText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#383838',
    lineHeight: 17,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  editBtn: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  editBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.muted,
  },
  // Copy — blue-tinted bg by default, green when copied (matches web)
  copyBtn: {
    flex: 1,
    backgroundColor: '#0d2137',
    borderWidth: 1,
    borderColor: '#1d9bf022',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  copiedBtn: {
    backgroundColor: '#0a2a15',
    borderColor: '#2ec4b622',
  },
  copyBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.blue,
  },
  copiedBtnText: {
    color: colors.green,
  },
});
