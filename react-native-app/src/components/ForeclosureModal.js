import React, { useState, useMemo, useEffect } from 'react';
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
import LoanService from '../services/loanService';
import authService from '../services/authService';

export const ForeclosureModal = ({ visible, loan, onClose, onSettled }) => {
  const [discountAdjustment, setDiscountAdjustment] = useState('0'); // +/- custom adjustment
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [settlementDate, setSettlementDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Full pre-closure one-time settlement');
  const [loading, setLoading] = useState(false);

  const currentUser = authService.getCurrentUser();

  // Mathematical Foreclosure Computation
  const calc = useMemo(() => {
    if (!loan) return null;

    const loanAmount = Number(loan.loanAmount || 0);
    const tenure = Math.max(1, Number(loan.tenure || 12));
    const emiAmount = Number(loan.emiAmount || loan.emi || 0);
    const totalPayable = loanAmount + Number(loan.totalInterest || 0);

    const paidCount = Number(loan.paidEmiCount || 0);
    const remainingCount = Math.max(0, tenure - paidCount);

    const principalPerMonth = Math.round(loanAmount / tenure);
    const interestPerMonth = Math.max(0, emiAmount - principalPerMonth);

    // Principal already recovered
    const principalPaid = principalPerMonth * paidCount;
    // Net Principal Outstanding
    const principalOutstanding = Math.max(0, loanAmount - principalPaid);

    // Unearned future interest that borrower saves
    const interestRebate = interestPerMonth * remainingCount;

    // Any overdue penalties on unpaid EMIs
    let pendingPenalties = 0;
    if (Array.isArray(loan.emis || loan.emiDetails)) {
      (loan.emis || loan.emiDetails).forEach((e) => {
        if (e.status !== 'Paid' && e.penaltyAmount > 0) {
          pendingPenalties += Number(e.penaltyAmount);
        }
      });
    }

    const adj = parseFloat(discountAdjustment) || 0;
    const netSettlement = Math.max(0, Math.round(principalOutstanding + pendingPenalties + adj));

    return {
      loanAmount,
      tenure,
      paidCount,
      remainingCount,
      principalOutstanding,
      interestRebate,
      pendingPenalties,
      netSettlement,
      totalPayable,
    };
  }, [loan, discountAdjustment]);

  if (!loan || !calc) return null;

  const formatCurrency = (val) => '₹' + Math.round(Number(val || 0)).toLocaleString('en-IN');

  const handleConfirmSettlement = async () => {
    Alert.alert(
      'Confirm Foreclosure Settlement',
      `Are you sure you want to close File #${loan.fileNumber} for ${loan.customerName} for a final settlement of ${formatCurrency(calc.netSettlement)}? This will mark all remaining EMIs as settled and close the loan account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle & Close Loan',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              const settlementData = {
                fileNumber: loan.fileNumber,
                settlementAmount: calc.netSettlement,
                principalOutstanding: calc.principalOutstanding,
                interestRebate: calc.interestRebate,
                penaltiesPaid: calc.pendingPenalties,
                discount: parseFloat(discountAdjustment) || 0,
                mode: paymentMode,
                date: settlementDate,
                notes,
                agentName: currentUser?.name || 'Administrator',
              };

              await LoanService.forecloseLoan(loan.fileNumber || loan.id, settlementData);
              setLoading(false);
              onClose();
              if (onSettled) {
                onSettled(settlementData);
              }
            } catch (err) {
              setLoading(false);
              Alert.alert('Settlement Failed', err.message || 'Error processing foreclosure');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.headerIcon}>
                <Ionicons name="calculator" size={22} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.title}>Loan Pre-Closure Settlement</Text>
                <Text style={styles.subtitle}>File #{loan.fileNumber} • {loan.customerName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Foreclosure Calculation Hero Card */}
            <View style={styles.calcCard}>
              <Text style={styles.calcTitle}>EARLY SETTLEMENT AUDIT</Text>
              
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Original Loan Principal</Text>
                <Text style={styles.calcVal}>{formatCurrency(calc.loanAmount)}</Text>
              </View>

              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Installments Cleared</Text>
                <Text style={styles.calcVal}>{calc.paidCount} of {calc.tenure} EMIs</Text>
              </View>

              <View style={styles.calcDivider} />

              <View style={styles.calcRow}>
                <Text style={styles.calcLabelBold}>Net Principal Remaining</Text>
                <Text style={[styles.calcValBold, { color: colors.primary }]}>
                  {formatCurrency(calc.principalOutstanding)}
                </Text>
              </View>

              <View style={styles.calcRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.calcLabelRebate}>Unearned Interest Rebate (Saved)</Text>
                  <Ionicons name="sparkles" size={13} color="#059669" />
                </View>
                <Text style={styles.calcValRebate}>
                  -{formatCurrency(calc.interestRebate)}
                </Text>
              </View>

              {calc.pendingPenalties > 0 && (
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.error }]}>Pending Overdue Penalties</Text>
                  <Text style={[styles.calcVal, { color: colors.error, fontWeight: '700' }]}>
                    +{formatCurrency(calc.pendingPenalties)}
                  </Text>
                </View>
              )}

              {/* Adjustment Field */}
              <View style={styles.adjRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adjLabel}>Foreclosure Charge / Concession (₹)</Text>
                  <Text style={styles.adjSub}>Enter +/- adjustment or waive amount</Text>
                </View>
                <TextInput
                  style={styles.adjInput}
                  keyboardType="numeric"
                  value={discountAdjustment}
                  onChangeText={setDiscountAdjustment}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Net Settlement Total Box */}
              <View style={styles.netHeroBox}>
                <Text style={styles.netHeroSub}>NET FINAL SETTLEMENT AMOUNT</Text>
                <Text style={styles.netHeroAmount}>{formatCurrency(calc.netSettlement)}</Text>
                <Text style={styles.netHeroNote}>Clears all remaining {calc.remainingCount} EMIs & closes loan</Text>
              </View>
            </View>

            {/* Payment Details Form */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Settlement Payment Method</Text>

              {/* Payment Mode Pills */}
              <View style={styles.modeRow}>
                {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modeChip, paymentMode === m && styles.modeChipActive]}
                    onPress={() => setPaymentMode(m)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modeChipText, paymentMode === m && styles.modeChipTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Settlement Date</Text>
                <TextInput
                  style={styles.input}
                  value={settlementDate}
                  onChangeText={setSettlementDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Remarks / Settlement Notes</Text>
                <TextInput
                  style={styles.input}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Settlement notes"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.settleBtn, loading && { opacity: 0.6 }]}
              onPress={handleConfirmSettlement}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={20} color="#ffffff" />
                  <Text style={styles.settleBtnText}>Confirm Settlement & Close Loan</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
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
  body: {
    padding: spacing.md,
  },
  calcCard: {
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  calcTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  calcLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  calcVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 6,
  },
  calcLabelBold: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  calcValBold: {
    fontSize: 15,
    fontWeight: '800',
  },
  calcLabelRebate: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  calcValRebate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  adjRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: spacing.sm,
  },
  adjLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  adjSub: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  adjInput: {
    width: 80,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'right',
    fontWeight: '700',
    color: colors.textPrimary,
    fontSize: 14,
  },
  netHeroBox: {
    backgroundColor: '#065f46',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  netHeroSub: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a7f3d0',
    letterSpacing: 0.8,
  },
  netHeroAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  netHeroNote: {
    fontSize: 11,
    color: '#d1fae5',
    marginTop: 2,
  },
  formSection: {
    marginTop: spacing.md,
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modeChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: colors.primary,
  },
  modeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  settleBtn: {
    backgroundColor: '#059669',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  settleBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default ForeclosureModal;
