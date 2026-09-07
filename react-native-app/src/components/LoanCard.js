import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';

export const LoanCard = ({ loan, onPress }) => {
  const percentPaid = Math.round(((loan.paidEmiCount || 0) / (loan.tenure || 1)) * 100);
  const formatCurrency = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return colors.success;
      case 'Closed':
        return colors.textSecondary;
      case 'Defaulted':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.topRow}>
        <View style={styles.badgeContainer}>
          <Text style={styles.fileNumber}>{loan.fileNumber}</Text>
          <View style={styles.vehicleTypeTag}>
            <Text style={styles.vehicleTypeText}>{loan.vehicleType}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(loan.status) }]}>{loan.status}</Text>
        </View>
      </View>

      <Text style={styles.customerName}>{loan.customerName}</Text>
      <Text style={styles.vehicleInfo}>
        {loan.vehicleMake} {loan.vehicleModel} • {loan.vehicleNumber}
      </Text>

      <View style={styles.numbersGrid}>
        <View>
          <Text style={styles.miniLabel}>LOAN AMOUNT</Text>
          <Text style={styles.boldAmount}>{formatCurrency(loan.loanAmount)}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.miniLabel}>MONTHLY EMI</Text>
          <Text style={[styles.boldAmount, { color: colors.primary }]}>{formatCurrency(loan.emiAmount)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.miniLabel}>TENURE</Text>
          <Text style={styles.boldAmount}>{loan.tenure} mos</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${Math.min(100, percentPaid)}%` }]} />
        </View>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressLabel}>
            {loan.paidEmiCount} of {loan.tenure} EMIs paid ({loan.remainingEmi} left)
          </Text>
          <Text style={styles.progressPercent}>{percentPaid}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileNumber: {
    fontWeight: '700',
    fontSize: 12,
    color: colors.primaryDark,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  vehicleTypeTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  vehicleTypeText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  vehicleInfo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  numbersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.sm,
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  boldAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default LoanCard;
