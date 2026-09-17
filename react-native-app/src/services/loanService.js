import apiClient from './apiClient';
import VehicleFinanceStore from './vehicleFinanceStore';
import { processLoanPhotosForUpload } from './supabaseStorageService';

export const LoanService = {
  /**
   * Fetch all loans from backend /api/loan/loans, with local fallback
   */
  async getLoans() {
    try {
      const remoteLoans = await apiClient.get('/api/loan/loans');
      if (Array.isArray(remoteLoans)) {
        if (remoteLoans.length === 0) {
          return [];
        }
        // Map backend DTO to mobile UI format
        return remoteLoans.map((l) => ({
          id: String(l.fileNumber || l.id),
          backendId: l.id,
          fileNumber: String(l.fileNumber || l.id),
          customerName: l.customerName || 'Customer',
          customerPhonePrimary: l.phoneNumberPrimary || '',
          vehicleNumber: l.vehicleNumber || 'N/A',
          vehicleMake: l.vehicleMake || '',
          vehicleModel: l.vehicleModel || 'Vehicle',
          vehicleType: l.vehicleType || 'Car / Four Wheeler',
          loanAmount: Number(l.loanAmount || 0),
          emiAmount: Number(l.emi || 0),
          tenure: l.tenure || 36,
          paidEmiCount: l.paidEmiCount || 0,
          remainingEmi: l.remainingEmi != null ? l.remainingEmi : (l.tenure || 36) - (l.paidEmiCount || 0),
          status: l.status === false ? 'Closed' : 'Active',
          insuranceExpiryDate: l.insuranceExpiryDate || '',
          customerPhoto: l.customerPhotoUrl || null,
          customerPhotoUrl: l.customerPhotoUrl || null,
        }));
      }
    } catch (err) {
      console.warn('Unable to load loans from backend API, falling back to local cache:', err.message);
    }
    // Fallback to local store
    return VehicleFinanceStore.getLoans();
  },

  /**
   * Fetch complete loan details (customer, vehicle, emi schedule)
   */
  async getLoanById(id) {
    try {
      const cleanId = String(id).replace(/\D/g, '') || id;
      // 1. Fetch loan details
      let loanDetails = null;
      let effectiveFileNumber = cleanId;
      try {
        loanDetails = await apiClient.get(`/api/loan/${cleanId}`);
      } catch (e) {
        // Fallback: If cleanId was DB id instead of fileNumber, lookup loan list
        try {
          const allLoans = await apiClient.get('/api/loan/loans');
          const found = Array.isArray(allLoans) && allLoans.find((l) => String(l.id) === String(cleanId) || String(l.fileNumber) === String(cleanId));
          if (found && found.fileNumber) {
            effectiveFileNumber = String(found.fileNumber);
            loanDetails = await apiClient.get(`/api/loan/${effectiveFileNumber}`);
          }
        } catch {}
      }
      
      // 2. Fetch payment and EMI schedule
      let paymentDetails = null;
      try {
        paymentDetails = await apiClient.get(`/api/payment/payments/${effectiveFileNumber}`);
      } catch (e) {
        try {
          paymentDetails = await apiClient.get(`/api/payment/${effectiveFileNumber}`);
        } catch {}
      }

      if (loanDetails) {
        const emiList = (paymentDetails?.emiDetails || []).map((emi) => ({
          emiNumber: emi.emiNumber,
          emiDate: emi.emiDate,
          emiAmount: Number(emi.emiAmount || loanDetails.emi || 0),
          paidAmount: Number(emi.paidAmount || 0),
          remainingAmount: Number(emi.remainingAmount || 0),
          principalComponent: Math.round(Number(emi.emiAmount || loanDetails.emi || 0) * 0.75),
          interestComponent: Math.round(Number(emi.emiAmount || loanDetails.emi || 0) * 0.25),
          status: emi.status || (emi.paidAmount > 0 ? 'Paid' : 'Upcoming'),
          paidDate: emi.paidDate || emi.paymentDate || null,
          paymentMode: emi.paymentMode || 'UPI',
        }));

        let parsedVehiclePhotos = [];
        if (Array.isArray(loanDetails.vehiclePhotos)) {
          parsedVehiclePhotos = loanDetails.vehiclePhotos;
        } else if (typeof loanDetails.vehiclePhotoUrls === 'string') {
          try {
            parsedVehiclePhotos = JSON.parse(loanDetails.vehiclePhotoUrls);
          } catch {
            parsedVehiclePhotos = loanDetails.vehiclePhotoUrls.split(',').map((s) => s.trim()).filter(Boolean);
          }
        }

        return {
          id: String(loanDetails.fileNumber || id),
          fileNumber: String(loanDetails.fileNumber || id),
          customerName: loanDetails.customerName,
          customerPhonePrimary: loanDetails.customerPhonePrimary,
          customerPhoneSecondary: loanDetails.customerPhoneSecondary || '',
          customerEmail: loanDetails.customerEmail || '',
          customerAddress: loanDetails.customerFullAddress || '',
          customerAadhaarNumber: loanDetails.customerAadhaarNumber || '',
          customerFatherName: loanDetails.customerFatherName || '',
          customerPhoto: loanDetails.customerPhotoUrl || null,
          customerPhotoUrl: loanDetails.customerPhotoUrl || null,
          vehicleType: loanDetails.vehicleType || 'Car / Four Wheeler',
          vehicleMake: loanDetails.vehicleMake || '',
          vehicleModel: loanDetails.vehicleModel || (loanDetails.vehicleModelYear ? `Model ${loanDetails.vehicleModelYear}` : 'Vehicle'),
          vehicleModelYear: loanDetails.vehicleModelYear || null,
          vehicleNumber: loanDetails.vehicleNumber,
          insuranceExpiryDate: loanDetails.vehicleInsuranceExpiryDate || loanDetails.insuranceExpiryDate || '',
          vehiclePhotos: parsedVehiclePhotos,
          vehiclePhotoUrls: loanDetails.vehiclePhotoUrls || null,
          rcPhoto: loanDetails.rcPhotoUrl || null,
          rcPhotoUrl: loanDetails.rcPhotoUrl || null,
          insurancePhoto: loanDetails.insurancePhotoUrl || null,
          insurancePhotoUrl: loanDetails.insurancePhotoUrl || null,
          loanAmount: Number(loanDetails.loanAmount || 0),
          interestRate: Number(loanDetails.interestRate || 10.5),
          tenure: Number(loanDetails.tenure || 36),
          emiAmount: Number(loanDetails.emi || 0),
          disbursedDate: loanDetails.loanCreationDate || new Date().toISOString().split('T')[0],
          status: 'Active',
          paidEmiCount: paymentDetails?.paidEmiCount || 0,
          remainingEmi: paymentDetails?.remainingEmi != null ? paymentDetails.remainingEmi : (loanDetails.tenure || 36),
          guarantorName: loanDetails.guarantorName || '',
          guarantorPhone: loanDetails.guarantorPhonePrimary || '',
          guarantorPhonePrimary: loanDetails.guarantorPhonePrimary || '',
          guarantorPhoneSecondary: loanDetails.guarantorPhoneSecondary || '',
          guarantorRelation: loanDetails.guarantorRelation || '',
          guarantorAddress: loanDetails.guarantorFullAddress || '',
          guarantorFullAddress: loanDetails.guarantorFullAddress || '',
          guarantorAadhaarNumber: loanDetails.guarantorAadhaarNumber || '',
          guarantorPhoto: loanDetails.guarantorPhotoUrl || null,
          guarantorPhotoUrl: loanDetails.guarantorPhotoUrl || null,
          emiDetails: emiList,
        };
      }
    } catch (err) {
      console.warn('Unable to load loan details from backend, checking local cache:', err.message);
    }
    return VehicleFinanceStore.getLoanById(id);
  },

  /**
   * Create a new loan via POST /api/loan
   */
  async createLoan(loanData) {
    // 1. Process & upload any local captured photos to Supabase Cloud Storage
    let processedData = loanData;
    try {
      processedData = await processLoanPhotosForUpload(loanData);
    } catch (photoErr) {
      console.warn('Supabase photo upload warning during createLoan:', photoErr);
    }

    // Generate clean numeric fileNumber if not given
    const generatedFileNum = processedData.fileNumber
      ? parseInt(String(processedData.fileNumber).replace(/\D/g, ''), 10) || (Date.now() % 1000000)
      : Math.floor(100000 + Math.random() * 900000);

    const payload = {
      customerName: processedData.customerName,
      customerPhonePrimary: processedData.customerPhone || processedData.customerPhonePrimary,
      customerPhoneSecondary: processedData.customerPhone2 || processedData.customerPhoneSecondary || '',
      customerFullAddress: processedData.customerAddress || processedData.customerFullAddress || '',
      customerFatherName: processedData.customerFatherName || '',
      customerAadhaarNumber: processedData.customerAadhaarNumber || '',
      customerPhotoUrl: processedData.customerPhotoUrl || processedData.customerPhoto || null,
      vehicleNumber: (processedData.vehicleNumber || '').toUpperCase(),
      vehicleModelYear: processedData.vehicleModelYear ? parseInt(processedData.vehicleModelYear, 10) : new Date().getFullYear(),
      vehicleInsuranceExpiryDate: processedData.insuranceExpiryDate || null,
      vehiclePhotoUrls: processedData.vehiclePhotoUrls || (Array.isArray(processedData.vehiclePhotos) ? JSON.stringify(processedData.vehiclePhotos) : null),
      rcPhotoUrl: processedData.rcPhotoUrl || processedData.rcPhoto || null,
      insurancePhotoUrl: processedData.insurancePhotoUrl || processedData.insurancePhoto || null,
      loanAmount: parseFloat(processedData.loanAmount || 0),
      interestRate: parseFloat(processedData.interestRate || 10.5),
      tenure: parseInt(processedData.tenure || 36, 10),
      emi: parseFloat(processedData.emiAmount || processedData.emi || 0),
      fileNumber: generatedFileNum,
      guarantorName: processedData.guarantorName || '',
      guarantorPhonePrimary: processedData.guarantorPhone || processedData.guarantorPhonePrimary || '',
      guarantorPhoneSecondary: processedData.guarantorPhoneSecondary || '',
      guarantorFullAddress: processedData.guarantorAddress || processedData.guarantorFullAddress || '',
      guarantorAadhaarNumber: processedData.guarantorAadhaarNumber || '',
      guarantorPhotoUrl: processedData.guarantorPhotoUrl || processedData.guarantorPhoto || null,
      loanCreationDate: new Date(),
    };

    let backendResult = null;
    try {
      backendResult = await apiClient.post('/api/loan', payload);
    } catch (err) {
      console.warn('Backend loan creation failed or unavailable:', err.message);
    }

    // Also persist in local store for seamless offline/cache experience
    const localLoan = await VehicleFinanceStore.createLoan({
      ...processedData,
      fileNumber: String(generatedFileNum),
    });

    return localLoan;
  },

  /**
   * Fetch portfolio stats via GET /api/loan/stats
   */
  async getLoanStats() {
    try {
      const stats = await apiClient.get('/api/loan/stats');
      if (stats) {
        return {
          totalLoans: stats.totalLoans || 0,
          totalDisbursed: stats.totalLoanAmountGiven || 0,
          totalCollected: stats.totalAmountReceived || 0,
          overdueAmount: stats.totalOutstandingAmount || 0,
          activeLoans: stats.activeLoans || 0,
          closedLoans: stats.closedLoans || 0,
          overdueCount: 0,
        };
      }
    } catch (err) {
      console.warn('Unable to load stats from backend, falling back to local calculation:', err.message);
    }
    return VehicleFinanceStore.getLoanStats();
  },

  /**
   * Update loan details via PUT /api/loan/{fileNumber}
   */
  async updateLoan(fileNumber, loanData) {
    // 1. Process & upload any local captured photos to Supabase Cloud Storage
    let processedData = loanData;
    try {
      processedData = await processLoanPhotosForUpload(loanData);
    } catch (photoErr) {
      console.warn('Supabase photo upload warning during updateLoan:', photoErr);
    }

    const cleanFileNumber = parseInt(String(fileNumber).replace(/\D/g, ''), 10) || fileNumber;

    const payload = {
      fileNumber: cleanFileNumber,
      customerName: processedData.customerName,
      customerPhonePrimary: processedData.customerPhone || processedData.customerPhonePrimary,
      customerPhoneSecondary: processedData.customerPhone2 || processedData.customerPhoneSecondary || '',
      customerFullAddress: processedData.customerAddress || processedData.customerFullAddress || '',
      customerFatherName: processedData.customerFatherName || '',
      customerAadhaarNumber: processedData.customerAadhaarNumber || '',
      customerPhotoUrl: processedData.customerPhotoUrl || processedData.customerPhoto || null,
      vehicleNumber: (processedData.vehicleNumber || '').toUpperCase(),
      vehicleModelYear: processedData.vehicleModelYear ? parseInt(processedData.vehicleModelYear, 10) : new Date().getFullYear(),
      vehicleInsuranceExpiryDate: processedData.insuranceExpiryDate || null,
      vehiclePhotoUrls: processedData.vehiclePhotoUrls || (Array.isArray(processedData.vehiclePhotos) ? JSON.stringify(processedData.vehiclePhotos) : null),
      rcPhotoUrl: processedData.rcPhotoUrl || processedData.rcPhoto || null,
      insurancePhotoUrl: processedData.insurancePhotoUrl || processedData.insurancePhoto || null,
      loanAmount: parseFloat(processedData.loanAmount || 0),
      interestRate: parseFloat(processedData.interestRate || 10.5),
      tenure: parseInt(processedData.tenure || 12, 10),
      emi: parseFloat(processedData.emiAmount || processedData.emi || 0),
      guarantorName: processedData.guarantorName || '',
      guarantorPhonePrimary: processedData.guarantorPhone || processedData.guarantorPhonePrimary || '',
      guarantorPhoneSecondary: processedData.guarantorPhoneSecondary || '',
      guarantorFullAddress: processedData.guarantorAddress || processedData.guarantorFullAddress || '',
      guarantorAadhaarNumber: processedData.guarantorAadhaarNumber || '',
      guarantorPhotoUrl: processedData.guarantorPhotoUrl || processedData.guarantorPhoto || null,
    };

    try {
      await apiClient.put(`/api/loan/${cleanFileNumber}`, payload);
    } catch (err) {
      console.warn('Backend loan update notice:', err.message);
    }

    return VehicleFinanceStore.updateLoan(fileNumber, processedData);
  },

  /**
   * Update an individual EMI installment via PUT /api/payment/payments/{fileNumber}/{emiNumber}
   */
  async updateEmi(fileNumber, emiNumber, emiData) {
    const cleanFileNumber = parseInt(String(fileNumber).replace(/\D/g, ''), 10) || fileNumber;

    try {
      await apiClient.put(`/api/payment/payments/${cleanFileNumber}/${emiNumber}`, {
        emiDate: emiData.emiDate,
        paymentDate: emiData.paidDate || emiData.paymentDate || null,
        paymentAmount: parseFloat(emiData.paidAmount || emiData.paymentAmount || 0),
        remainingAmount: parseFloat(emiData.remainingAmount || 0),
      });
    } catch (err) {
      console.warn('Backend EMI update notice:', err.message);
    }

    return VehicleFinanceStore.updateEmi(fileNumber, emiNumber, emiData);
  },

  async deleteLoan(id) {
    try {
      await apiClient.delete(`/api/loan/${id}`);
    } catch (err) {
      console.warn('Unable to delete loan on backend:', err.message);
    }
    return VehicleFinanceStore.deleteLoan(id);
  },

  async resetData() {
    return VehicleFinanceStore.resetToDefaultData();
  },
};

export default LoanService;
