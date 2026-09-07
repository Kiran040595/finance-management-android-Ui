import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import Header from '../components/Header';
import LoanCard from '../components/LoanCard';
import LoanService from '../services/loanService';

export const LoansListScreen = ({ navigation }) => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, Active, Closed

  const fetchLoans = useCallback(async () => {
    try {
      const data = await LoanService.getLoans();
      setLoans(data || []);
    } catch (e) {
      console.error('Error fetching loans', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLoans();
    });
    return unsubscribe;
  }, [navigation, fetchLoans]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoans();
  };

  const filteredLoans = useMemo(() => {
    let result = [...loans];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.customerName?.toLowerCase().includes(q) ||
          l.vehicleNumber?.toLowerCase().includes(q) ||
          l.fileNumber?.toLowerCase().includes(q) ||
          l.vehicleModel?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((l) => l.status === statusFilter);
    }
    return result;
  }, [loans, search, statusFilter]);

  return (
    <View style={styles.container}>
      <Header
        title="Vehicle Loans"
        subtitle={`${loans.length} Accounts in Portfolio`}
        rightAction={
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('AddLoan')}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Customer, Vehicle, File #..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.textMuted}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.statusTabsRow}>
        {['ALL', 'Active', 'Closed'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.statusTab, statusFilter === s && styles.statusTabActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.statusTabText, statusFilter === s && styles.statusTabTextActive]}>
              {s === 'ALL' ? 'All Loans' : s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loans List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 8, color: colors.textSecondary }}>Loading loan accounts...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLoans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LoanCard loan={item} onPress={() => navigation.navigate('LoanDetail', { loanId: item.id })} />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="car-sport-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No loans found</Text>
              <Text style={styles.emptySub}>No loan accounts match your search filters.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddLoan')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={26} color="#ffffff" />
      </TouchableOpacity>
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
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
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
  statusTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    gap: 8,
  },
  statusTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  statusTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusTabTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 80,
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default LoansListScreen;
