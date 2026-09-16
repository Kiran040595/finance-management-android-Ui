import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import Header from '../components/Header';
import LoanService from '../services/loanService';

export const AddLoanScreen = ({ navigation }) => {
  // Section tabs
  const [activeStep, setActiveStep] = useState(1); // 1: Customer, 2: Vehicle, 3: Loan Terms, 4: Guarantor

  // Customer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerPhone2, setCustomerPhone2] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Vehicle
  const [vehicleType, setVehicleType] = useState('Car / Four Wheeler');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [vehicleCost, setVehicleCost] = useState('');

  // Loan Terms
  const [downPayment, setDownPayment] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('10.5');
  const [tenure, setTenure] = useState('36');

  // Guarantor
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState('');
  const [guarantorAddress, setGuarantorAddress] = useState('');

  const [loading, setLoading] = useState(false);

  // Auto-calculate Flat EMI in real-time
  // Formula: Total Interest = P * (R / 100) * (N / 12)
  // Total Amount = P + Total Interest
  // EMI = Total Amount / N
  const calculatedEmi = useMemo(() => {
    const P = parseFloat(loanAmount || 0);
    const R = parseFloat(interestRate || 0);
    const N = parseInt(tenure || 12, 10);
    if (P <= 0 || N <= 0) return 0;
    if (R === 0) return Math.round((P / N) * 100) / 100;
    const totalInterest = P * (R / 100) * (N / 12);
    const totalPayable = P + totalInterest;
    const emi = totalPayable / N;
    return Math.round(emi * 100) / 100;
  }, [loanAmount, interestRate, tenure]);

  // Auto-calculate suggested loan amount from vehicle cost - downpayment
  const handleCostOrDownChange = (newCost, newDown) => {
    const cost = parseFloat(newCost || vehicleCost || 0);
    const down = parseFloat(newDown || downPayment || 0);
    if (cost > 0 && down >= 0 && cost >= down) {
      setLoanAmount(String(cost - down));
    }
  };

  const handleSave = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert('Missing Customer Info', 'Please provide Customer Name and Phone Number');
      setActiveStep(1);
      return;
    }
    if (!vehicleModel.trim() || !vehicleNumber.trim()) {
      Alert.alert('Missing Vehicle Info', 'Please enter Vehicle Model and Registration Number');
      setActiveStep(2);
      return;
    }
    if (!loanAmount || parseFloat(loanAmount) <= 0) {
      Alert.alert('Invalid Loan Amount', 'Please provide a valid loan amount');
      setActiveStep(3);
      return;
    }

    try {
      setLoading(true);
      const newLoan = await LoanService.createLoan({
        customerName: customerName.trim(),
        customerPhonePrimary: customerPhone.trim(),
        customerPhoneSecondary: customerPhone2.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim(),
        vehicleType,
        vehicleMake: vehicleMake.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        engineNumber: engineNumber.trim(),
        chassisNumber: chassisNumber.trim(),
        vehicleCost: parseFloat(vehicleCost || 0),
        downPayment: parseFloat(downPayment || 0),
        loanAmount: parseFloat(loanAmount),
        interestRate: parseFloat(interestRate || 10),
        tenure: parseInt(tenure || 12, 10),
        emi: calculatedEmi,
        emiAmount: calculatedEmi,
        guarantorName: guarantorName.trim(),
        guarantorPhone: guarantorPhone.trim(),
        guarantorRelation: guarantorRelation.trim(),
        guarantorAddress: guarantorAddress.trim(),
      });

      setLoading(false);
      Alert.alert(
        'Loan Created Successfully!',
        `Account File Number: ${newLoan.fileNumber}\nMonthly EMI: ₹${newLoan.emiAmount.toLocaleString('en-IN')}`,
        [
          {
            text: 'View Loan Details',
            onPress: () => navigation.replace('LoanDetail', { loanId: newLoan.id }),
          },
        ]
      );
    } catch (e) {
      setLoading(false);
      Alert.alert('Save Failed', e.message || 'Error creating loan');
    }
  };

  const formatCurrency = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  const steps = [
    { num: 1, label: 'Customer' },
    { num: 2, label: 'Vehicle' },
    { num: 3, label: 'Finance' },
    { num: 4, label: 'Guarantor' },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="New Vehicle Loan"
        subtitle="Sanction, Amortization & Registration"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Step Indicators */}
      <View style={styles.stepBar}>
        {steps.map((s) => (
          <TouchableOpacity
            key={s.num}
            style={[styles.stepItem, activeStep === s.num && styles.stepItemActive]}
            onPress={() => setActiveStep(s.num)}
          >
            <View style={[styles.stepCircle, activeStep === s.num && styles.stepCircleActive]}>
              <Text style={[styles.stepCircleText, activeStep === s.num && styles.stepCircleTextActive]}>
                {s.num}
              </Text>
            </View>
            <Text style={[styles.stepLabel, activeStep === s.num && styles.stepLabelActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Step 1: Customer Details */}
        {activeStep === 1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>1. Customer Personal Information</Text>

            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ramesh Chandra"
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.inputLabel}>Primary Phone * (10 Digits)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              value={customerPhone}
              onChangeText={setCustomerPhone}
            />

            <Text style={styles.inputLabel}>Alternate Phone (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Secondary contact number"
              keyboardType="phone-pad"
              value={customerPhone2}
              onChangeText={setCustomerPhone2}
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              keyboardType="email-address"
              value={customerEmail}
              onChangeText={setCustomerEmail}
            />

            <Text style={styles.inputLabel}>Residential / Commercial Address</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Complete street address, City, PIN"
              multiline
              value={customerAddress}
              onChangeText={setCustomerAddress}
            />

            <TouchableOpacity style={styles.nextBtn} onPress={() => setActiveStep(2)}>
              <Text style={styles.nextBtnText}>Next: Vehicle Details</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Vehicle Details */}
        {activeStep === 2 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>2. Vehicle Information</Text>

            <Text style={styles.inputLabel}>Vehicle Category *</Text>
            <View style={styles.categoryRow}>
              {['Two Wheeler', 'Car / Four Wheeler', 'Commercial'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.catBtn, vehicleType === type && styles.catBtnActive]}
                  onPress={() => setVehicleType(type)}
                >
                  <Text style={[styles.catBtnText, vehicleType === type && styles.catBtnTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Vehicle Make (Manufacturer)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Maruti Suzuki, Honda, Tata"
              value={vehicleMake}
              onChangeText={setVehicleMake}
            />

            <Text style={styles.inputLabel}>Vehicle Model *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Swift VXi / Activa 6G / Tata Ace"
              value={vehicleModel}
              onChangeText={setVehicleModel}
            />

            <Text style={styles.inputLabel}>Registration Number *</Text>
            <TextInput
              style={[styles.input, { fontFamily: 'monospace' }]}
              placeholder="e.g. KA-01-MJ-1234"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>Vehicle On-Road Cost (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 750000"
              keyboardType="numeric"
              value={vehicleCost}
              onChangeText={(val) => {
                setVehicleCost(val);
                handleCostOrDownChange(val, downPayment);
              }}
            />

            <View style={styles.grid2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Engine Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Engine serial"
                  value={engineNumber}
                  onChangeText={setEngineNumber}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Chassis Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Chassis serial"
                  value={chassisNumber}
                  onChangeText={setChassisNumber}
                />
              </View>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.prevBtn} onPress={() => setActiveStep(1)}>
                <Text style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={() => setActiveStep(3)}>
                <Text style={styles.nextBtnText}>Next: Loan Terms</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Loan Financials */}
        {activeStep === 3 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>3. Financing Terms & EMI Calculator</Text>

            <Text style={styles.inputLabel}>Down Payment by Customer (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 150000"
              keyboardType="numeric"
              value={downPayment}
              onChangeText={(val) => {
                setDownPayment(val);
                handleCostOrDownChange(vehicleCost, val);
              }}
            />

            <Text style={styles.inputLabel}>Loan Sanction Amount (Principal ₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 600000"
              keyboardType="numeric"
              value={loanAmount}
              onChangeText={setLoanAmount}
            />

            <View style={styles.grid2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Annual Interest Rate (% p.a.)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10.5"
                  keyboardType="numeric"
                  value={interestRate}
                  onChangeText={setInterestRate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Tenure (Months)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 36"
                  keyboardType="numeric"
                  value={tenure}
                  onChangeText={setTenure}
                />
              </View>
            </View>

            {/* Live EMI Preview Box */}
            <View style={styles.emiPreviewBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={styles.emiPreviewSub}>Calculated Monthly EMI</Text>
                  <Text style={styles.emiPreviewAmount}>{formatCurrency(calculatedEmi)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.emiPreviewSub}>Total Interest</Text>
                  <Text style={styles.emiPreviewInterest}>
                    {formatCurrency(Math.max(0, calculatedEmi * (parseInt(tenure, 10) || 0) - (parseFloat(loanAmount) || 0)))}
                  </Text>
                </View>
              </View>
              <Text style={styles.emiNote}>
                Amortization schedule will be automatically generated with monthly due dates and principal/interest splits.
              </Text>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.prevBtn} onPress={() => setActiveStep(2)}>
                <Text style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={() => setActiveStep(4)}>
                <Text style={styles.nextBtnText}>Next: Guarantor</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 4: Guarantor & Confirm */}
        {activeStep === 4 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>4. Guarantor Information (Optional)</Text>

            <Text style={styles.inputLabel}>Guarantor Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Suresh Kumar"
              value={guarantorName}
              onChangeText={setGuarantorName}
            />

            <Text style={styles.inputLabel}>Guarantor Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9845112233"
              keyboardType="phone-pad"
              value={guarantorPhone}
              onChangeText={setGuarantorPhone}
            />

            <Text style={styles.inputLabel}>Relationship with Borrower</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Brother, Father, Business Partner"
              value={guarantorRelation}
              onChangeText={setGuarantorRelation}
            />

            <Text style={styles.inputLabel}>Guarantor Address</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Address of guarantor"
              multiline
              value={guarantorAddress}
              onChangeText={setGuarantorAddress}
            />

            {/* Summary Review */}
            <View style={styles.reviewBox}>
              <Text style={styles.reviewTitle}>Application Summary</Text>
              <Text style={styles.reviewItem}>Borrower: {customerName || 'N/A'} ({customerPhone || 'N/A'})</Text>
              <Text style={styles.reviewItem}>Vehicle: {vehicleMake} {vehicleModel} ({vehicleNumber || 'N/A'})</Text>
              <Text style={styles.reviewItem}>
                Sanction: {formatCurrency(loanAmount)} @ {interestRate}% for {tenure} months
              </Text>
              <Text style={[styles.reviewItem, { fontWeight: '700', color: colors.primary }]}>
                Monthly EMI: {formatCurrency(calculatedEmi)}
              </Text>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.prevBtn} onPress={() => setActiveStep(3)} disabled={loading}>
                <Text style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle" size={20} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Sanction & Create Loan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  stepItemActive: {
    borderBottomWidth: 2,
    borderColor: colors.primary,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stepCircleTextActive: {
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  catBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  catBtnActive: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primary,
  },
  catBtnText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  catBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  grid2: {
    flexDirection: 'row',
    gap: 12,
  },
  emiPreviewBox: {
    backgroundColor: '#eff6ff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  emiPreviewSub: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  emiPreviewAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 2,
  },
  emiPreviewInterest: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  emiNote: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
  },
  reviewBox: {
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  reviewItem: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: spacing.xl,
  },
  prevBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: colors.successDark,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default AddLoanScreen;
