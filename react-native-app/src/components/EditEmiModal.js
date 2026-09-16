import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';

export const EditEmiModal = ({ visible, emi, onClose, onSave }) => {
  const [emiDate, setEmiDate] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [status, setStatus] = useState('Upcoming');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emi) {
      setEmiDate(emi.emiDate || '');
      setEmiAmount(String(emi.emiAmount || ''));
      setPaidAmount(String(emi.paidAmount || '0'));
      setStatus(emi.status || 'Upcoming');
    }
  }, [emi]);

  if (!visible || !emi) return null;

  const handleSave = async () => {
    if (!emiDate.trim()) {
      Alert.alert('Required', 'Due Date is required (YYYY-MM-DD)');
      return;
    }
    const parsedAmount = parseFloat(emiAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Required', 'Please enter a valid EMI amount');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...emi,
        emiDate: emiDate.trim(),
        emiAmount: parsedAmount,
        paidAmount: parseFloat(paidAmount) || 0,
        status,
      });
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update installment');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = ['Upcoming', 'Paid', 'Overdue'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleCol}>
              <Text style={styles.title}>Edit Installment #{emi.emiNumber}</Text>
              <Text style={styles.subtitle}>Modify scheduled due date, amount, or status</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Due Date */}
          <Text style={styles.label}>Scheduled Due Date (YYYY-MM-DD)</Text>
          <View style={styles.inputRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={emiDate}
              onChangeText={setEmiDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* EMI Amount */}
          <Text style={styles.label}>Installment Amount (₹)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.input}
              value={emiAmount}
              onChangeText={setEmiAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Paid Amount */}
          <Text style={styles.label}>Amount Paid So Far (₹)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.input}
              value={paidAmount}
              onChangeText={setPaidAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Status Chips */}
          <Text style={styles.label}>Installment Status</Text>
          <View style={styles.statusChipsRow}>
            {statusOptions.map((st) => (
              <TouchableOpacity
                key={st}
                style={[
                  styles.statusChip,
                  status === st && (
                    st === 'Paid' ? styles.chipPaidActive :
                    st === 'Overdue' ? styles.chipOverdueActive :
                    styles.chipUpcomingActive
                  ),
                ]}
                onPress={() => setStatus(st)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    status === st && styles.statusChipTextActive,
                  ]}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipPaidActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  chipOverdueActive: {
    backgroundColor: '#b91c1c',
    borderColor: '#b91c1c',
  },
  chipUpcomingActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default EditEmiModal;
