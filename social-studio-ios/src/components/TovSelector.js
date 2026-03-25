import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { TOV_OPTIONS } from '../constants/prompts';
import { colors } from '../constants/theme';

export default function TovSelector({ value, onChange }) {
  return (
    <View style={styles.block}>
      <Text style={styles.label}>Tone of Voice</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {TOV_OPTIONS.map(opt => {
          const active = value === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onChange(active ? null : opt.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 14,
  },
  label: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 4,
  },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.surface2,
    borderColor: '#555',
  },
  pillText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.muted,
  },
  pillTextActive: {
    color: colors.text,
  },
});
