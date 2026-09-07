import VehicleFinanceStore from './vehicleFinanceStore';

// Get loan payment details with pagination, search, and sorting
const getLoanPayments = async (currentPage, pageSize, searchQuery, sortKey, sortDirection) => {
  try {
    return VehicleFinanceStore.getLoanPayments(currentPage, pageSize, searchQuery, sortKey, sortDirection);
  } catch (error) {
    console.error("Error fetching loan payments:", error);
    throw new Error('Error fetching loan payments');
  }
};

// Make a payment for a specific loan
const makePayment = async (loanId, paymentData) => {
  try {
    const { emiNumber, paymentAmount, paymentDate, paymentMode, notes } = paymentData;
    return VehicleFinanceStore.payEMI(loanId, emiNumber, paymentAmount, paymentDate, paymentMode, notes);
  } catch (error) {
    console.error("Error making payment:", error);
    throw new Error('Error making payment');
  }
};

// Get loan details by file number
const getLoanDetailsByFileNumber = async (fileNumber) => {
  try {
    const loan = VehicleFinanceStore.getLoanByFileNumber(fileNumber);
    if (!loan) throw new Error('Loan not found');
    return loan;
  } catch (error) {
    console.error("Error fetching loan details by file number:", error);
    throw new Error('Error fetching loan details by file number');
  }
};

// Pay EMI for a specific loan
const payEMI = async (fileNumber, emiNumber, paymentAmount, paymentDate, paymentMode = 'Cash', notes = '') => {
  try {
    return VehicleFinanceStore.payEMI(fileNumber, emiNumber, paymentAmount, paymentDate, paymentMode, notes);
  } catch (error) {
    console.error("Error paying EMI:", error);
    throw new Error('Error paying EMI');
  }
};

// Update EMI details for a specific loan
const updateEMI = async (fileNumber, emiNumber, data) => {
  try {
    return VehicleFinanceStore.updateEMI(fileNumber, emiNumber, data);
  } catch (error) {
    console.error("Error updating EMI:", error);
    throw new Error('Error updating EMI details');
  }
};

// Get all upcoming EMI installments across active loans
const getUpcomingEMIs = async () => {
  try {
    return VehicleFinanceStore.getUpcomingEMIs();
  } catch (error) {
    console.error("Error fetching upcoming EMIs:", error);
    throw new Error('Error fetching upcoming EMIs');
  }
};

const PaymentService = {
  getLoanPayments,
  makePayment,
  getLoanDetailsByFileNumber,
  payEMI,
  updateEMI,
  getUpcomingEMIs,
};

export default PaymentService;
