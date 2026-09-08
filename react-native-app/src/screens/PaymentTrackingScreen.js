import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import Header from '../components/Header';
import PaymentTrackingService from '../services/paymentService'; // or vehicleFinanceStore
import VehicleFinanceStore from '../services/vehicleFinanceStore';

export const PaymentTrackingScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL'); // ALL, UPI, Cash, Bank Transfer, Cheque
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, CREDIT, DEBIT

  const loadData = useCallback(async () => {
    try {
      const txns = VehicleFinanceStore.getTransactions();
      setTransactions(txns || []);
    } catch (e) {
      console.error('Error fetching transactions:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = navigation.addListener('focus', () => {
      loadData();
    });
    return unsub;
  }, [navigation, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredTxns = useMemo(() => {
    let list = [...transactions];

    if (typeFilter !== 'ALL') {
      list = list.filter((t) => t.type === typeFilter);
    }

    if (modeFilter !== 'ALL') {
      list = list.filter(
        (t) => (t.paymentMode || t.mode || '').toLowerCase() === modeFilter.toLowerCase()
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.customerName?.toLowerCase().includes(q) ||
          t.fileNumber?.toLowerCase().includes(q) ||
          t.vehicleNumber?.toLowerCase().includes(q) ||
          t.transactionId?.toLowerCase().includes(q) ||
          t.id?.toLowerCase().includes(q)
      );
    }

    // Sort latest first
    return list.sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));
  }, [transactions, typeFilter, modeFilter, searchTerm]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalCollected = transactions
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const totalDisbursed = transactions
      .filter((t) => t.type === 'DEBIT')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const count = transactions.length;
    return { totalCollected, totalDisbursed, count };
  }, [transactions]);

  const handleShareStatement = async () => {
    try {
      let text = `*VEHICLE FINANCE - TRANSACTION AUDIT LEDGER*\nTotal Transactions: ${filteredTxns.length}\nTotal Inflow: ₹${stats.totalCollected.toLocaleString('en-IN')}\nTotal Outflow: ₹${stats.totalDisbursed.toLocaleString('en-IN')}\n\n`;
      filteredTxns.slice(0, 15).forEach((t, idx) => {
        text += `${idx + 1}. ${t.date || 'N/A'} | ₹${Number(t.amount || 0).toLocaleString('en-IN')} (${t.type})\n   ${t.customerName || t.description || 'Customer'} - ${t.fileNumber || ''} [${t.paymentMode || t.mode || 'N/A'}]\n`;
      });
      await Share.share({ message: text });
    } catch (e) {
      console.error(e);
    }
  };

  const renderTransactionItem = ({ item }) => {
    const isCredit = item.type === 'CREDIT';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrapper}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: isCredit ? '#ecfdf5' : '#fef2f2' },
              ]}
            >
              <Ionicons
                name={isCredit ? 'arrow-down-circle' : 'arrow-up-circle'}
                size={22}
                color={isCredit ? colors.success : colors.danger}
              />
            </View>
            <View>
              <Text style={styles.customerName}>
                {item.customerName || item.description || 'General Transaction'}
              </Text>
              <Text style={styles.fileAndDate}>
                {item.fileNumber ? `${item.fileNumber} • ` : ''}
                {item.date || 'Today'}
              </Text>
            </View>
          </View>
          <View style={styles.amountContainer}>
            <Text
              style={[
                styles.amountText,
                { color: isCredit ? colors.success : colors.danger },
              ]}
            >
              {isCredit ? '+' : '-'}₹{Number(item.amount || 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.modeBadge}>{item.paymentMode || item.mode || 'UPI'}</Text>
          </View>
        </View>

        {(item.vehicleNumber || item.notes || item.emiNumber) && (
          <View style={styles.cardFooter}>
            {item.vehicleNumber && (
              <View style={styles.chip}>
                <Ionicons name="car-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.chipText}>{item.vehicleNumber}</Text>
              </View>
            )}
            {item.emiNumber && (
              <View style={styles.chip}>
                <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.chipText}>EMI #{item.emiNumber}</Text>
              </View>
            )}
            {item.status && (
              <View style={[styles.chip, { backgroundColor: '#f0fdf4' }]}>
                <Text style={[styles.chipText, { color: colors.success, fontWeight: '700' }]}>
                  {item.status}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Transaction Ledger"
        subtitle="Payment inflows, disbursements & audit trail"
        rightAction={{
          icon: 'share-social-outline',
          onPress: handleShareStatement,
        }}
      />

      {/* Top Metrics Banner */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Collections</Text>
          <Text style={[styles.metricValue, { color: colors.success }]}>
            ₹{stats.totalCollected.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Disbursements</Text>
          <Text style={[styles.metricValue, { color: colors.danger }]}>
            ₹{stats.totalDisbursed.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Transactions</Text>
          <Text style={styles.metricValue}>{transactions.length}</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer, file #, vehicle #..."
          placeholderTextColor={colors.textMuted}
          value={searchTerm}
          onChangeText={setSearchTerm}
          clearButtonMode="while-editing"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, typeFilter === 'ALL' && styles.filterChipActive]}
          onPress={() => setTypeFilter('ALL')}
        >
          <Text style={[styles.filterChipText, typeFilter === 'ALL' && styles.filterChipTextActive]}>
            All Flows
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, typeFilter === 'CREDIT' && styles.filterChipActive]}
          onPress={() => setTypeFilter('CREDIT')}
        >
          <Text style={[styles.filterChipText, typeFilter === 'CREDIT' && styles.filterChipTextActive]}>
            Inflow (EMIs)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, typeFilter === 'DEBIT' && styles.filterChipActive]}
          onPress={() => setTypeFilter('DEBIT')}
        >
          <Text style={[styles.filterChipText, typeFilter === 'DEBIT' && styles.filterChipTextActive]}>
            Disbursed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading audit ledger...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTxns}
          keyExtractor={(item, index) => item.id || `txn-${index}`}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={54} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search criteria or filter tags.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  metricsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 42,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  typeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fileAndDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  modeBadge: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});

export default PaymentTrackingScreen;
