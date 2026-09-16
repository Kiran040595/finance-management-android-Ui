import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import Header from '../components/Header';
import LoanService from '../services/loanService';
import PaymentService from '../services/paymentService';

const MONTH_NAMES = [
  'All Months',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const AMOUNT_RANGES = [
  { id: 'ALL', label: 'All Amounts' },
  { id: 'UNDER_50K', label: 'Under ₹50K' },
  { id: '50K_1L', label: '₹50K - ₹1L' },
  { id: 'ABOVE_1L', label: 'Above ₹1L' },
];

const SORT_OPTIONS = [
  { id: 'AMOUNT_DESC', label: 'Amount: High → Low' },
  { id: 'AMOUNT_ASC', label: 'Amount: Low → High' },
  { id: 'NAME_ASC', label: 'Borrower: A → Z' },
  { id: 'TENURE_DESC', label: 'Tenure: Longest' },
];

export const AnalyticsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'monthly' | 'explorer'
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters for Explorer
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [selectedAmountRange, setSelectedAmountRange] = useState('ALL');
  const [selectedVehicleType, setSelectedVehicleType] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('AMOUNT_DESC');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [allLoans, allTxns] = await Promise.all([
        LoanService.getLoans(),
        PaymentService.getTransactions(),
      ]);
      setLoans(Array.isArray(allLoans) ? allLoans : []);
      setTransactions(Array.isArray(allTxns) ? allTxns : []);
    } catch (e) {
      console.warn('Error loading analytics data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (val) => '₹' + Math.round(Number(val || 0)).toLocaleString('en-IN');

  // Computed Portfolio Metrics
  const metrics = useMemo(() => {
    let totalDisbursed = 0;
    let totalCollected = 0;
    let activeCount = 0;
    let closedCount = 0;
    let overdueCount = 0;
    let totalOutstanding = 0;

    const vehicleTypeCounts = { 'Two Wheeler': 0, 'Car / Four Wheeler': 0, 'Commercial': 0 };
    const monthWiseCollections = {};
    const monthWiseDisbursements = {};

    loans.forEach((loan) => {
      const loanAmt = Number(loan.loanAmount || 0);
      totalDisbursed += loanAmt;

      if (loan.status === 'Active') activeCount += 1;
      else if (loan.status === 'Closed') closedCount += 1;

      // Type
      const type = (loan.vehicleType || '').toLowerCase();
      if (type.includes('two') || type.includes('bike') || type.includes('scooter')) {
        vehicleTypeCounts['Two Wheeler'] = (vehicleTypeCounts['Two Wheeler'] || 0) + 1;
      } else if (type.includes('commercial') || type.includes('three')) {
        vehicleTypeCounts['Commercial'] = (vehicleTypeCounts['Commercial'] || 0) + 1;
      } else {
        vehicleTypeCounts['Car / Four Wheeler'] = (vehicleTypeCounts['Car / Four Wheeler'] || 0) + 1;
      }

      // Disbursement month
      if (loan.disbursedDate) {
        const d = new Date(loan.disbursedDate);
        if (!isNaN(d)) {
          const mKey = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
          monthWiseDisbursements[mKey] = (monthWiseDisbursements[mKey] || 0) + loanAmt;
        }
      }

      // Overdue check
      let hasOverdue = false;
      let loanCollected = 0;
      (loan.emiDetails || []).forEach((emi) => {
        if (emi.status === 'Paid') {
          loanCollected += Number(emi.paidAmount || emi.emiAmount || 0);
        } else if (emi.status === 'Overdue') {
          hasOverdue = true;
        }
      });

      totalCollected += loanCollected;
      const outstanding = Math.max(0, loanAmt - loanCollected);
      totalOutstanding += outstanding;

      if (hasOverdue) overdueCount += 1;
    });

    // Transaction collections by month
    transactions.forEach((t) => {
      const dateStr = t.date || t.paymentDate;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d)) {
          const mKey = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
          monthWiseCollections[mKey] = (monthWiseCollections[mKey] || 0) + Number(t.amount || t.paidAmount || 0);
        }
      }
    });

    const recoveryRate = totalDisbursed > 0 ? Math.round((totalCollected / totalDisbursed) * 100) : 0;
    const avgTicketSize = loans.length > 0 ? Math.round(totalDisbursed / loans.length) : 0;

    return {
      totalDisbursed,
      totalCollected,
      totalOutstanding,
      activeCount,
      closedCount,
      overdueCount,
      recoveryRate,
      avgTicketSize,
      vehicleTypeCounts,
      monthWiseCollections,
      monthWiseDisbursements,
    };
  }, [loans, transactions]);

  // Filtered & Sorted Loans for Explorer
  const filteredLoans = useMemo(() => {
    return loans
      .filter((loan) => {
        // Month filter (based on disbursement date or emi due date)
        if (selectedMonth !== 'All Months') {
          const monthIdx = MONTH_NAMES.indexOf(selectedMonth) - 1; // 0-indexed
          const loanDate = loan.disbursedDate ? new Date(loan.disbursedDate) : null;
          if (loanDate && !isNaN(loanDate)) {
            if (loanDate.getMonth() !== monthIdx) return false;
          }
        }

        // Amount filter
        const amt = Number(loan.loanAmount || 0);
        if (selectedAmountRange === 'UNDER_50K' && amt >= 50000) return false;
        if (selectedAmountRange === '50K_1L' && (amt < 50000 || amt > 100000)) return false;
        if (selectedAmountRange === 'ABOVE_1L' && amt <= 100000) return false;

        // Vehicle Type filter
        if (selectedVehicleType !== 'ALL') {
          const vType = (loan.vehicleType || '').toLowerCase();
          if (selectedVehicleType === 'TWO_WHEELER' && !vType.includes('two') && !vType.includes('bike')) return false;
          if (selectedVehicleType === 'FOUR_WHEELER' && !vType.includes('car') && !vType.includes('four')) return false;
          if (selectedVehicleType === 'COMMERCIAL' && !vType.includes('commercial') && !vType.includes('three')) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (selectedSort === 'AMOUNT_DESC') {
          return Number(b.loanAmount || 0) - Number(a.loanAmount || 0);
        }
        if (selectedSort === 'AMOUNT_ASC') {
          return Number(a.loanAmount || 0) - Number(b.loanAmount || 0);
        }
        if (selectedSort === 'NAME_ASC') {
          return (a.customerName || '').localeCompare(b.customerName || '');
        }
        if (selectedSort === 'TENURE_DESC') {
          return Number(b.tenure || 0) - Number(a.tenure || 0);
        }
        return 0;
      });
  }, [loans, selectedMonth, selectedAmountRange, selectedVehicleType, selectedSort]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Analyzing Portfolio Data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Portfolio Analytics"
        subtitle="Multi-dimensional insights, trends & reporting"
      />

      {/* Tab Switcher */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
          onPress={() => setActiveTab('overview')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="pie-chart-outline"
            size={16}
            color={activeTab === 'overview' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'overview' && styles.tabBtnTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'monthly' && styles.tabBtnActive]}
          onPress={() => setActiveTab('monthly')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="trending-up-outline"
            size={16}
            color={activeTab === 'monthly' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'monthly' && styles.tabBtnTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'explorer' && styles.tabBtnActive]}
          onPress={() => setActiveTab('explorer')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="filter-outline"
            size={16}
            color={activeTab === 'explorer' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'explorer' && styles.tabBtnTextActive]}>
            Explorer ({filteredLoans.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <View>
            {/* Top KPI Cards */}
            <View style={styles.heroCard}>
              <View style={styles.heroRow}>
                <View>
                  <Text style={styles.heroSub}>TOTAL DISBURSED</Text>
                  <Text style={styles.heroAmount}>{formatCurrency(metrics.totalDisbursed)}</Text>
                </View>
                <View style={styles.efficiencyBadge}>
                  <Text style={styles.efficiencyBadgeText}>{metrics.recoveryRate}% Recovered</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(metrics.recoveryRate, 100)}%` }]} />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabelText}>Collected: {formatCurrency(metrics.totalCollected)}</Text>
                  <Text style={styles.progressLabelText}>Outstanding: {formatCurrency(metrics.totalOutstanding)}</Text>
                </View>
              </View>
            </View>

            {/* Metrics Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Ionicons name="car-sport" size={22} color={colors.primary} />
                <Text style={styles.statVal}>{metrics.activeCount}</Text>
                <Text style={styles.statLabel}>Active Loans</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="checkmark-done-circle" size={22} color={colors.success} />
                <Text style={styles.statVal}>{metrics.closedCount}</Text>
                <Text style={styles.statLabel}>Closed Loans</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="alert-circle" size={22} color={colors.error} />
                <Text style={[styles.statVal, { color: colors.error }]}>{metrics.overdueCount}</Text>
                <Text style={styles.statLabel}>At-Risk / Overdue</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="pricetag" size={22} color="#8b5cf6" />
                <Text style={styles.statVal}>{formatCurrency(metrics.avgTicketSize)}</Text>
                <Text style={styles.statLabel}>Avg Ticket Size</Text>
              </View>
            </View>

            {/* Vehicle Category Distribution */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="pie-chart" size={18} color={colors.primary} />
                <Text style={styles.cardTitle}>Vehicle Category Distribution</Text>
              </View>

              {Object.entries(metrics.vehicleTypeCounts).map(([cat, count]) => {
                const pct = loans.length > 0 ? Math.round((count / loans.length) * 100) : 0;
                return (
                  <View key={cat} style={styles.distributionRow}>
                    <View style={styles.distLabelRow}>
                      <Text style={styles.distLabel}>{cat}</Text>
                      <Text style={styles.distCount}>{count} loans ({pct}%)</Text>
                    </View>
                    <View style={styles.distBarBg}>
                      <View style={[styles.distBarFill, { width: `${pct}%`, backgroundColor: cat.includes('Two') ? colors.primary : cat.includes('Commercial') ? '#f59e0b' : '#10b981' }]} />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Quick Actions to Day-End Summary */}
            <TouchableOpacity
              style={styles.dayEndBanner}
              onPress={() => navigation.navigate('DayEndSummary')}
              activeOpacity={0.8}
            >
              <View style={styles.bannerIcon}>
                <Ionicons name="calendar-outline" size={24} color="#ffffff" />
              </View>
              <View style={styles.bannerInfo}>
                <Text style={styles.bannerTitle}>Day-End Collection Summary</Text>
                <Text style={styles.bannerSub}>Daily mode-wise breakdown, agent receipts & cash drawer</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 2: MONTHLY TRENDS */}
        {activeTab === 'monthly' && (
          <View>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="bar-chart" size={18} color={colors.primary} />
                <Text style={styles.cardTitle}>Monthly Collection Trends</Text>
              </View>
              <Text style={styles.chartSubtitle}>Inflows recorded per calendar month</Text>

              {Object.keys(metrics.monthWiseCollections).length === 0 ? (
                <View style={styles.emptyChart}>
                  <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
                  <Text style={styles.emptyChartText}>No monthly collections recorded yet.</Text>
                </View>
              ) : (
                Object.entries(metrics.monthWiseCollections).map(([mKey, amt]) => {
                  const maxAmt = Math.max(...Object.values(metrics.monthWiseCollections), 1);
                  const barPct = Math.min(Math.round((amt / maxAmt) * 100), 100);

                  return (
                    <View key={mKey} style={styles.trendRow}>
                      <Text style={styles.trendMonth}>{mKey}</Text>
                      <View style={styles.trendBarTrack}>
                        <View style={[styles.trendBarFill, { width: `${barPct}%` }]} />
                      </View>
                      <Text style={styles.trendAmount}>{formatCurrency(amt)}</Text>
                    </View>
                  );
                })
              )}
            </View>

            {/* Monthly Disbursements Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="arrow-up-circle" size={18} color="#059669" />
                <Text style={styles.cardTitle}>Monthly Capital Sanctioned</Text>
              </View>
              <Text style={styles.chartSubtitle}>Loans disbursed to borrowers</Text>

              {Object.keys(metrics.monthWiseDisbursements).length === 0 ? (
                <View style={styles.emptyChart}>
                  <Ionicons name="cash-outline" size={32} color={colors.textMuted} />
                  <Text style={styles.emptyChartText}>No loans disbursed recorded yet.</Text>
                </View>
              ) : (
                Object.entries(metrics.monthWiseDisbursements).map(([mKey, amt]) => {
                  const maxAmt = Math.max(...Object.values(metrics.monthWiseDisbursements), 1);
                  const barPct = Math.min(Math.round((amt / maxAmt) * 100), 100);

                  return (
                    <View key={mKey} style={styles.trendRow}>
                      <Text style={styles.trendMonth}>{mKey}</Text>
                      <View style={styles.trendBarTrack}>
                        <View style={[styles.trendBarFill, { width: `${barPct}%`, backgroundColor: '#059669' }]} />
                      </View>
                      <Text style={styles.trendAmount}>{formatCurrency(amt)}</Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* TAB 3: EXPLORER (Multi-Filter & Sort) */}
        {activeTab === 'explorer' && (
          <View>
            {/* Filter Section */}
            <View style={styles.filterBox}>
              {/* Amount Range Filter */}
              <Text style={styles.filterSectionTitle}>Loan Amount Bracket</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
                {AMOUNT_RANGES.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.filterChip, selectedAmountRange === r.id && styles.filterChipActive]}
                    onPress={() => setSelectedAmountRange(r.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, selectedAmountRange === r.id && styles.filterChipTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Vehicle Type Filter */}
              <Text style={[styles.filterSectionTitle, { marginTop: spacing.sm }]}>Vehicle Type</Text>
              <View style={styles.filterChipsRow}>
                {[
                  { id: 'ALL', label: 'All Types' },
                  { id: 'TWO_WHEELER', label: '2-Wheeler' },
                  { id: 'FOUR_WHEELER', label: '4-Wheeler' },
                  { id: 'COMMERCIAL', label: 'Commercial' },
                ].map((vt) => (
                  <TouchableOpacity
                    key={vt.id}
                    style={[styles.filterChip, selectedVehicleType === vt.id && styles.filterChipActive]}
                    onPress={() => setSelectedVehicleType(vt.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, selectedVehicleType === vt.id && styles.filterChipTextActive]}>
                      {vt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Month Filter */}
              <Text style={[styles.filterSectionTitle, { marginTop: spacing.sm }]}>Disbursement Month</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
                {MONTH_NAMES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.filterChip, selectedMonth === m && styles.filterChipActive]}
                    onPress={() => setSelectedMonth(m)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, selectedMonth === m && styles.filterChipTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Sort Selector */}
              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Sort Portfolio By:</Text>
                <TouchableOpacity
                  style={styles.sortDropdownBtn}
                  onPress={() => setShowSortDropdown(!showSortDropdown)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sortDropdownText}>
                    {SORT_OPTIONS.find((s) => s.id === selectedSort)?.label}
                  </Text>
                  <Ionicons name={showSortDropdown ? 'chevron-up' : 'chevron-down'} size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {showSortDropdown && (
                <View style={styles.sortOptionsContainer}>
                  {SORT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.sortOptionItem, selectedSort === opt.id && styles.sortOptionItemActive]}
                      onPress={() => {
                        setSelectedSort(opt.id);
                        setShowSortDropdown(false);
                      }}
                    >
                      <Text style={[styles.sortOptionText, selectedSort === opt.id && styles.sortOptionTextActive]}>
                        {opt.label}
                      </Text>
                      {selectedSort === opt.id && (
                        <Ionicons name="checkmark" size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Results Count */}
            <View style={styles.resultsCountRow}>
              <Text style={styles.resultsCountText}>Showing {filteredLoans.length} Loans</Text>
              {(selectedAmountRange !== 'ALL' || selectedVehicleType !== 'ALL' || selectedMonth !== 'All Months') && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedAmountRange('ALL');
                    setSelectedVehicleType('ALL');
                    setSelectedMonth('All Months');
                  }}
                >
                  <Text style={styles.resetFiltersText}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Loan Explorer List */}
            {filteredLoans.length === 0 ? (
              <View style={styles.emptyResultsCard}>
                <Ionicons name="search-outline" size={36} color={colors.textMuted} />
                <Text style={styles.emptyResultsTitle}>No matching loans found</Text>
                <Text style={styles.emptyResultsSub}>Try clearing filters to see more results</Text>
              </View>
            ) : (
              filteredLoans.map((loan) => (
                <TouchableOpacity
                  key={loan.id}
                  style={styles.loanItemCard}
                  onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.loanItemTop}>
                    <View>
                      <Text style={styles.loanFileTag}>#{loan.fileNumber}</Text>
                      <Text style={styles.loanCustomerName}>{loan.customerName}</Text>
                    </View>
                    <View style={styles.loanAmountCol}>
                      <Text style={styles.loanAmountVal}>{formatCurrency(loan.loanAmount)}</Text>
                      <Text style={styles.loanEmiVal}>EMI: {formatCurrency(loan.emiAmount)}</Text>
                    </View>
                  </View>

                  <View style={styles.loanItemBottom}>
                    <View style={styles.vehicleInfoRow}>
                      <Ionicons name="car-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.vehicleInfoText}>{loan.vehicleMake} {loan.vehicleModel} ({loan.vehicleNumber})</Text>
                    </View>
                    <View style={[styles.statusTag, loan.status === 'Active' ? styles.statusActive : styles.statusClosed]}>
                      <Text style={[styles.statusTagText, loan.status === 'Active' ? styles.statusActiveText : styles.statusClosedText]}>
                        {loan.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#eff6ff',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    color: colors.primary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93c5fd',
    letterSpacing: 0.8,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  efficiencyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.round,
  },
  efficiencyBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabelText: {
    fontSize: 11,
    color: '#bfdbfe',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chartSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  distributionRow: {
    marginTop: spacing.sm,
  },
  distLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  distLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  distCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  distBarBg: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  dayEndBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  bannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  bannerSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  trendMonth: {
    width: 55,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  trendBarTrack: {
    flex: 1,
    height: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 7,
    overflow: 'hidden',
  },
  trendBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 7,
  },
  trendAmount: {
    width: 80,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyChartText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  filterBox: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: spacing.md,
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: borderRadius.round,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sortDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  sortDropdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  sortOptionsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  sortOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sortOptionItemActive: {
    backgroundColor: '#eff6ff',
  },
  sortOptionText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  sortOptionTextActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  resultsCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: 2,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  resetFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyResultsCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyResultsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  emptyResultsSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  loanItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loanItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  loanFileTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  loanCustomerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  loanAmountCol: {
    alignItems: 'flex-end',
  },
  loanAmountVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  loanEmiVal: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loanItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  vehicleInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusTag: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  statusClosed: {
    backgroundColor: '#f1f5f9',
  },
  statusClosedText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
});

export default AnalyticsScreen;
