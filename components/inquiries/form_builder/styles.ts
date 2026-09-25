import { StyleSheet } from 'react-native';
import { fieldCardStyles } from './fieldCardStyles';

const builderBaseStyles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  headerContainer: { paddingTop: 12 },
  sectionHeading: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  triggerSelectorRow: { gap: 10, marginBottom: 16 },
  triggerCard: { borderRadius: 16, borderWidth: 1.5, padding: 14 },
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
});

export const styles = {
  ...builderBaseStyles,
  ...fieldCardStyles,
};
export { fieldCardStyles };
