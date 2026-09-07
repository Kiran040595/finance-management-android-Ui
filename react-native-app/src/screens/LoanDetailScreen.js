import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import Header from '../components/Header';
import PaymentModal from '../components/PaymentModal';
import LoanService from '../services/loanService';
import PaymentService from '../services/paymentService';

export const LoanDetailScreen = ({ route, navigation }) => {
  const { loanId } = route.params || {};
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pay Modal
  const [selectedEmi, setSelectedEmi] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const data = await LoanService.getLoanById(loanId);
      setLoan(data);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unable to load loan details');
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handlePayEmi = (emi) => {
    setSelectedEmi({
      ...emi,
      fileNumber: loan.fileNumber,
      customerName: loan.customerName,
      vehicleModel: loan.vehicleModel,
      vehicleNumber: loan.vehicleNumber,
    });
    setModalVisible(true);
  };

  const handleConfirmPayment = async (paymentData) => {
    await PaymentService.payEMI(
      paymentData.fileNumber,
      paymentData.emiNumber,
      paymentData.amount,
      paymentData.date,
      paymentData.mode,
      paymentData.notes
    );
    Alert.alert('Payment Recorded', `Recorded payment for EMI #${paymentData.emiNumber}`);
    fetchDetail();
  };

  const formatCurrency = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  if (loading || !loan) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 8, color: colors.textSecondary }}>Loading loan details...</Text>
      </View>
    );
  }

  const percentPaid = Math.round(((loan.paidEmiCount || 0) / (loan.tenure || 1)) * 100);

  return (
    <View style={styles.container}>
      <Header
        title={loan.fileNumber}
        subtitle={`${loan.customerName} • ${loan.vehicleModel}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status & Highlights Card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.label}>BORROWER</Text>
              <Text style={styles.mainTitle}>{loan.customerName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: loan.status === 'Active' ? '#dcfce7' : '#f1f5f9' }]}>
              <Text style={[styles.statusText, { color: loan.status === 'Active' ? '#15803d' : '#64748b' }]}>
                {loan.status}
              </Text>
            </View>
          </View>

          {/* Quick Contact Buttons */}
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => Linking.openURL(`tel:${loan.customerPhonePrimary}`)}
            >
              <Ionicons name="call" size={16} color={colors.primary} />
              <Text style={styles.contactBtnText}>{loan.customerPhonePrimary}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
              onPress={() => Linking.openURL(`whatsapp://send?phone=91${loan.customerPhonePrimary}`)}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#16a34a" />
              <Text style={[styles.contactBtnText, { color: '#16a34a' }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {loan.customerAddress ? (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.addressText}>{loan.customerAddress}</Text>
            </View>
          ) : null}
        </View>

        {/* Vehicle Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car" size={18} color={colors.primary} />
            <Text style={styles.cardHeaderTitle}>Vehicle Specifications</Text>
          </View>
          <View style={styles.grid2}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>MAKE & MODEL</Text>
              <Text style={styles.valBold}>{loan.vehicleMake} {loan.vehicleModel}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>REGISTRATION NO</Text>
              <Text style={[styles.valBold, { fontFamily: 'monospace' }]}>{loan.vehicleNumber}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>VEHICLE TYPE</Text>
              <Text style={styles.valText}>{loan.vehicleType}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>VEHICLE ON-ROAD COST</Text>
              <Text style={styles.valText}>{formatCurrency(loan.vehicleCost)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>ENGINE NO</Text>
              <Text style={[styles.valText, { fontFamily: 'monospace' }]}>{loan.engineNumber || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>CHASSIS NO</Text>
              <Text style={[styles.valText, { fontFamily: 'monospace' }]}>{loan.chassisNumber || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Loan Financial Structure */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash" size={18} color={colors.primary} />
            <Text style={styles.cardHeaderTitle}>Loan Terms & Financials</Text>
          </View>
          <View style={styles.grid3}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>LOAN SANCTIONED</Text>
              <Text style={[styles.valBold, { color: colors.primary }]}>{formatCurrency(loan.loanAmount)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>INTEREST RATE</Text>
              <Text style={styles.valBold}>{loan.interestRate}% p.a.</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>TENURE</Text>
              <Text style={styles.valBold}>{loan.tenure} Months</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>MONTHLY EMI</Text>
              <Text style={[styles.valBold, { color: '#0f766e', fontSize: 16 }]}>{formatCurrency(loan.emiAmount)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>DOWN PAYMENT</Text>
              <Text style={styles.valText}>{formatCurrency(loan.downPayment)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>DISBURSED ON</Text>
              <Text style={styles.valText}>{loan.disbursedDate || 'N/A'}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.rowBetween}>
              <Text style={styles.progressLabel}>
                Repayment: {loan.paidEmiCount} of {loan.tenure} EMIs completed
              </Text>
              <Text style={styles.progressPercent}>{percentPaid}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${percentPaid}%` }]} />
            </View>
            <View style={[styles.rowBetween, { marginTop: 6 }]}>
              <Text style={styles.miniDetail}>Principal Paid: {formatCurrency(loan.totalPrincipalPaid)}</Text>
              <Text style={styles.miniDetail}>Interest Paid: {formatCurrency(loan.totalInterestPaid)}</Text>
            </View>
          </View>
        </View>

        {/* Guarantor Details */}
        {loan.guarantorName ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={18} color="#059669" />
              <Text style={styles.cardHeaderTitle}>Guarantor Information</Text>
            </View>
            <View style={styles.grid2}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>NAME</Text>
                <Text style={styles.valBold}>{loan.guarantorName}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>RELATIONSHIP</Text>
                <Text style={styles.valText}>{loan.guarantorRelation || 'N/A'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>PHONE</Text>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${loan.guarantorPhone}`)}>
                  <Text style={[styles.valBold, { color: colors.primary }]}>{loan.guarantorPhone}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>ADDRESS</Text>
                <Text style={styles.valText}>{loan.guarantorAddress || 'Same as customer'}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Amortization Schedule */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.cardHeaderTitle}>Amortization Schedule</Text>
            </View>
            <Text style={styles.countTag}>{loan.emiDetails?.length || 0} Installments</Text>
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: 44 }]}>#</Text>
            <Text style={[styles.th, { flex: 1 }]}>Due Date</Text>
            <Text style={[styles.th, { width: 75, textAlign: 'right' }]}>Amount</Text>
            <Text style={[styles.th, { width: 75, textAlign: 'center' }]}>Status</Text>
            <Text style={[styles.th, { width: 55, textAlign: 'right' }]}>Action</Text>
          </View>

          {loan.emiDetails?.map((item) => (
            <View key={item.emiNumber} style={styles.tableRow}>
              <Text style={[styles.td, { width: 44, fontWeight: '700' }]}>{item.emiNumber}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.tdDate}>{item.emiDate}</Text>
                {item.paidDate ? <Text style={styles.tdPaidOn}>Paid {item.paidDate}</Text> : null}
              </View>
              <Text style={[styles.td, { width: 75, textAlign: 'right', fontWeight: '700' }]}>
                {formatCurrency(item.emiAmount)}
              </Text>
              <View style={{ width: 75, alignItems: 'center' }}>
                <View
                  style={[
                    styles.statusPill,
                    item.status === 'Paid'
                      ? styles.pillPaid
                      : item.status === 'Overdue'
                      ? styles.pillOverdue
                      : styles.pillUpcoming,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      item.status === 'Paid'
                        ? styles.pillPaidText
                        : item.status === 'Overdue'
                        ? styles.pillOverdueText
                        : styles.pillUpcomingText,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
              <View style={{ width: 55, alignItems: 'flex-end' }}>
                {item.status !== 'Paid' ? (
                  <TouchableOpacity
                    style={styles.miniPayBtn}
                    onPress={() => handlePayEmi(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.miniPayText}>Pay</Text>
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="checkmark-done" size={18} color={colors.success} />
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={modalVisible}
        emi={selectedEmi}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirmPayment}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    elevation: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: '#ffffff',
    gap: 6,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  countTag: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '46%',
  },
  valBold: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  valText: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
  },
  progressSection: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.divider,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  miniDetail: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    paddingHorizontal: 6,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  td: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  tdDate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tdPaidOn: {
    fontSize: 10,
    color: colors.successDark,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  pillPaid: {
    backgroundColor: '#dcfce7',
  },
  pillPaidText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  pillOverdue: {
    backgroundColor: '#fee2e2',
  },
  pillOverdueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b91c1c',
  },
  pillUpcoming: {
    backgroundColor: '#f1f5f9',
  },
  pillUpcomingText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  miniPayBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  miniPayText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default LoanDetailScreen;
