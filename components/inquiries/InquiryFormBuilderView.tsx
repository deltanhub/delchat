import React, { useState, useEffect } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import { InquiryFieldModal } from './InquiryFieldModal';
import type {
  ChatInquiryTemplateField,
} from '../../types/inquiries';
import {
  FormBuilderTriggerCards,
  FormBuilderMetaCard,
  FormBuilderFieldsHeader,
  FormBuilderFieldCard,
  styles,
} from './form_builder';
import type { InquiryFormBuilderViewProps } from './form_builder/types';

export type { InquiryFormBuilderViewProps };

export const InquiryFormBuilderView: React.FC<InquiryFormBuilderViewProps> = ({
  template,
  selectedTrigger,
  onSelectTrigger,
  onToggleActive,
  onSaveMeta,
  onAddField,
  onUpdateField,
  onDeleteField,
  onReorderField,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [title, setTitle] = useState(template.title);
  const [description, setDescription] = useState(template.description || '');
  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<ChatInquiryTemplateField | null>(null);

  useEffect(() => {
    setTitle(template.title);
    setDescription(template.description || '');
  }, [template]);

  const handleSaveDetails = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Form title cannot be empty.');
      return;
    }
    onSaveMeta(title.trim(), description.trim());
  };

  const handleOpenAddModal = () => {
    setEditingField(null);
    setFieldModalVisible(true);
  };

  const handleOpenEditModal = (field: ChatInquiryTemplateField) => {
    setEditingField(field);
    setFieldModalVisible(true);
  };

  const handleSaveField = (fieldData: Omit<ChatInquiryTemplateField, 'id' | 'templateId'>) => {
    if (editingField) {
      onUpdateField(editingField.id, fieldData);
    } else {
      onAddField(fieldData);
    }
  };

  const listHeader = (
    <View style={styles.headerContainer}>
      <FormBuilderTriggerCards
        selectedTrigger={selectedTrigger}
        isActive={template.isActive}
        onSelectTrigger={onSelectTrigger}
        isDark={isDark}
      />
      <FormBuilderMetaCard
        title={title}
        description={description}
        isActive={template.isActive}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onToggleActive={onToggleActive}
        onSaveDetails={handleSaveDetails}
        isDark={isDark}
      />
      <FormBuilderFieldsHeader
        fieldsCount={template.fields.length}
        onOpenAddModal={handleOpenAddModal}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={template.fields}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <FormBuilderFieldCard
            item={item}
            index={index}
            totalFields={template.fields.length}
            isDark={isDark}
            onReorderField={onReorderField}
            onOpenEditModal={handleOpenEditModal}
            onDeleteField={onDeleteField}
          />
        )}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <InquiryFieldModal
        visible={fieldModalVisible}
        initialField={editingField}
        onClose={() => setFieldModalVisible(false)}
        onSave={handleSaveField}
      />
    </View>
  );
};
