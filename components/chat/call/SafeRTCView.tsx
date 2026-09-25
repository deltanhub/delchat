import React, { useEffect, useRef } from 'react';
import { Platform, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { detectNativeWebRTC } from '../../../lib/webrtc/nativeWebRTCDetector';

export interface SafeRTCViewProps {
  stream?: any;
  style?: StyleProp<ViewStyle>;
  objectFit?: 'cover' | 'contain';
  mirror?: boolean;
  zOrder?: number;
  fallback?: React.ReactNode;
}

export const SafeRTCView: React.FC<SafeRTCViewProps> = ({
  stream,
  style,
  objectFit = 'cover',
  mirror = false,
  zOrder = 0,
  fallback = null,
}) => {
  const videoRef = useRef<any>(null);
  const { isAvailable, nativeWebRTC } = detectNativeWebRTC();

  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return <View style={style}>{fallback}</View>;
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={mirror}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            transform: mirror ? 'scaleX(-1)' : 'none',
          } as any}
        />
      </View>
    );
  }

  if (isAvailable && nativeWebRTC?.RTCView) {
    const RTCViewComponent = nativeWebRTC.RTCView;
    const streamURL =
      typeof stream?.toURL === 'function'
        ? stream.toURL()
        : typeof stream === 'string'
        ? stream
        : stream?.id;
    if (streamURL) {
      return (
        <RTCViewComponent
          streamURL={streamURL}
          style={style || StyleSheet.absoluteFill}
          objectFit={objectFit}
          mirror={mirror}
          zOrder={zOrder}
          zOrderMediaOverlay={zOrder > 0}
        />
      );
    }
  }

  return <View style={style}>{fallback}</View>;
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
