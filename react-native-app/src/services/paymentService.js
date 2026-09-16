import apiClient from './apiClient';
import VehicleFinanceStore from './vehicleFinanceStore';

export const PaymentService = {
  /**
   * Fetch all upcoming and overdue EMIs across all loans
   */
  async getUpcomingEMIs() {
    return VehicleFinanceStore.getUpcomingEMIs();
  },

  /**
   * Pay an EMI via POST /api/payment/payments/pay/{fileNumber}
   */
  async payEMI(fileNumber, emiNumber, amount, date, mode = 'UPI', notes = '', options = {}) {
    const cleanFileNumber = parseInt(String(fileNumber).replace(/\D/g, ''), 10);
    const paymentDate = date || new Date().toISOString().split('T')[0];

    // Try posting to backend API
    try {
      if (cleanFileNumber) {
        await apiClient.post(`/api/payment/payments/pay/${cleanFileNumber}`, {
          fileNumber: cleanFileNumber,
          emiNumber: parseInt(emiNumber, 10),
          paymentAmount: parseFloat(amount),
          paymentDate: paymentDate,
          notes: `${notes || ''}${options.agentName ? ` [Agent: ${options.agentName}]` : ''}${options.penaltyCollected ? ` [Late Fee: ₹${options.penaltyCollected}]` : ''}`.trim(),
        });
      }
    } catch (err) {
      console.warn('Backend payment recording notice:', err.message);
    }

    // Always keep local store in sync
    return VehicleFinanceStore.payEMI(fileNumber, emiNumber, amount, paymentDate, mode, notes, options);
  },

  /**
   * Fetch transactions history from GET /api/paymentsTracking/getAll
   */
  async getTransactions() {
    try {
      const trackingList = await apiClient.get('/api/paymentsTracking/getAll');
      if (Array.isArray(trackingList)) {
        if (trackingList.length === 0) {
          return [];
        }
        return trackingList.map((t, idx) => ({
          id: String(t.id || `TXN-${idx + 1}`),
          fileNumber: String(t.fileNumber || 'N/A'),
          customerName: t.customerName || 'Customer',
          vehicleNumber: t.vehicleNumber || '',
          emiNumber: t.emiNumber || 1,
          amount: Number(t.paidAmount || t.amount || 0),
          date: t.paymentDate || t.date || new Date().toISOString().split('T')[0],
          mode: t.paymentMode || 'UPI',
          type: 'CREDIT',
          status: 'COMPLETED',
          reference: t.referenceNumber || `REF-${t.id || idx + 1}`,
        }));
      }
    } catch (err) {
      console.warn('Unable to load payment tracking from backend, using local store:', err.message);
    }
    return VehicleFinanceStore.getTransactions();
  },

  async getLoans() {
    return VehicleFinanceStore.getLoans();
  },
};

export default PaymentService;
