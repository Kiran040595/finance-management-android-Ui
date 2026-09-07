import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import Header from '../components/Header';
import PaymentService from '../services/paymentService';
import LoanService from '../services/loanService';

export const PaymentScreen = ({ navigation }) => {
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [fileInput, setFileInput] = useState('');
  const [nextEmi, setNextEmi] = useState(null);

  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('UPI');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    LoanService.getLoans().then((data) => setLoans(data || []));
  }, []);

  const handleSelectLoan = (loan) => {
    setSelectedLoan(loan);
    setFileInput(loan.fileNumber);
    const pending = loan.emiDetails?.find((e) => e.status !== 'Paid');
    if (pending) {
      setNextEmi(pending);
      setAmount(String(pending.remainingAmount || pending.emiAmount));
      setNotes(`Payment for EMI #${pending.emiNumber} - ${loan.vehicleNumber}`);
    } else {
      setNextEmi(null);
      setAmount('0');
      setNotes('All EMIs already paid');
    }
  };

  const handleLookup = () => {
    if (!fileInput.trim()) return;
    const q = fileInput.trim().toLowerCase();
    const found = loans.find(
      (l) =>
        l.fileNumber.toLowerCase() === q ||
        l.customerName.toLowerCase().includes(q) ||
        l.vehicleNumber.toLowerCase().includes(q)
    );
    if (found) {
      handleSelectLoan(found);
    } else {
      Alert.alert('Not Found', 'No loan found matching this search');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedLoan || !nextEmi) {
      Alert.alert('Selection Error', 'Please choose a loan with an unpaid installment');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      await PaymentService.payEMI(
        selectedLoan.fileNumber,
        nextEmi.emiNumber,
        parseFloat(amount),
        date,
        mode,
        notes
      );
      setLoading(false);
      Alert.alert(
        'Receipt Confirmed',
        `Payment of ₹${amount} received for EMI #${nextEmi.emiNumber} via ${mode}.\nCustomer: ${selectedLoan.customerName}\nVehicle: ${selectedLoan.vehicleNumber}`,
        [
          {
            text: 'View Loan Details',
            onPress: () => navigation.navigate('LoanDetail', { loanId: selectedLoan.id }),
          },
          {
            text: 'Collect Another',
            onPress: () => {
              setSelectedLoan(null);
              setFileInput('');
              setNextEmi(null);
              setAmount('');
            },
          },
        ]
      );
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Failed to record payment');
    }
  };

  const formatCurrency = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');
  const paymentModes = ['UPI', 'Cash', 'Bank Transfer', 'Cheque'];

  return (
    <View style={styles.container}>
      <Header title="Collect EMI Payment" subtitle="Instant Payment Entry & Amortization Update" />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Lookup Box */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Search Loan File</Text>
          <View style={styles.lookupRow}>
            <TextInput
              style={styles.lookupInput}
              placeholder="Enter File #, Customer Name, or Vehicle No"
              value={fileInput}
              onChangeText={setFileInput}
            />
            <TouchableOpacity style={styles.lookupBtn} onPress={handleLookup}>
              <Ionicons name="search" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Quick Recent Loans Picker */}
          <Text style={styles.quickLabel}>Or choose from recent accounts:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
            {loans.slice(0, 5).map((l) => (
              <TouchableOpacity
                key={l.id}
                style={[styles.recentChip, selectedLoan?.id === l.id && styles.recentChipActive]}
                onPress={() => handleSelectLoan(l)}
              >
                <Text style={[styles.recentFile, selectedLoan?.id === l.id && { color: colors.primary }]}>
                  {l.fileNumber}
                </Text>
                <Text style={styles.recentCust} numberOfLines={1}>{l.customerName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Selected Loan & Pending Installment */}
        {selectedLoan && (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>2. Account Overview</Text>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{selectedLoan.fileNumber}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.custName}>{selectedLoan.customerName}</Text>
              <Text style={styles.vehText}>{selectedLoan.vehicleMake} {selectedLoan.vehicleModel} ({selectedLoan.vehicleNumber})</Text>
              <Text style={styles.subText}>Phone: {selectedLoan.customerPhonePrimary}</Text>
            </View>

            {nextEmi ? (
              <View style={styles.pendingStrip}>
                <View>
                  <Text style={styles.pendingTag}>UNPAID INSTALLMENT</Text>
                  <Text style={styles.pendingTitle}>EMI #{nextEmi.emiNumber} of {selectedLoan.tenure}</Text>
                  <Text style={styles.pendingDueDate}>Due Date: {nextEmi.emiDate}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.pendingTag}>AMOUNT DUE</Text>
                  <Text style={styles.pendingAmt}>{formatCurrency(nextEmi.remainingAmount || nextEmi.emiAmount)}</Text>
                  {nextEmi.status === 'Overdue' && (
                    <Text style={styles.overdueWarn}>Overdue</Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.allPaidBox}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={styles.allPaidText}>All installments for this loan have been paid!</Text>
              </View>
            )}

            {/* Payment Details Form */}
            {nextEmi && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.inputLabel}>Collected Amount (₹) *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />

                <Text style={styles.inputLabel}>Payment Mode *</Text>
                <View style={styles.modesRow}>
                  {paymentModes.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.modeChip, mode === m && styles.modeChipActive]}
                      onPress={() => setMode(m)}
                    >
                      <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Payment Date</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                />

                <Text style={styles.inputLabel}>Reference / Transaction ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. UPI Ref / Cheque No"
                  value={notes}
                  onChangeText={setNotes}
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleConfirmPayment}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="receipt-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                      <Text style={styles.submitBtnText}>Record Payment & Update Schedule</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  lookupRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lookupInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  lookupBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  recentRow: {
    gap: 8,
  },
  recentChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 110,
  },
  recentChipActive: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primary,
  },
  recentFile: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recentCust: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  custName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vehText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  subText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  pendingStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginVertical: spacing.sm,
  },
  pendingTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#b45309',
    letterSpacing: 0.5,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  pendingDueDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pendingAmt: {
    fontSize: 18,
    fontWeight: '800',
    color: '#b45309',
  },
  overdueWarn: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.error,
    marginTop: 2,
  },
  allPaidBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  allPaidText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.successDark,
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  modesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: '#ffffff',
  },
  modeChipActive: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primary,
  },
  modeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default PaymentScreen;
