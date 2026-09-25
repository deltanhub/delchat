import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from '../../../lib/haptics';

export function useMediaPickerActions(
  isPickingActiveRef: React.MutableRefObject<boolean>,
  openMediaPreview: (assets: ImagePicker.ImagePickerAsset[]) => void
) {
  const handlePickMedia = useCallback(async () => {
    if (isPickingActiveRef.current) return;
    isPickingActiveRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow media library access to send attachments.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        openMediaPreview(result.assets);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('cancelled') || msg.includes('canceled')) return;
      Alert.alert('Media Error', msg);
    } finally {
      setTimeout(() => {
        isPickingActiveRef.current = false;
      }, 400);
    }
  }, [isPickingActiveRef, openMediaPreview]);

  const handleLaunchCamera = useCallback(async () => {
    if (isPickingActiveRef.current) return;
    isPickingActiveRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow camera access to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        openMediaPreview(result.assets);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('cancelled') || msg.includes('canceled')) return;
      Alert.alert('Camera Error', msg);
    } finally {
      setTimeout(() => {
        isPickingActiveRef.current = false;
      }, 400);
    }
  }, [isPickingActiveRef, openMediaPreview]);

  return {
    handlePickMedia,
    handleLaunchCamera,
  };
}
