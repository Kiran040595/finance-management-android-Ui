import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import Header from '../components/Header';
import EmiCard from '../components/EmiCard';
import PaymentModal from '../components/PaymentModal';
import PaymentService from '../services/paymentService';

export const EmiTrackerScreen = ({ navigation }) => {
  const [upcomingList, setUpcomingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState('all'); // all, 7days, 15days, thisMonth, overdue
  const [vehicleType, setVehicleType] = useState('ALL'); // ALL, Two Wheeler, Car, Commercial

  // Pay Modal
  const [selectedEmi, setSelectedEmi] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadEMIs = useCallback(async () => {
    try {
      const data = await PaymentService.getUpcomingEMIs();
      setUpcomingList(data || []);
    } catch (err) {
      console.error('Error loading EMIs:', err);
      Alert.alert('Error', 'Unable to fetch EMI list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEMIs();
    const unsubscribe = navigation.addListener('focus', () => {
      loadEMIs();
    });
    return unsubscribe;
  }, [navigation, loadEMIs]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEMIs();
  };

  // Filtered List
  const filteredList = useMemo(() => {
    let list = [...upcomingList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.customerName?.toLowerCase().includes(q) ||
          i.customerPhone?.includes(q) ||
          i.vehicleNumber?.toLowerCase().includes(q) ||
          i.fileNumber?.toLowerCase().includes(q) ||
          i.vehicleModel?.toLowerCase().includes(q)
      );
    }

    if (vehicleType !== 'ALL') {
      list = list.filter((i) => i.vehicleType?.includes(vehicleType));
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (timeframe === '7days') {
      list = list.filter((i) => i.daysUntilDue >= 0 && i.daysUntilDue <= 7);
    } else if (timeframe === '15days') {
      list = list.filter((i) => i.daysUntilDue >= 0 && i.daysUntilDue <= 15);
    } else if (timeframe === 'thisMonth') {
      list = list.filter((i) => {
        const d = new Date(i.emiDate);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });
    } else if (timeframe === 'overdue') {
      list = list.filter((i) => i.daysUntilDue < 0);
    }

    return list;
  }, [upcomingList, searchQuery, vehicleType, timeframe]);

  // Aggregates
  const aggregates = useMemo(() => {
    let due30 = 0;
    let due7 = 0;
    let overdue = 0;
    let overdueCount = 0;

    upcomingList.forEach((item) => {
      const amt = item.remainingAmount || item.emiAmount || 0;
      if (item.daysUntilDue < 0) {
        overdue += amt;
        overdueCount += 1;
      } else if (item.daysUntilDue <= 7) {
        due7 += amt;
      }
      if (item.daysUntilDue >= 0 && item.daysUntilDue <= 30) {
        due30 += amt;
      }
    });

    return { due30, due7, overdue, overdueCount };
  }, [upcomingList]);

  const formatCurrency = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  const handlePay = (emi) => {
    setSelectedEmi(emi);
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
    Alert.alert('Payment Recorded', `Successfully recorded payment of ₹${paymentData.amount}`);
    loadEMIs();
  };

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: '7days', label: 'Due in 7 Days' },
    { key: '15days', label: 'Due in 15 Days' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'overdue', label: `Overdue (${aggregates.overdueCount})` },
  ];

  const vehicleFilters = [
    { key: 'ALL', label: 'All Vehicles' },
    { key: 'Car', label: 'Cars' },
    { key: 'Two Wheeler', label: 'Two Wheelers' },
    { key: 'Commercial', label: 'Commercial' },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="EMI Tracker"
        subtitle="Repayment Obligations & Due Dates"
        rightAction={
          <TouchableOpacity style={styles.refreshBtn} onPress={loadEMIs} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      {/* KPI Overview Pills */}
      <View style={styles.kpiPillsRow}>
        <View style={[styles.kpiPill, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
          <Text style={styles.kpiPillLabel}>30D DUE</Text>
          <Text style={[styles.kpiPillVal, { color: colors.primary }]}>{formatCurrency(aggregates.due30)}</Text>
        </View>

        <View style={[styles.kpiPill, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
          <Text style={styles.kpiPillLabel}>7D DUE</Text>
          <Text style={[styles.kpiPillVal, { color: '#c2410c' }]}>{formatCurrency(aggregates.due7)}</Text>
        </View>

        <View style={[styles.kpiPill, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
          <Text style={styles.kpiPillLabel}>OVERDUE</Text>
          <Text style={[styles.kpiPillVal, { color: colors.error }]}>{formatCurrency(aggregates.overdue)}</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Customer, Vehicle No, File #..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textMuted}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Timeframe Chips */}
      <View style={styles.chipsRowContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {filterTabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.filterChip,
                timeframe === t.key && styles.filterChipActive,
                t.key === 'overdue' && timeframe === t.key && { backgroundColor: colors.error },
              ]}
              onPress={() => setTimeframe(t.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  timeframe === t.key && styles.filterChipTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Vehicle Type Mini Filter */}
      <View style={styles.vehicleFilterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 6 }}>
          {vehicleFilters.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[styles.vehicleChip, vehicleType === v.key && styles.vehicleChipActive]}
              onPress={() => setVehicleType(v.key)}
            >
              <Text style={[styles.vehicleChipText, vehicleType === v.key && styles.vehicleChipTextActive]}>
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* EMI List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 8, color: colors.textSecondary }}>Loading installments...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => `${item.fileNumber}-${item.emiNumber}`}
          renderItem={({ item }) => (
            <EmiCard
              item={item}
              onPay={handlePay}
              onViewLoan={(id) => navigation.navigate('LoanDetail', { loanId: id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No matching EMI obligations</Text>
              <Text style={styles.emptySub}>Try adjusting your search keywords or timeframe filter.</Text>
              {(searchQuery || timeframe !== 'all' || vehicleType !== 'ALL') && (
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setTimeframe('all');
                    setVehicleType('ALL');
                  }}
                >
                  <Text style={styles.resetBtnText}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

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
  refreshBtn: {
    padding: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  kpiPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  kpiPill: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  kpiPillVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  chipsRowContainer: {
    marginTop: spacing.sm,
  },
  chipsScroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderDark,
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
  vehicleFilterRow: {
    marginVertical: spacing.xs,
  },
  vehicleChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: '#f1f5f9',
  },
  vehicleChipActive: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#7dd3fc',
  },
  vehicleChipText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  vehicleChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  resetBtn: {
    marginTop: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  resetBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default EmiTrackerScreen;
