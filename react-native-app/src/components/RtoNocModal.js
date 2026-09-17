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

export const RtoNocModal = ({ visible, loan, onClose }) => {
  if (!loan) return null;

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const nocRefNo = `NOC/RTO/2026/VF-${loan.fileNumber || '00'}`;

  const generateNocText = () => {
    return (
      `*🏛️ NO OBJECTION CERTIFICATE (NOC) FOR HYPOTHECATION TERMINATION*\n` +
      `*SRI SAI VEHICLE FINANCE & INVESTMENTS*\n` +
      `*Regd. Auto Finance & Hire Purchase Division*\n` +
      `────────────────────────────────────\n` +
      `*Ref No:* ${nocRefNo}\n` +
      `*Date:* ${todayStr}\n\n` +
      `*To:*\n` +
      `The Registering Authority (RTO)\n` +
      `Motor Vehicles Department\n\n` +
      `*Subject:* Hypothecation Cancellation / Form 35 Clearance for Vehicle No: *${loan.vehicleNumber || 'N/A'}*\n\n` +
      `*Dear Sir / Madam,*\n\n` +
      `This is to certify that the vehicle described below was under a Hire Purchase / Hypothecation Agreement with our finance firm:\n\n` +
      `• *Registration No:* ${loan.vehicleNumber || 'N/A'}\n` +
      `• *Vehicle Make & Model:* ${loan.vehicleMake || ''} ${loan.vehicleModel || 'Vehicle'}\n` +
      `• *Engine No:* ${loan.engineNumber || 'AS PER RC'}\n` +
      `• *Chassis No:* ${loan.chassisNumber || 'AS PER RC'}\n` +
      `• *Registered Owner / Hirer:* ${loan.customerName || 'Customer'}\n` +
      `• *Contact Phone:* ${loan.customerPhone || loan.customerPhonePrimary || 'N/A'}\n` +
      `• *Loan File #:* ${loan.fileNumber}\n` +
      `• *Agreement Date:* ${loan.disbursedDate || 'Active'}\n\n` +
      `*DECLARATION OF FULL SATISFACTION:*\n` +
      `We hereby confirm that all principal dues, interest, and finance charges relating to the aforementioned vehicle loan have been *FULLY LIQUIDATED AND SATISFIED* with *NIL OUTSTANDING BALANCE*.\n\n` +
      `We have *NO OBJECTION* whatsoever to the cancellation / termination of our Hypothecation / Hire Purchase endorsement from the Certificate of Registration (RC) and official RTO database under Form 35 of the Central Motor Vehicles Rules.\n\n` +
      `────────────────────────────────────\n` +
      `*For SRI SAI VEHICLE FINANCE*\n` +
      `_Authorized Signatory & Seal_\n` +
      `Tel: +91 98765 43210 • Email: support@vehiclefinance.in`
    );
  };

  const handleSendWhatsApp = () => {
    const text = generateNocText();
    let phone = (loan.customerPhone || loan.customerPhonePrimary || '').replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `whatsapp://send?text=${encodeURIComponent(text)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Not Available', 'Could not open WhatsApp. You can use Print / Share.', [
        { text: 'Share Document', onPress: handleShareUniversal },
        { text: 'Cancel', style: 'cancel' },
      ]);
    });
  };

  const handleShareUniversal = async () => {
    try {
      await Share.share({
        title: `RTO NOC - Vehicle ${loan.vehicleNumber} (File #${loan.fileNumber})`,
        message: generateNocText(),
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
                <Ionicons name="ribbon" size={22} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.title}>RTO Form 35 NOC Certificate</Text>
                <Text style={styles.subtitle}>Hypothecation Cancellation • File #{loan.fileNumber}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Certificate Paper */}
            <View style={styles.certPaper}>
              {/* Watermark / Seal background */}
              <View style={styles.certHeaderBox}>
                <Text style={styles.finTitle}>SRI SAI VEHICLE FINANCE</Text>
                <Text style={styles.finSub}>Licensed Auto Financier & Hire Purchase Syndicate</Text>
                <Text style={styles.finContact}>Regd: AP/HYD/VF-2021-9981 • Contact: +91 98765 43210</Text>
              </View>

              <View style={styles.certMetaRow}>
                <Text style={styles.certRefText}>Ref: {nocRefNo}</Text>
                <Text style={styles.certDateText}>Date: {todayStr}</Text>
              </View>

              <View style={styles.hr} />

              <View style={styles.toSection}>
                <Text style={styles.toLabel}>To,</Text>
                <Text style={styles.toText}>The Registering Authority (RTO)</Text>
                <Text style={styles.toText}>Motor Vehicles Department</Text>
              </View>

              <View style={styles.subjectBox}>
                <Text style={styles.subjectText}>
                  SUBJECT: ISSUE OF NO OBJECTION CERTIFICATE (NOC) FOR CANCELLATION OF HYPOTHECATION (FORM 35)
                </Text>
              </View>

              <Text style={styles.certPara}>
                This is to certify that the motor vehicle specified herein was under a Hire Purchase / Hypothecation Agreement with our firm:
              </Text>

              {/* Particulars Table */}
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={styles.colLabel}>Vehicle Reg No</Text>
                  <Text style={styles.colValHighlight}>{loan.vehicleNumber}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.colLabel}>Make & Model</Text>
                  <Text style={styles.colVal}>{loan.vehicleMake} {loan.vehicleModel}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.colLabel}>Engine No</Text>
                  <Text style={styles.colVal}>{loan.engineNumber || 'AS PER RC'}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.colLabel}>Chassis No</Text>
                  <Text style={styles.colVal}>{loan.chassisNumber || 'AS PER RC'}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.colLabel}>Registered Owner</Text>
                  <Text style={styles.colValBold}>{loan.customerName}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.colLabel}>Agreement File #</Text>
                  <Text style={styles.colVal}>#{loan.fileNumber} ({loan.disbursedDate || 'Closed'})</Text>
                </View>
              </View>

              <Text style={styles.declarationText}>
                We hereby confirm that the total financial facility advanced has been <Text style={{ fontWeight: '800' }}>FULLY LIQUIDATED AND SETTLED IN FULL</Text> with NIL balance outstanding.
                We have <Text style={{ fontWeight: '800' }}>NO OBJECTION</Text> to the cancellation of our hypothecation endorsement in the official RTO records and RC Book.
              </Text>

              {/* Signatory Box */}
              <View style={styles.signatoryBox}>
                <View style={styles.sealCircle}>
                  <Ionicons name="checkmark-seal" size={24} color="#059669" />
                  <Text style={styles.sealText}>CLEARED</Text>
                </View>
                <View style={styles.sigCol}>
                  <View style={styles.sigLine} />
                  <Text style={styles.sigTitle}>Authorized Signatory & Seal</Text>
                  <Text style={styles.sigCompany}>Sri Sai Vehicle Finance</Text>
                </View>
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
              <Text style={styles.whatsAppBtnText}>Send NOC on WhatsApp</Text>
            </TouchableOpacity>

            <View style={styles.footerSecondaryRow}>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShareUniversal}
                activeOpacity={0.7}
              >
                <Ionicons name="print-outline" size={18} color={colors.primary} />
                <Text style={styles.shareBtnText}>Print / Export PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.closeModalBtnText}>Close</Text>
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
    maxHeight: '94%',
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
    backgroundColor: '#059669',
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
  certPaper: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#059669',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  certHeaderBox: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  finTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#065f46',
    letterSpacing: 0.8,
  },
  finSub: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
  finContact: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  certMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  certRefText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  certDateText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  hr: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: spacing.xs,
  },
  toSection: {
    marginVertical: spacing.xs,
  },
  toLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  toText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  subjectBox: {
    backgroundColor: '#f0fdf4',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderColor: '#059669',
    marginVertical: spacing.xs,
  },
  subjectText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
  },
  certPara: {
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 16,
    marginVertical: spacing.xs,
  },
  table: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  colLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    width: '40%',
  },
  colVal: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    width: '60%',
    textAlign: 'right',
  },
  colValBold: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    width: '60%',
    textAlign: 'right',
  },
  colValHighlight: {
    fontSize: 12,
    fontWeight: '900',
    color: '#059669',
    width: '60%',
    textAlign: 'right',
  },
  declarationText: {
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 16,
    marginVertical: spacing.sm,
  },
  signatoryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  sealCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#059669',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
  },
  sealText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.5,
  },
  sigCol: {
    alignItems: 'center',
    width: 150,
  },
  sigLine: {
    width: '100%',
    height: 1,
    backgroundColor: colors.textSecondary,
    marginBottom: 4,
  },
  sigTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sigCompany: {
    fontSize: 9,
    color: colors.textSecondary,
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
  closeModalBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  closeModalBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default RtoNocModal;
