import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WatermarkOverlayProps {
  text?: string;
  type?: 'property' | 'floor_plan';
  publisherName?: string | null;
  opacity?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
}

/**
 * Universal Watermark Overlay for Property Photos and Floor Plans.
 * Matches DeltanHub Web WebWatermarkOverlay parity.
 */
export { WatermarkOverlay };
export default function WatermarkOverlay({
  text,
  type = 'property',
  publisherName,
  opacity = 0.28,
  size = 'md',
}: WatermarkOverlayProps) {
  const watermarkText =
    type === 'floor_plan'
      ? (publisherName || text || 'Authorized Publisher').toLowerCase()
      : (text || 'deltanhub').toLowerCase();

  const isExtraSmall = size === 'xs';
  const isSmall = size === 'sm' || size === 'small';
  const isLarge = size === 'lg' || size === 'large';
  const fontSize = isExtraSmall ? 9 : isSmall ? 12 : isLarge ? 22 : 16;
  const letterSpacing = isExtraSmall ? 1 : isSmall ? 1.5 : isLarge ? 3 : 2;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.watermarkCenter, { opacity }]}>
        <Text
          style={[
            styles.watermarkText,
            {
              fontSize,
              letterSpacing,
            },
          ]}
        >
          {watermarkText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  watermarkCenter: {
    transform: [{ rotate: '-18deg' }],
  },
  watermarkText: {
    color: '#ffffff',
    fontWeight: '800',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
