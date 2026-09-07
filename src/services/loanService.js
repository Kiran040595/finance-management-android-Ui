import VehicleFinanceStore from './vehicleFinanceStore';

const getLoanStats = async () => {
  try {
    return VehicleFinanceStore.getLoanStats();
  } catch (error) {
    console.error("Error fetching loan statistics:", error);
    throw error;
  }
};

const getLoans = async () => {
  try {
    return VehicleFinanceStore.getLoans();
  } catch (error) {
    console.error("Error fetching loans:", error);
    throw error;
  }
};

const getLoanById = async (id) => {
  try {
    const loan = VehicleFinanceStore.getLoanById(id);
    if (!loan) throw new Error("Loan not found");
    return loan;
  } catch (error) {
    console.error("Error fetching loan by id:", error);
    throw error;
  }
};

const createLoan = async (loanData) => {
  try {
    return VehicleFinanceStore.createLoan(loanData);
  } catch (error) {
    console.error("Error creating loan:", error);
    throw error;
  }
};

const updateLoan = async (id, loanData) => {
  try {
    return VehicleFinanceStore.updateLoan(id, loanData);
  } catch (error) {
    console.error("Error updating loan:", error);
    throw error;
  }
};

const deleteLoan = async (id) => {
  try {
    return VehicleFinanceStore.deleteLoan(id);
  } catch (error) {
    console.error("Error deleting loan:", error);
    throw error;
  }
};

const resetData = async () => {
  return VehicleFinanceStore.resetToDefaultData();
};

const LoanService = {
  getLoanStats,
  getLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
  resetData,
};

export default LoanService;
