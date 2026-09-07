import VehicleFinanceStore from './vehicleFinanceStore';

// Service to handle fetching payment tracking data
const getPayments = async () => {
  try {
    return VehicleFinanceStore.getTransactions();
  } catch (error) {
    console.error("Error fetching payment tracking data:", error);
    throw error;
  }
};

const recordTransaction = async (transactionData) => {
  try {
    const txns = VehicleFinanceStore.getTransactions();
    const newTxn = {
      id: `TXN-${Date.now()}`,
      transactionId: `TXN-${Date.now()}`,
      ...transactionData,
    };
    txns.unshift(newTxn);
    VehicleFinanceStore.saveTransactions(txns);
    return newTxn;
  } catch (error) {
    console.error("Error recording transaction:", error);
    throw error;
  }
};

const PaymentTrackingService = {
  getPayments,
  recordTransaction,
};

export default PaymentTrackingService;
