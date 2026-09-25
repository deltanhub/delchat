import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  useAudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import * as Haptics from '../../../lib/haptics';
import { AudioRecordingState } from './types';

export const formatRecordTime = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export function useAudioRecording(
  onSendVoiceNote?: (duration: number, audioUri?: string) => void
): AudioRecordingState {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;

  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimer = useRef<any>(null);

  // Safe audio recorder unmount cleanup
  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      if (isRecordingRef.current) {
        isRecordingRef.current = false;
        try {
          const rec = recorderRef.current;
          if (rec) {
            Promise.resolve(rec.stop()).catch(() => {});
          }
        } catch {
          // Native shared object may have already been released
        }
      }
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Microphone Access Required',
          'Please enable microphone access in settings to record voice notes.'
        );
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingSeconds(0);
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('[ChatComposer] Error starting recording:', err);
      Alert.alert('Recording Error', 'Unable to start audio recording on this device.');
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  const handleStopRecording = async (send: boolean) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const wasRecording = isRecordingRef.current;
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }

    let recordedUri: string | null = null;
    const finalDuration = Math.max(1, recordingSeconds);

    if (wasRecording) {
      try {
        let isNativeRecording = false;
        try {
          isNativeRecording = Boolean(recorder && recorder.isRecording);
        } catch {
          isNativeRecording = false;
        }

        if (isNativeRecording) {
          await recorder.stop().catch(() => {});
        }

        try {
          recordedUri = recorder.uri || null;
        } catch {
          recordedUri = null;
        }

        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        }).catch(() => {});
      } catch (err) {
        console.warn('[ChatComposer] Error stopping recording:', err);
      }
    }

    if (send && onSendVoiceNote && finalDuration > 0) {
      onSendVoiceNote(finalDuration, recordedUri || undefined);
    }
    setRecordingSeconds(0);
  };

  return {
    isRecording,
    recordingSeconds,
    handleStartRecording,
    handleStopRecording,
    formatRecordTime,
  };
}
