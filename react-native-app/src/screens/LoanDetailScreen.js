import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import Header from '../components/Header';
import PaymentModal from '../components/PaymentModal';
import EditEmiModal from '../components/EditEmiModal';
import LoanService from '../services/loanService';
import PaymentService from '../services/paymentService';
import authService from '../services/authService';

export const LoanDetailScreen = ({ route, navigation }) => {
  const { loanId } = route.params || {};
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Pay Modal
  const [selectedEmi, setSelectedEmi] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Edit EMI Modal
  const [editingEmi, setEditingEmi] = useState(null);
  const [editEmiModalVisible, setEditEmiModalVisible] = useState(false);

  const isAdmin = authService.isAdmin();

  const fetchDetail = useCallback(async () => {
    try {
      const data = await LoanService.getLoanById(loanId);
      setLoan(data);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unable to load loan details');
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    fetchDetail();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDetail();
    });
    return unsubscribe;
  }, [navigation, fetchDetail]);

  const handlePayEmi = (emi) => {
    setSelectedEmi({
      ...emi,
      fileNumber: loan.fileNumber,
      customerName: loan.customerName,
      vehicleModel: loan.vehicleModel,
      vehicleNumber: loan.vehicleNumber,
    });
    setModalVisible(true);
  };

  const handleConfirmPayment = async (paymentData) => {
    await PaymentService.payEMI(
      paymentData.fileNumber,
      paymentData.emiNumber,
      paymentData.amount,
      paymentData.date,
      paymentData.mode,
      paymentData.notes,
      {
        agentName: paymentData.agentName,
        penaltyCollected: paymentData.penaltyCollected,
        penaltyWaived: paymentData.penaltyWaived,
      }
    );
    Alert.alert('Payment Recorded', `Recorded payment for EMI #${paymentData.emiNumber}`);
    fetchDetail();
  };

  const handleOpenEditEmi = (emi) => {
    setEditingEmi(emi);
    setEditEmiModalVisible(true);
  };

  const handleSaveEmi = async (updatedEmi) => {
    await LoanService.updateEmi(loan.fileNumber || loan.id, updatedEmi.emiNumber, updatedEmi);
    Alert.alert('Success', `Installment #${updatedEmi.emiNumber} updated.`);
    fetchDetail();
  };

  const handleDeleteLoan = () => {
    Alert.alert(
      'Delete Loan Account',
      `Are you sure you want to permanently delete Loan #${loan.fileNumber} for ${loan.customerName}? All amortizations and schedule records will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Loan',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await LoanService.deleteLoan(loan.fileNumber || loan.id);
              Alert.alert('Deleted', 'Loan account deleted successfully.', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to delete loan');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  if (loading || !loan) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 8, color: colors.textSecondary }}>Loading loan details...</Text>
      </View>
    );
  }

  const percentPaid = Math.round(((loan.paidEmiCount || 0) / (loan.tenure || 1)) * 100);
  const rupeeRate = ((loan.interestRate || 24) / 12).toFixed(2);
  const vehiclePhotosList = Array.isArray(loan.vehiclePhotos)
    ? loan.vehiclePhotos
    : typeof loan.vehiclePhotoUrls === 'string'
    ? (() => {
        try {
          return JSON.parse(loan.vehiclePhotoUrls);
        } catch {
          return loan.vehiclePhotoUrls.split(',').map((s) => s.trim()).filter(Boolean);
        }
      })()
    : [];

  return (
    <View style={styles.container}>
      <Header
        title={`File #${loan.fileNumber}`}
        subtitle={`${loan.customerName} • ${loan.vehicleModel}`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.headerEditBtn}
            onPress={() => navigation.navigate('EditLoan', { loan })}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Management Actions Row */}
        <View style={styles.managementBar}>
          <TouchableOpacity
            style={styles.actionBtnPassbook}
            onPress={() => navigation.navigate('CustomerPassbook', { loanId: loan.id, loan })}
            activeOpacity={0.7}
          >
            <Ionicons name="book" size={16} color="#ffffff" />
            <Text style={styles.actionBtnPassbookText}>Khata Passbook</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => navigation.navigate('EditLoan', { loan })}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.actionBtnSecondaryText}>Edit Loan</Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={styles.actionBtnDanger}
              onPress={handleDeleteLoan}
              disabled={deleting}
              activeOpacity={0.7}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={styles.actionBtnDangerText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Khatabook Passbook Banner Card */}
        <TouchableOpacity
          style={styles.passbookBannerCard}
          onPress={() => navigation.navigate('CustomerPassbook', { loanId: loan.id, loan })}
          activeOpacity={0.8}
        >
          <View style={styles.passbookBannerLeft}>
            <View style={styles.passbookIconCircle}>
              <Ionicons name="book" size={22} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.passbookBannerTitle}>Customer Khata Passbook</Text>
                <View style={styles.khatabookTag}>
                  <Text style={styles.khatabookTagText}>KHATA</Text>
                </View>
              </View>
              <Text style={styles.passbookBannerSubtitle}>
                Running balance ledger, Udhar/Jama, WhatsApp statement & UPI
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Status & Borrower Card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              {(loan.customerPhoto || loan.customerPhotoUrl) ? (
                <Image source={{ uri: loan.customerPhoto || loan.customerPhotoUrl }} style={styles.customerAvatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>BORROWER (FILE #{loan.fileNumber})</Text>
                <Text style={styles.mainTitle}>{loan.customerName}</Text>
                {loan.customerFatherName ? (
                  <Text style={styles.subText}>S/o {loan.customerFatherName}</Text>
                ) : null}
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: loan.status === 'Active' ? '#dcfce7' : '#f1f5f9' }]}>
              <Text style={[styles.statusText, { color: loan.status === 'Active' ? '#15803d' : '#64748b' }]}>
                {loan.status}
              </Text>
            </View>
          </View>

          {/* Quick Contact Buttons */}
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => Linking.openURL(`tel:${loan.customerPhonePrimary}`)}
            >
              <Ionicons name="call" size={16} color={colors.primary} />
              <Text style={styles.contactBtnText}>{loan.customerPhonePrimary}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
              onPress={() => Linking.openURL(`whatsapp://send?phone=91${loan.customerPhonePrimary}`)}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#16a34a" />
              <Text style={[styles.contactBtnText, { color: '#16a34a' }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {loan.customerAddress ? (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.addressText}>{loan.customerAddress}</Text>
            </View>
          ) : null}
        </View>

        {/* Vehicle Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car" size={18} color={colors.primary} />
            <Text style={styles.cardHeaderTitle}>Vehicle Specifications</Text>
          </View>
          <View style={styles.grid2}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>MAKE & MODEL</Text>
              <Text style={styles.valBold}>{loan.vehicleMake} {loan.vehicleModel}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>REGISTRATION NO</Text>
              <Text style={[styles.valBold, { fontFamily: 'monospace' }]}>{loan.vehicleNumber}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>MODEL YEAR</Text>
              <Text style={styles.valBold}>{loan.vehicleModelYear || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>INSURANCE EXPIRY</Text>
              <Text style={[styles.valBold, { color: loan.insuranceExpiryDate ? '#b45309' : colors.textPrimary }]}>
                {loan.insuranceExpiryDate || 'Not Available'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>VEHICLE TYPE</Text>
              <Text style={styles.valText}>{loan.vehicleType}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>ON-ROAD COST</Text>
              <Text style={styles.valText}>{formatCurrency(loan.vehicleCost)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>ENGINE NO</Text>
              <Text style={[styles.valText, { fontFamily: 'monospace' }]}>{loan.engineNumber || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>CHASSIS NO</Text>
              <Text style={[styles.valText, { fontFamily: 'monospace' }]}>{loan.chassisNumber || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Vehicle Photos & KYC Documents Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="images" size={18} color={colors.primary} />
            <Text style={styles.cardHeaderTitle}>Vehicle Photos & Documents</Text>
          </View>

          {/* Vehicle Photos Preview */}
          <Text style={styles.docLabel}>Vehicle Photos ({vehiclePhotosList.length} Photos)</Text>
          {vehiclePhotosList.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
              {vehiclePhotosList.map((uri, idx) => (
                <View key={idx} style={styles.photoThumbWrapper}>
                  <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                  <Text style={styles.photoCaption}>Photo #{idx + 1}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noPhotosText}>No vehicle photos uploaded yet.</Text>
          )}

          {/* Document Thumbnails: RC & Insurance */}
          <View style={styles.docsRow}>
            <View style={styles.docBox}>
              <Text style={styles.docBoxTitle}>RC Document</Text>
              {(loan.rcPhoto || loan.rcPhotoUrl) ? (
                <Image source={{ uri: loan.rcPhoto || loan.rcPhotoUrl }} style={styles.docImage} resizeMode="cover" />
              ) : (
                <View style={styles.docPlaceholder}>
                  <Ionicons name="document-text-outline" size={24} color={colors.textMuted} />
                  <Text style={styles.docPlaceholderText}>No RC uploaded</Text>
                </View>
              )}
            </View>

            <View style={styles.docBox}>
              <Text style={styles.docBoxTitle}>Insurance Policy</Text>
              {(loan.insurancePhoto || loan.insurancePhotoUrl) ? (
                <Image source={{ uri: loan.insurancePhoto || loan.insurancePhotoUrl }} style={styles.docImage} resizeMode="cover" />
              ) : (
                <View style={styles.docPlaceholder}>
                  <Ionicons name="shield-outline" size={24} color={colors.textMuted} />
                  <Text style={styles.docPlaceholderText}>No Policy uploaded</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Loan Financial Structure */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash" size={18} color={colors.primary} />
            <Text style={styles.cardHeaderTitle}>Loan Terms & Flat Rate EMI</Text>
          </View>
          <View style={styles.grid3}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>LOAN SANCTIONED</Text>
              <Text style={[styles.valBold, { color: colors.primary, fontSize: 16 }]}>{formatCurrency(loan.loanAmount)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>INTEREST RATE</Text>
              <Text style={styles.valBold}>{loan.interestRate}% p.a.</Text>
              <Text style={styles.rupeeTag}>₹{rupeeRate} Rs/mo</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>TENURE</Text>
              <Text style={styles.valBold}>{loan.tenure} Months</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>MONTHLY FLAT EMI</Text>
              <Text style={[styles.valBold, { color: '#0f766e', fontSize: 16 }]}>{formatCurrency(loan.emiAmount)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>PAID / REMAINING</Text>
              <Text style={styles.valBold}>{loan.paidEmiCount || 0} / {loan.remainingEmi || 0}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>DISBURSED</Text>
              <Text style={styles.valText}>{loan.disbursedDate ? loan.disbursedDate.split('T')[0] : 'N/A'}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>REPAYMENT PROGRESS</Text>
              <Text style={styles.progressVal}>{percentPaid}% Completed</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, percentPaid)}%` }]} />
            </View>
          </View>
        </View>

        {/* Guarantor Details */}
        {loan.guarantorName ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={18} color="#059669" />
              <Text style={styles.cardHeaderTitle}>Guarantor Information</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: spacing.sm }}>
              {(loan.guarantorPhoto || loan.guarantorPhotoUrl) ? (
                <Image source={{ uri: loan.guarantorPhoto || loan.guarantorPhotoUrl }} style={styles.guarantorAvatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: '#ecfdf5' }]}>
                  <Ionicons name="person-outline" size={22} color="#059669" />
                </View>
              )}
              <View>
                <Text style={styles.valBold}>{loan.guarantorName}</Text>
                <Text style={styles.subText}>{loan.guarantorRelation || 'Guarantor'}</Text>
              </View>
            </View>

            <View style={styles.grid2}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>PHONE</Text>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${loan.guarantorPhone}`)}>
                  <Text style={[styles.valBold, { color: colors.primary }]}>{loan.guarantorPhone}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>ADDRESS</Text>
                <Text style={styles.valText}>{loan.guarantorAddress || 'Same as borrower'}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Amortization Schedule */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.cardHeaderTitle}>Amortization Schedule</Text>
            </View>
            <Text style={styles.countTag}>{loan.emiDetails?.length || 0} Installments</Text>
          </View>
          <Text style={styles.scheduleHint}>Tap pencil icon to modify installment date or amount</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: 32 }]}>#</Text>
            <Text style={[styles.th, { flex: 1 }]}>Due Date</Text>
            <Text style={[styles.th, { width: 75, textAlign: 'right' }]}>Amount</Text>
            <Text style={[styles.th, { width: 70, textAlign: 'center' }]}>Status</Text>
            <Text style={[styles.th, { width: 70, textAlign: 'right' }]}>Actions</Text>
          </View>

          {loan.emiDetails?.map((item) => (
            <View key={item.emiNumber} style={styles.tableRow}>
              <Text style={[styles.td, { width: 32, fontWeight: '700' }]}>{item.emiNumber}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.tdDate}>{item.emiDate}</Text>
                {item.paidDate ? <Text style={styles.tdPaidOn}>Paid {item.paidDate}</Text> : null}
              </View>
              <Text style={[styles.td, { width: 75, textAlign: 'right', fontWeight: '700' }]}>
                {formatCurrency(item.emiAmount)}
              </Text>
              <View style={{ width: 70, alignItems: 'center' }}>
                <View
                  style={[
                    styles.statusPill,
                    item.status === 'Paid'
                      ? styles.pillPaid
                      : item.status === 'Overdue'
                      ? styles.pillOverdue
                      : styles.pillUpcoming,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      item.status === 'Paid'
                        ? styles.pillPaidText
                        : item.status === 'Overdue'
                        ? styles.pillOverdueText
                        : styles.pillUpcomingText,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
              <View style={{ width: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                <TouchableOpacity
                  style={styles.editEmiIconBtn}
                  onPress={() => handleOpenEditEmi(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil-outline" size={15} color={colors.primary} />
                </TouchableOpacity>

                {item.status !== 'Paid' ? (
                  <TouchableOpacity
                    style={styles.miniPayBtn}
                    onPress={() => handlePayEmi(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.miniPayText}>Pay</Text>
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="checkmark-done" size={17} color={colors.success} />
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={modalVisible}
        emi={selectedEmi}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirmPayment}
      />

      {/* Edit EMI Modal */}
      <EditEmiModal
        visible={editEmiModalVisible}
        emi={editingEmi}
        onClose={() => setEditEmiModalVisible(false)}
        onSave={handleSaveEmi}
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
  headerEditBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  managementBar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtnPassbook: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f766e',
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    gap: 6,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  actionBtnPassbookText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  passbookBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  passbookBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  passbookIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passbookBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
  },
  khatabookTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  khatabookTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16a34a',
  },
  passbookBannerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    gap: 6,
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  actionBtnDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    gap: 6,
  },
  actionBtnDangerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  guarantorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  subText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: '#ffffff',
    gap: 6,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  countTag: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scheduleHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '46%',
  },
  valBold: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  valText: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
  },
  rupeeTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 1,
  },
  docLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 6,
  },
  photosScroll: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  photoThumbWrapper: {
    marginRight: 10,
    alignItems: 'center',
  },
  photoThumb: {
    width: 100,
    height: 75,
    borderRadius: borderRadius.md,
    backgroundColor: '#000',
  },
  photoCaption: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  noPhotosText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  docsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.xs,
  },
  docBox: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  docBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    padding: 6,
    backgroundColor: '#f1f5f9',
  },
  docImage: {
    width: '100%',
    height: 90,
  },
  docPlaceholder: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  docPlaceholderText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  progressSection: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.divider,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  miniDetail: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    paddingHorizontal: 6,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  td: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  tdDate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tdPaidOn: {
    fontSize: 10,
    color: colors.successDark,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  pillPaid: {
    backgroundColor: '#dcfce7',
  },
  pillPaidText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  pillOverdue: {
    backgroundColor: '#fee2e2',
  },
  pillOverdueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b91c1c',
  },
  pillUpcoming: {
    backgroundColor: '#f1f5f9',
  },
  pillUpcomingText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  editEmiIconBtn: {
    padding: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  miniPayBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  miniPayText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default LoanDetailScreen;
