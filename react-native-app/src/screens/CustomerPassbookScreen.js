import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Share,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import Header from '../components/Header';
import PaymentModal from '../components/PaymentModal';
import LoanService from '../services/loanService';
import PaymentService from '../services/paymentService';

export const CustomerPassbookScreen = ({ route, navigation }) => {
  const { loanId, loan: initialLoan } = route.params || {};
  const [loan, setLoan] = useState(initialLoan || null);
  const [loading, setLoading] = useState(!initialLoan);
  const [filterType, setFilterType] = useState('ALL'); // ALL, CREDITS (Jama), DEBITS (Udhar), UPCOMING
  const [selectedEmiForPayment, setSelectedEmiForPayment] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const fetchLoanData = useCallback(async () => {
    try {
      if (loanId) {
        const data = await LoanService.getLoanById(loanId);
        if (data) {
          setLoan(data);
        }
      }
    } catch (err) {
      console.error('Error fetching loan passbook details:', err);
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    fetchLoanData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLoanData();
    });
    return unsubscribe;
  }, [navigation, fetchLoanData]);

  const formatCurrency = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  // Compute Flat Financial Totals
  const principalAmount = Number(loan?.loanAmount || 0);
  const annualInterestRate = Number(loan?.interestRate || 24);
  const monthlyRupeeRate = (annualInterestRate / 12).toFixed(2);
  const tenureMonths = Number(loan?.tenure || 12);
  const monthlyEmi = Number(loan?.emiAmount || loan?.emi || 0);

  // Flat Interest: P * (R / 100) * (N / 12)
  const totalInterestPayable = Math.round(principalAmount * (annualInterestRate / 100) * (tenureMonths / 12));
  const totalContractPayable = principalAmount + totalInterestPayable;

  // Build Chronological Passbook Entries
  const ledgerEntries = useMemo(() => {
    if (!loan) return [];

    const entries = [];
    const disbursedDate = loan.disbursedDate
      ? loan.disbursedDate.split('T')[0]
      : (loan.loanCreationDate ? new Date(loan.loanCreationDate).toISOString().split('T')[0] : '2026-01-01');

    // 1. Initial Opening Entry: Loan Disbursed (Debit / Udhar)
    let runningBalance = totalContractPayable;
    entries.push({
      id: 'disbursement',
      date: disbursedDate,
      type: 'DEBIT', // Udhar
      title: 'Loan Disbursed (Udhar)',
      subtitle: `Principal: ${formatCurrency(principalAmount)} + Interest (${annualInterestRate}% / ₹${monthlyRupeeRate} Rs): ${formatCurrency(totalInterestPayable)}`,
      debit: totalContractPayable,
      credit: 0,
      balance: runningBalance,
      mode: 'Bank Disbursal',
      agent: 'Admin',
      status: 'Disbursed',
      isDisbursement: true,
    });

    // 2. Add each EMI installment entry in chronological order
    const emiSchedule = Array.isArray(loan.emiDetails) ? [...loan.emiDetails] : [];
    emiSchedule.sort((a, b) => (a.emiNumber || 0) - (b.emiNumber || 0));

    let cumulativePaid = 0;

    emiSchedule.forEach((emi) => {
      const emiAmount = Number(emi.emiAmount || monthlyEmi || 0);
      const isPaid = emi.status === 'Paid' || Number(emi.paidAmount || 0) > 0;
      const paymentAmount = isPaid ? Number(emi.paidAmount || emiAmount) : 0;
      const paymentDate = emi.paidDate || emi.paymentDate || emi.emiDate;

      if (isPaid) {
        cumulativePaid += paymentAmount;
        runningBalance = Math.max(0, runningBalance - paymentAmount);

        entries.push({
          id: `emi-paid-${emi.emiNumber}`,
          date: paymentDate,
          type: 'CREDIT', // Jama
          title: `EMI #${emi.emiNumber} Received (Jama)`,
          subtitle: `P: ${formatCurrency(emi.principalComponent || Math.round(emiAmount * 0.75))} | Int: ${formatCurrency(emi.interestComponent || Math.round(emiAmount * 0.25))}`,
          debit: 0,
          credit: paymentAmount,
          balance: runningBalance,
          mode: emi.paymentMode || 'UPI',
          agent: emi.agentName || 'Collection Agent',
          receipt: emi.receiptNumber || `REC-${loan.fileNumber}-${emi.emiNumber}`,
          status: 'Paid',
          emiNumber: emi.emiNumber,
          penaltyCollected: emi.penaltyCollected || 0,
        });
      } else {
        // Unpaid / Upcoming
        entries.push({
          id: `emi-due-${emi.emiNumber}`,
          date: emi.emiDate,
          type: 'UPCOMING',
          title: `EMI #${emi.emiNumber} Scheduled Due`,
          subtitle: `Scheduled Installment (${tenureMonths} mos)`,
          debit: emiAmount,
          credit: 0,
          balance: runningBalance,
          mode: 'Pending',
          agent: '-',
          status: emi.status || 'Upcoming',
          emiNumber: emi.emiNumber,
          isUpcoming: true,
          emiData: emi,
        });
      }
    });

    return entries;
  }, [loan, totalContractPayable, principalAmount, annualInterestRate, monthlyRupeeRate, tenureMonths, monthlyEmi]);

  // Derived metrics
  const totalReceived = useMemo(() => {
    return ledgerEntries
      .filter((e) => e.type === 'CREDIT')
      .reduce((sum, e) => sum + e.credit, 0);
  }, [ledgerEntries]);

  const currentOutstanding = Math.max(0, totalContractPayable - totalReceived);
  const paidCount = loan?.paidEmiCount || (Array.isArray(loan?.emiDetails) ? loan.emiDetails.filter((e) => e.status === 'Paid').length : 0);
  const percentCompleted = Math.round((paidCount / (tenureMonths || 1)) * 100);

  // Next scheduled EMI
  const nextDueEmi = useMemo(() => {
    if (!Array.isArray(loan?.emiDetails)) return null;
    return loan.emiDetails.find((e) => e.status !== 'Paid');
  }, [loan]);

  // Filtered List
  const displayedEntries = useMemo(() => {
    if (filterType === 'CREDITS') {
      return ledgerEntries.filter((e) => e.type === 'CREDIT');
    }
    if (filterType === 'DEBITS') {
      return ledgerEntries.filter((e) => e.type === 'DEBIT');
    }
    if (filterType === 'UPCOMING') {
      return ledgerEntries.filter((e) => e.type === 'UPCOMING');
    }
    return ledgerEntries;
  }, [ledgerEntries, filterType]);

  // Share WhatsApp Statement
  const handleShareWhatsApp = () => {
    if (!loan) return;
    const phone = loan.customerPhonePrimary || loan.customerPhone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = `*VEHICLE FINANCE CUSTOMER PASSBOOK* 📖
━━━━━━━━━━━━━━━━━━━━
👤 *Borrower:* ${loan.customerName}
📁 *File No:* ${loan.fileNumber}
🚗 *Vehicle:* ${loan.vehicleNumber} (${loan.vehicleModel || 'Vehicle'})
📅 *Disbursed:* ${loan.disbursedDate ? loan.disbursedDate.split('T')[0] : 'N/A'}
━━━━━━━━━━━━━━━━━━━━
💰 *Loan Sanctioned:* ${formatCurrency(principalAmount)}
📈 *Interest (${annualInterestRate}% / ₹${monthlyRupeeRate} Rs):* ${formatCurrency(totalInterestPayable)}
🏷️ *Total Net Payable:* ${formatCurrency(totalContractPayable)}
✅ *Total Received (Jama):* ${formatCurrency(totalReceived)}
🔴 *Current Balance (Baki):* ${formatCurrency(currentOutstanding)}
━━━━━━━━━━━━━━━━━━━━
📊 *Installments Paid:* ${paidCount} of ${tenureMonths} EMIs (${percentCompleted}%)
${nextDueEmi ? `⏰ *Next EMI Due:* ${nextDueEmi.emiDate} • ${formatCurrency(nextDueEmi.emiAmount || monthlyEmi)}` : '🎉 *Status:* All EMIs Cleared!'}
━━━━━━━━━━━━━━━━━━━━
*Thank you for banking with us!*`;

    const url = `whatsapp://send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      // Fallback to generic share
      Share.share({ message });
    });
  };

  // Share Universal Text Statement
  const handleShareStatement = () => {
    if (!loan) return;
    const statementText = `====================================
VEHICLE FINANCE PASSBOOK STATEMENT
====================================
Customer: ${loan.customerName}
Phone: ${loan.customerPhonePrimary}
File Number: #${loan.fileNumber}
Vehicle: ${loan.vehicleMake || ''} ${loan.vehicleModel || ''} (${loan.vehicleNumber})

FINANCIAL SUMMARY:
- Sanctioned Principal: ${formatCurrency(principalAmount)}
- Interest Rate: ${annualInterestRate}% p.a. (₹${monthlyRupeeRate} Rs/mo)
- Total Interest: ${formatCurrency(totalInterestPayable)}
- Total Payable (Udhar): ${formatCurrency(totalContractPayable)}
- Total Collected (Jama): ${formatCurrency(totalReceived)}
- Current Due (Baki): ${formatCurrency(currentOutstanding)}
- Repayment Progress: ${paidCount} of ${tenureMonths} EMIs completed

${nextDueEmi ? `NEXT DUE INSTALLMENT:\nDue Date: ${nextDueEmi.emiDate}\nAmount: ${formatCurrency(nextDueEmi.emiAmount || monthlyEmi)}\n` : 'STATUS: ALL DUES CLEARED\n'}
Generated on: ${new Date().toLocaleDateString('en-IN')}
====================================`;

    Share.share({
      title: `Passbook Statement - ${loan.customerName} (#${loan.fileNumber})`,
      message: statementText,
    });
  };

  // Quick Pay Trigger
  const handlePayEmi = (emi) => {
    setSelectedEmiForPayment({
      ...emi,
      fileNumber: loan.fileNumber,
      customerName: loan.customerName,
      customerPhone: loan.customerPhonePrimary,
      vehicleNumber: loan.vehicleNumber,
    });
    setPaymentModalVisible(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalVisible(false);
    setSelectedEmiForPayment(null);
    fetchLoanData();
  };

  if (loading || !loan) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading Customer Passbook...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={`Passbook • #${loan.fileNumber}`}
        subtitle={`${loan.customerName} • Khata Statement`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleShareStatement} activeOpacity={0.7}>
            <Ionicons name="share-social-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Customer Profile & Vehicle Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            {loan.customerPhoto || loan.customerPhotoUrl ? (
              <Image source={{ uri: loan.customerPhoto || loan.customerPhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={26} color={colors.primary} />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.customerName}>{loan.customerName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: loan.status === 'Active' ? '#dcfce7' : '#f1f5f9' }]}>
                  <Text style={[styles.statusText, { color: loan.status === 'Active' ? '#15803d' : '#64748b' }]}>
                    {loan.status || 'Active'}
                  </Text>
                </View>
              </View>

              <Text style={styles.vehicleSubtitle}>
                🚗 {loan.vehicleMake} {loan.vehicleModel} • {loan.vehicleNumber}
              </Text>
              <Text style={styles.phoneSubtitle}>
                📞 {loan.customerPhonePrimary}
              </Text>
            </View>
          </View>

          {/* Quick Communication Actions */}
          <View style={styles.quickActionsBar}>
            <TouchableOpacity
              style={styles.quickBtnPrimary}
              onPress={handleShareWhatsApp}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
              <Text style={styles.quickBtnPrimaryText}>Share Passbook on WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtnCall}
              onPress={() => Linking.openURL(`tel:${loan.customerPhonePrimary}`)}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={16} color={colors.primary} />
              <Text style={styles.quickBtnCallText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Khatabook Style Udhar / Jama Hero Balance */}
        <View style={styles.khataHeroCard}>
          <View style={styles.khataBalanceHeader}>
            <View>
              <Text style={styles.khataHeaderLabel}>TOTAL NET PAYABLE (UDHAR)</Text>
              <Text style={styles.khataTotalAmount}>{formatCurrency(totalContractPayable)}</Text>
            </View>
            <View style={styles.rupeePill}>
              <Text style={styles.rupeePillText}>₹{monthlyRupeeRate} Rs/mo Vaddi</Text>
            </View>
          </View>

          <View style={styles.khataSplitRow}>
            {/* Jama (Credit / Received) */}
            <View style={styles.khataSplitCol}>
              <View style={styles.pillGreen}>
                <Ionicons name="arrow-down-circle" size={14} color="#16a34a" />
                <Text style={styles.pillGreenText}>YOU GOT (JAMA)</Text>
              </View>
              <Text style={styles.amountGreen}>{formatCurrency(totalReceived)}</Text>
              <Text style={styles.subLabelGreen}>{paidCount} of {tenureMonths} EMIs Cleared</Text>
            </View>

            <View style={styles.dividerVertical} />

            {/* Baki (Net Outstanding Due) */}
            <View style={styles.khataSplitCol}>
              <View style={styles.pillRed}>
                <Ionicons name="arrow-up-circle" size={14} color="#dc2626" />
                <Text style={styles.pillRedText}>BALANCE DUE (BAKI)</Text>
              </View>
              <Text style={styles.amountRed}>{formatCurrency(currentOutstanding)}</Text>
              <Text style={styles.subLabelRed}>{tenureMonths - paidCount} EMIs Remaining</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressSubLabel}>Repayment Progress</Text>
              <Text style={styles.progressPercent}>{percentCompleted}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, percentCompleted)}%` }]} />
            </View>
          </View>

          {/* Breakdown Pills */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>PRINCIPAL</Text>
              <Text style={styles.breakdownVal}>{formatCurrency(principalAmount)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>INTEREST ({annualInterestRate}%)</Text>
              <Text style={styles.breakdownVal}>{formatCurrency(totalInterestPayable)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>MONTHLY EMI</Text>
              <Text style={[styles.breakdownVal, { color: '#0f766e' }]}>{formatCurrency(monthlyEmi)}</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabsContainer}>
          {[
            { key: 'ALL', label: 'All Entries' },
            { key: 'CREDITS', label: 'Credits (Jama)' },
            { key: 'DEBITS', label: 'Debits (Udhar)' },
            { key: 'UPCOMING', label: 'Upcoming Due' },
          ].map((tab) => {
            const active = filterType === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, active && styles.filterTabActive]}
                onPress={() => setFilterType(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Chronological Passbook Entries */}
        <View style={styles.ledgerSection}>
          <View style={styles.ledgerHeaderRow}>
            <Text style={styles.sectionTitle}>Transaction Passbook ({displayedEntries.length})</Text>
            <Text style={styles.bakiHeaderTitle}>Running Balance</Text>
          </View>

          {displayedEntries.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyText}>No ledger records found for this filter</Text>
            </View>
          ) : (
            displayedEntries.map((item, index) => {
              const isCredit = item.type === 'CREDIT';
              const isDebit = item.type === 'DEBIT';
              const isUpcoming = item.type === 'UPCOMING';

              return (
                <View key={item.id || index} style={styles.passbookRow}>
                  {/* Left Indicator */}
                  <View style={styles.dateCol}>
                    <Text style={styles.entryDate}>{item.date}</Text>
                    <View
                      style={[
                        styles.indicatorDot,
                        {
                          backgroundColor: isCredit
                            ? '#16a34a'
                            : isDebit
                            ? '#dc2626'
                            : '#f59e0b',
                        },
                      ]}
                    />
                  </View>

                  {/* Details Col */}
                  <View style={styles.entryDetailCol}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.entryTitle}>{item.title}</Text>
                      {item.receipt ? (
                        <Text style={styles.receiptTag}>{item.receipt}</Text>
                      ) : null}
                    </View>

                    <Text style={styles.entrySubtitle}>{item.subtitle}</Text>

                    <View style={styles.metaRow}>
                      {item.mode ? (
                        <View style={styles.metaChip}>
                          <Ionicons
                            name={
                              item.mode.includes('UPI')
                                ? 'flash-outline'
                                : item.mode.includes('Cash')
                                ? 'cash-outline'
                                : 'card-outline'
                            }
                            size={11}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.metaChipText}>{item.mode}</Text>
                        </View>
                      ) : null}

                      {item.agent && item.agent !== '-' ? (
                        <Text style={styles.agentTag}>By {item.agent}</Text>
                      ) : null}
                    </View>

                    {/* Pay Button for Upcoming EMIs */}
                    {isUpcoming && item.emiData ? (
                      <TouchableOpacity
                        style={styles.payEmiBtn}
                        onPress={() => handlePayEmi(item.emiData)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="checkmark-circle-outline" size={14} color="#ffffff" />
                        <Text style={styles.payEmiBtnText}>Record Payment</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Amount & Running Balance Col */}
                  <View style={styles.amountCol}>
                    {isCredit ? (
                      <Text style={styles.creditAmount}>+{formatCurrency(item.credit)}</Text>
                    ) : (
                      <Text style={styles.debitAmount}>-{formatCurrency(item.debit)}</Text>
                    )}

                    <Text style={styles.balanceLabel}>Baki</Text>
                    <Text style={styles.balanceVal}>{formatCurrency(item.balance)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Payment Recording Modal */}
      {selectedEmiForPayment && (
        <PaymentModal
          visible={paymentModalVisible}
          emi={selectedEmiForPayment}
          onClose={() => {
            setPaymentModalVisible(false);
            setSelectedEmiForPayment(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  headerIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // Customer Profile Card
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vehicleSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  phoneSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quickActionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  quickBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingVertical: 9,
    borderRadius: borderRadius.md,
  },
  quickBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  quickBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: borderRadius.md,
  },
  quickBtnCallText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Khatabook Hero Balance Card
  khataHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  khataBalanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  khataHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  khataTotalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  rupeePill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rupeePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  khataSplitRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  khataSplitCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: spacing.sm,
  },
  pillGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  pillGreenText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  amountGreen: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16a34a',
  },
  subLabelGreen: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  pillRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  pillRedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  amountRed: {
    fontSize: 18,
    fontWeight: '800',
    color: '#dc2626',
  },
  subLabelRed: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressSubLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarBg: {
    height: 7,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },

  // Filter Tabs
  filterTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    padding: 3,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  filterTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Ledger Section
  ledgerSection: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bakiHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  emptyBox: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  passbookRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dateCol: {
    width: 65,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 6,
  },
  entryDate: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  entryDetailCol: {
    flex: 1,
    paddingHorizontal: 8,
  },
  entryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  receiptTag: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  entrySubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaChipText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  agentTag: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  payEmiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  payEmiBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  amountCol: {
    width: 85,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  creditAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16a34a',
  },
  debitAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },
  balanceLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  balanceVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default CustomerPassbookScreen;
