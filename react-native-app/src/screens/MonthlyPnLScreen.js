import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import Header from '../components/Header';
import LoanService from '../services/loanService';
import PaymentService from '../services/paymentService';
import expenseService, { EXPENSE_CATEGORIES } from '../services/expenseService';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlyPnLScreen = ({ navigation }) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(today.getMonth()); // 0 - 11
  const [activeTab, setActiveTab] = useState('pnl'); // 'pnl' | 'cashflow' | 'expenses' | 'defaulters'

  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Expense Modal
  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0].label);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [allLoans, allTxns, allExpenses] = await Promise.all([
        LoanService.getLoans(),
        PaymentService.getTransactions(),
        expenseService.getExpenses(),
      ]);
      setLoans(Array.isArray(allLoans) ? allLoans : []);
      setTransactions(Array.isArray(allTxns) ? allTxns : []);
      setExpenses(Array.isArray(allExpenses) ? allExpenses : []);
    } catch (e) {
      console.warn('Error loading P&L data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    const unsub = navigation.addListener('focus', () => {
      loadAllData();
    });
    return unsub;
  }, [navigation, loadAllData]);

  const formatCurrency = (val) => '₹' + Math.round(Number(val || 0)).toLocaleString('en-IN');

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonthIndex === 0) {
      setSelectedMonthIndex(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonthIndex((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex === 11) {
      setSelectedMonthIndex(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonthIndex((prev) => prev + 1);
    }
  };

  const currentMonthLabel = `${MONTHS[selectedMonthIndex]} ${selectedYear}`;
  const monthKey = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;

  const isCurrentCalendarMonth =
    selectedYear === today.getFullYear() && selectedMonthIndex === today.getMonth();
  const isFutureMonth =
    selectedYear > today.getFullYear() ||
    (selectedYear === today.getFullYear() && selectedMonthIndex > today.getMonth());

  // ==========================================
  // FINANCIAL CALCULATIONS FOR SELECTED MONTH
  // ==========================================
  const monthlyFinancials = useMemo(() => {
    let expectedInflow = 0;
    let actualEmiInflow = 0;
    let penaltyInflow = 0;
    let principalRecovered = 0;
    let interestRealized = 0;
    let capitalDisbursed = 0;

    const dueList = [];
    const collectedList = [];
    const defaulterList = [];

    // 1. Analyze Loans & EMIs for this Month
    loans.forEach((loan) => {
      const loanAmt = Number(loan.loanAmount || 0);
      const tenure = Number(loan.tenure || 12);
      const interestRate = Number(loan.interestRate || 24);
      const monthlyEmi = Number(loan.emiAmount || loan.emi || 0);

      // Check if loan was disbursed in this month
      const disbursedDateStr = loan.disbursedDate || loan.loanCreationDate || '';
      if (disbursedDateStr.startsWith(monthKey)) {
        capitalDisbursed += loanAmt;
      }

      // Check each EMI installment for this month
      (loan.emiDetails || []).forEach((emi) => {
        const emiDateStr = emi.emiDate || '';
        if (emiDateStr.startsWith(monthKey)) {
          expectedInflow += Number(emi.emiAmount || monthlyEmi || 0);

          const isPaid = emi.status === 'Paid' || Number(emi.paidAmount || 0) > 0;
          if (isPaid) {
            const paidAmt = Number(emi.paidAmount || emi.emiAmount || monthlyEmi || 0);
            actualEmiInflow += paidAmt;

            // Split into Principal Recovery vs Interest Profit (Flat formula)
            const pComponent = Number(emi.principalComponent || (loanAmt / tenure) || 0);
            const iComponent = Number(emi.interestComponent || (paidAmt - pComponent) || 0);

            principalRecovered += pComponent;
            interestRealized += Math.max(0, iComponent);

            collectedList.push({
              loan,
              emi,
              paidAmount: paidAmt,
              interestComponent: iComponent,
              principalComponent: pComponent,
              paidDate: emi.paidDate || emiDateStr,
            });
          } else {
            // Unpaid / Overdue this month
            dueList.push({
              loan,
              emi,
              emiAmount: Number(emi.emiAmount || monthlyEmi || 0),
              dueDate: emiDateStr,
              status: emi.status || 'Upcoming',
            });

            if (emi.status === 'Overdue' || new Date(emiDateStr) < today) {
              defaulterList.push({
                loan,
                emi,
                emiAmount: Number(emi.emiAmount || monthlyEmi || 0),
                dueDate: emiDateStr,
              });
            }
          }
        }
      });
    });

    // 2. Analyze Direct Transactions for penalties or additional inflows in this month
    transactions.forEach((tx) => {
      const txDate = tx.date || tx.paymentDate || '';
      if (txDate.startsWith(monthKey)) {
        if (Number(tx.penaltyCollected || 0) > 0) {
          penaltyInflow += Number(tx.penaltyCollected);
        }
      }
    });

    // 3. Filter Operating Expenses for this Month
    const currentMonthExpenses = expenses.filter((exp) => (exp.date || '').startsWith(monthKey));
    const totalExpenses = currentMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

    // 4. Totals & Realization
    const totalCollectedInflow = actualEmiInflow + penaltyInflow;
    const collectionShortfall = Math.max(0, expectedInflow - actualEmiInflow);
    const collectionEfficiency = expectedInflow > 0 ? Math.round((actualEmiInflow / expectedInflow) * 100) : 0;
    const netCashFlow = totalCollectedInflow - capitalDisbursed;

    // 5. P&L Engine
    const grossOperatingIncome = interestRealized + penaltyInflow;
    const netProfitInPocket = grossOperatingIncome - totalExpenses;
    const netProfitMargin = grossOperatingIncome > 0 ? Math.round((netProfitInPocket / grossOperatingIncome) * 100) : 0;

    return {
      expectedInflow,
      actualEmiInflow,
      penaltyInflow,
      totalCollectedInflow,
      collectionShortfall,
      collectionEfficiency,
      capitalDisbursed,
      netCashFlow,
      principalRecovered,
      interestRealized,
      totalExpenses,
      currentMonthExpenses,
      grossOperatingIncome,
      netProfitInPocket,
      netProfitMargin,
      collectedList,
      dueList,
      defaulterList,
    };
  }, [loans, transactions, expenses, monthKey, today]);

  // Handle Add Expense
  const handleSaveExpense = async () => {
    if (!expenseTitle.trim() || !expenseAmount || parseFloat(expenseAmount) <= 0) {
      Alert.alert('Missing Info', 'Please enter a valid expense title and amount');
      return;
    }

    try {
      setSavingExpense(true);
      const d = new Date(selectedYear, selectedMonthIndex, 15);
      const dateStr = d.toISOString().split('T')[0];

      await expenseService.addExpense({
        title: expenseTitle.trim(),
        category: expenseCategory,
        amount: parseFloat(expenseAmount),
        date: dateStr,
        notes: expenseNotes.trim(),
      });

      setAddExpenseModalVisible(false);
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseNotes('');
      loadAllData();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to record expense');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = (id) => {
    Alert.alert('Delete Expense', 'Are you sure you want to remove this expense record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await expenseService.deleteExpense(id);
          loadAllData();
        },
      },
    ]);
  };

  // 1-Tap WhatsApp Share P&L Report
  const handleShareWhatsAppReport = () => {
    const reportText = `*📊 VEHICLE FINANCE: MONTHLY P&L & CASH FLOW REPORT*
━━━━━━━━━━━━━━━━━━━━
📅 *Period:* ${currentMonthLabel}
━━━━━━━━━━━━━━━━━━━━
💰 *PROFIT & LOSS (P&L):*
• *Interest Income Realized (Vaddi):* ${formatCurrency(monthlyFinancials.interestRealized)}
• *Late Fee Penalties Collected:* ${formatCurrency(monthlyFinancials.penaltyInflow)}
• *Gross Operating Income:* ${formatCurrency(monthlyFinancials.grossOperatingIncome)}
• *Total Operating Expenses:* ${formatCurrency(monthlyFinancials.totalExpenses)}
━━━━━━━━━━━━━━━━━━━━
🎉 *NET PROFIT IN-POCKET:* ${formatCurrency(monthlyFinancials.netProfitInPocket)}
📈 *Net Profit Margin:* ${monthlyFinancials.netProfitMargin}%
━━━━━━━━━━━━━━━━━━━━
💵 *CASH FLOW & COLLECTIONS:*
• *Expected EMI Inflow:* ${formatCurrency(monthlyFinancials.expectedInflow)}
• *Actual Cash Collected:* ${formatCurrency(monthlyFinancials.totalCollectedInflow)} (${monthlyFinancials.collectionEfficiency}% Efficiency)
• *Collection Shortfall:* ${formatCurrency(monthlyFinancials.collectionShortfall)}
• *Capital Disbursed (New Loans):* ${formatCurrency(monthlyFinancials.capitalDisbursed)}
• *Net Cash Flow:* ${formatCurrency(monthlyFinancials.netCashFlow)}
━━━━━━━━━━━━━━━━━━━━
Generated by Vehicle Finance Manager`;

    Share.share({
      title: `Monthly P&L Report - ${currentMonthLabel}`,
      message: reportText,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>Calculating Monthly P&L & Cash Flow...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Monthly P&L & Cash Flow"
        subtitle={`${currentMonthLabel} Financial Health`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.headerShareBtn} onPress={handleShareWhatsAppReport} activeOpacity={0.7}>
            <Ionicons name="share-social-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Month Selector Bar */}
        <View style={styles.monthSelectorBar}>
          <TouchableOpacity style={styles.arrowBtn} onPress={handlePrevMonth} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.monthCenter}>
            <Text style={styles.monthLabel}>{currentMonthLabel}</Text>
            <View
              style={[
                styles.periodBadge,
                {
                  backgroundColor: isCurrentCalendarMonth
                    ? '#dcfce7'
                    : isFutureMonth
                    ? '#eff6ff'
                    : '#f1f5f9',
                },
              ]}
            >
              <Text
                style={[
                  styles.periodBadgeText,
                  {
                    color: isCurrentCalendarMonth
                      ? '#16a34a'
                      : isFutureMonth
                      ? colors.primary
                      : '#64748b',
                  },
                ]}
              >
                {isCurrentCalendarMonth ? 'CURRENT MONTH' : isFutureMonth ? 'FORECAST' : 'PAST CLOSED'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.arrowBtn} onPress={handleNextMonth} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Hero Card: Net Profit in Pocket */}
        <View style={styles.heroProfitCard}>
          <View style={styles.heroProfitHeader}>
            <View>
              <Text style={styles.heroProfitLabel}>NET PROFIT IN-POCKET</Text>
              <Text
                style={[
                  styles.heroProfitValue,
                  { color: monthlyFinancials.netProfitInPocket >= 0 ? '#15803d' : '#dc2626' },
                ]}
              >
                {formatCurrency(monthlyFinancials.netProfitInPocket)}
              </Text>
            </View>
            <View style={styles.marginPill}>
              <Text style={styles.marginPillText}>{monthlyFinancials.netProfitMargin}% Margin</Text>
            </View>
          </View>

          <View style={styles.heroProfitGrid}>
            <View style={styles.heroProfitCol}>
              <Text style={styles.miniLabel}>INTEREST EARNED</Text>
              <Text style={styles.boldValGreen}>+{formatCurrency(monthlyFinancials.interestRealized)}</Text>
            </View>
            <View style={styles.heroProfitCol}>
              <Text style={styles.miniLabel}>LATE FEES COLLECTED</Text>
              <Text style={styles.boldValGreen}>+{formatCurrency(monthlyFinancials.penaltyInflow)}</Text>
            </View>
            <View style={styles.heroProfitCol}>
              <Text style={styles.miniLabel}>OPERATING EXPENSES</Text>
              <Text style={styles.boldValRed}>-{formatCurrency(monthlyFinancials.totalExpenses)}</Text>
            </View>
          </View>
        </View>

        {/* Cash Flow Forecast & Efficiency Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleGroup}>
              <Ionicons name="trending-up" size={18} color={colors.primary} />
              <Text style={styles.cardHeaderTitle}>Cash Flow & Inflow Realization</Text>
            </View>
            <View style={[styles.efficiencyBadge, { backgroundColor: monthlyFinancials.collectionEfficiency >= 80 ? '#dcfce7' : '#fef3c7' }]}>
              <Text style={[styles.efficiencyText, { color: monthlyFinancials.collectionEfficiency >= 80 ? '#15803d' : '#b45309' }]}>
                {monthlyFinancials.collectionEfficiency}% Collected
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.flowProgressBarBg}>
            <View
              style={[
                styles.flowProgressBarFill,
                { width: `${Math.min(100, monthlyFinancials.collectionEfficiency)}%` },
              ]}
            />
          </View>

          <View style={styles.flowGrid}>
            <View style={styles.flowGridItem}>
              <Text style={styles.flowLabel}>EXPECTED INFLOW</Text>
              <Text style={styles.flowVal}>{formatCurrency(monthlyFinancials.expectedInflow)}</Text>
              <Text style={styles.flowSub}>{monthlyFinancials.dueList.length + monthlyFinancials.collectedList.length} Scheduled EMIs</Text>
            </View>

            <View style={styles.flowGridItem}>
              <Text style={styles.flowLabel}>ACTUAL COLLECTED</Text>
              <Text style={[styles.flowVal, { color: '#16a34a' }]}>
                {formatCurrency(monthlyFinancials.totalCollectedInflow)}
              </Text>
              <Text style={styles.flowSub}>{monthlyFinancials.collectedList.length} EMIs Received</Text>
            </View>

            <View style={styles.flowGridItem}>
              <Text style={styles.flowLabel}>SHORTFALL (PENDING)</Text>
              <Text style={[styles.flowVal, { color: '#dc2626' }]}>
                {formatCurrency(monthlyFinancials.collectionShortfall)}
              </Text>
              <Text style={styles.flowSub}>{monthlyFinancials.dueList.length} EMIs Pending</Text>
            </View>

            <View style={styles.flowGridItem}>
              <Text style={styles.flowLabel}>NEW LOAN DISBURSED</Text>
              <Text style={[styles.flowVal, { color: colors.textPrimary }]}>
                {formatCurrency(monthlyFinancials.capitalDisbursed)}
              </Text>
              <Text style={styles.flowSub}>Working Capital Outflow</Text>
            </View>
          </View>

          {/* Net Liquidity Banner */}
          <View style={styles.netLiquidityBanner}>
            <Text style={styles.netLiquidityLabel}>NET MONTHLY CASH INFLUX (INFLOW - DISBURSED)</Text>
            <Text
              style={[
                styles.netLiquidityVal,
                { color: monthlyFinancials.netCashFlow >= 0 ? '#15803d' : '#dc2626' },
              ]}
            >
              {monthlyFinancials.netCashFlow >= 0 ? '+' : ''}
              {formatCurrency(monthlyFinancials.netCashFlow)}
            </Text>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          {[
            { id: 'pnl', label: 'P&L Anatomy' },
            { id: 'expenses', label: `Expenses (${monthlyFinancials.currentMonthExpenses.length})` },
            { id: 'defaulters', label: `Pending (${monthlyFinancials.dueList.length})` },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabBtnText, activeTab === tab.id && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ==========================================
            TAB 1: P&L ANATOMY (Interest vs Principal)
           ========================================== */}
        {activeTab === 'pnl' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
              <Text style={styles.cardHeaderTitle}>Inflow Anatomy: Capital vs Profit</Text>
            </View>

            <Text style={styles.explanationText}>
              Every rupee received contains two parts: Principal (your original money returning) and Interest (your pure profit / vaddi).
            </Text>

            <View style={styles.anatomyRow}>
              <View style={[styles.anatomyBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                <Ionicons name="gift-outline" size={20} color="#16a34a" />
                <Text style={styles.anatomyLabel}>PURE INTEREST PROFIT</Text>
                <Text style={[styles.anatomyAmount, { color: '#16a34a' }]}>
                  {formatCurrency(monthlyFinancials.interestRealized)}
                </Text>
                <Text style={styles.anatomySub}>Realized Interest (Income)</Text>
              </View>

              <View style={[styles.anatomyBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                <Ionicons name="refresh-circle-outline" size={22} color={colors.primary} />
                <Text style={styles.anatomyLabel}>CAPITAL RECOVERED</Text>
                <Text style={[styles.anatomyAmount, { color: colors.primary }]}>
                  {formatCurrency(monthlyFinancials.principalRecovered)}
                </Text>
                <Text style={styles.anatomySub}>Principal Back in Hand</Text>
              </View>
            </View>

            {/* Late Fee Addition */}
            {monthlyFinancials.penaltyInflow > 0 && (
              <View style={styles.penaltyNoticeRow}>
                <Ionicons name="alert-circle" size={16} color="#b45309" />
                <Text style={styles.penaltyNoticeText}>
                  + {formatCurrency(monthlyFinancials.penaltyInflow)} additional profit collected as Late Fee Penalties.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ==========================================
            TAB 2: OPERATING EXPENSE MANAGER
           ========================================== */}
        {activeTab === 'expenses' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleGroup}>
                <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                <Text style={styles.cardHeaderTitle}>Operating Expenses</Text>
              </View>
              <TouchableOpacity
                style={styles.addExpenseBtn}
                onPress={() => setAddExpenseModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
                <Text style={styles.addExpenseBtnText}>Add Expense</Text>
              </TouchableOpacity>
            </View>

            {monthlyFinancials.currentMonthExpenses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="wallet-outline" size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No expenses logged this month</Text>
                <Text style={styles.emptySub}>Add staff salaries, fuel allowances, or rent to see true net profit.</Text>
              </View>
            ) : (
              monthlyFinancials.currentMonthExpenses.map((exp) => (
                <View key={exp.id} style={styles.expenseRow}>
                  <View style={styles.expenseIconCircle}>
                    <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseTitle}>{exp.title}</Text>
                    <Text style={styles.expenseCategory}>{exp.category} • {exp.date}</Text>
                    {exp.notes ? <Text style={styles.expenseNotes}>{exp.notes}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={styles.expenseAmount}>-{formatCurrency(exp.amount)}</Text>
                    <TouchableOpacity onPress={() => handleDeleteExpense(exp.id)}>
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ==========================================
            TAB 3: PENDING SHORTFALL & OVERDUE LIST
           ========================================== */}
        {activeTab === 'defaulters' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="hourglass-outline" size={18} color="#b45309" />
              <Text style={styles.cardHeaderTitle}>Pending EMIs Due ({monthlyFinancials.dueList.length})</Text>
            </View>

            {monthlyFinancials.dueList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={36} color="#16a34a" />
                <Text style={styles.emptyTitle}>All EMIs Collected!</Text>
                <Text style={styles.emptySub}>Zero outstanding shortfall for {currentMonthLabel}.</Text>
              </View>
            ) : (
              monthlyFinancials.dueList.map((item, idx) => (
                <View key={idx} style={styles.defaulterRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.defaulterName}>{item.loan.customerName}</Text>
                    <Text style={styles.defaulterSub}>
                      File #{item.loan.fileNumber} • {item.loan.vehicleNumber}
                    </Text>
                    <Text style={styles.defaulterDueDate}>Due: {item.dueDate}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={styles.defaulterAmount}>{formatCurrency(item.emiAmount)}</Text>
                    <View style={styles.contactRow}>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => Linking.openURL(`tel:${item.loan.customerPhonePrimary || item.loan.customerPhone}`)}
                      >
                        <Ionicons name="call" size={14} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionIconBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
                        onPress={() => {
                          const p = item.loan.customerPhonePrimary || item.loan.customerPhone || '';
                          const clean = p.replace(/\D/g, '');
                          const url = `whatsapp://send?phone=${clean.length === 10 ? '91' + clean : clean}&text=${encodeURIComponent(
                            `Dear ${item.loan.customerName}, your vehicle loan EMI of ${formatCurrency(
                              item.emiAmount
                            )} for ${item.loan.vehicleNumber} was due on ${item.dueDate}. Please clear it at the earliest.`
                          )}`;
                          Linking.openURL(url);
                        }}
                      >
                        <Ionicons name="logo-whatsapp" size={14} color="#16a34a" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={addExpenseModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddExpenseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Operating Expense</Text>
              <TouchableOpacity onPress={() => setAddExpenseModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Expense Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Agent Travel Fuel, Office Rent, Notice Fee"
                value={expenseTitle}
                onChangeText={setExpenseTitle}
              />

              <Text style={styles.inputLabel}>Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2500"
                keyboardType="numeric"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
              />

              <Text style={styles.inputLabel}>Expense Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const active = expenseCategory === cat.label;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                      onPress={() => setExpenseCategory(cat.label)}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={14}
                        color={active ? '#ffffff' : colors.textSecondary}
                      />
                      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Additional details..."
                value={expenseNotes}
                onChangeText={setExpenseNotes}
                multiline
              />

              <TouchableOpacity
                style={styles.saveExpenseBtn}
                onPress={handleSaveExpense}
                disabled={savingExpense}
                activeOpacity={0.8}
              >
                {savingExpense ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveExpenseBtnText}>Save Expense</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerShareBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // Month Selector
  monthSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  arrowBtn: {
    padding: 8,
    borderRadius: borderRadius.md,
    backgroundColor: '#f1f5f9',
  },
  monthCenter: {
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  periodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  periodBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // Hero Profit Card
  heroProfitCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: '#86efac',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  heroProfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  heroProfitLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  heroProfitValue: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  marginPill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  marginPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  heroProfitGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroProfitCol: {
    flex: 1,
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  boldValGreen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16a34a',
    marginTop: 2,
  },
  boldValRed: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
    marginTop: 2,
  },

  // Card general
  card: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  efficiencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  efficiencyText: {
    fontSize: 11,
    fontWeight: '800',
  },
  flowProgressBarBg: {
    height: 7,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  flowProgressBarFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 4,
  },
  flowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  flowGridItem: {
    width: '50%',
    paddingRight: 8,
  },
  flowLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  flowVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  flowSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  netLiquidityBanner: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netLiquidityLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    flex: 1,
  },
  netLiquidityVal: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    padding: 3,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Tab 1: P&L Anatomy
  explanationText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  anatomyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  anatomyBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  anatomyLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    textAlign: 'center',
  },
  anatomyAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  anatomySub: {
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  penaltyNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  penaltyNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
    flex: 1,
  },

  // Tab 2: Expenses
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  addExpenseBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  expenseIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  expenseCategory: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  expenseNotes: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },

  // Tab 3: Defaulters / Due List
  defaulterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  defaulterName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  defaulterSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  defaulterDueDate: {
    fontSize: 10,
    fontWeight: '600',
    color: '#b45309',
    marginTop: 2,
  },
  defaulterAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#dc2626',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  saveExpenseBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  saveExpenseBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default MonthlyPnLScreen;
