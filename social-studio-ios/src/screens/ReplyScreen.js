// Reply tab — placeholder. Full implementation in next sprint.
// Will include: Watch List (X API), Trending (web search fallback), Paste-any-tweet.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function ReplyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Reply</Text>
      <Text style={styles.sub}>Watch List, Trending, and Paste — coming next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  label: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 8,
  },
  sub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});
