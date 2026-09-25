import React from 'react';
import {
  View,
  Modal,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import {
  InquiryFormField,
  SelectedInquiryTemplate,
  InquiryFormModalProps,
  styles,
  useInquiryTemplates,
  InquiryFormHeader,
  InquiryFormEmptyState,
  InquiryTemplateCard,
  InquiryFormLegalNotice,
} from './inquiry_form';

export {
  InquiryFormField,
  SelectedInquiryTemplate,
  InquiryFormModalProps,
} from './inquiry_form';

export default function InquiryFormModal({
  visible,
  onClose,
  onSelectTemplate,
}: InquiryFormModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
    templates,
    loading,
    handleSelect,
  } = useInquiryTemplates({ visible, onSelectTemplate, onClose });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#141416' : '#ffffff',
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <InquiryFormHeader
            onClose={onClose}
            textColor={colors.text}
            placeholderColor={colors.placeholder}
            isDark={isDark}
          />

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : templates.length === 0 ? (
            <InquiryFormEmptyState
              textColor={colors.text}
              placeholderColor={colors.placeholder}
            />
          ) : (
            <FlatList
              data={templates}
              keyExtractor={(item) => item.templateId}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <InquiryTemplateCard
                  item={item}
                  onSelect={handleSelect}
                  textColor={colors.text}
                  placeholderColor={colors.placeholder}
                  primaryColor={colors.primary}
                  primarySoftColor={colors.primarySoft}
                  isDark={isDark}
                />
              )}
              contentContainerStyle={{ padding: 16 }}
            />
          )}

          <InquiryFormLegalNotice
            primaryColor={colors.primary}
            isDark={isDark}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
