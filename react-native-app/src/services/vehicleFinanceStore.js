import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@vehicle_finance_loans_v1';

const defaultLoans = [
  {
    id: 'LN-2024-001',
    fileNumber: 'VF-2024-001',
    customerName: 'Rajesh Kumar',
    customerPhonePrimary: '9876543210',
    customerPhoneSecondary: '9876543211',
    customerEmail: 'rajesh.k@example.com',
    customerAddress: '#142, Gandhi Nagar, 2nd Cross, Bangalore - 560001',
    vehicleType: 'Car / Four Wheeler',
    vehicleMake: 'Maruti Suzuki',
    vehicleModel: 'Swift VXi 2024',
    vehicleNumber: 'KA-01-MJ-4821',
    engineNumber: 'K12N8829104',
    chassisNumber: 'MBHEB41S8P8102941',
    vehicleCost: 750000,
    downPayment: 150000,
    loanAmount: 600000,
    interestRate: 10.5,
    tenure: 36,
    emiAmount: 19500,
    disbursedDate: '2024-01-15',
    status: 'Active',
    paidEmiCount: 8,
    remainingEmi: 28,
    totalPrincipalPaid: 124000,
    totalInterestPaid: 32000,
    totalPenaltyDue: 0,
    guarantorName: 'Suresh Kumar',
    guarantorPhone: '9845112233',
    guarantorRelation: 'Brother',
    guarantorAddress: '#144, Gandhi Nagar, Bangalore',
    emiDetails: [
      { emiNumber: 1, emiDate: '2024-02-15', emiAmount: 19500, principalComponent: 14250, interestComponent: 5250, remainingAmount: 0, status: 'Paid', paidDate: '2024-02-14', paymentMode: 'UPI' },
      { emiNumber: 2, emiDate: '2024-03-15', emiAmount: 19500, principalComponent: 14370, interestComponent: 5130, remainingAmount: 0, status: 'Paid', paidDate: '2024-03-15', paymentMode: 'UPI' },
      { emiNumber: 3, emiDate: '2024-04-15', emiAmount: 19500, principalComponent: 14500, interestComponent: 5000, remainingAmount: 0, status: 'Paid', paidDate: '2024-04-12', paymentMode: 'Bank Transfer' },
      { emiNumber: 4, emiDate: '2024-05-15', emiAmount: 19500, principalComponent: 14620, interestComponent: 4880, remainingAmount: 0, status: 'Paid', paidDate: '2024-05-15', paymentMode: 'UPI' },
      { emiNumber: 5, emiDate: '2024-06-15', emiAmount: 19500, principalComponent: 14750, interestComponent: 4750, remainingAmount: 0, status: 'Paid', paidDate: '2024-06-14', paymentMode: 'Cash' },
      { emiNumber: 6, emiDate: '2024-07-15', emiAmount: 19500, principalComponent: 14880, interestComponent: 4620, remainingAmount: 0, status: 'Paid', paidDate: '2024-07-15', paymentMode: 'UPI' },
      { emiNumber: 7, emiDate: '2024-08-15', emiAmount: 19500, principalComponent: 15010, interestComponent: 4490, remainingAmount: 0, status: 'Paid', paidDate: '2024-08-15', paymentMode: 'UPI' },
      { emiNumber: 8, emiDate: '2024-09-15', emiAmount: 19500, principalComponent: 15140, interestComponent: 4360, remainingAmount: 0, status: 'Paid', paidDate: '2024-09-14', paymentMode: 'UPI' },
      { emiNumber: 9, emiDate: '2026-09-15', emiAmount: 19500, principalComponent: 15270, interestComponent: 4230, remainingAmount: 19500, status: 'Due', penaltyAmount: 0 },
      { emiNumber: 10, emiDate: '2026-10-15', emiAmount: 19500, principalComponent: 15400, interestComponent: 4100, remainingAmount: 19500, status: 'Upcoming', penaltyAmount: 0 },
      { emiNumber: 11, emiDate: '2026-11-15', emiAmount: 19500, principalComponent: 15540, interestComponent: 3960, remainingAmount: 19500, status: 'Upcoming', penaltyAmount: 0 },
      { emiNumber: 12, emiDate: '2026-12-15', emiAmount: 19500, principalComponent: 15670, interestComponent: 3830, remainingAmount: 19500, status: 'Upcoming', penaltyAmount: 0 },
    ],
  },
  {
    id: 'LN-2024-002',
    fileNumber: 'VF-2024-002',
    customerName: 'Priya Sharma',
    customerPhonePrimary: '9123456780',
    customerPhoneSecondary: '',
    customerEmail: 'priya.s@example.com',
    customerAddress: 'Flat 304, Green Heights, Indiranagar, Bangalore - 560038',
    vehicleType: 'Two Wheeler',
    vehicleMake: 'Honda',
    vehicleModel: 'Activa 6G DLX',
    vehicleNumber: 'KA-03-EX-9912',
    engineNumber: 'JF50E918231',
    chassisNumber: 'ME4JF507K819230',
    vehicleCost: 95000,
    downPayment: 25000,
    loanAmount: 70000,
    interestRate: 12.0,
    tenure: 18,
    emiAmount: 4270,
    disbursedDate: '2024-03-01',
    status: 'Active',
    paidEmiCount: 5,
    remainingEmi: 13,
    totalPrincipalPaid: 19500,
    totalInterestPaid: 1850,
    totalPenaltyDue: 350,
    guarantorName: 'Ramesh Sharma',
    guarantorPhone: '9845009988',
    guarantorRelation: 'Father',
    guarantorAddress: 'Same as customer',
    emiDetails: [
      { emiNumber: 1, emiDate: '2024-04-01', emiAmount: 4270, principalComponent: 3570, interestComponent: 700, remainingAmount: 0, status: 'Paid', paidDate: '2024-04-01', paymentMode: 'UPI' },
      { emiNumber: 2, emiDate: '2024-05-01', emiAmount: 4270, principalComponent: 3600, interestComponent: 670, remainingAmount: 0, status: 'Paid', paidDate: '2024-05-01', paymentMode: 'UPI' },
      { emiNumber: 3, emiDate: '2024-06-01', emiAmount: 4270, principalComponent: 3640, interestComponent: 630, remainingAmount: 0, status: 'Paid', paidDate: '2024-06-02', paymentMode: 'Cash' },
      { emiNumber: 4, emiDate: '2024-07-01', emiAmount: 4270, principalComponent: 3680, interestComponent: 590, remainingAmount: 0, status: 'Paid', paidDate: '2024-07-01', paymentMode: 'UPI' },
      { emiNumber: 5, emiDate: '2024-08-01', emiAmount: 4270, principalComponent: 3710, interestComponent: 560, remainingAmount: 0, status: 'Paid', paidDate: '2024-08-01', paymentMode: 'UPI' },
      { emiNumber: 6, emiDate: '2026-09-01', emiAmount: 4270, principalComponent: 3750, interestComponent: 520, remainingAmount: 4270, status: 'Overdue', penaltyAmount: 350 },
      { emiNumber: 7, emiDate: '2026-10-01', emiAmount: 4270, principalComponent: 3790, interestComponent: 480, remainingAmount: 4270, status: 'Upcoming', penaltyAmount: 0 },
      { emiNumber: 8, emiDate: '2026-11-01', emiAmount: 4270, principalComponent: 3820, interestComponent: 450, remainingAmount: 4270, status: 'Upcoming', penaltyAmount: 0 },
    ],
  },
  {
    id: 'LN-2024-003',
    fileNumber: 'VF-2024-003',
    customerName: 'Mohammed Asif',
    customerPhonePrimary: '9880123456',
    customerPhoneSecondary: '',
    customerEmail: 'asif.transport@example.com',
    customerAddress: 'Shop #12, Market Yard, Yeshwanthpur, Bangalore - 560022',
    vehicleType: 'Commercial / Three Wheeler',
    vehicleMake: 'Tata Motors',
    vehicleModel: 'Tata Ace Gold HT Plus',
    vehicleNumber: 'KA-04-AB-7734',
    engineNumber: 'TATA475ID28',
    chassisNumber: 'MAT612089P890123',
    vehicleCost: 650000,
    downPayment: 130000,
    loanAmount: 520000,
    interestRate: 11.5,
    tenure: 48,
    emiAmount: 13560,
    disbursedDate: '2024-02-10',
    status: 'Active',
    paidEmiCount: 6,
    remainingEmi: 42,
    totalPrincipalPaid: 51000,
    totalInterestPaid: 30360,
    totalPenaltyDue: 0,
    guarantorName: 'Farooq Ahmed',
    guarantorPhone: '9880998877',
    guarantorRelation: 'Business Partner',
    guarantorAddress: 'Market Yard, Bangalore',
    emiDetails: [
      { emiNumber: 1, emiDate: '2024-03-10', emiAmount: 13560, principalComponent: 8570, interestComponent: 4990, remainingAmount: 0, status: 'Paid', paidDate: '2024-03-10', paymentMode: 'Bank Transfer' },
      { emiNumber: 2, emiDate: '2024-04-10', emiAmount: 13560, principalComponent: 8650, interestComponent: 4910, remainingAmount: 0, status: 'Paid', paidDate: '2024-04-09', paymentMode: 'UPI' },
      { emiNumber: 3, emiDate: '2024-05-10', emiAmount: 13560, principalComponent: 8740, interestComponent: 4820, remainingAmount: 0, status: 'Paid', paidDate: '2024-05-10', paymentMode: 'UPI' },
      { emiNumber: 4, emiDate: '2024-06-10', emiAmount: 13560, principalComponent: 8820, interestComponent: 4740, remainingAmount: 0, status: 'Paid', paidDate: '2024-06-10', paymentMode: 'Bank Transfer' },
      { emiNumber: 5, emiDate: '2024-07-10', emiAmount: 13560, principalComponent: 8900, interestComponent: 4660, remainingAmount: 0, status: 'Paid', paidDate: '2024-07-10', paymentMode: 'UPI' },
      { emiNumber: 6, emiDate: '2024-08-10', emiAmount: 13560, principalComponent: 8990, interestComponent: 4570, remainingAmount: 0, status: 'Paid', paidDate: '2024-08-10', paymentMode: 'UPI' },
      { emiNumber: 7, emiDate: '2026-09-10', emiAmount: 13560, principalComponent: 9070, interestComponent: 4490, remainingAmount: 13560, status: 'Due', penaltyAmount: 0 },
      { emiNumber: 8, emiDate: '2026-10-10', emiAmount: 13560, principalComponent: 9160, interestComponent: 4400, remainingAmount: 13560, status: 'Upcoming', penaltyAmount: 0 },
      { emiNumber: 9, emiDate: '2026-11-10', emiAmount: 13560, principalComponent: 9250, interestComponent: 4310, remainingAmount: 13560, status: 'Upcoming', penaltyAmount: 0 },
    ],
  },
  {
    id: 'LN-2024-004',
    fileNumber: 'VF-2024-004',
    customerName: 'Ananya Deshmukh',
    customerPhonePrimary: '9740112233',
    customerPhoneSecondary: '',
    customerEmail: 'ananya.d@example.com',
    customerAddress: '#55, 7th Main, Koramangala 4th Block, Bangalore - 560034',
    vehicleType: 'Car / Four Wheeler',
    vehicleMake: 'Hyundai',
    vehicleModel: 'Creta SX (O) Turbo',
    vehicleNumber: 'KA-05-MM-3108',
    engineNumber: 'G4LDN89012',
    chassisNumber: 'MALC181CLP91823',
    vehicleCost: 1850000,
    downPayment: 450000,
    loanAmount: 1400000,
    interestRate: 9.8,
    tenure: 60,
    emiAmount: 29620,
    disbursedDate: '2024-04-05',
    status: 'Active',
    paidEmiCount: 5,
    remainingEmi: 55,
    totalPrincipalPaid: 91000,
    totalInterestPaid: 57100,
    totalPenaltyDue: 0,
    guarantorName: 'Vikram Deshmukh',
    guarantorPhone: '9740998811',
    guarantorRelation: 'Spouse',
    guarantorAddress: 'Same as customer',
    emiDetails: [
      { emiNumber: 1, emiDate: '2024-05-05', emiAmount: 29620, principalComponent: 18180, interestComponent: 11440, remainingAmount: 0, status: 'Paid', paidDate: '2024-05-05', paymentMode: 'Bank Transfer' },
      { emiNumber: 2, emiDate: '2024-06-05', emiAmount: 29620, principalComponent: 18330, interestComponent: 11290, remainingAmount: 0, status: 'Paid', paidDate: '2024-06-05', paymentMode: 'Bank Transfer' },
      { emiNumber: 3, emiDate: '2024-07-05', emiAmount: 29620, principalComponent: 18480, interestComponent: 11140, remainingAmount: 0, status: 'Paid', paidDate: '2024-07-05', paymentMode: 'UPI' },
      { emiNumber: 4, emiDate: '2024-08-05', emiAmount: 29620, principalComponent: 18630, interestComponent: 10990, remainingAmount: 0, status: 'Paid', paidDate: '2024-08-05', paymentMode: 'Bank Transfer' },
      { emiNumber: 5, emiDate: '2024-09-05', emiAmount: 29620, principalComponent: 18780, interestComponent: 10840, remainingAmount: 0, status: 'Paid', paidDate: '2024-09-05', paymentMode: 'UPI' },
      { emiNumber: 6, emiDate: '2026-10-05', emiAmount: 29620, principalComponent: 18930, interestComponent: 10690, remainingAmount: 29620, status: 'Upcoming', penaltyAmount: 0 },
    ],
  },
];

let inMemoryLoans = [...defaultLoans];

class VehicleFinanceStore {
  static async init() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        inMemoryLoans = JSON.parse(stored);
      } else {
        inMemoryLoans = [...defaultLoans];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryLoans));
      }
    } catch (e) {
      console.warn('AsyncStorage init fallback to memory', e);
    }
    return inMemoryLoans;
  }

  static async getLoans() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        inMemoryLoans = JSON.parse(stored);
      }
    } catch (e) {
      // fallback to inMemory
    }
    return [...inMemoryLoans];
  }

  static async getLoanById(id) {
    const loans = await this.getLoans();
    return loans.find((l) => l.id === id || l.fileNumber === id) || null;
  }

  static async createLoan(loanData) {
    const loans = await this.getLoans();
    const nextIndex = loans.length + 1;
    const fileNumber = `VF-${new Date().getFullYear()}-${String(nextIndex).padStart(3, '0')}`;
    const id = `LN-${new Date().getFullYear()}-${String(nextIndex).padStart(3, '0')}`;

    // Auto-calculate Amortization schedule
    const P = parseFloat(loanData.loanAmount || 0);
    const annualRate = parseFloat(loanData.interestRate || 10);
    const N = parseInt(loanData.tenure || 12, 10);
    const monthlyRate = annualRate / 12 / 100;

    let emi = 0;
    if (monthlyRate === 0) {
      emi = Math.round(P / N);
    } else {
      emi = Math.round((P * monthlyRate * Math.pow(1 + monthlyRate, N)) / (Math.pow(1 + monthlyRate, N) - 1));
    }

    const emiDetails = [];
    let balance = P;
    const startDate = new Date();

    for (let i = 1; i <= N; i++) {
      const emiDate = new Date(startDate);
      emiDate.setMonth(emiDate.getMonth() + i);
      const interestComp = Math.round(balance * monthlyRate);
      const principalComp = Math.min(emi - interestComp, balance);
      balance = Math.max(0, balance - principalComp);

      emiDetails.push({
        emiNumber: i,
        emiDate: emiDate.toISOString().split('T')[0],
        emiAmount: emi,
        principalComponent: principalComp,
        interestComponent: interestComp,
        remainingAmount: emi,
        status: 'Upcoming',
        penaltyAmount: 0,
      });
    }

    const newLoan = {
      ...loanData,
      id,
      fileNumber,
      emiAmount: emi,
      status: 'Active',
      paidEmiCount: 0,
      remainingEmi: N,
      totalPrincipalPaid: 0,
      totalInterestPaid: 0,
      totalPenaltyDue: 0,
      emiDetails,
      disbursedDate: new Date().toISOString().split('T')[0],
    };

    loans.unshift(newLoan);
    inMemoryLoans = loans;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
    } catch (e) {}

    return newLoan;
  }

  static async payEMI(fileNumber, emiNumber, paymentAmount, paymentDate, paymentMode = 'UPI', notes = '') {
    const loans = await this.getLoans();
    const loanIndex = loans.findIndex(
      (l) =>
        String(l.fileNumber).toLowerCase() === String(fileNumber).toLowerCase() ||
        String(l.id).toLowerCase() === String(fileNumber).toLowerCase()
    );

    if (loanIndex === -1) throw new Error('Loan not found');

    const loan = loans[loanIndex];
    const emi = loan.emiDetails.find((e) => e.emiNumber === emiNumber);
    if (!emi) throw new Error(`EMI installment #${emiNumber} not found`);

    emi.status = 'Paid';
    emi.remainingAmount = 0;
    emi.paidDate = paymentDate || new Date().toISOString().split('T')[0];
    emi.paymentMode = paymentMode;
    emi.notes = notes;

    loan.paidEmiCount = (loan.paidEmiCount || 0) + 1;
    loan.remainingEmi = Math.max(0, (loan.remainingEmi || loan.tenure) - 1);
    loan.totalPrincipalPaid = (loan.totalPrincipalPaid || 0) + (emi.principalComponent || 0);
    loan.totalInterestPaid = (loan.totalInterestPaid || 0) + (emi.interestComponent || 0);

    if (loan.remainingEmi === 0) {
      loan.status = 'Closed';
    }

    loans[loanIndex] = loan;
    inMemoryLoans = loans;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
    } catch (e) {}

    return { success: true, loan, emi };
  }

  static async getUpcomingEMIs() {
    const loans = await this.getLoans();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = [];

    loans.forEach((loan) => {
      if (loan.status === 'Closed') return;
      if (!Array.isArray(loan.emiDetails)) return;

      loan.emiDetails.forEach((emi) => {
        if (emi.status === 'Paid') return;

        const dueDate = new Date(emi.emiDate);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        let urgency = 'upcoming';
        if (diffDays < 0) urgency = 'overdue';
        else if (diffDays === 0) urgency = 'today';
        else if (diffDays <= 3) urgency = 'urgent';
        else if (diffDays <= 7) urgency = 'soon';
        else if (diffDays <= 30) urgency = 'month';
        else urgency = 'future';

        upcoming.push({
          loanId: loan.id,
          fileNumber: loan.fileNumber,
          customerName: loan.customerName,
          customerPhone: loan.customerPhonePrimary,
          customerEmail: loan.customerEmail,
          vehicleType: loan.vehicleType || 'Two Wheeler',
          vehicleMake: loan.vehicleMake || '',
          vehicleModel: loan.vehicleModel || '',
          vehicleNumber: loan.vehicleNumber || 'N/A',
          totalTenure: loan.tenure,
          paidEmiCount: loan.paidEmiCount || 0,
          remainingEmiCount: loan.remainingEmi || 0,
          loanStatus: loan.status,
          emiNumber: emi.emiNumber,
          emiDate: emi.emiDate,
          emiAmount: emi.emiAmount,
          principalComponent: emi.principalComponent,
          interestComponent: emi.interestComponent,
          remainingAmount: emi.remainingAmount,
          penaltyAmount: emi.penaltyAmount || (diffDays < 0 ? Math.round(emi.emiAmount * 0.002 * Math.abs(diffDays)) : 0),
          status: diffDays < 0 ? 'Overdue' : diffDays === 0 ? 'Due Today' : 'Upcoming',
          overdueDays: diffDays < 0 ? Math.abs(diffDays) : 0,
          daysUntilDue: diffDays,
          urgency,
        });
      });
    });

    upcoming.sort((a, b) => new Date(a.emiDate) - new Date(b.emiDate));
    return upcoming;
  }

  static async getLoanStats() {
    const loans = await this.getLoans();
    let totalDisbursed = 0;
    let activeLoans = 0;
    let totalCollected = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    loans.forEach((loan) => {
      totalDisbursed += loan.loanAmount || 0;
      if (loan.status === 'Active') activeLoans += 1;
      totalCollected += (loan.totalPrincipalPaid || 0) + (loan.totalInterestPaid || 0);

      const hasOverdue = (loan.emiDetails || []).some((e) => e.status === 'Overdue');
      if (hasOverdue) {
        overdueCount += 1;
        overdueAmount += loan.totalPenaltyDue || 500;
      }
    });

    return {
      totalDisbursed,
      activeLoans,
      totalCollected,
      overdueCount,
      overdueAmount,
      totalLoans: loans.length,
    };
  }

  static async resetToDefaultData() {
    inMemoryLoans = [...defaultLoans];
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLoans));
    } catch (e) {}
    return inMemoryLoans;
  }
}

export default VehicleFinanceStore;
