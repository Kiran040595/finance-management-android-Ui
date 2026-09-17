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

export const SeizureNoticeModal = ({ visible, loan, onClose }) => {
  if (!loan) return null;

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const noticeRefNo = `LEGAL/NOTICE/2026/VF-${loan.fileNumber || '00'}`;

  // Compute overdue count and amount
  let overdueCount = 0;
  let overdueTotal = 0;
  if (Array.isArray(loan.emis || loan.emiDetails)) {
    const today = new Date();
    (loan.emis || loan.emiDetails).forEach((e) => {
      if (e.status !== 'Paid') {
        const d = new Date(e.emiDate);
        if (d < today) {
          overdueCount += 1;
          overdueTotal += Number(e.remainingAmount || e.emiAmount || 0) + Number(e.penaltyAmount || 0);
        }
      }
    });
  }

  const formatCurrency = (val) => '₹' + Math.round(Number(val || 0)).toLocaleString('en-IN');

  const generateNoticeText = () => {
    return (
      `*🚨 FORMAL LEGAL DEMAND & VEHICLE REPOSSESSION NOTICE*\n` +
      `*SRI SAI VEHICLE FINANCE — LEGAL & RECOVERY CELL*\n` +
      `────────────────────────────────────\n` +
      `*Notice Ref:* ${noticeRefNo}\n` +
      `*Date of Issue:* ${todayStr}\n\n` +
      `*TO:*\n` +
      `*Borrower:* ${loan.customerName}\n` +
      `*Address:* ${loan.customerAddress || 'Customer Address'}\n` +
      `*Phone:* ${loan.customerPhone || loan.customerPhonePrimary || 'N/A'}\n` +
      (loan.guarantorName ? `*Guarantor:* ${loan.guarantorName} (${loan.guarantorPhone || 'N/A'})\n\n` : '\n') +
      `*VEHICLE PARTICULARS:*\n` +
      `• *Registration No:* ${loan.vehicleNumber}\n` +
      `• *Make & Model:* ${loan.vehicleMake || ''} ${loan.vehicleModel}\n` +
      `• *Loan Agreement File #:* ${loan.fileNumber}\n` +
      `• *Defaulted Installments:* ${overdueCount} EMIs Unpaid\n` +
      `• *Total Overdue Dues:* ${formatCurrency(overdueTotal || loan.totalOutstanding || 0)}\n\n` +
      `*FINAL 7-DAY DEMAND TO PAY OR SURRENDER:*\n` +
      `You are in serious breach of the Hire Purchase / Hypothecation Agreement. Despite repeated reminders, you have neglected and failed to liquidate your overdue installments.\n\n` +
      `*YOU ARE HEREBY GIVEN SEVEN (7) DAYS NOTICE* to pay the full overdue sum of *${formatCurrency(overdueTotal || loan.totalOutstanding || 0)}* at our office or via official UPI.\n\n` +
      `*CONSEQUENCES OF DEFAULT:*\n` +
      `1. Our authorized field recovery agents will proceed to *REPOSSESS AND SEIZE* the vehicle wherever located at your sole risk and expense.\n` +
      `2. Formal police intimation and criminal complaint under Sections 406/420 of IPC / Sec 138 NI Act.\n` +
      `3. Vehicle will be auctioned to recover financial loss.\n\n` +
      `────────────────────────────────────\n` +
      `*RECOVERY & LEGAL DEPARTMENT*\n` +
      `*SRI SAI VEHICLE FINANCE*\n` +
      `Emergency Contact: +91 98765 43210`
    );
  };

  const handleSendWhatsApp = () => {
    const text = generateNoticeText();
    let phone = (loan.customerPhone || loan.customerPhonePrimary || '').replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `whatsapp://send?text=${encodeURIComponent(text)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Error', 'Unable to launch WhatsApp. You can share via native sharing.', [
        { text: 'Share', onPress: handleShareUniversal },
        { text: 'Cancel', style: 'cancel' },
      ]);
    });
  };

  const handleShareUniversal = async () => {
    try {
      await Share.share({
        title: `Legal Seizure Notice - ${loan.vehicleNumber}`,
        message: generateNoticeText(),
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.headerIcon}>
                <Ionicons name="warning" size={22} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.title}>7-Day Repossession Legal Notice</Text>
                <Text style={styles.subtitle}>File #{loan.fileNumber} • {loan.customerName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Notice Card */}
            <View style={styles.noticeCard}>
              <View style={styles.cardTop}>
                <Text style={styles.urgentBadge}>FINAL LEGAL INTIMATION</Text>
                <Text style={styles.refText}>{noticeRefNo}</Text>
              </View>

              <Text style={styles.bodyHeadline}>
                NOTICE FOR VEHICLE REPOSSESSION & ARBITRATION
              </Text>

              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Borrower Name</Text>
                  <Text style={styles.infoValBold}>{loan.customerName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Vehicle Number</Text>
                  <Text style={styles.infoValHighlight}>{loan.vehicleNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Vehicle Model</Text>
                  <Text style={styles.infoVal}>{loan.vehicleMake} {loan.vehicleModel}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Defaulted EMIs</Text>
                  <Text style={[styles.infoValBold, { color: colors.error }]}>
                    {overdueCount || 1} Overdue Installments
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total Overdue Dues</Text>
                  <Text style={[styles.infoValBold, { color: colors.error, fontSize: 14 }]}>
                    {formatCurrency(overdueTotal || loan.totalOutstanding || 0)}
                  </Text>
                </View>
              </View>

              <View style={styles.warningBox}>
                <Ionicons name="alert-circle" size={20} color="#b91c1c" />
                <Text style={styles.warningText}>
                  Notice Period: <Text style={{ fontWeight: '800' }}>7 DAYS</Text> to clear total dues. If unpaid, recovery team will impound the vehicle and lodge police intimation.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.whatsAppBtn}
              onPress={handleSendWhatsApp}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
              <Text style={styles.whatsAppBtnText}>Send Legal Notice on WhatsApp</Text>
            </TouchableOpacity>

            <View style={styles.footerSecondaryRow}>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShareUniversal}
                activeOpacity={0.7}
              >
                <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                <Text style={styles.shareBtnText}>Print / Export Notice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtnSecondary}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.closeBtnSecondaryText}>Dismiss</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: spacing.md,
  },
  noticeCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgentBadge: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  refText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  bodyHeadline: {
    fontSize: 14,
    fontWeight: '900',
    color: '#991b1b',
    marginTop: spacing.sm,
    letterSpacing: 0.3,
  },
  infoBox: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoVal: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  infoValBold: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  infoValHighlight: {
    fontSize: 12,
    fontWeight: '900',
    color: '#dc2626',
  },
  warningBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 11,
    color: '#991b1b',
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
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
  closeBtnSecondary: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  closeBtnSecondaryText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default SeizureNoticeModal;
