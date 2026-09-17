import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@vehicle_finance_loans_clean_v2';

const defaultLoans = [];

let inMemoryLoans = [];

class VehicleFinanceStore {
  static async init() {
    try {
      await AsyncStorage.removeItem('@vehicle_finance_loans_v1').catch(() => {});
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        inMemoryLoans = JSON.parse(stored);
      } else {
        inMemoryLoans = [];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
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
    const fileNumber = loanData.fileNumber ? String(loanData.fileNumber) : `VF-${new Date().getFullYear()}-${String(nextIndex).padStart(3, '0')}`;
    const id = loanData.fileNumber ? String(loanData.fileNumber) : `LN-${new Date().getFullYear()}-${String(nextIndex).padStart(3, '0')}`;

    // Flat Rate EMI calculation
    // Total Interest = P * (R / 100) * (N / 12)
    // Total Payable = P + Total Interest
    // EMI = Total Payable / N
    const P = parseFloat(loanData.loanAmount || 0);
    const annualRate = parseFloat(loanData.interestRate || 0);
    const N = parseInt(loanData.tenure || 12, 10);
    const totalInterest = P * (annualRate / 100) * (N / 12);
    const totalPayable = P + totalInterest;
    const emi = loanData.emi || loanData.emiAmount || (N > 0 ? Math.round((totalPayable / N) * 100) / 100 : 0);
    const principalPerEmi = N > 0 ? Math.round((P / N) * 100) / 100 : 0;
    const interestPerEmi = N > 0 ? Math.round((totalInterest / N) * 100) / 100 : 0;

    const emiDetails = [];
    const startDate = new Date();

    for (let i = 1; i <= N; i++) {
      const emiDate = new Date(startDate);
      emiDate.setMonth(emiDate.getMonth() + i);

      emiDetails.push({
        emiNumber: i,
        emiDate: emiDate.toISOString().split('T')[0],
        emiAmount: emi,
        principalComponent: principalPerEmi,
        interestComponent: interestPerEmi,
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

  static async payEMI(fileNumber, emiNumber, paymentAmount, paymentDate, paymentMode = 'UPI', notes = '', options = {}) {
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
    emi.paidAmount = paymentAmount;
    emi.paidDate = paymentDate || new Date().toISOString().split('T')[0];
    emi.paymentMode = paymentMode;
    emi.notes = notes;
    emi.agentName = options.agentName || 'Admin';
    emi.penaltyCollected = options.penaltyCollected || 0;
    emi.penaltyWaived = options.penaltyWaived || 0;

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

  static async forecloseLoan(fileNumber, settlementData = {}) {
    const loans = await this.getLoans();
    const loanIndex = loans.findIndex(
      (l) =>
        String(l.fileNumber).toLowerCase() === String(fileNumber).toLowerCase() ||
        String(l.id).toLowerCase() === String(fileNumber).toLowerCase()
    );

    if (loanIndex === -1) throw new Error('Loan not found');

    const loan = loans[loanIndex];
    const todayStr = settlementData.date || new Date().toISOString().split('T')[0];
    const settlementAmount = Number(settlementData.settlementAmount || 0);
    const agentName = settlementData.agentName || 'Administrator';
    const notes = settlementData.notes || 'Full loan pre-closure settlement';
    const mode = settlementData.mode || 'Cash';

    // Mark all remaining unpaid EMIs as Settled
    if (Array.isArray(loan.emiDetails)) {
      loan.emiDetails.forEach((emi) => {
        if (emi.status !== 'Paid') {
          emi.status = 'Paid';
          emi.remainingAmount = 0;
          emi.paidAmount = emi.emiAmount || 0;
          emi.paidDate = todayStr;
          emi.paymentMode = mode;
          emi.notes = notes;
          emi.agentName = agentName;
        }
      });
    }

    loan.status = 'Closed';
    loan.remainingEmi = 0;
    loan.paidEmiCount = loan.tenure || loan.emiDetails?.length || 0;
    loan.foreclosureDetails = {
      settlementAmount,
      foreclosureDate: todayStr,
      paymentMode: mode,
      notes,
      settledBy: agentName,
      principalPaidAtClose: Number(settlementData.principalOutstanding || 0),
      interestRebate: Number(settlementData.interestRebate || 0),
      penaltiesPaid: Number(settlementData.penaltiesPaid || 0),
      discount: Number(settlementData.discount || 0),
      nocGenerated: false,
    };

    loans[loanIndex] = loan;
    inMemoryLoans = loans;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
    } catch (e) {}

    return { success: true, loan };
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
    inMemoryLoans = [];
    try {
      await AsyncStorage.removeItem('@vehicle_finance_loans_v1').catch(() => {});
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch (e) {}
    return inMemoryLoans;
  }

  static async getTransactions() {
    const loans = await this.getLoans();
    const transactions = [];
    loans.forEach((loan) => {
      (loan.emiDetails || []).forEach((emi) => {
        if (emi.status === 'Paid') {
          transactions.push({
            id: `TXN-${loan.fileNumber}-${emi.emiNumber}`,
            fileNumber: loan.fileNumber,
            customerName: loan.customerName,
            vehicleNumber: loan.vehicleNumber,
            emiNumber: emi.emiNumber,
            amount: emi.emiAmount || emi.paidAmount || 0,
            date: emi.paidDate || emi.emiDate || new Date().toISOString().split('T')[0],
            mode: emi.paymentMode || 'UPI',
            type: 'CREDIT',
            status: 'COMPLETED',
            agentName: emi.agentName || 'Admin',
            penaltyCollected: emi.penaltyCollected || 0,
            penaltyWaived: emi.penaltyWaived || 0,
            reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
          });
        }
      });
    });
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  static async updateLoan(fileNumber, updatedData) {
    const loans = await this.getLoans();
    const idx = loans.findIndex(
      (l) =>
        String(l.fileNumber).toLowerCase() === String(fileNumber).toLowerCase() ||
        String(l.id).toLowerCase() === String(fileNumber).toLowerCase()
    );
    if (idx === -1) {
      const newEntry = { ...updatedData, fileNumber, id: String(fileNumber) };
      loans.unshift(newEntry);
      inMemoryLoans = loans;
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
      } catch (e) {}
      return newEntry;
    }

    loans[idx] = {
      ...loans[idx],
      ...updatedData,
    };
    inMemoryLoans = loans;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
    } catch (e) {}
    return loans[idx];
  }

  static async deleteLoan(fileNumber) {
    const loans = await this.getLoans();
    const filtered = loans.filter(
      (l) =>
        String(l.fileNumber).toLowerCase() !== String(fileNumber).toLowerCase() &&
        String(l.id).toLowerCase() !== String(fileNumber).toLowerCase()
    );
    inMemoryLoans = filtered;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {}
    return true;
  }

  static async updateEmi(fileNumber, emiNumber, emiData) {
    const loans = await this.getLoans();
    const loan = loans.find(
      (l) =>
        String(l.fileNumber).toLowerCase() === String(fileNumber).toLowerCase() ||
        String(l.id).toLowerCase() === String(fileNumber).toLowerCase()
    );
    if (!loan || !Array.isArray(loan.emiDetails)) return null;

    const emi = loan.emiDetails.find((e) => e.emiNumber === emiNumber);
    if (!emi) return null;

    Object.assign(emi, emiData);
    inMemoryLoans = loans;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
    } catch (e) {}
    return emi;
  }
}

export default VehicleFinanceStore;
