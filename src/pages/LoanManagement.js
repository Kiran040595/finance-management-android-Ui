import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Card
} from "@mui/material";
import AddLoan from "../components/AddLoan";
import LoansList from "../components/LoansList";
import LoanManagementDashboard from "../components/LoanManagementDashboard";
import { FaPlus, FaCalculator } from "react-icons/fa";

const LoanManagement = () => {
  const [isLoanFormVisible, setIsLoanFormVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [calcOpen, setCalcOpen] = useState(false);

  // EMI Calculator State
  const [calcAmount, setCalcAmount] = useState(100000);
  const [calcRate, setCalcRate] = useState(1.4);
  const [calcTenure, setCalcTenure] = useState(24);

  const calculateQuote = () => {
    const p = parseFloat(calcAmount) || 0;
    const r = parseFloat(calcRate) || 0;
    const m = parseInt(calcTenure, 10) || 1;
    const totalInterest = p * (r / 100) * m;
    const totalPayable = p + totalInterest;
    const emi = Math.round(totalPayable / m);
    return { emi, totalInterest: Math.round(totalInterest), totalPayable: Math.round(totalPayable) };
  };

  const quote = calculateQuote();

  // Show Add Loan Form
  const showLoanForm = () => {
    setIsLoanFormVisible(true);
  };

  // Close Add Loan Form
  const onClose = () => setIsLoanFormVisible(false);

  const handleLoanSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Box sx={{ maxWidth: 1350, margin: 'auto', p: { xs: 1.5, sm: 3 } }}>
      {/* Header with Quick Actions */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3, 
          flexWrap: 'wrap', 
          gap: 1.5 
        }}
      >
        <div>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Vehicle Loan Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage two-wheelers, cars, commercial vehicle loans, and hypothecation contracts
          </Typography>
        </div>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FaCalculator />}
            onClick={() => setCalcOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            EMI Calculator
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FaPlus />}
            onClick={showLoanForm}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >
            New Vehicle Loan
          </Button>
        </Box>
      </Box>

      {/* KPI Stats Bar */}
      <LoanManagementDashboard refreshTrigger={refreshTrigger} />

      {/* Loans List Table */}
      <LoansList refreshTrigger={refreshTrigger} />

      {/* Add Loan Dialog */}
      <Dialog 
        open={isLoanFormVisible} 
        onClose={onClose} 
        fullWidth 
        maxWidth="lg"
        PaperProps={{ sx: { maxHeight: '92vh' } }}
      >
        <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
          <AddLoan
            onSave={handleLoanSaved}
            onClose={onClose}
          />
        </DialogContent>
      </Dialog>

      {/* Quick Vehicle EMI Quote Calculator Dialog */}
      <Dialog open={calcOpen} onClose={() => setCalcOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 'bold' }}>
          <FaCalculator /> Vehicle Finance EMI Calculator
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
            <TextField
              label="Loan Amount Required (₹)"
              type="number"
              fullWidth
              value={calcAmount}
              onChange={(e) => setCalcAmount(e.target.value)}
            />
            <TextField
              label="Flat Interest Rate (% per month)"
              type="number"
              fullWidth
              value={calcRate}
              onChange={(e) => setCalcRate(e.target.value)}
              helperText="E.g. 1.2% - 1.5% for two-wheelers/cars"
            />
            <TextField
              label="Tenure (Months)"
              type="number"
              fullWidth
              value={calcTenure}
              onChange={(e) => setCalcTenure(e.target.value)}
              helperText="Common tenures: 12, 18, 24, 36 months"
            />

            <Card sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="textSecondary" display="block">
                ESTIMATED MONTHLY INSTALLMENT
              </Typography>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                ₹{quote.emi.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>/ month</span>
              </Typography>

              <Box display="flex" justifyContent="space-between" mt={1.5} pt={1} borderTop="1px dashed #bbb">
                <Typography variant="body2">Total Interest:</Typography>
                <Typography variant="body2" fontWeight="bold">₹{quote.totalInterest.toLocaleString()}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mt={0.5}>
                <Typography variant="body2">Total Repayable:</Typography>
                <Typography variant="body2" fontWeight="bold">₹{quote.totalPayable.toLocaleString()}</Typography>
              </Box>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            variant="contained" 
            fullWidth 
            onClick={() => {
              setCalcOpen(false);
              showLoanForm();
            }}
          >
            Apply for this Loan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoanManagement;
