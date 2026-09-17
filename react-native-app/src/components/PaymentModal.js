import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import authService from '../services/authService';
import PaymentService from '../services/paymentService';

export const PaymentModal = ({ visible, emi, onClose, onConfirm, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [baseEmiAmount, setBaseEmiAmount] = useState(0);
  const [penaltyAmount, setPenaltyAmount] = useState('0');
  const [penaltyAction, setPenaltyAction] = useState('include'); // 'include' | 'waive'
  const [mode, setMode] = useState('UPI');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [collectorAgent, setCollectorAgent] = useState('');
  const [loading, setLoading] = useState(false);

  const currentUser = authService.getCurrentUser();

  // Overdue calculation
  const overdueInfo = useMemo(() => {
    if (!emi || !emi.emiDate) return { isOverdue: false, days: 0, suggestedPenalty: 0 };
    const payDate = new Date(date || new Date());
    payDate.setHours(0, 0, 0, 0);
    const dueDate = new Date(emi.emiDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = payDate.getTime() - dueDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      // 3 days grace period, then ₹50 / day
      const billableDays = Math.max(0, diffDays - 3);
      const suggestedPenalty = billableDays * 50;
      return { isOverdue: true, days: diffDays, suggestedPenalty };
    }
    return { isOverdue: false, days: 0, suggestedPenalty: 0 };
  }, [emi, date]);

  useEffect(() => {
    if (emi) {
      const base = Number(emi.remainingAmount || emi.emiAmount || 0);
      setBaseEmiAmount(base);

      const penalty = emi.penaltyAmount || overdueInfo.suggestedPenalty;
      setPenaltyAmount(String(penalty));
      setPenaltyAction(penalty > 0 ? 'include' : 'waive');

      const initialTotal = penalty > 0 ? base + penalty : base;
      setAmount(String(initialTotal));

      setMode('UPI');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes(`Payment for EMI #${emi.emiNumber}`);
      setCollectorAgent(currentUser?.name || 'Administrator');
    }
  }, [emi, overdueInfo.suggestedPenalty, currentUser]);

  // Recalculate total amount when penalty or action changes
  const handlePenaltyToggle = (action) => {
    setPenaltyAction(action);
    const pVal = parseFloat(penaltyAmount) || 0;
    if (action === 'include') {
      setAmount(String(baseEmiAmount + pVal));
    } else {
      setAmount(String(baseEmiAmount));
    }
  };

  const handlePenaltyChange = (text) => {
    setPenaltyAmount(text);
    const pVal = parseFloat(text) || 0;
    if (penaltyAction === 'include') {
      setAmount(String(baseEmiAmount + pVal));
    }
  };

  if (!emi) return null;

  const paymentModes = ['UPI', 'Cash', 'Bank Transfer', 'Cheque'];

  const handleSubmit = async () => {
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
      return;
    }

    try {
      setLoading(true);
      const paymentData = {
        fileNumber: emi.fileNumber,
        emiNumber: emi.emiNumber,
        amount: numericAmount,
        baseEmiAmount,
        penaltyCollected: penaltyAction === 'include' ? parseFloat(penaltyAmount) || 0 : 0,
        penaltyWaived: penaltyAction === 'waive' ? parseFloat(penaltyAmount) || 0 : 0,
        date,
        mode,
        notes,
        agentName: collectorAgent || currentUser?.name || 'Admin',
      };

      if (onConfirm) {
        await onConfirm(paymentData);
      } else if (onSuccess) {
        await PaymentService.payEMI(
          paymentData.fileNumber,
          paymentData.emiNumber,
          paymentData.amount,
          paymentData.date,
          paymentData.mode,
          paymentData.notes,
          {
            agentName: paymentData.agentName,
            penaltyCollected: paymentData.penaltyCollected,
            penaltyWaived: paymentData.penaltyWaived,
          }
        );
        await onSuccess(paymentData);
      }
      setLoading(false);
      onClose();
    } catch (e) {
      setLoading(false);
      Alert.alert('Payment Failed', e.message || 'Error processing payment');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="receipt" size={22} color={colors.primary} />
              <Text style={styles.title}>Record EMI Payment</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Info Summary Box */}
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Customer</Text>
                <Text style={styles.infoVal}>{emi.customerName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Loan File #</Text>
                <Text style={styles.infoVal}>{emi.fileNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vehicle</Text>
                <Text style={styles.infoVal}>{emi.vehicleModel} ({emi.vehicleNumber})</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Installment</Text>
                <Text style={[styles.infoVal, { color: colors.primary, fontWeight: '700' }]}>
                  EMI #{emi.emiNumber} (Due: {emi.emiDate})
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Base EMI Amount</Text>
                <Text style={[styles.infoVal, { fontWeight: '700' }]}>
                  ₹{baseEmiAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Overdue Penalty Calculator Banner */}
            {overdueInfo.isOverdue && (
              <View style={styles.penaltyBanner}>
                <View style={styles.penaltyHeader}>
                  <Ionicons name="warning" size={18} color="#d97706" />
                  <Text style={styles.penaltyTitle}>
                    Overdue by {overdueInfo.days} days ({overdueInfo.days > 3 ? `${overdueInfo.days - 3} days @ ₹50/day` : 'Within 3 days grace'})
                  </Text>
                </View>

                <View style={styles.penaltyControlsRow}>
                  <View style={styles.penaltyInputGroup}>
                    <Text style={styles.penaltyLabel}>Late Fee (₹):</Text>
                    <TextInput
                      style={styles.penaltyInput}
                      value={penaltyAmount}
                      onChangeText={handlePenaltyChange}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.penaltyActionToggle}>
                    <TouchableOpacity
                      style={[
                        styles.penaltyToggleBtn,
                        penaltyAction === 'include' && styles.penaltyToggleBtnActive,
                      ]}
                      onPress={() => handlePenaltyToggle('include')}
                    >
                      <Text
                        style={[
                          styles.penaltyToggleText,
                          penaltyAction === 'include' && styles.penaltyToggleTextActive,
                        ]}
                      >
                        + Charge
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.penaltyToggleBtn,
                        penaltyAction === 'waive' && styles.penaltyToggleBtnWaive,
                      ]}
                      onPress={() => handlePenaltyToggle('waive')}
                    >
                      <Text
                        style={[
                          styles.penaltyToggleText,
                          penaltyAction === 'waive' && styles.penaltyToggleTextActive,
                        ]}
                      >
                        Waive
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.penaltyNote}>
                  {penaltyAction === 'include'
                    ? `✓ Adding ₹${penaltyAmount} late fee to total receipt amount`
                    : `✓ Late fee waived off by ${currentUser?.name || 'Admin'}`}
                </Text>
              </View>
            )}

            {/* Amount Input */}
            <Text style={styles.inputLabel}>Total Payment Amount (₹) *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="e.g. 5167"
            />

            {/* Payment Mode Selector */}
            <Text style={styles.inputLabel}>Payment Mode *</Text>
            <View style={styles.modesRow}>
              {paymentModes.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeChip, mode === m && styles.modeChipActive]}
                  onPress={() => setMode(m)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment Date Input */}
            <Text style={styles.inputLabel}>Payment Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />

            {/* Collector Agent Attribution */}
            <Text style={styles.inputLabel}>Collector / Agent Name</Text>
            <TextInput
              style={styles.input}
              value={collectorAgent}
              onChangeText={setCollectorAgent}
              placeholder="e.g. Administrator / Branch Manager"
            />

            {/* Transaction Ref / Notes */}
            <Text style={styles.inputLabel}>Reference ID / Notes</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="e.g. UPI Ref #40291039401 / Cash in hand"
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>Confirm Receipt</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: spacing.lg,
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  penaltyBanner: {
    backgroundColor: '#fffbeb',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  penaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  penaltyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  penaltyControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  penaltyInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  penaltyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  penaltyInput: {
    width: 80,
    height: 34,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#fcd34d',
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },
  penaltyActionToggle: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: borderRadius.sm,
    padding: 2,
  },
  penaltyToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
  },
  penaltyToggleBtnActive: {
    backgroundColor: '#d97706',
  },
  penaltyToggleBtnWaive: {
    backgroundColor: '#059669',
  },
  penaltyToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  penaltyToggleTextActive: {
    color: '#ffffff',
  },
  penaltyNote: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default PaymentModal;
