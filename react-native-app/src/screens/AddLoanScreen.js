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
import ImagePickerField from '../components/ImagePickerField';
import LoanService from '../services/loanService';

export const AddLoanScreen = ({ navigation }) => {
  // Section steps: 1: Customer, 2: Vehicle, 3: Loan Terms, 4: Guarantor
  const [activeStep, setActiveStep] = useState(1);

  // File Number (Editable manually with auto-suggested initial value)
  const [fileNumber, setFileNumber] = useState(() => String(Math.floor(300800 + Math.random() * 1000)));

  // Customer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerPhone2, setCustomerPhone2] = useState('');
  const [customerFatherName, setCustomerFatherName] = useState('');
  const [customerAadhaar, setCustomerAadhaar] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhoto, setCustomerPhoto] = useState(null);

  // Vehicle
  const [vehicleType, setVehicleType] = useState('Car / Four Wheeler');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModelYear, setVehicleModelYear] = useState(String(new Date().getFullYear()));
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [vehicleCost, setVehicleCost] = useState('');
  // Vehicle Photos & Documents
  const [vehiclePhotos, setVehiclePhotos] = useState([]); // Up to 3 photos
  const [rcPhoto, setRcPhoto] = useState(null);
  const [insurancePhoto, setInsurancePhoto] = useState(null);

  // Loan Terms (Defaults: 24% annual interest, 12 months tenure)
  const [downPayment, setDownPayment] = useState('');
  const [loanAmount, setLoanAmount] = useState('50000');
  const [interestRate, setInterestRate] = useState('24'); // Default 24%
  const [tenure, setTenure] = useState('12'); // Default 12 months

  // Guarantor
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState('');
  const [guarantorAddress, setGuarantorAddress] = useState('');
  const [guarantorPhoto, setGuarantorPhoto] = useState(null);

  const [loading, setLoading] = useState(false);

  // Monthly Interest Rate in Rupees per ₹100 / month (Local Indian Lending Format)
  // Formula: Rate in Rs = Annual Rate (%) / 12
  const interestInRupees = useMemo(() => {
    const r = parseFloat(interestRate || 0);
    if (r <= 0) return '0.00';
    return (r / 12).toFixed(2);
  }, [interestRate]);

  // Set interest rate from Rupee quick-select (e.g. 2 Rs = 24%)
  const handleRupeeSelect = (rsVal) => {
    const annualPct = (rsVal * 12).toString();
    setInterestRate(annualPct);
  };

  // Auto-calculate Flat Rate EMI in real-time
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

  const totalInterest = useMemo(() => {
    const P = parseFloat(loanAmount || 0);
    const R = parseFloat(interestRate || 0);
    const N = parseInt(tenure || 12, 10);
    if (P <= 0 || N <= 0 || R <= 0) return 0;
    return Math.round(P * (R / 100) * (N / 12));
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
    if (!fileNumber.trim()) {
      Alert.alert('Missing File Number', 'Please provide a Loan File / Account Number');
      setActiveStep(1);
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert('Missing Customer Info', 'Please provide Customer Name and Primary Phone Number');
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
        fileNumber: fileNumber.trim(),
        customerName: customerName.trim(),
        customerPhonePrimary: customerPhone.trim(),
        customerPhoneSecondary: customerPhone2.trim(),
        customerFatherName: customerFatherName.trim(),
        customerAadhaarNumber: customerAadhaar.trim(),
        customerAddress: customerAddress.trim(),
        customerPhoto,
        vehicleType,
        vehicleMake: vehicleMake.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleModelYear: parseInt(vehicleModelYear, 10) || new Date().getFullYear(),
        insuranceExpiryDate: insuranceExpiryDate.trim(),
        engineNumber: engineNumber.trim(),
        chassisNumber: chassisNumber.trim(),
        vehicleCost: parseFloat(vehicleCost || 0),
        downPayment: parseFloat(downPayment || 0),
        vehiclePhotos, // 2-3 photos array
        rcPhoto,
        insurancePhoto,
        loanAmount: parseFloat(loanAmount),
        interestRate: parseFloat(interestRate || 24),
        tenure: parseInt(tenure || 12, 10),
        emi: calculatedEmi,
        emiAmount: calculatedEmi,
        guarantorName: guarantorName.trim(),
        guarantorPhone: guarantorPhone.trim(),
        guarantorRelation: guarantorRelation.trim(),
        guarantorAddress: guarantorAddress.trim(),
        guarantorPhoto,
      });

      setLoading(false);
      Alert.alert(
        'Loan Created Successfully!',
        `Account File Number: ${newLoan.fileNumber}\nMonthly Flat EMI: ₹${newLoan.emiAmount.toLocaleString('en-IN')}`,
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
        subtitle="Sanction, KYC, Photo Capture & Amortization"
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
            activeOpacity={0.7}
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
            <Text style={styles.sectionTitle}>1. Account & Borrower Information</Text>

            {/* Editable File / Account Number */}
            <View style={styles.fileNumberBox}>
              <View style={styles.fileHeaderRow}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                <Text style={styles.fileNumberLabel}>File / Account Number * (Editable)</Text>
              </View>
              <TextInput
                style={[styles.input, styles.fileNumberInput]}
                placeholder="Enter file number (e.g. 300808)"
                value={fileNumber}
                onChangeText={setFileNumber}
                keyboardType="numeric"
              />
              <Text style={styles.fileHint}>You can manually edit or replace this file number.</Text>
            </View>

            {/* Customer Photo (Camera or Local Upload) */}
            <ImagePickerField
              label="Borrower / Customer Photo *"
              sublabel="Take photo with camera or choose from gallery"
              value={customerPhoto}
              onChange={setCustomerPhoto}
            />

            <Text style={styles.inputLabel}>Borrower Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ramesh Chandra"
              value={customerName}
              onChangeText={setCustomerName}
            />

            <View style={styles.grid2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Primary Phone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile"
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Secondary Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Alternative mobile"
                  keyboardType="phone-pad"
                  value={customerPhone2}
                  onChangeText={setCustomerPhone2}
                />
              </View>
            </View>

            <View style={styles.grid2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Father / Spouse Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Father's name"
                  value={customerFatherName}
                  onChangeText={setCustomerFatherName}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Aadhaar Card No.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12-digit Aadhaar"
                  keyboardType="numeric"
                  value={customerAadhaar}
                  onChangeText={setCustomerAadhaar}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Residential Address</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Door No, Street, Village/Town, PIN"
              multiline
              value={customerAddress}
              onChangeText={setCustomerAddress}
            />

            <TouchableOpacity style={styles.nextBtn} onPress={() => setActiveStep(2)} activeOpacity={0.8}>
              <Text style={styles.nextBtnText}>Next: Vehicle Details</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Vehicle Details */}
        {activeStep === 2 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>2. Vehicle Specifications & Documentation</Text>

            <Text style={styles.inputLabel}>Vehicle Category *</Text>
            <View style={styles.categoryRow}>
              {['Two Wheeler', 'Car / Four Wheeler', 'Commercial'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.catBtn, vehicleType === type && styles.catBtnActive]}
                  onPress={() => setVehicleType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catBtnText, vehicleType === type && styles.catBtnTextActive]}>
                    {type.split('/')[0].trim()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.grid2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Make / Manufacturer</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Maruti / Honda"
                  value={vehicleMake}
                  onChangeText={setVehicleMake}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Vehicle Model *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Swift VXi / Activa"
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                />
              </View>
            </View>

            <View style={styles.grid2}>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.inputLabel}>Registration No *</Text>
                <TextInput
                  style={[styles.input, { fontFamily: 'monospace', fontWeight: '700' }]}
                  placeholder="e.g. AP-31-CJ-9309"
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                  autoCapitalize="characters"
                />
              </View>
              <View style={{ flex: 0.8 }}>
                <Text style={styles.inputLabel}>Model Year *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2024"
                  keyboardType="numeric"
                  value={vehicleModelYear}
                  onChangeText={setVehicleModelYear}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Insurance Ending Date (Expiry Date)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (e.g. 2027-03-31)"
              value={insuranceExpiryDate}
              onChangeText={setInsuranceExpiryDate}
            />

            <View style={styles.grid2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Engine Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Engine Serial"
                  value={engineNumber}
                  onChangeText={setEngineNumber}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Chassis Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Chassis Serial"
                  value={chassisNumber}
                  onChangeText={setChassisNumber}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Vehicle On-Road / Valuation Cost (₹)</Text>
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

            {/* Photos Section */}
            <View style={styles.photoDivider}>
              <Ionicons name="images-outline" size={18} color={colors.primary} />
              <Text style={styles.photoDividerText}>Vehicle Photos & Document Uploads</Text>
            </View>

            {/* 2 to 3 Vehicle Photos */}
            <ImagePickerField
              label="Vehicle Photos (2 to 3 Photos)"
              sublabel="Take photos of front, side, and rear via camera or upload"
              value={vehiclePhotos}
              onChange={setVehiclePhotos}
              multiple={true}
              maxCount={3}
            />

            {/* RC Document Photo */}
            <ImagePickerField
              label="RC Document Photo (Registration Certificate)"
              sublabel="Camera snap of RC book or smart card"
              value={rcPhoto}
              onChange={setRcPhoto}
            />

            {/* Insurance Document Photo */}
            <ImagePickerField
              label="Insurance Document Photo"
              sublabel="Camera snap or gallery upload of insurance policy"
              value={insurancePhoto}
              onChange={setInsurancePhoto}
            />

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.prevBtn} onPress={() => setActiveStep(1)} activeOpacity={0.7}>
                <Text style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={() => setActiveStep(3)} activeOpacity={0.8}>
                <Text style={styles.nextBtnText}>Next: Loan Terms</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Loan Financials */}
        {activeStep === 3 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>3. Financing Terms & Flat Rate EMI</Text>

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
              style={[styles.input, { fontSize: 16, fontWeight: '700' }]}
              placeholder="e.g. 50000"
              keyboardType="numeric"
              value={loanAmount}
              onChangeText={setLoanAmount}
            />

            <View style={styles.grid2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Annual Interest Rate (% p.a.) *</Text>
                <TextInput
                  style={[styles.input, { fontWeight: '700' }]}
                  placeholder="24"
                  keyboardType="numeric"
                  value={interestRate}
                  onChangeText={setInterestRate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Tenure (Months) *</Text>
                <TextInput
                  style={[styles.input, { fontWeight: '700' }]}
                  placeholder="12"
                  keyboardType="numeric"
                  value={tenure}
                  onChangeText={setTenure}
                />
              </View>
            </View>

            {/* Interest in Rupees (Local Indian Lending Display) */}
            <View style={styles.rupeeDisplayCard}>
              <View style={styles.rupeeHeaderRow}>
                <Ionicons name="cash-outline" size={18} color="#0f766e" />
                <Text style={styles.rupeeCardTitle}>Interest Rate in Rupees (Rs)</Text>
              </View>

              <Text style={styles.rupeeValueText}>
                ₹{interestInRupees} <Text style={styles.rupeeSub}>per ₹100 / month ({interestInRupees} Rs interest)</Text>
              </Text>

              <Text style={styles.rupeeChipsLabel}>Quick Preset Rates:</Text>
              <View style={styles.rupeeChipsRow}>
                {[
                  { rs: 1.5, label: '₹1.50 Rs (18%)' },
                  { rs: 1.9, label: '₹1.90 Rs (22.8%)' },
                  { rs: 2.0, label: '₹2.00 Rs (24%)' },
                  { rs: 2.5, label: '₹2.50 Rs (30%)' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.rs}
                    style={[
                      styles.rupeeChip,
                      parseFloat(interestInRupees) === item.rs && styles.rupeeChipActive,
                    ]}
                    onPress={() => handleRupeeSelect(item.rs)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.rupeeChipText,
                        parseFloat(interestInRupees) === item.rs && styles.rupeeChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Live Flat EMI Preview Box */}
            <View style={styles.emiPreviewBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={styles.emiPreviewSub}>Monthly Flat EMI</Text>
                  <Text style={styles.emiPreviewAmount}>{formatCurrency(calculatedEmi)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.emiPreviewSub}>Total Interest ({tenure} Mo)</Text>
                  <Text style={styles.emiPreviewInterest}>{formatCurrency(totalInterest)}</Text>
                </View>
              </View>
              <View style={styles.emiFormulaRow}>
                <Text style={styles.emiFormulaText}>
                  Total Payable: {formatCurrency(parseFloat(loanAmount || 0) + totalInterest)} ÷ {tenure} months = {formatCurrency(calculatedEmi)}/mo
                </Text>
              </View>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.prevBtn} onPress={() => setActiveStep(2)} activeOpacity={0.7}>
                <Text style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={() => setActiveStep(4)} activeOpacity={0.8}>
                <Text style={styles.nextBtnText}>Next: Guarantor</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 4: Guarantor & Confirm */}
        {activeStep === 4 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>4. Guarantor Information & Review</Text>

            {/* Guarantor Photo */}
            <ImagePickerField
              label="Guarantor Photo (Optional)"
              sublabel="Take photo with camera or choose from gallery"
              value={guarantorPhoto}
              onChange={setGuarantorPhoto}
            />

            <Text style={styles.inputLabel}>Guarantor Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Suresh Kumar"
              value={guarantorName}
              onChangeText={setGuarantorName}
            />

            <View style={styles.grid2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Guarantor Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile"
                  keyboardType="phone-pad"
                  value={guarantorPhone}
                  onChangeText={setGuarantorPhone}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Relationship</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Brother, Father, etc."
                  value={guarantorRelation}
                  onChangeText={setGuarantorRelation}
                />
              </View>
            </View>

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
              <Text style={styles.reviewItem}>File #: {fileNumber || 'N/A'}</Text>
              <Text style={styles.reviewItem}>Borrower: {customerName || 'N/A'} ({customerPhone || 'N/A'})</Text>
              <Text style={styles.reviewItem}>Vehicle: {vehicleMake} {vehicleModel} ({vehicleNumber || 'N/A'})</Text>
              <Text style={styles.reviewItem}>Model Year: {vehicleModelYear || 'N/A'} • Ins. Expiry: {insuranceExpiryDate || 'N/A'}</Text>
              <Text style={styles.reviewItem}>
                Sanction: {formatCurrency(loanAmount)} @ {interestRate}% ({interestInRupees} Rs) for {tenure} months
              </Text>
              <Text style={[styles.reviewItem, { fontWeight: '800', color: colors.primary, fontSize: 14 }]}>
                Monthly Flat EMI: {formatCurrency(calculatedEmi)}
              </Text>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.prevBtn} onPress={() => setActiveStep(3)} disabled={loading} activeOpacity={0.7}>
                <Text style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading} activeOpacity={0.8}>
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
  fileNumberBox: {
    backgroundColor: '#eff6ff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: spacing.md,
  },
  fileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fileNumberLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  fileNumberInput: {
    backgroundColor: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    paddingVertical: 8,
  },
  fileHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
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
  photoDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  photoDividerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  rupeeDisplayCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  rupeeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  rupeeCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
    textTransform: 'uppercase',
  },
  rupeeValueText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15803d',
    marginTop: 2,
  },
  rupeeSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  rupeeChipsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
    marginTop: 8,
    marginBottom: 4,
  },
  rupeeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rupeeChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.round,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  rupeeChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  rupeeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d',
  },
  rupeeChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
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
  emiFormulaRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
  },
  emiFormulaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
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
