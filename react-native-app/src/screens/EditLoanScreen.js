import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import Header from '../components/Header';
import ImagePickerField from '../components/ImagePickerField';
import LoanService from '../services/loanService';

export const EditLoanScreen = ({ route, navigation }) => {
  const { loan } = route.params || {};

  if (!loan) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No loan account provided for editing.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Customer Info
  const [customerName, setCustomerName] = useState(loan.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(loan.customerPhonePrimary || '');
  const [customerPhone2, setCustomerPhone2] = useState(loan.customerPhoneSecondary || '');
  const [customerAddress, setCustomerAddress] = useState(loan.customerAddress || '');
  const [customerFatherName, setCustomerFatherName] = useState(loan.customerFatherName || '');
  const [customerAadhaar, setCustomerAadhaar] = useState(loan.customerAadhaarNumber || '');
  const [customerPhoto, setCustomerPhoto] = useState(loan.customerPhoto || null);

  // Vehicle Info
  const [vehicleType, setVehicleType] = useState(loan.vehicleType || 'Car / Four Wheeler');
  const [vehicleMake, setVehicleMake] = useState(loan.vehicleMake || '');
  const [vehicleModel, setVehicleModel] = useState(loan.vehicleModel || '');
  const [vehicleNumber, setVehicleNumber] = useState(loan.vehicleNumber || '');
  const [vehicleModelYear, setVehicleModelYear] = useState(String(loan.vehicleModelYear || new Date().getFullYear()));
  const [engineNumber, setEngineNumber] = useState(loan.engineNumber || '');
  const [chassisNumber, setChassisNumber] = useState(loan.chassisNumber || '');
  const [insuranceExpiry, setInsuranceExpiry] = useState(loan.insuranceExpiryDate || '');
  // Vehicle Photos & Documents
  const [vehiclePhotos, setVehiclePhotos] = useState(Array.isArray(loan.vehiclePhotos) ? loan.vehiclePhotos : []);
  const [rcPhoto, setRcPhoto] = useState(loan.rcPhoto || null);
  const [insurancePhoto, setInsurancePhoto] = useState(loan.insurancePhoto || null);

  // Guarantor Info
  const [guarantorName, setGuarantorName] = useState(loan.guarantorName || '');
  const [guarantorPhone, setGuarantorPhone] = useState(loan.guarantorPhone || '');
  const [guarantorRelation, setGuarantorRelation] = useState(loan.guarantorRelation || '');
  const [guarantorAddress, setGuarantorAddress] = useState(loan.guarantorAddress || '');
  const [guarantorPhoto, setGuarantorPhoto] = useState(loan.guarantorPhoto || null);

  const [loading, setLoading] = useState(false);

  const vehicleTypes = ['Two Wheeler', 'Car / Four Wheeler', 'Commercial / Three Wheeler'];

  const handleSave = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert('Required Fields', 'Customer Name and Primary Phone are required');
      return;
    }
    if (!vehicleNumber.trim()) {
      Alert.alert('Required Fields', 'Vehicle Registration Number is required');
      return;
    }

    setLoading(true);
    try {
      const updatedData = {
        ...loan,
        customerName: customerName.trim(),
        customerPhonePrimary: customerPhone.trim(),
        customerPhoneSecondary: customerPhone2.trim(),
        customerAddress: customerAddress.trim(),
        customerFatherName: customerFatherName.trim(),
        customerAadhaarNumber: customerAadhaar.trim(),
        customerPhoto,
        vehicleType,
        vehicleMake: vehicleMake.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleModelYear: parseInt(vehicleModelYear, 10) || new Date().getFullYear(),
        engineNumber: engineNumber.trim(),
        chassisNumber: chassisNumber.trim(),
        insuranceExpiryDate: insuranceExpiry.trim(),
        vehiclePhotos,
        rcPhoto,
        insurancePhoto,
        guarantorName: guarantorName.trim(),
        guarantorPhone: guarantorPhone.trim(),
        guarantorPhonePrimary: guarantorPhone.trim(),
        guarantorRelation: guarantorRelation.trim(),
        guarantorAddress: guarantorAddress.trim(),
        guarantorPhoto,
      };

      await LoanService.updateLoan(loan.fileNumber || loan.id, updatedData);

      setLoading(false);
      Alert.alert('Success', 'Loan details updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (e) {
      setLoading(false);
      Alert.alert('Update Failed', e.message || 'Error updating loan');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title={`Edit Loan #${loan.fileNumber || loan.id}`}
        subtitle="Update borrower, vehicle, KYC photos & guarantor"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Section 1: Customer Details */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Customer Information</Text>
          </View>

          {/* Customer Photo */}
          <ImagePickerField
            label="Customer Photo"
            sublabel="Tap to capture or upload borrower photo"
            value={customerPhoto}
            onChange={setCustomerPhoto}
          />

          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Customer Name"
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>Primary Phone *</Text>
              <TextInput
                style={styles.input}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
                placeholder="10-digit Mobile"
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>Secondary Phone</Text>
              <TextInput
                style={styles.input}
                value={customerPhone2}
                onChangeText={setCustomerPhone2}
                keyboardType="phone-pad"
                placeholder="Alternative Phone"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>Father's / Spouse Name</Text>
              <TextInput
                style={styles.input}
                value={customerFatherName}
                onChangeText={setCustomerFatherName}
                placeholder="Father's Name"
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>Aadhaar Card No.</Text>
              <TextInput
                style={styles.input}
                value={customerAadhaar}
                onChangeText={setCustomerAadhaar}
                keyboardType="numeric"
                placeholder="12-digit Aadhaar"
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Full Residential Address</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
            value={customerAddress}
            onChangeText={setCustomerAddress}
            multiline
            placeholder="Door No, Street, Landmark, City"
          />
        </View>

        {/* Section 2: Vehicle Details */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="car-sport" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Vehicle Information & Photos</Text>
          </View>

          <Text style={styles.inputLabel}>Vehicle Category</Text>
          <View style={styles.chipsRow}>
            {vehicleTypes.map((vt) => (
              <TouchableOpacity
                key={vt}
                style={[styles.chip, vehicleType === vt && styles.chipActive]}
                onPress={() => setVehicleType(vt)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, vehicleType === vt && styles.chipTextActive]}>
                  {vt.split('/')[0].trim()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>Make / Brand</Text>
              <TextInput
                style={styles.input}
                value={vehicleMake}
                onChangeText={setVehicleMake}
                placeholder="e.g. Maruti / Honda"
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>Model</Text>
              <TextInput
                style={styles.input}
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder="e.g. Swift / Activa"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.halfCol, { flex: 1.2 }]}>
              <Text style={styles.inputLabel}>Vehicle Reg # *</Text>
              <TextInput
                style={[styles.input, { fontWeight: '700' }]}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                autoCapitalize="characters"
                placeholder="AP-31-CJ-9309"
              />
            </View>
            <View style={[styles.halfCol, { flex: 0.8 }]}>
              <Text style={styles.inputLabel}>Model Year *</Text>
              <TextInput
                style={styles.input}
                value={vehicleModelYear}
                onChangeText={setVehicleModelYear}
                keyboardType="numeric"
                placeholder="2024"
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Insurance Ending Date (Expiry Date)</Text>
          <TextInput
            style={styles.input}
            value={insuranceExpiry}
            onChangeText={setInsuranceExpiry}
            placeholder="YYYY-MM-DD"
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>Engine Number</Text>
              <TextInput
                style={styles.input}
                value={engineNumber}
                onChangeText={setEngineNumber}
                placeholder="Engine No."
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>Chassis Number</Text>
              <TextInput
                style={styles.input}
                value={chassisNumber}
                onChangeText={setChassisNumber}
                placeholder="Chassis No."
              />
            </View>
          </View>

          {/* Vehicle Photos */}
          <ImagePickerField
            label="Vehicle Photos (2 to 3 Photos)"
            sublabel="Capture front, side, and rear photos"
            value={vehiclePhotos}
            onChange={setVehiclePhotos}
            multiple={true}
            maxCount={3}
          />

          {/* RC Document */}
          <ImagePickerField
            label="RC Document Photo"
            sublabel="Registration certificate snap"
            value={rcPhoto}
            onChange={setRcPhoto}
          />

          {/* Insurance Document */}
          <ImagePickerField
            label="Insurance Document Photo"
            sublabel="Current insurance policy snap"
            value={insurancePhoto}
            onChange={setInsurancePhoto}
          />
        </View>

        {/* Section 3: Guarantor Details */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Guarantor Information</Text>
          </View>

          {/* Guarantor Photo */}
          <ImagePickerField
            label="Guarantor Photo"
            sublabel="Guarantor photo capture or upload"
            value={guarantorPhoto}
            onChange={setGuarantorPhoto}
          />

          <Text style={styles.inputLabel}>Guarantor Full Name</Text>
          <TextInput
            style={styles.input}
            value={guarantorName}
            onChangeText={setGuarantorName}
            placeholder="Guarantor Name"
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={guarantorPhone}
                onChangeText={setGuarantorPhone}
                keyboardType="phone-pad"
                placeholder="10-digit Mobile"
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.inputLabel}>Relationship</Text>
              <TextInput
                style={styles.input}
                value={guarantorRelation}
                onChangeText={setGuarantorRelation}
                placeholder="Brother, Friend, etc."
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Guarantor Address</Text>
          <TextInput
            style={[styles.input, { height: 50, textAlignVertical: 'top' }]}
            value={guarantorAddress}
            onChangeText={setGuarantorAddress}
            multiline
            placeholder="Address"
          />
        </View>

        {/* Save Changes Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Loan Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfCol: {
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 50,
    marginTop: spacing.sm,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default EditLoanScreen;
