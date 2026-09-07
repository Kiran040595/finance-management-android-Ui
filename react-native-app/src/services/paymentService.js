import VehicleFinanceStore from './vehicleFinanceStore';

export const PaymentService = {
  getUpcomingEMIs: () => VehicleFinanceStore.getUpcomingEMIs(),
  payEMI: (fileNumber, emiNumber, amount, date, mode, notes) =>
    VehicleFinanceStore.payEMI(fileNumber, emiNumber, amount, date, mode, notes),
  getLoans: () => VehicleFinanceStore.getLoans(),
};

export default PaymentService;
