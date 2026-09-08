import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import EmiCard from '../components/EmiCard';
import PaymentModal from '../components/PaymentModal';
import LoanService from '../services/loanService';
import PaymentService from '../services/paymentService';

export const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pay Modal
  const [selectedEmi, setSelectedEmi] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([
        LoanService.getLoanStats(),
        PaymentService.getUpcomingEMIs(),
      ]);
      setStats(s);
      setUpcoming(u.slice(0, 4)); // top 4 upcoming
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

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
    loadData();
  };

  const formatCurrency = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Vehicle Portfolio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Vehicle Finance"
        subtitle="Automobile Loan Management & EMI Tracking"
        rightAction={
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('AddLoan')}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCol}>
            <StatCard
              title="Total Disbursed"
              value={formatCurrency(stats?.totalDisbursed)}
              subtitle={`${stats?.totalLoans || 0} Total Loans`}
              iconName="cash-outline"
              iconColor={colors.primary}
              bgColor="#eff6ff"
              borderColor="#bfdbfe"
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard
              title="Active Loans"
              value={String(stats?.activeLoans || 0)}
              subtitle="Current Portfolio"
              iconName="car-outline"
              iconColor={colors.success}
              bgColor="#ecfdf5"
              borderColor="#a7f3d0"
            />
          </View>
        </View>

        <View style={[styles.kpiGrid, { marginTop: spacing.sm }]}>
          <View style={styles.kpiCol}>
            <StatCard
              title="Total Collected"
              value={formatCurrency(stats?.totalCollected)}
              subtitle="Principal + Interest"
              iconName="checkmark-circle-outline"
              iconColor="#059669"
              bgColor="#f0fdf4"
              borderColor="#bbf7d0"
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard
              title="Overdue Accounts"
              value={String(stats?.overdueCount || 0)}
              subtitle="Action Required"
              iconName="alert-circle-outline"
              iconColor={colors.error}
              bgColor="#fef2f2"
              borderColor="#fecaca"
            />
          </View>
        </View>

        {/* Quick Action Navigation Buttons */}
        <Text style={styles.sectionHeading}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#1e40af' }]}
            onPress={() => navigation.navigate('EmiTracker')}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={24} color="#ffffff" />
            <Text style={styles.actionCardTitle}>EMI Tracker</Text>
            <Text style={styles.actionCardSub}>Due dates & reminders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#0f766e' }]}
            onPress={() => navigation.navigate('AddLoan')}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={24} color="#ffffff" />
            <Text style={styles.actionCardTitle}>New Loan</Text>
            <Text style={styles.actionCardSub}>Customer & vehicle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#c2410c' }]}
            onPress={() => navigation.navigate('Payment')}
            activeOpacity={0.8}
          >
            <Ionicons name="card" size={24} color="#ffffff" />
            <Text style={styles.actionCardTitle}>Pay EMI</Text>
            <Text style={styles.actionCardSub}>Instant receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#475569' }]}
            onPress={() => navigation.navigate('PaymentTracking')}
            activeOpacity={0.8}
          >
            <Ionicons name="receipt" size={24} color="#ffffff" />
            <Text style={styles.actionCardTitle}>Ledger</Text>
            <Text style={styles.actionCardSub}>Audit trail</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming EMI Obligations Preview */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>Upcoming Due Dates</Text>
            <Text style={styles.sectionSub}>Next installments due across portfolio</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('EmiTracker')}>
            <Text style={styles.seeAllText}>View All ({upcoming.length}+)</Text>
          </TouchableOpacity>
        </View>

        {upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={36} color={colors.success} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No pending EMI obligations in the immediate window.</Text>
          </View>
        ) : (
          upcoming.map((item) => (
            <EmiCard
              key={`${item.fileNumber}-${item.emiNumber}`}
              item={item}
              onPay={handlePay}
              onViewLoan={(id) => navigation.navigate('LoanDetail', { loanId: id })}
            />
          ))
        )}
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
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kpiCol: {
    flex: 1,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'flex-start',
    elevation: 2,
  },
  actionCardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  actionCardSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
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
});

export default DashboardScreen;
