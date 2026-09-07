import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import LoanService from '../../services/loanService';
import PaymentService from '../../services/paymentService';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Box,
  Alert,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  FaCar, 
  FaUser, 
  FaShieldAlt, 
  FaFileContract, 
  FaPrint, 
  FaExclamationCircle, 
  FaArrowLeft,
  FaEdit,
  FaTrash
} from 'react-icons/fa';

function LoanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLoan, setEditedLoan] = useState({});
  const [nocOpen, setNocOpen] = useState(false);
  
  // Pay EMI modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedEmi, setSelectedEmi] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMode, setPayMode] = useState('UPI');
  const [payNotes, setPayNotes] = useState('');

  const fetchLoanData = useCallback(() => {
    setLoading(true);
    LoanService.getLoanById(id)
      .then((data) => {
        setLoan(data);
        setEditedLoan(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching loan:', err);
        setError('Error fetching loan details');
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetchLoanData();
  }, [fetchLoanData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedLoan((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const updated = await LoanService.updateLoan(loan.id, editedLoan);
      setLoan(updated);
      setIsEditing(false);
    } catch (err) {
      alert('Error updating loan');
    }
  };

  const handleDeleteLoan = async () => {
    if (window.confirm('Are you sure you want to delete this vehicle loan?')) {
      await LoanService.deleteLoan(loan.id);
      navigate('/loan-management');
    }
  };

  const handleOpenPayModal = (emi) => {
    setSelectedEmi(emi);
    setPayAmount(emi.remainingAmount || emi.emiAmount);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMode('Cash');
    setPayNotes('');
    setPayModalOpen(true);
  };

  const handleConfirmPay = async () => {
    if (!selectedEmi) return;
    try {
      await PaymentService.payEMI(
        loan.fileNumber,
        selectedEmi.emiNumber,
        payAmount,
        payDate,
        payMode,
        payNotes
      );
      setPayModalOpen(false);
      fetchLoanData();
    } catch (err) {
      alert('Failed to process payment');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !loan) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Loan not found'}</Alert>
        <Button component={Link} to="/loan-management" startIcon={<FaArrowLeft />}>
          Back to Loans
        </Button>
      </Container>
    );
  }

  // Insurance status check
  const insuranceExpiry = loan.vehicleInsuranceExpiryDate ? new Date(loan.vehicleInsuranceExpiryDate) : null;
  const today = new Date();
  const daysUntilExpiry = insuranceExpiry ? Math.ceil((insuranceExpiry - today) / (1000 * 60 * 60 * 24)) : null;

  const isInsuranceExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
  const isInsuranceExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Top Header & Navigation */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Button 
          component={Link} 
          to="/loan-management" 
          startIcon={<FaArrowLeft />}
          variant="outlined"
          size="small"
        >
          Back to Loans
        </Button>

        <Box display="flex" gap={1}>
          {loan.status === 'Closed' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<FaFileContract />}
              size="small"
              onClick={() => setNocOpen(true)}
            >
              Generate Vehicle NOC
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<FaPrint />}
            size="small"
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant={isEditing ? 'contained' : 'outlined'}
            color={isEditing ? 'success' : 'primary'}
            startIcon={<FaEdit />}
            size="small"
            onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
          >
            {isEditing ? 'Save Changes' : 'Edit Loan'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<FaTrash />}
            size="small"
            onClick={handleDeleteLoan}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Insurance Alert Banner */}
      {isInsuranceExpired && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<FaExclamationCircle />}>
          <strong>Vehicle Insurance Expired!</strong> The insurance policy for vehicle {loan.vehicleNumber} expired on {loan.vehicleInsuranceExpiryDate}. Hypothecated assets must maintain active comprehensive insurance.
        </Alert>
      )}
      {isInsuranceExpiringSoon && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<FaShieldAlt />}>
          <strong>Insurance Renewal Due:</strong> Insurance policy for vehicle {loan.vehicleNumber} expires in {daysUntilExpiry} days ({loan.vehicleInsuranceExpiryDate}).
        </Alert>
      )}

      {/* Main Loan Info Banner */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#f8fafc' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
              <Typography variant="h5" fontWeight="bold" color="primary">
                File #{loan.fileNumber}
              </Typography>
              <Chip 
                label={loan.status} 
                color={loan.status === 'Closed' ? 'success' : loan.status === 'Overdue' ? 'error' : 'primary'}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
              <Chip 
                label={loan.vehicleType || 'Vehicle Loan'} 
                variant="outlined"
                size="small"
              />
            </Box>
            <Typography variant="h6" fontWeight="600" color="text.primary">
              {loan.customerName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Financed Vehicle: <strong>{loan.vehicleMake} {loan.vehicleModel}</strong> ({loan.vehicleNumber})
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
            <Typography variant="caption" color="textSecondary">Monthly EMI</Typography>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              ₹{Number(loan.emi).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {loan.paidEmiCount || 0} of {loan.tenure} EMIs Settled
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Vehicle Details Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2} color="primary.main">
              <FaCar size={20} />
              <Typography variant="h6" fontWeight="bold">
                Vehicle Specifications
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Vehicle Make & Model</Typography>
                <Typography variant="body2" fontWeight="600">
                  {loan.vehicleMake} {loan.vehicleModel}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Registration Number</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ color: '#1976d2', fontFamily: 'monospace' }}>
                  {loan.vehicleNumber}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Vehicle Category</Typography>
                <Typography variant="body2">{loan.vehicleType}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Model Year</Typography>
                <Typography variant="body2">{loan.vehicleModelYear || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Engine Number</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{loan.engineNumber || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Chassis Number (VIN)</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{loan.chassisNumber || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Vehicle Valuation</Typography>
                <Typography variant="body2">₹{Number(loan.vehicleCost || 0).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Customer Down Payment</Typography>
                <Typography variant="body2">₹{Number(loan.downPayment || 0).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1, border: '1px solid #bbf7d0' }}>
                  <Typography variant="caption" color="textSecondary" display="block">Insurance Company & Policy:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {loan.insuranceCompany || 'Not specified'} — {loan.insurancePolicyNumber || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color={isInsuranceExpired ? 'error' : 'textSecondary'}>
                    Valid until: {loan.vehicleInsuranceExpiryDate || 'Not specified'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 0.5, p: 1, bgcolor: '#e0f2fe', borderRadius: 1 }}>
                  <Typography variant="caption" color="textSecondary">Hypothecation Endorsement:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {loan.hypothecation || 'Hypothecated to FMS Vehicle Finance Ltd'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Customer & Guarantor Details Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2} color="primary.main">
              <FaUser size={20} />
              <Typography variant="h6" fontWeight="bold">
                Customer & Guarantor
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
              Borrower Information
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Customer Name</Typography>
                {isEditing ? (
                  <TextField size="small" fullWidth name="customerName" value={editedLoan.customerName || ''} onChange={handleInputChange} />
                ) : (
                  <Typography variant="body2" fontWeight="600">{loan.customerName}</Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Primary Phone</Typography>
                {isEditing ? (
                  <TextField size="small" fullWidth name="customerPhonePrimary" value={editedLoan.customerPhonePrimary || ''} onChange={handleInputChange} />
                ) : (
                  <Typography variant="body2">
                    <a href={`tel:${loan.customerPhonePrimary}`} style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 'bold' }}>
                      📞 {loan.customerPhonePrimary}
                    </a>
                  </Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Aadhaar Number</Typography>
                <Typography variant="body2">{loan.customerAadhaarNumber || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">PAN Number</Typography>
                <Typography variant="body2">{loan.customerPanNumber || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Residential Address</Typography>
                <Typography variant="body2">{loan.customerFullAddress || `${loan.houseNo || ''} ${loan.street || ''} ${loan.city || ''} ${loan.state || ''} ${loan.pinCode || ''}`}</Typography>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" fontWeight="bold" color="secondary" sx={{ mb: 1, mt: 2 }}>
              Guarantor Details
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Guarantor Name</Typography>
                <Typography variant="body2" fontWeight="600">{loan.guarantorName || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Guarantor Phone</Typography>
                <Typography variant="body2">
                  {loan.guarantorPhonePrimary ? (
                    <a href={`tel:${loan.guarantorPhonePrimary}`} style={{ color: '#1976d2', textDecoration: 'none' }}>
                      📞 {loan.guarantorPhonePrimary}
                    </a>
                  ) : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Relation</Typography>
                <Typography variant="body2">{loan.guarantorRelation || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Aadhaar</Typography>
                <Typography variant="body2">{loan.guarantorAadhaarNumber || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* EMI Repayment Schedule (Amortization) */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <div>
            <Typography variant="h6" fontWeight="bold" color="primary">
              Vehicle Loan Repayment Schedule
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Full monthly amortization schedule ({loan.emiDetails?.length || 0} installments)
            </Typography>
          </div>
          <Button
            component={Link}
            to={`/payments/${loan.fileNumber}`}
            variant="contained"
            color="success"
            size="small"
          >
            Quick Payment Screen
          </Button>
        </Box>

        <TableContainer sx={{ maxHeight: 480 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>EMI #</strong></TableCell>
                <TableCell><strong>Due Date</strong></TableCell>
                <TableCell align="right"><strong>EMI Amount</strong></TableCell>
                <TableCell align="right"><strong>Principal</strong></TableCell>
                <TableCell align="right"><strong>Interest</strong></TableCell>
                <TableCell align="center"><strong>Paid Date</strong></TableCell>
                <TableCell align="center"><strong>Mode</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loan.emiDetails?.map((emi) => (
                <TableRow key={emi.emiNumber} hover>
                  <TableCell>#{emi.emiNumber}</TableCell>
                  <TableCell>{emi.emiDate}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ₹{Number(emi.emiAmount).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">₹{Number(emi.principalComponent || 0).toLocaleString()}</TableCell>
                  <TableCell align="right">₹{Number(emi.interestComponent || 0).toLocaleString()}</TableCell>
                  <TableCell align="center">{emi.paymentDate || '-'}</TableCell>
                  <TableCell align="center">
                    {emi.paymentMode ? (
                      <Chip label={emi.paymentMode} size="small" variant="outlined" />
                    ) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={emi.status} 
                      size="small" 
                      color={emi.status === 'Paid' ? 'success' : emi.status === 'Overdue' ? 'error' : 'default'}
                    />
                    {emi.overdueDays > 0 && (
                      <Typography variant="caption" color="error" display="block">
                        +{emi.overdueDays}d overdue (₹{emi.penaltyAmount})
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {emi.status !== 'Paid' ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleOpenPayModal(emi)}
                        sx={{ fontSize: '0.75rem', py: 0.2 }}
                      >
                        Pay EMI
                      </Button>
                    ) : (
                      <Typography variant="caption" color="success.main" fontWeight="bold">
                        ✓ {emi.receiptNumber || 'Settled'}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pay EMI Modal */}
      <Dialog open={payModalOpen} onClose={() => setPayModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
          Collect EMI Payment
        </DialogTitle>
        <DialogContent dividers>
          {selectedEmi && (
            <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Collecting EMI #{selectedEmi.emiNumber} for <strong>{loan.customerName}</strong> ({loan.vehicleNumber})
              </Typography>
              <TextField
                label="Amount to Pay (₹)"
                type="number"
                fullWidth
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
              <TextField
                label="Payment Date"
                type="date"
                fullWidth
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label="Payment Mode"
                fullWidth
                value={payMode}
                onChange={(e) => setPayMode(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="Cheque">Bank Cheque</option>
                <option value="Bank Transfer">NEFT / IMPS / Net Banking</option>
              </TextField>
              <TextField
                label="Transaction Reference / Notes"
                placeholder="e.g. UTR # or Cheque #"
                fullWidth
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPayModalOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleConfirmPay} variant="contained" color="success">
            Confirm & Issue Receipt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vehicle Hypothecation Clearance Certificate / NOC Dialog */}
      <Dialog open={nocOpen} onClose={() => setNocOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1b5e20', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Form 35 — Vehicle Hypothecation Termination (NOC)</span>
          <Button variant="contained" color="inherit" size="small" onClick={handlePrint} sx={{ color: '#1b5e20' }}>
            Print Certificate
          </Button>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4, bgcolor: '#ffffff' }}>
          <Box textAlign="center" mb={3} borderBottom="2px solid #333" pb={2}>
            <Typography variant="h5" fontWeight="bold">
              FMS VEHICLE FINANCE LIMITED
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block">
              Corporate Office: 104 Financial Tower, MG Road, Bangalore - 560001
            </Typography>
            <Typography variant="h6" sx={{ mt: 2, textDecoration: 'underline', fontWeight: 'bold' }}>
              NO OBJECTION CERTIFICATE (NOC)
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              For Removal of Hypothecation Endorsement in Registration Certificate (Form 35)
            </Typography>
          </Box>

          <Typography variant="body1" paragraph>
            Date: <strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
          </Typography>

          <Typography variant="body1" paragraph>
            To,<br />
            <strong>The Registering Authority (RTO)</strong><br />
            Department of Motor Vehicles
          </Typography>

          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Dear Sir/Madam,<br />
            This is to certify that <strong>{loan.customerName}</strong> residing at <strong>{loan.customerFullAddress || 'Registered Address'}</strong> has fully cleared all loan obligations, principal, interest, and dues under Loan Account / File Number <strong>{loan.fileNumber}</strong>.
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Vehicle Particulars:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}><Typography variant="body2">Registration Number: <strong>{loan.vehicleNumber}</strong></Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">Make & Model: <strong>{loan.vehicleMake} {loan.vehicleModel}</strong></Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">Engine Number: <strong>{loan.engineNumber || 'N/A'}</strong></Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">Chassis Number: <strong>{loan.chassisNumber || 'N/A'}</strong></Typography></Grid>
            </Grid>
          </Paper>

          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            We hereby confirm that <strong>FMS Vehicle Finance Limited</strong> has <strong>NO OBJECTION</strong> to the cancellation of our hypothecation endorsement from the Registration Certificate (RC Book) of the aforementioned motor vehicle.
          </Typography>

          <Box display="flex" justifyContent="space-between" mt={6} pt={3}>
            <Box textAlign="center">
              <Typography variant="body2">_________________________</Typography>
              <Typography variant="caption" fontWeight="bold">Customer / Owner Signature</Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="body2" fontWeight="bold">For FMS Vehicle Finance Ltd.</Typography>
              <Box height={40} />
              <Typography variant="body2">_________________________</Typography>
              <Typography variant="caption" fontWeight="bold">Authorized Signatory & Seal</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNocOpen(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default LoanDetails;
