// Comprehensive Persistent Vehicle Finance Management Storage Engine
// Stores vehicle loans, customer & guarantor profiles, vehicle specs, EMI schedules, and transaction ledger.

const STORAGE_KEY_LOANS = 'fms_vehicle_loans_v1';
const STORAGE_KEY_TRANSACTIONS = 'fms_vehicle_transactions_v1';

// Helper to generate full EMI schedule for a loan
export const generateEmiSchedule = (loanAmount, interestRate, tenure, startDateStr) => {
  const principal = parseFloat(loanAmount);
  const ratePerMonth = parseFloat(interestRate);
  const months = parseInt(tenure, 10);

  if (isNaN(principal) || isNaN(ratePerMonth) || isNaN(months) || months <= 0) {
    return [];
  }

  // Flat interest calculation commonly used in vehicle finance:
  // Total Interest = Principal * (ratePerMonth / 100) * months
  const totalInterest = principal * (ratePerMonth / 100) * months;
  const totalPayable = principal + totalInterest;
  const monthlyEmi = Math.round(totalPayable / months);
  const monthlyPrincipal = Math.round(principal / months);
  const monthlyInterest = monthlyEmi - monthlyPrincipal;

  const startDate = startDateStr ? new Date(startDateStr) : new Date();
  const schedule = [];

  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    schedule.push({
      emiNumber: i,
      emiDate: dueDateStr,
      emiAmount: monthlyEmi,
      principalComponent: monthlyPrincipal,
      interestComponent: monthlyInterest,
      paidAmount: 0,
      remainingAmount: monthlyEmi,
      paymentDate: null,
      paymentMode: null,
      receiptNumber: null,
      status: 'Pending', // 'Pending' | 'Paid' | 'Overdue'
      overdueDays: 0,
      penaltyAmount: 0,
    });
  }

  return schedule;
};

// Seed initial realistic vehicle finance data
const getInitialLoans = () => {
  const today = new Date();
  
  // Helper to format date offset by months
  const dateOffset = (monthsAgo, day = 10) => {
    const d = new Date(today.getFullYear(), today.getMonth() - monthsAgo, day);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: '1',
      fileNumber: 'FL-1001',
      customerName: 'Rajesh Kumar Sharma',
      customerFatherName: 'Ramesh Sharma',
      customerPhonePrimary: '9876543210',
      customerPhoneSecondary: '9876543211',
      customerEmail: 'rajesh.sharma@example.com',
      customerAadhaarNumber: '4532 8910 2345',
      customerPanNumber: 'ABCPR1234F',
      houseNo: 'Flat 402',
      street: 'MG Road',
      landmark: 'Near Metro Station',
      addressLine1: 'Sunshine Residency, MG Road',
      addressLine2: 'Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pinCode: '560038',
      customerFullAddress: 'Flat 402, Sunshine Residency, MG Road, Indiranagar, Bangalore, Karnataka - 560038',
      
      // Vehicle Details
      vehicleType: 'Two Wheeler',
      vehicleMake: 'Honda',
      vehicleModel: 'Activa 6G DLX',
      vehicleNumber: 'KA-01-EF-2345',
      vehicleModelYear: 2023,
      vehicleCost: 92000,
      downPayment: 22000,
      engineNumber: 'JF91E8392019',
      chassisNumber: 'ME4JF9139P8392019',
      insuranceCompany: 'ICICI Lombard GIC',
      insurancePolicyNumber: 'POL-ICICI-839210',
      vehicleInsuranceExpiryDate: dateOffset(-6, 20), // 6 months in future
      hypothecation: 'Hypothecated to FMS Vehicle Finance Ltd',

      // Guarantor Details
      guarantorName: 'Suresh Kumar Sharma',
      guarantorPhonePrimary: '9845012345',
      guarantorAadhaarNumber: '7890 1234 5678',
      guarantorRelation: 'Brother',
      guarantorOccupation: 'Government Teacher',
      guarantorFullAddress: 'Flat 301, Sunshine Residency, MG Road, Bangalore - 560038',

      // Loan Terms
      loanAmount: 70000,
      interestRate: 1.5, // 1.5% monthly flat
      tenure: 18,
      emi: 4939,
      loanCreationDate: dateOffset(12, 5),
      status: 'Active',
      paidEmiCount: 11,
      remainingEmi: 7,
      totalPendingEmiAmount: 34573,
      pendingDays: 0,
      emiDetails: Array.from({ length: 18 }, (_, idx) => {
        const emiNum = idx + 1;
        const dueDate = dateOffset(12 - emiNum, 10);
        const isPaid = emiNum <= 11;
        return {
          emiNumber: emiNum,
          emiDate: dueDate,
          emiAmount: 4939,
          principalComponent: 3889,
          interestComponent: 1050,
          paidAmount: isPaid ? 4939 : 0,
          remainingAmount: isPaid ? 0 : 4939,
          paymentDate: isPaid ? dueDate : null,
          paymentMode: isPaid ? (emiNum % 2 === 0 ? 'UPI' : 'Cash') : null,
          receiptNumber: isPaid ? `RCP-1001-${emiNum}` : null,
          status: isPaid ? 'Paid' : 'Pending',
          overdueDays: 0,
          penaltyAmount: 0,
        };
      }),
    },
    {
      id: '2',
      fileNumber: 'FL-1002',
      customerName: 'Priya Sundaram',
      customerFatherName: 'K. Sundaram',
      customerPhonePrimary: '9123456780',
      customerPhoneSecondary: '',
      customerEmail: 'priya.s@example.com',
      customerAadhaarNumber: '8910 2345 6789',
      customerPanNumber: 'DEFPS5678K',
      houseNo: 'House 14',
      street: 'Anna Salai',
      landmark: 'Opposite State Library',
      addressLine1: 'T. Nagar',
      addressLine2: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pinCode: '600017',
      customerFullAddress: 'House 14, Anna Salai, T. Nagar, Chennai, Tamil Nadu - 600017',

      // Vehicle Details
      vehicleType: 'Car / Four Wheeler',
      vehicleMake: 'Maruti Suzuki',
      vehicleModel: 'Swift VXI',
      vehicleNumber: 'TN-09-CB-4491',
      vehicleModelYear: 2022,
      vehicleCost: 750000,
      downPayment: 250000,
      engineNumber: 'K12M7492810',
      chassisNumber: 'MA3FNE82S00918234',
      insuranceCompany: 'Bajaj Allianz General Insurance',
      insurancePolicyNumber: 'BA-2024-918230',
      vehicleInsuranceExpiryDate: dateOffset(-8, 15),
      hypothecation: 'Hypothecated to FMS Vehicle Finance Ltd',

      // Guarantor Details
      guarantorName: 'M. Anand',
      guarantorPhonePrimary: '9940123987',
      guarantorAadhaarNumber: '2345 6789 0123',
      guarantorRelation: 'Spouse',
      guarantorOccupation: 'Software Consultant',
      guarantorFullAddress: 'House 14, Anna Salai, T. Nagar, Chennai - 600017',

      // Loan Terms
      loanAmount: 500000,
      interestRate: 1.1,
      tenure: 36,
      emi: 19389,
      loanCreationDate: dateOffset(20, 1),
      status: 'Active',
      paidEmiCount: 19,
      remainingEmi: 17,
      totalPendingEmiAmount: 329613,
      pendingDays: 0,
      emiDetails: Array.from({ length: 36 }, (_, idx) => {
        const emiNum = idx + 1;
        const dueDate = dateOffset(20 - emiNum, 5);
        const isPaid = emiNum <= 19;
        return {
          emiNumber: emiNum,
          emiDate: dueDate,
          emiAmount: 19389,
          principalComponent: 13889,
          interestComponent: 5500,
          paidAmount: isPaid ? 19389 : 0,
          remainingAmount: isPaid ? 0 : 19389,
          paymentDate: isPaid ? dueDate : null,
          paymentMode: isPaid ? 'Bank Transfer' : null,
          receiptNumber: isPaid ? `RCP-1002-${emiNum}` : null,
          status: isPaid ? 'Paid' : 'Pending',
          overdueDays: 0,
          penaltyAmount: 0,
        };
      }),
    },
    {
      id: '3',
      fileNumber: 'FL-1003',
      customerName: 'Amitbhai Patel',
      customerFatherName: 'Naranbhai Patel',
      customerPhonePrimary: '9825091823',
      customerPhoneSecondary: '9825091824',
      customerEmail: 'amit.patel@example.com',
      customerAadhaarNumber: '6789 0123 4567',
      customerPanNumber: 'GHIAP9012M',
      houseNo: 'B-12',
      street: 'Ashram Road',
      landmark: 'Near Riverfront',
      addressLine1: 'Navrangpura',
      addressLine2: '',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pinCode: '380009',
      customerFullAddress: 'B-12, Ashram Road, Navrangpura, Ahmedabad, Gujarat - 380009',

      // Vehicle Details
      vehicleType: 'Two Wheeler',
      vehicleMake: 'Bajaj',
      vehicleModel: 'Pulsar 150 Twin Disc',
      vehicleNumber: 'GJ-01-QR-8821',
      vehicleModelYear: 2023,
      vehicleCost: 125000,
      downPayment: 35000,
      engineNumber: 'DH59182049',
      chassisNumber: 'MD2DH59ZXPC918204',
      insuranceCompany: 'HDFC ERGO General Insurance',
      insurancePolicyNumber: 'HDFC-89201948',
      vehicleInsuranceExpiryDate: dateOffset(1, 10), // Expiring this month!
      hypothecation: 'Hypothecated to FMS Vehicle Finance Ltd',

      // Guarantor Details
      guarantorName: 'Dinesh Patel',
      guarantorPhonePrimary: '9879018234',
      guarantorAadhaarNumber: '3456 7890 1234',
      guarantorRelation: 'Uncle',
      guarantorOccupation: 'Business Owner',
      guarantorFullAddress: 'Shop 4, Ashram Road, Ahmedabad - 380009',

      // Loan Terms
      loanAmount: 90000,
      interestRate: 1.4,
      tenure: 24,
      emi: 5010,
      loanCreationDate: dateOffset(10, 1),
      status: 'Overdue',
      paidEmiCount: 8,
      remainingEmi: 16,
      totalPendingEmiAmount: 80160,
      pendingDays: 34,
      emiDetails: Array.from({ length: 24 }, (_, idx) => {
        const emiNum = idx + 1;
        const dueDate = dateOffset(10 - emiNum, 1);
        const isPaid = emiNum <= 8;
        const isOverdue = emiNum === 9;
        return {
          emiNumber: emiNum,
          emiDate: dueDate,
          emiAmount: 5010,
          principalComponent: 3750,
          interestComponent: 1260,
          paidAmount: isPaid ? 5010 : 0,
          remainingAmount: isPaid ? 0 : 5010,
          paymentDate: isPaid ? dueDate : null,
          paymentMode: isPaid ? 'UPI' : null,
          receiptNumber: isPaid ? `RCP-1003-${emiNum}` : null,
          status: isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending',
          overdueDays: isOverdue ? 34 : 0,
          penaltyAmount: isOverdue ? 340 : 0,
        };
      }),
    },
    {
      id: '4',
      fileNumber: 'FL-1004',
      customerName: 'Suresh Babu Reddy',
      customerFatherName: 'Venkata Reddy',
      customerPhonePrimary: '9440192834',
      customerPhoneSecondary: '',
      customerEmail: 'suresh.reddy@example.com',
      customerAadhaarNumber: '1234 5678 9012',
      customerPanNumber: 'JKLSB3456T',
      houseNo: 'Plot 88',
      street: 'Madhapur Main Road',
      landmark: 'Behind Cyber Towers',
      addressLine1: 'Madhapur',
      addressLine2: '',
      city: 'Hyderabad',
      state: 'Telangana',
      pinCode: '500081',
      customerFullAddress: 'Plot 88, Madhapur Main Road, Behind Cyber Towers, Hyderabad, Telangana - 500081',

      // Vehicle Details
      vehicleType: 'Commercial Vehicle',
      vehicleMake: 'Tata Motors',
      vehicleModel: 'Tata Ace Gold Petrol',
      vehicleNumber: 'TS-08-UA-1029',
      vehicleModelYear: 2022,
      vehicleCost: 520000,
      downPayment: 170000,
      engineNumber: '475ID839210',
      chassisNumber: 'MAT618392P8392011',
      insuranceCompany: 'New India Assurance',
      insurancePolicyNumber: 'NIA-839201948',
      vehicleInsuranceExpiryDate: dateOffset(-11, 28),
      hypothecation: 'Cleared / NOC Issued',

      // Guarantor Details
      guarantorName: 'Venkata Reddy',
      guarantorPhonePrimary: '9440192835',
      guarantorAadhaarNumber: '5678 9012 3456',
      guarantorRelation: 'Father',
      guarantorOccupation: 'Farmer / Transport',
      guarantorFullAddress: 'Plot 88, Madhapur, Hyderabad - 500081',

      // Loan Terms
      loanAmount: 350000,
      interestRate: 1.25,
      tenure: 24,
      emi: 18958,
      loanCreationDate: dateOffset(25, 10),
      status: 'Closed',
      paidEmiCount: 24,
      remainingEmi: 0,
      totalPendingEmiAmount: 0,
      pendingDays: 0,
      emiDetails: Array.from({ length: 24 }, (_, idx) => {
        const emiNum = idx + 1;
        const dueDate = dateOffset(25 - emiNum, 10);
        return {
          emiNumber: emiNum,
          emiDate: dueDate,
          emiAmount: 18958,
          principalComponent: 14583,
          interestComponent: 4375,
          paidAmount: 18958,
          remainingAmount: 0,
          paymentDate: dueDate,
          paymentMode: emiNum % 2 === 0 ? 'Cheque' : 'Bank Transfer',
          receiptNumber: `RCP-1004-${emiNum}`,
          status: 'Paid',
          overdueDays: 0,
          penaltyAmount: 0,
        };
      }),
    },
    {
      id: '5',
      fileNumber: 'FL-1005',
      customerName: 'Vikramjit Singh',
      customerFatherName: 'Harbhajan Singh',
      customerPhonePrimary: '9814098234',
      customerPhoneSecondary: '',
      customerEmail: 'vikram.singh@example.com',
      customerAadhaarNumber: '3456 9012 7823',
      customerPanNumber: 'MNOPV7890R',
      houseNo: 'Flat 102',
      street: 'Mall Road',
      landmark: 'Near Golden Avenue',
      addressLine1: 'Civil Lines',
      addressLine2: '',
      city: 'Amritsar',
      state: 'Punjab',
      pinCode: '143001',
      customerFullAddress: 'Flat 102, Mall Road, Civil Lines, Amritsar, Punjab - 143001',

      // Vehicle Details
      vehicleType: 'Two Wheeler',
      vehicleMake: 'Royal Enfield',
      vehicleModel: 'Classic 350 Stealth Black',
      vehicleNumber: 'PB-02-ZZ-3344',
      vehicleModelYear: 2023,
      vehicleCost: 225000,
      downPayment: 65000,
      engineNumber: 'UCE350E918234',
      chassisNumber: 'ME3UCE350PC918234',
      insuranceCompany: 'Reliance General Insurance',
      insurancePolicyNumber: 'REL-89102934',
      vehicleInsuranceExpiryDate: dateOffset(-3, 12),
      hypothecation: 'Hypothecated to FMS Vehicle Finance Ltd',

      // Guarantor Details
      guarantorName: 'Gurpreet Kaur',
      guarantorPhonePrimary: '9814098235',
      guarantorAadhaarNumber: '7823 3456 9012',
      guarantorRelation: 'Sister',
      guarantorOccupation: 'Professor',
      guarantorFullAddress: 'Flat 102, Mall Road, Amritsar - 143001',

      // Loan Terms
      loanAmount: 160000,
      interestRate: 1.3,
      tenure: 24,
      emi: 8747,
      loanCreationDate: dateOffset(9, 15),
      status: 'Overdue',
      paidEmiCount: 6,
      remainingEmi: 18,
      totalPendingEmiAmount: 157446,
      pendingDays: 62,
      emiDetails: Array.from({ length: 24 }, (_, idx) => {
        const emiNum = idx + 1;
        const dueDate = dateOffset(9 - emiNum, 15);
        const isPaid = emiNum <= 6;
        const isOverdue = emiNum === 7 || emiNum === 8;
        return {
          emiNumber: emiNum,
          emiDate: dueDate,
          emiAmount: 8747,
          principalComponent: 6667,
          interestComponent: 2080,
          paidAmount: isPaid ? 8747 : 0,
          remainingAmount: isPaid ? 0 : 8747,
          paymentDate: isPaid ? dueDate : null,
          paymentMode: isPaid ? 'UPI' : null,
          receiptNumber: isPaid ? `RCP-1005-${emiNum}` : null,
          status: isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending',
          overdueDays: isOverdue ? (emiNum === 7 ? 62 : 31) : 0,
          penaltyAmount: isOverdue ? (emiNum === 7 ? 620 : 310) : 0,
        };
      }),
    },
    {
      id: '6',
      fileNumber: 'FL-1006',
      customerName: 'Sunita Santosh Gaikwad',
      customerFatherName: 'Santosh Gaikwad',
      customerPhonePrimary: '9765412390',
      customerPhoneSecondary: '',
      customerEmail: 'sunita.g@example.com',
      customerAadhaarNumber: '9012 3456 7890',
      customerPanNumber: 'QRSTG2345L',
      houseNo: 'W-45',
      street: 'MIDC Bhosari',
      landmark: 'Near Telco Gate',
      addressLine1: 'Bhosari',
      addressLine2: '',
      city: 'Pune',
      state: 'Maharashtra',
      pinCode: '411026',
      customerFullAddress: 'W-45, MIDC Bhosari, Near Telco Gate, Pune, Maharashtra - 411026',

      // Vehicle Details
      vehicleType: 'Auto Rickshaw',
      vehicleMake: 'Bajaj',
      vehicleModel: 'Compact 4S CNG Auto',
      vehicleNumber: 'MH-14-GH-9012',
      vehicleModelYear: 2023,
      vehicleCost: 260000,
      downPayment: 60000,
      engineNumber: 'BAJ4S891023',
      chassisNumber: 'MD2BAJ4S8PC891023',
      insuranceCompany: 'Oriental Insurance Co',
      insurancePolicyNumber: 'OIC-98102349',
      vehicleInsuranceExpiryDate: dateOffset(-9, 5),
      hypothecation: 'Hypothecated to FMS Vehicle Finance Ltd',

      // Guarantor Details
      guarantorName: 'Santosh Gaikwad',
      guarantorPhonePrimary: '9765412391',
      guarantorAadhaarNumber: '3456 7890 9012',
      guarantorRelation: 'Spouse',
      guarantorOccupation: 'Mechanic',
      guarantorFullAddress: 'W-45, Bhosari, Pune - 411026',

      // Loan Terms
      loanAmount: 200000,
      interestRate: 1.35,
      tenure: 36,
      emi: 8256,
      loanCreationDate: dateOffset(14, 1),
      status: 'Active',
      paidEmiCount: 14,
      remainingEmi: 22,
      totalPendingEmiAmount: 181632,
      pendingDays: 0,
      emiDetails: Array.from({ length: 36 }, (_, idx) => {
        const emiNum = idx + 1;
        const dueDate = dateOffset(14 - emiNum, 5);
        const isPaid = emiNum <= 14;
        return {
          emiNumber: emiNum,
          emiDate: dueDate,
          emiAmount: 8256,
          principalComponent: 5556,
          interestComponent: 2700,
          paidAmount: isPaid ? 8256 : 0,
          remainingAmount: isPaid ? 0 : 8256,
          paymentDate: isPaid ? dueDate : null,
          paymentMode: isPaid ? 'Cash' : null,
          receiptNumber: isPaid ? `RCP-1006-${emiNum}` : null,
          status: isPaid ? 'Paid' : 'Pending',
          overdueDays: 0,
          penaltyAmount: 0,
        };
      }),
    }
  ];
};

const getInitialTransactions = (loans) => {
  const txns = [];
  let txnCounter = 1001;

  loans.forEach((loan) => {
    // Add loan disbursement
    txns.push({
      id: `TXN-${txnCounter++}`,
      transactionId: `TXN-${txnCounter}`,
      fileNumber: loan.fileNumber,
      customerName: loan.customerName,
      vehicleNumber: loan.vehicleNumber,
      vehicleType: loan.vehicleType,
      amount: loan.loanAmount,
      transactionType: 'Loan Given',
      transactionDate: loan.loanCreationDate,
      paymentMode: 'Bank Transfer',
      receiptNumber: `DISB-${loan.fileNumber}`,
      notes: `Vehicle loan disbursement for ${loan.vehicleMake} ${loan.vehicleModel}`,
    });

    // Add paid EMIs
    loan.emiDetails
      .filter((e) => e.status === 'Paid')
      .forEach((emi) => {
        txns.push({
          id: `TXN-${txnCounter++}`,
          transactionId: `TXN-${txnCounter}`,
          fileNumber: loan.fileNumber,
          customerName: loan.customerName,
          vehicleNumber: loan.vehicleNumber,
          vehicleType: loan.vehicleType,
          amount: emi.paidAmount,
          transactionType: 'EMI Paid',
          transactionDate: emi.paymentDate || emi.emiDate,
          paymentMode: emi.paymentMode || 'Cash',
          emiNumber: emi.emiNumber,
          receiptNumber: emi.receiptNumber || `RCP-${loan.fileNumber}-${emi.emiNumber}`,
          notes: `EMI #${emi.emiNumber} collected for ${loan.vehicleNumber}`,
        });
      });
  });

  // Sort descending by date
  return txns.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
};

export class VehicleFinanceStore {
  static getLoans() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LOANS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not read loans from localStorage:', e);
    }
    const initialLoans = getInitialLoans();
    this.saveLoans(initialLoans);
    if (!localStorage.getItem(STORAGE_KEY_TRANSACTIONS)) {
      this.saveTransactions(getInitialTransactions(initialLoans));
    }
    return initialLoans;
  }

  static saveLoans(loans) {
    try {
      localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(loans));
    } catch (e) {
      console.error('Could not save loans to localStorage:', e);
    }
  }

  static getTransactions() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not read transactions:', e);
    }
    const loans = this.getLoans();
    const txns = getInitialTransactions(loans);
    this.saveTransactions(txns);
    return txns;
  }

  static saveTransactions(txns) {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(txns));
    } catch (e) {
      console.error('Could not save transactions:', e);
    }
  }

  static getLoanById(id) {
    const loans = this.getLoans();
    return loans.find((l) => String(l.id) === String(id) || String(l.fileNumber) === String(id));
  }

  static getLoanByFileNumber(fileNumber) {
    const loans = this.getLoans();
    return loans.find((l) => String(l.fileNumber).toLowerCase() === String(fileNumber).toLowerCase());
  }

  static createLoan(loanData) {
    const loans = this.getLoans();

    // Auto-assign file number if not provided
    const nextFileNum = loanData.fileNumber || `FL-${1000 + loans.length + 1}`;
    const newId = String(Date.now());

    // Generate schedule
    const schedule = generateEmiSchedule(
      loanData.loanAmount,
      loanData.interestRate,
      loanData.tenure,
      loanData.loanCreationDate
    );

    const calculatedEmi = schedule.length > 0 ? schedule[0].emiAmount : Number(loanData.emi || 0);
    const totalPayable = calculatedEmi * (parseInt(loanData.tenure, 10) || 1);

    const newLoan = {
      ...loanData,
      id: newId,
      fileNumber: nextFileNum,
      loanAmount: parseFloat(loanData.loanAmount) || 0,
      interestRate: parseFloat(loanData.interestRate) || 0,
      tenure: parseInt(loanData.tenure, 10) || 1,
      emi: calculatedEmi,
      loanCreationDate: loanData.loanCreationDate || new Date().toISOString().split('T')[0],
      vehicleType: loanData.vehicleType || 'Two Wheeler',
      vehicleMake: loanData.vehicleMake || 'Honda',
      vehicleModel: loanData.vehicleModel || 'Activa',
      vehicleNumber: loanData.vehicleNumber || 'NEW-REG',
      status: 'Active',
      paidEmiCount: 0,
      remainingEmi: parseInt(loanData.tenure, 10) || 1,
      totalPendingEmiAmount: totalPayable,
      pendingDays: 0,
      emiDetails: schedule,
    };

    loans.unshift(newLoan);
    this.saveLoans(loans);

    // Record disbursement in transactions
    const txns = this.getTransactions();
    txns.unshift({
      id: `TXN-${Date.now()}`,
      transactionId: `TXN-${Date.now()}`,
      fileNumber: newLoan.fileNumber,
      customerName: newLoan.customerName,
      vehicleNumber: newLoan.vehicleNumber,
      vehicleType: newLoan.vehicleType,
      amount: newLoan.loanAmount,
      transactionType: 'Loan Given',
      transactionDate: newLoan.loanCreationDate,
      paymentMode: 'Bank Transfer',
      receiptNumber: `DISB-${newLoan.fileNumber}`,
      notes: `Vehicle loan disbursement for ${newLoan.vehicleMake} ${newLoan.vehicleModel}`,
    });
    this.saveTransactions(txns);

    return newLoan;
  }

  static updateLoan(id, updatedData) {
    const loans = this.getLoans();
    const index = loans.findIndex((l) => String(l.id) === String(id) || String(l.fileNumber) === String(id));
    if (index === -1) throw new Error('Loan not found');

    loans[index] = { ...loans[index], ...updatedData };
    this.saveLoans(loans);
    return loans[index];
  }

  static deleteLoan(id) {
    const loans = this.getLoans();
    const filtered = loans.filter((l) => String(l.id) !== String(id) && String(l.fileNumber) !== String(id));
    this.saveLoans(filtered);
    return true;
  }

  static payEMI(fileNumber, emiNumber, paymentAmount, paymentDate, paymentMode = 'Cash', notes = '') {
    const loans = this.getLoans();
    const loanIndex = loans.findIndex((l) => String(l.fileNumber).toLowerCase() === String(fileNumber).toLowerCase());
    if (loanIndex === -1) throw new Error('Loan not found');

    const loan = loans[loanIndex];
    const emiIndex = loan.emiDetails.findIndex((e) => Number(e.emiNumber) === Number(emiNumber));
    if (emiIndex === -1) throw new Error('EMI installment not found');

    const paidAmt = parseFloat(paymentAmount) || loan.emiDetails[emiIndex].emiAmount;
    const payDate = paymentDate || new Date().toISOString().split('T')[0];
    const receiptNum = `RCP-${loan.fileNumber}-${emiNumber}-${Date.now().toString().slice(-4)}`;

    loan.emiDetails[emiIndex] = {
      ...loan.emiDetails[emiIndex],
      paidAmount: paidAmt,
      remainingAmount: Math.max(0, loan.emiDetails[emiIndex].emiAmount - paidAmt),
      paymentDate: payDate,
      paymentMode: paymentMode,
      receiptNumber: receiptNum,
      status: 'Paid',
      overdueDays: 0,
      penaltyAmount: 0,
    };

    // Recalculate loan summary
    const paidCount = loan.emiDetails.filter((e) => e.status === 'Paid').length;
    const remainingCount = loan.emiDetails.length - paidCount;
    const pendingTotal = loan.emiDetails
      .filter((e) => e.status !== 'Paid')
      .reduce((sum, e) => sum + e.remainingAmount, 0);

    // Check if any remaining EMI is overdue
    const today = new Date();
    let maxOverdueDays = 0;
    loan.emiDetails.forEach((e) => {
      if (e.status !== 'Paid') {
        const dueDate = new Date(e.emiDate);
        if (today > dueDate) {
          const diffDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
          if (diffDays > maxOverdueDays) maxOverdueDays = diffDays;
          e.status = 'Overdue';
          e.overdueDays = diffDays;
          e.penaltyAmount = Math.round(e.emiAmount * 0.002 * diffDays);
        }
      }
    });

    loan.paidEmiCount = paidCount;
    loan.remainingEmi = remainingCount;
    loan.totalPendingEmiAmount = pendingTotal;
    loan.pendingDays = maxOverdueDays;

    if (remainingCount === 0) {
      loan.status = 'Closed';
      loan.hypothecation = 'Cleared / NOC Eligible';
    } else if (maxOverdueDays > 0) {
      loan.status = 'Overdue';
    } else {
      loan.status = 'Active';
    }

    loans[loanIndex] = loan;
    this.saveLoans(loans);

    // Record in transaction ledger
    const txns = this.getTransactions();
    const newTxn = {
      id: `TXN-${Date.now()}`,
      transactionId: `TXN-${Date.now()}`,
      fileNumber: loan.fileNumber,
      customerName: loan.customerName,
      vehicleNumber: loan.vehicleNumber,
      vehicleType: loan.vehicleType,
      amount: paidAmt,
      transactionType: 'EMI Paid',
      transactionDate: payDate,
      paymentMode: paymentMode,
      emiNumber: emiNumber,
      receiptNumber: receiptNum,
      notes: notes || `EMI #${emiNumber} payment received`,
    };
    txns.unshift(newTxn);
    this.saveTransactions(txns);

    return {
      paidAmount: paidAmt,
      remainingAmount: loan.emiDetails[emiIndex].remainingAmount,
      status: true,
      receiptNumber: receiptNum,
      loan: loan,
    };
  }

  static updateEMI(fileNumber, emiNumber, data) {
    const loans = this.getLoans();
    const loanIndex = loans.findIndex((l) => String(l.fileNumber).toLowerCase() === String(fileNumber).toLowerCase());
    if (loanIndex === -1) throw new Error('Loan not found');

    const loan = loans[loanIndex];
    const emiIndex = loan.emiDetails.findIndex((e) => Number(e.emiNumber) === Number(emiNumber));
    if (emiIndex === -1) throw new Error('EMI installment not found');

    loan.emiDetails[emiIndex] = {
      ...loan.emiDetails[emiIndex],
      ...data,
    };

    loans[loanIndex] = loan;
    this.saveLoans(loans);
    return loan.emiDetails[emiIndex];
  }

  static getLoanStats() {
    const loans = this.getLoans();
    const totalLoans = loans.length;
    const activeLoans = loans.filter((l) => l.status === 'Active').length;
    const closedLoans = loans.filter((l) => l.status === 'Closed').length;
    const overdueLoans = loans.filter((l) => l.status === 'Overdue').length;

    const totalLoanAmountGiven = loans.reduce((sum, l) => sum + (parseFloat(l.loanAmount) || 0), 0);

    const totalAmountReceived = loans.reduce((sum, l) => {
      const paidInLoan = (l.emiDetails || [])
        .filter((e) => e.status === 'Paid')
        .reduce((pSum, e) => pSum + (parseFloat(e.paidAmount) || 0), 0);
      return sum + paidInLoan;
    }, 0);

    const totalOutstandingAmount = loans.reduce((sum, l) => {
      const remInLoan = (l.emiDetails || [])
        .filter((e) => e.status !== 'Paid')
        .reduce((rSum, e) => rSum + (parseFloat(e.remainingAmount) || 0), 0);
      return sum + remInLoan;
    }, 0);

    return {
      totalLoans,
      activeLoans,
      closedLoans,
      overdueLoans,
      totalLoanAmountGiven,
      totalAmountReceived,
      totalOutstandingAmount,
    };
  }

  static getLoanPayments(currentPage = 1, pageSize = 10, searchQuery = '', sortKey = 'fileNumber', sortDirection = 'asc') {
    const loans = this.getLoans();
    
    // Transform loans into payment-friendly rows
    let rows = loans.map((l) => {
      return {
        id: l.id,
        fileNumber: l.fileNumber,
        customerName: l.customerName,
        phoneNumbers: l.customerPhonePrimary,
        vehicleNumber: l.vehicleNumber,
        vehicleType: l.vehicleType,
        pendingDays: l.pendingDays || 0,
        totalPendingEmiAmount: l.totalPendingEmiAmount || 0,
        paidEmiCount: l.paidEmiCount || 0,
        tenure: l.tenure,
        emi: l.emi,
        status: l.status,
      };
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.vehicleNumber.toLowerCase().includes(q) ||
          String(r.fileNumber).toLowerCase().includes(q) ||
          r.phoneNumbers.includes(q)
      );
    }

    // Sort
    rows.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const totalElements = rows.length;
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = rows.slice(startIndex, startIndex + pageSize);

    const pendingLoans = loans.filter((l) => (l.remainingEmi || 0) > 0);
    const pendingEmiCount = pendingLoans.reduce((sum, l) => sum + (l.remainingEmi || 0), 0);
    const pendingEmiAmount = pendingLoans.reduce((sum, l) => sum + (l.totalPendingEmiAmount || 0), 0);
    const pendingCustomerCount = pendingLoans.length;

    return {
      payments: {
        content: paginated,
        totalElements: totalElements,
        totalPages: Math.ceil(totalElements / pageSize),
        pageNumber: currentPage,
        pageSize: pageSize,
      },
      totalLoans: loans.length,
      pendingEmiCount,
      pendingEmiAmount,
      pendingCustomerCount,
    };
  }

  static resetToDefaultData() {
    localStorage.removeItem(STORAGE_KEY_LOANS);
    localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
    return this.getLoans();
  }
}

export default VehicleFinanceStore;
