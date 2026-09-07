import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import { InquiryFieldModal } from './InquiryFieldModal';
import type {
  ChatInquiryTemplate,
  ChatInquiryTemplateField,
  FormTrigger,
} from '../../types/inquiries';
import { TRIGGER_META, FIELD_TYPE_LABELS } from '../../types/inquiries';

interface InquiryFormBuilderViewProps {
  template: ChatInquiryTemplate;
  selectedTrigger: FormTrigger;
  onSelectTrigger: (trigger: FormTrigger) => void;
  onToggleActive: () => void;
  onSaveMeta: (title: string, description: string) => void;
  onAddField: (field: Omit<ChatInquiryTemplateField, 'id' | 'templateId'>) => void;
  onUpdateField: (fieldId: string, patch: Partial<ChatInquiryTemplateField>) => void;
  onDeleteField: (fieldId: string) => void;
  onReorderField: (fieldId: string, direction: 'up' | 'down') => void;
}

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
  const colors = Colors[colorScheme];
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

  const renderFieldItem = ({ item, index }: { item: ChatInquiryTemplateField; index: number }) => {
    const isFirst = index === 0;
    const isLast = index === template.fields.length - 1;

    return (
      <View
        style={[
          styles.fieldCard,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? '#27272a' : colors.border,
          },
        ]}
      >
        <View style={styles.fieldHeader}>
          <View style={styles.orderBadge}>
            <Text style={styles.orderBadgeText}>{index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>{item.fieldLabel}</Text>
              {item.isRequired && <Text style={styles.requiredStar}>*Required</Text>}
            </View>
            <View style={styles.fieldTypePill}>
              <Text style={styles.fieldTypeText}>{FIELD_TYPE_LABELS[item.fieldType]}</Text>
            </View>
          </View>

          {/* Action buttons: Reorder, Edit, Delete */}
          <View style={styles.actionControls}>
            <TouchableOpacity
              disabled={isFirst}
              onPress={() => onReorderField(item.id, 'up')}
              style={[styles.miniBtn, isFirst && { opacity: 0.25 }]}
            >
              <Ionicons name="chevron-up" size={16} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isLast}
              onPress={() => onReorderField(item.id, 'down')}
              style={[styles.miniBtn, isLast && { opacity: 0.25 }]}
            >
              <Ionicons name="chevron-down" size={16} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleOpenEditModal(item)}
              style={styles.miniBtn}
            >
              <Ionicons name="pencil" size={14} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDeleteField(item.id)}
              style={styles.miniBtn}
            >
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {item.options && item.options.length > 0 && (
          <View style={styles.optionsPreview}>
            {item.options.map((opt, i) => (
              <View
                key={i}
                style={[
                  styles.optionChip,
                  { backgroundColor: isDark ? '#1f2937' : '#f0e5e9' },
                ]}
              >
                <Text style={[styles.optionChipText, { color: colors.primary }]}>{opt}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const listHeader = (
    <View style={styles.headerContainer}>
      {/* Trigger Selector Cards */}
      <Text style={[styles.sectionHeading, { color: colors.placeholder }]}>
        SELECT QUESTIONNAIRE FORM
      </Text>
      <View style={styles.triggerSelectorRow}>
        {(['tour', 'question'] as FormTrigger[]).map((trig) => {
          const meta = TRIGGER_META[trig];
          const isSelected = selectedTrigger === trig;
          return (
            <TouchableOpacity
              key={trig}
              onPress={() => onSelectTrigger(trig)}
              style={[
                styles.triggerCard,
                isSelected
                  ? {
                      borderColor: colors.primary,
                      backgroundColor: isDark ? 'rgba(74, 15, 31, 0.25)' : '#fdf6f8',
                    }
                  : {
                      borderColor: isDark ? '#27272a' : colors.border,
                      backgroundColor: colors.card,
                    },
              ]}
            >
              <View style={styles.triggerCardTop}>
                <Text
                  style={[
                    styles.triggerCardTitle,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}
                >
                  {meta.label}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: template.isActive ? '#10b981' : '#9ca3af' },
                  ]}
                />
              </View>
              <Text style={[styles.triggerCardSub, { color: colors.placeholder }]}>
                {meta.subtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Form Settings Card: Active Switch & Details */}
      <View
        style={[
          styles.formMetaCard,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? '#27272a' : colors.border,
          },
        ]}
      >
        <View style={styles.metaRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.metaCardTitle, { color: colors.text }]}>Form Status</Text>
            <Text style={[styles.metaCardSub, { color: colors.placeholder }]}>
              {template.isActive
                ? 'Active — displayed to clients on request'
                : 'Deactivated — temporarily hidden from chat'}
            </Text>
          </View>
          <Switch
            value={template.isActive}
            onValueChange={onToggleActive}
            trackColor={{ false: isDark ? '#3f3f46' : '#d1d5db', true: colors.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#27272a' : '#f0e5e9' }]} />

        {/* Title Input */}
        <Text style={[styles.fieldLabelSmall, { color: colors.placeholder }]}>FORM TITLE</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Form Title"
          placeholderTextColor={colors.placeholder}
          style={[
            styles.metaInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />

        {/* Description Input */}
        <Text style={[styles.fieldLabelSmall, { color: colors.placeholder, marginTop: 10 }]}>
          DESCRIPTION / INSTRUCTIONS
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Instructions shown to buyer..."
          placeholderTextColor={colors.placeholder}
          multiline
          style={[
            styles.metaInput,
            styles.metaInputMulti,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />

        <ScalePressable
          onPress={handleSaveDetails}
          style={[styles.saveMetaBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.saveMetaBtnText}>Save Form Details</Text>
        </ScalePressable>
      </View>

      {/* Fields List Header */}
      <View style={styles.fieldsSectionHeader}>
        <View>
          <Text style={[styles.fieldsTitle, { color: colors.text }]}>Form Fields</Text>
          <Text style={[styles.fieldsCount, { color: colors.placeholder }]}>
            {template.fields.length} questions configured
          </Text>
        </View>
        <ScalePressable
          onPress={handleOpenAddModal}
          style={[styles.addFieldBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.addFieldBtnText}>Add Field</Text>
        </ScalePressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={template.fields}
        keyExtractor={(item) => item.id}
        renderItem={renderFieldItem}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    paddingTop: 12,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  triggerSelectorRow: {
    gap: 10,
    marginBottom: 16,
  },
  triggerCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
  },
  triggerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  triggerCardSub: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },
  formMetaCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  metaCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  fieldLabelSmall: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  metaInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  metaInputMulti: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveMetaBtn: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveMetaBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  fieldsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  fieldsCount: {
    fontSize: 11,
    marginTop: 1,
  },
  addFieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 4,
  },
  addFieldBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  fieldCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 15, 31, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4a0f1f',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  requiredStar: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },
  fieldTypePill: {
    marginTop: 2,
  },
  fieldTypeText: {
    fontSize: 10,
    color: '#6b7280',
  },
  actionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniBtn: {
    padding: 6,
  },
  optionsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingLeft: 34,
  },
  optionChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  optionChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
