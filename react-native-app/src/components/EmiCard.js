import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';

export const EmiCard = ({ item, onPay, onViewLoan }) => {
  const isOverdue = item.daysUntilDue < 0;
  const isToday = item.daysUntilDue === 0;

  const formatCurrency = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  const getUrgencyBadge = () => {
    if (isOverdue) {
      return (
        <View style={[styles.badge, styles.badgeOverdue]}>
          <Ionicons name="warning-outline" size={12} color={colors.errorDark} />
          <Text style={styles.badgeTextOverdue}>
            {Math.abs(item.daysUntilDue)}d Overdue {item.penaltyAmount > 0 ? `(+₹${item.penaltyAmount})` : ''}
          </Text>
        </View>
      );
    }
    if (isToday) {
      return (
        <View style={[styles.badge, styles.badgeToday]}>
          <Ionicons name="notifications-outline" size={12} color="#b45309" />
          <Text style={styles.badgeTextToday}>Due Today</Text>
        </View>
      );
    }
    if (item.daysUntilDue <= 7) {
      return (
        <View style={[styles.badge, styles.badgeSoon]}>
          <Ionicons name="time-outline" size={12} color="#0369a1" />
          <Text style={styles.badgeTextSoon}>Due in {item.daysUntilDue}d</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgeFuture]}>
        <Text style={styles.badgeTextFuture}>In {item.daysUntilDue} days</Text>
      </View>
    );
  };

  const handleCall = () => {
    if (!item.customerPhone) {
      Alert.alert('No Phone', 'Customer phone number is not available');
      return;
    }
    Linking.openURL(`tel:${item.customerPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call');
    });
  };

  const handleWhatsApp = () => {
    if (!item.customerPhone) {
      Alert.alert('No Phone', 'Customer phone number is not available');
      return;
    }
    const cleanPhone = item.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = isOverdue
      ? `Dear ${item.customerName}, your vehicle loan EMI #${item.emiNumber} of ${formatCurrency(item.remainingAmount || item.emiAmount)} for vehicle ${item.vehicleNumber} is OVERDUE by ${Math.abs(item.daysUntilDue)} days. Please pay immediately. - FMS Vehicle Finance`
      : `Dear ${item.customerName}, reminder that your vehicle loan EMI #${item.emiNumber} of ${formatCurrency(item.remainingAmount || item.emiAmount)} for ${item.vehicleModel} (${item.vehicleNumber}) is due on ${item.emiDate}. - FMS Vehicle Finance`;
    
    Linking.openURL(`whatsapp://send?phone=${phoneWithCountry}&text=${encodeURIComponent(msg)}`).catch(() => {
      // Fallback to web link
      Linking.openURL(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`).catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp');
      });
    });
  };

  return (
    <View style={[styles.card, isOverdue && styles.cardOverdue]}>
      {/* Top Bar: File Number, Vehicle Type & Urgency Badge */}
      <View style={styles.topRow}>
        <View style={styles.fileTagContainer}>
          <Text style={styles.fileNumber}>{item.fileNumber}</Text>
          <View style={styles.vehicleTypePill}>
            <Text style={styles.vehicleTypeText}>{item.vehicleType}</Text>
          </View>
        </View>
        {getUrgencyBadge()}
      </View>

      {/* Customer & Vehicle Info */}
      <TouchableOpacity onPress={() => onViewLoan && onViewLoan(item.loanId)} activeOpacity={0.8}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <View style={styles.vehicleRow}>
          <Ionicons
            name={item.vehicleType?.includes('Two') ? 'bicycle-outline' : 'car-outline'}
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.vehicleModel}>{item.vehicleMake} {item.vehicleModel}</Text>
          <View style={styles.vehicleNumBadge}>
            <Text style={styles.vehicleNumText}>{item.vehicleNumber}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Due Date & Amount Strip */}
      <View style={[styles.amountStrip, isOverdue ? styles.stripOverdue : isToday ? styles.stripToday : styles.stripNormal]}>
        <View>
          <Text style={styles.stripLabel}>DUE DATE</Text>
          <Text style={[styles.stripDate, isOverdue && { color: colors.error }]}>{item.emiDate}</Text>
          <Text style={styles.stripEmiNum}>Installment #{item.emiNumber} of {item.totalTenure}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.stripLabel}>AMOUNT DUE</Text>
          <Text style={styles.stripAmount}>{formatCurrency(item.remainingAmount || item.emiAmount)}</Text>
          <Text style={styles.stripBreakdown}>P: ₹{item.principalComponent} | I: ₹{item.interestComponent}</Text>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        <View style={styles.contactActions}>
          <TouchableOpacity style={styles.iconBtnWhatsapp} onPress={handleWhatsApp} activeOpacity={0.7}>
            <Ionicons name="logo-whatsapp" size={18} color="#16a34a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnCall} onPress={handleCall} activeOpacity={0.7}>
            <Ionicons name="call-outline" size={18} color="#475569" />
          </TouchableOpacity>
          {onViewLoan && (
            <TouchableOpacity style={styles.iconBtnView} onPress={() => onViewLoan(item.loanId)} activeOpacity={0.7}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.payBtn, isOverdue ? styles.payBtnOverdue : isToday ? styles.payBtnToday : styles.payBtnNormal]}
          onPress={() => onPay && onPay(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="card-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.payBtnText}>Record Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardOverdue: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffdfd',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fileTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileNumber: {
    fontWeight: '700',
    fontSize: 13,
    color: colors.primaryDark,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  vehicleTypePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  vehicleTypeText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  badgeOverdue: {
    backgroundColor: '#fee2e2',
  },
  badgeTextOverdue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.errorDark,
  },
  badgeToday: {
    backgroundColor: '#fef3c7',
  },
  badgeTextToday: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  badgeSoon: {
    backgroundColor: '#e0f2fe',
  },
  badgeTextSoon: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
  },
  badgeFuture: {
    backgroundColor: '#f1f5f9',
  },
  badgeTextFuture: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  vehicleModel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  vehicleNumBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  vehicleNumText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#475569',
  },
  amountStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  stripNormal: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  stripToday: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  stripOverdue: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  stripLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  stripDate: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  stripEmiNum: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stripAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 2,
  },
  stripBreakdown: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtnWhatsapp: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnCall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnView: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: borderRadius.md,
  },
  payBtnNormal: {
    backgroundColor: colors.primary,
  },
  payBtnToday: {
    backgroundColor: '#d97706',
  },
  payBtnOverdue: {
    backgroundColor: colors.error,
  },
  payBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default EmiCard;
