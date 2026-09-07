import VehicleFinanceStore from './vehicleFinanceStore';

export const LoanService = {
  getLoans: () => VehicleFinanceStore.getLoans(),
  getLoanById: (id) => VehicleFinanceStore.getLoanById(id),
  createLoan: (loanData) => VehicleFinanceStore.createLoan(loanData),
  getLoanStats: () => VehicleFinanceStore.getLoanStats(),
  getUpcomingEMIs: () => VehicleFinanceStore.getUpcomingEMIs(),
  resetData: () => VehicleFinanceStore.resetToDefaultData(),
};

export default LoanService;
