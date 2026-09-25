import { useState, useEffect, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as Haptics from '../../../../lib/haptics';
import {
  ChatMessage,
  WAVEFORM_BAR_HEIGHTS,
  registerAudioPlayback,
  stopAudioPlayback,
  subscribeAudioPlayback,
} from '../types';
import { PlaybackSpeed, VoiceNotePlayerState } from './types';
import {
  formatAudioTime,
  resolveVoiceNoteDuration,
  resolveVoiceNoteAudioUri,
} from './voiceNoteUtils';

export { formatAudioTime };

export function useVoiceNotePlayer(message: ChatMessage): VoiceNotePlayerState {
  const duration = resolveVoiceNoteDuration(message);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const playbackTimerRef = useRef<any>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  const audioUri = resolveVoiceNoteAudioUri(message);

  useEffect(() => {
    return subscribeAudioPlayback((activeMessageId) => {
      if (activeMessageId !== message.id && isPlaying) {
        setIsPlaying(false);
        try { playerRef.current?.pause(); } catch {}
        if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      }
    });
  }, [message.id, isPlaying]);

  useEffect(() => {
    return () => {
      stopAudioPlayback(message.id);
      try {
        playerRef.current?.pause();
        playerRef.current?.release();
      } catch {}
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [message.id]);

  const handleTogglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      setIsPlaying(false);
      stopAudioPlayback(message.id);
      try { playerRef.current?.pause(); } catch {}
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      return;
    }

    setIsPlaying(true);
    registerAudioPlayback({
      messageId: message.id,
      player: playerRef.current,
      pause: () => {
        setIsPlaying(false);
        try { playerRef.current?.pause(); } catch {}
        if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      },
    });

    if (audioUri) {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });

        if (!playerRef.current) {
          const player = createAudioPlayer(audioUri, { updateInterval: 100 });
          player.setPlaybackRate(playbackSpeed);
          player.addListener('playbackStatusUpdate', (status) => {
            if (status.isLoaded) {
              if (status.currentTime !== undefined) setPlaybackSeconds(status.currentTime);
              if (status.didJustFinish) {
                setIsPlaying(false);
                stopAudioPlayback(message.id);
                setPlaybackSeconds(0);
                playerRef.current?.seekTo(0).catch(() => {});
              }
            }
          });
          playerRef.current = player;
          player.play();
          return;
        } else {
          playerRef.current.setPlaybackRate(playbackSpeed);
          playerRef.current.play();
          return;
        }
      } catch (err) {
        console.warn('Error playing audio sound:', err);
      }
    }

    const intervalMs = 250 / playbackSpeed;
    playbackTimerRef.current = setInterval(() => {
      setPlaybackSeconds((prev) => {
        const next = prev + 0.25;
        if (next >= duration) {
          setIsPlaying(false);
          stopAudioPlayback(message.id);
          if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
          return 0;
        }
        return next;
      });
    }, intervalMs);
  };

  const handleCycleSpeed = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextSpeed: PlaybackSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    try { playerRef.current?.setPlaybackRate(nextSpeed); } catch {}
  };

  const progressRatio = duration > 0 ? playbackSeconds / duration : 0;
  const activeBarsCount = Math.floor(progressRatio * WAVEFORM_BAR_HEIGHTS.length);

  return {
    isPlaying,
    playbackSeconds,
    playbackSpeed,
    duration,
    activeBarsCount,
    audioUri,
    playerRef,
    handleTogglePlay,
    handleCycleSpeed,
    formatAudioTime,
  };
}
