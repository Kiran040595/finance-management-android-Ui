import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';

export const PaymentReceiptModal = ({ visible, receipt, onClose }) => {
  if (!receipt) return null;

  const formatCurrency = (val) => '₹' + Math.round(Number(val || 0)).toLocaleString('en-IN');

  const generateReceiptText = () => {
    return (
      `*🧾 OFFICIAL PAYMENT RECEIPT*\n` +
      `*VEHICLE FINANCE & INVESTMENTS*\n` +
      `──────────────────────────\n` +
      `*Receipt No:* ${receipt.receiptNumber || 'VF-REC-' + Date.now().toString().slice(-6)}\n` +
      `*Date:* ${receipt.date || new Date().toISOString().split('T')[0]}\n` +
      `*Customer:* ${receipt.customerName || 'Customer'}\n` +
      `*Vehicle:* ${receipt.vehicleModel || 'Vehicle'} (${receipt.vehicleNumber || 'N/A'})\n` +
      `*Loan File #:* ${receipt.fileNumber || 'N/A'}\n` +
      `*Installment:* EMI #${receipt.emiNumber || '1'}\n` +
      `──────────────────────────\n` +
      `*Base EMI:* ${formatCurrency(receipt.baseAmount || receipt.amount)}\n` +
      (Number(receipt.penaltyCollected || 0) > 0 ? `*Late Fee Penalty:* ${formatCurrency(receipt.penaltyCollected)}\n` : '') +
      `*Total Amount Paid:* ${formatCurrency(receipt.amount)}\n` +
      `*Payment Mode:* ${receipt.mode || 'UPI'}\n` +
      `*Collected By:* ${receipt.agentName || 'Administrator'}\n` +
      `──────────────────────────\n` +
      (receipt.remainingBalance != null ? `*Remaining Balance:* ${formatCurrency(receipt.remainingBalance)}\n` : '') +
      (receipt.remainingEmis != null ? `*Remaining EMIs:* ${receipt.remainingEmis} months\n` : '') +
      `──────────────────────────\n` +
      `_Payment verified & credited successfully._\n` +
      `_Thank you for your timely payment!_`
    );
  };

  const handleSendWhatsApp = () => {
    const text = generateReceiptText();
    let phone = (receipt.customerPhone || '').replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `whatsapp://send?text=${encodeURIComponent(text)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Not Available', 'Could not launch WhatsApp. You can use Share instead.', [
        { text: 'Share', onPress: handleShareUniversal },
        { text: 'Cancel', style: 'cancel' },
      ]);
    });
  };

  const handleShareUniversal = async () => {
    try {
      await Share.share({
        title: `Payment Receipt #${receipt.receiptNumber || 'VF'}`,
        message: generateReceiptText(),
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top Success Banner */}
          <View style={styles.successHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle" size={40} color="#059669" />
            </View>
            <Text style={styles.headerTitle}>Payment Received!</Text>
            <Text style={styles.headerSubtitle}>Official money receipt has been generated</Text>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Voucher Card */}
            <View style={styles.voucherCard}>
              <View style={styles.voucherHeaderRow}>
                <View>
                  <Text style={styles.companyName}>VEHICLE FINANCE</Text>
                  <Text style={styles.receiptType}>EMI COLLECTION RECEIPT</Text>
                </View>
                <View style={styles.receiptNoTag}>
                  <Text style={styles.receiptNoText}>{receipt.receiptNumber || 'REC-' + Date.now().toString().slice(-6)}</Text>
                </View>
              </View>

              <View style={styles.perforationLine} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Borrower Name</Text>
                <Text style={styles.detailValueBold}>{receipt.customerName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loan File #</Text>
                <Text style={styles.detailValue}>#{receipt.fileNumber}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vehicle</Text>
                <Text style={styles.detailValue}>{receipt.vehicleModel} ({receipt.vehicleNumber})</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Installment</Text>
                <Text style={styles.detailValue}>EMI #{receipt.emiNumber}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Date</Text>
                <Text style={styles.detailValue}>{receipt.date || new Date().toISOString().split('T')[0]}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Mode</Text>
                <View style={styles.modePill}>
                  <Text style={styles.modePillText}>{receipt.mode || 'Cash'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Collected By</Text>
                <Text style={styles.detailValue}>{receipt.agentName || 'Agent'}</Text>
              </View>

              {Number(receipt.penaltyCollected || 0) > 0 && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.error }]}>Late Penalty Included</Text>
                  <Text style={[styles.detailValue, { color: colors.error, fontWeight: '700' }]}>
                    +{formatCurrency(receipt.penaltyCollected)}
                  </Text>
                </View>
              )}

              <View style={styles.amountHighlightBox}>
                <Text style={styles.amountBoxLabel}>TOTAL PAID TODAY</Text>
                <Text style={styles.amountBoxValue}>{formatCurrency(receipt.amount)}</Text>
              </View>

              {receipt.remainingBalance != null && (
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Remaining Loan Balance:</Text>
                  <Text style={styles.balanceValue}>{formatCurrency(receipt.remainingBalance)}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.whatsAppBtn}
              onPress={handleSendWhatsApp}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
              <Text style={styles.whatsAppBtnText}>Send WhatsApp Receipt</Text>
            </TouchableOpacity>

            <View style={styles.footerSecondaryRow}>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShareUniversal}
                activeOpacity={0.7}
              >
                <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                <Text style={styles.shareBtnText}>Share / Print</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  successHeader: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderColor: '#dcfce7',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#065f46',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  body: {
    padding: spacing.md,
  },
  voucherCard: {
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: spacing.md,
  },
  voucherHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyName: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  receiptType: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
  receiptNoTag: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
  },
  receiptNoText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369a1',
  },
  perforationLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginVertical: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  detailValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modePill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  amountHighlightBox: {
    backgroundColor: '#065f46',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  amountBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a7f3d0',
    letterSpacing: 0.8,
  },
  amountBoxValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  balanceLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  balanceValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    gap: spacing.sm,
  },
  whatsAppBtn: {
    backgroundColor: '#16a34a',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  whatsAppBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  footerSecondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  shareBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  shareBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  doneBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default PaymentReceiptModal;
