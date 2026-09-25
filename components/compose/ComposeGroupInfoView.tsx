import React from 'react';
import { View, Text, TextInput, ScrollView, Image } from 'react-native';
import ScalePressable from '../ScalePressable';
import { ComposeGroupInfoViewProps } from './types';
import { groupInfoStyles } from './groupInfoStyles';

export default function ComposeGroupInfoView({
  groupName,
  onChangeGroupName,
  selectedContacts,
  isSubmitting,
  colors,
  onCreateGroup,
}: ComposeGroupInfoViewProps) {
  const isCreateDisabled = !groupName.trim() || isSubmitting;

  return (
    <ScrollView contentContainerStyle={groupInfoStyles.infoScroll} keyboardShouldPersistTaps="handled">
      {/* Group Avatar Preview */}
      <View style={groupInfoStyles.avatarPreviewContainer}>
        <View style={[groupInfoStyles.groupAvatarPreview, { backgroundColor: colors.primarySoft }]}>
          <Text style={[groupInfoStyles.groupAvatarLetter, { color: colors.primary }]}>
            {groupName ? groupName.slice(0, 2).toUpperCase() : 'GP'}
          </Text>
        </View>
        <Text style={[groupInfoStyles.avatarPreviewLabel, { color: colors.placeholder }]}>
          Group Avatar Preview
        </Text>
      </View>

      {/* Group Subject Name input */}
      <View style={groupInfoStyles.inputContainer}>
        <Text style={[groupInfoStyles.inputLabel, { color: colors.placeholder }]}>
          GROUP SUBJECT / NAME
        </Text>
        <TextInput
          value={groupName}
          onChangeText={onChangeGroupName}
          placeholder="e.g. Sales Team, Marketing Discussion"
          placeholderTextColor={colors.placeholder}
          maxLength={60}
          style={[
            groupInfoStyles.inputField,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
          ]}
          accessibilityLabel="Group subject or name"
        />
      </View>

      {/* Selected Members Summary */}
      <View style={groupInfoStyles.membersSummaryContainer}>
        <Text style={[groupInfoStyles.inputLabel, { color: colors.placeholder }]}>
          MEMBERS ({selectedContacts.length})
        </Text>
        <View style={[groupInfoStyles.membersSummaryList, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {selectedContacts.map((contact) => (
            <View key={contact.userId} style={groupInfoStyles.summaryItem}>
              {contact.avatarUrl ? (
                <Image source={{ uri: contact.avatarUrl }} style={groupInfoStyles.summaryAvatar} />
              ) : (
                <View style={[groupInfoStyles.summaryAvatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[groupInfoStyles.summaryAvatarLetter, { color: colors.primary }]}>
                    {contact.fullName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={[groupInfoStyles.summaryName, { color: colors.text }]} numberOfLines={1}>
                {contact.fullName}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Submit Group Button */}
      <ScalePressable
        onPress={onCreateGroup}
        disabled={isCreateDisabled}
        style={[
          groupInfoStyles.createGroupButton,
          {
            backgroundColor: colors.primary,
            opacity: isCreateDisabled ? 0.6 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Create Group"
      >
        <Text style={groupInfoStyles.createGroupButtonText}>Create Group</Text>
      </ScalePressable>
    </ScrollView>
  );
}
