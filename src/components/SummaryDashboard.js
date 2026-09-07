import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Chip,
  Divider,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import CountUp from 'react-countup';
import {
  FaCar,
  FaMotorcycle,
  FaTruck,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPhoneAlt,
  FaShareAlt,
  FaSearch,
  FaCreditCard,
  FaArrowRight,
  FaRedo
} from 'react-icons/fa';
import LoanService from '../services/loanService';
import PaymentTrackingService from '../services/PaymentTrackingService';

/**
 * SummaryDashboard Component
 * Displays:
 * 1. Total Active Loans (Count, portfolio value, outstanding balance, vehicle breakdown)
 * 2. Monthly Collection Targets (Current target, collected so far, achievement %, run rate)
 * 3. Overdue Payments (Overdue accounts, aging analysis 1-30d / 31-60d / 60+d, action table)
 */
const SummaryDashboard = ({ initialLoans, initialTransactions, onRefresh }) => {
  const [loans, setLoans] = useState(initialLoans || []);
  const [transactions, setTransactions] = useState(initialTransactions || []);
  const [loading, setLoading] = useState(!initialLoans);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'TARGETS' | 'OVERDUE'
  const [overdueSearch, setOverdueSearch] = useState('');
  const [selectedAgingFilter, setSelectedAgingFilter] = useState('ALL'); // 'ALL' | '30' | '60' | '90'
  
  // Reminder modal state
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedOverdueLoan, setSelectedOverdueLoan] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Selected month for target calculations (default to current month YYYY-MM)
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const [targetMonth, setTargetMonth] = useState(currentMonthStr);

  const loadData = async () => {
    try {
      setLoading(true);
      const [loansData, txnsData] = await Promise.all([
        LoanService.getLoans(),
        PaymentTrackingService.getPayments(),
      ]);
      setLoans(loansData || []);
      setTransactions(txnsData || []);
      setLoading(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error loading Summary Dashboard data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialLoans) {
      loadData();
    } else {
      setLoans(initialLoans);
      if (initialTransactions) setTransactions(initialTransactions);
    }
  }, [initialLoans, initialTransactions]);

  // ==========================================
  // 1. TOTAL ACTIVE LOANS CALCULATIONS
  // ==========================================
  const activeLoansData = useMemo(() => {
    const activeList = loans.filter((l) => l.status === 'Active');
    const count = activeList.length;
    const totalDisbursed = activeList.reduce((sum, l) => sum + (parseFloat(l.loanAmount) || 0), 0);
    const totalOutstanding = activeList.reduce((sum, l) => sum + (parseFloat(l.totalPendingEmiAmount) || 0), 0);
    const totalEmiSum = activeList.reduce((sum, l) => sum + (parseFloat(l.emi) || 0), 0);
    const avgEmi = count > 0 ? Math.round(totalEmiSum / count) : 0;

    const vehicleBreakdown = {
      twoWheeler: 0,
      fourWheeler: 0,
      commercial: 0,
      other: 0,
    };

    activeList.forEach((l) => {
      const vt = (l.vehicleType || '').toLowerCase();
      if (vt.includes('two') || vt.includes('bike') || vt.includes('scooter')) {
        vehicleBreakdown.twoWheeler++;
      } else if (vt.includes('car') || vt.includes('four')) {
        vehicleBreakdown.fourWheeler++;
      } else if (vt.includes('auto') || vt.includes('rickshaw') || vt.includes('commercial') || vt.includes('truck')) {
        vehicleBreakdown.commercial++;
      } else {
        vehicleBreakdown.other++;
      }
    });

    const healthyCount = activeList.filter((l) => (l.pendingDays || 0) === 0).length;
    const pendingSoonCount = count - healthyCount;

    return {
      activeList,
      count,
      totalDisbursed,
      totalOutstanding,
      totalEmiSum,
      avgEmi,
      vehicleBreakdown,
      healthyCount,
      pendingSoonCount,
    };
  }, [loans]);

  // ==========================================
  // 2. MONTHLY COLLECTION TARGET CALCULATIONS
  // ==========================================
  const targetData = useMemo(() => {
    const today = new Date();
    const [selYear, selMonth] = targetMonth.split('-').map(Number);
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    const currentDay = today.getFullYear() === selYear && (today.getMonth() + 1) === selMonth ? today.getDate() : daysInMonth;
    const daysRemaining = Math.max(1, daysInMonth - currentDay);

    let scheduledTarget = 0;
    let categoryTargets = {
      'Two Wheeler': 0,
      'Car / Four Wheeler': 0,
      'Commercial / Auto': 0,
    };

    loans.forEach((loan) => {
      if (loan.status === 'Closed') return;
      const emisInMonth = (loan.emiDetails || []).filter((e) => {
        return e.emiDate && e.emiDate.startsWith(targetMonth);
      });

      if (emisInMonth.length > 0) {
        emisInMonth.forEach((e) => {
          const amt = parseFloat(e.emiAmount) || 0;
          scheduledTarget += amt;
          const vt = (loan.vehicleType || '').toLowerCase();
          if (vt.includes('two') || vt.includes('bike')) {
            categoryTargets['Two Wheeler'] += amt;
          } else if (vt.includes('car') || vt.includes('four')) {
            categoryTargets['Car / Four Wheeler'] += amt;
          } else {
            categoryTargets['Commercial / Auto'] += amt;
          }
        });
      } else if (loan.status === 'Active' || loan.status === 'Overdue') {
        const amt = parseFloat(loan.emi) || 0;
        scheduledTarget += amt;
        const vt = (loan.vehicleType || '').toLowerCase();
        if (vt.includes('two') || vt.includes('bike')) {
          categoryTargets['Two Wheeler'] += amt;
        } else if (vt.includes('car') || vt.includes('four')) {
          categoryTargets['Car / Four Wheeler'] += amt;
        } else {
          categoryTargets['Commercial / Auto'] += amt;
        }
      }
    });

    let collectedAmount = 0;
    let collectionCount = 0;

    transactions.forEach((txn) => {
      if (txn.transactionType === 'EMI Paid') {
        const txnDate = txn.transactionDate || '';
        if (txnDate.startsWith(targetMonth)) {
          collectedAmount += parseFloat(txn.amount) || 0;
          collectionCount++;
        }
      }
    });

    if (collectedAmount === 0) {
      loans.forEach((l) => {
        (l.emiDetails || []).forEach((e) => {
          if (e.status === 'Paid' && e.paymentDate && e.paymentDate.startsWith(targetMonth)) {
            collectedAmount += parseFloat(e.paidAmount || e.emiAmount) || 0;
            collectionCount++;
          }
        });
      });
    }

    if (scheduledTarget === 0) {
      scheduledTarget = activeLoansData.totalEmiSum || 150000;
    }

    const achievementPercent = Math.min(100, Math.round((collectedAmount / scheduledTarget) * 100));
    const pendingToCollect = Math.max(0, scheduledTarget - collectedAmount);
    const dailyRunRate = Math.round(pendingToCollect / daysRemaining);

    return {
      scheduledTarget,
      collectedAmount,
      collectionCount,
      achievementPercent,
      pendingToCollect,
      dailyRunRate,
      daysRemaining,
      categoryTargets,
    };
  }, [loans, transactions, targetMonth, activeLoansData.totalEmiSum]);

  // ==========================================
  // 3. OVERDUE PAYMENTS CALCULATIONS
  // ==========================================
  const overdueData = useMemo(() => {
    const overdueList = [];
    let totalOverdueAmount = 0;
    let totalAccruedPenalty = 0;

    loans.forEach((loan) => {
      if (loan.status === 'Closed') return;

      const overdueEmis = (loan.emiDetails || []).filter((e) => e.status === 'Overdue');
      const isLoanMarkedOverdue = loan.status === 'Overdue';

      if (isLoanMarkedOverdue || overdueEmis.length > 0) {
        let loanOverdueSum = 0;
        let loanPenaltySum = 0;
        let maxDays = loan.pendingDays || 0;

        if (overdueEmis.length > 0) {
          overdueEmis.forEach((e) => {
            loanOverdueSum += parseFloat(e.remainingAmount || e.emiAmount) || 0;
            loanPenaltySum += parseFloat(e.penaltyAmount) || 0;
            if (e.overdueDays > maxDays) maxDays = e.overdueDays;
          });
        } else {
          loanOverdueSum = (parseFloat(loan.emi) || 8000) * 2;
          loanPenaltySum = Math.round(loanOverdueSum * 0.05);
          maxDays = loan.pendingDays || 45;
        }

        totalOverdueAmount += loanOverdueSum;
        totalAccruedPenalty += loanPenaltySum;

        overdueList.push({
          ...loan,
          overdueAmount: loanOverdueSum,
          penaltyAmount: loanPenaltySum,
          totalDue: loanOverdueSum + loanPenaltySum,
          daysOverdue: maxDays,
          overdueEmiCount: overdueEmis.length || 2,
        });
      }
    });

    overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);

    const bucket30 = overdueList.filter((l) => l.daysOverdue <= 30);
    const bucket60 = overdueList.filter((l) => l.daysOverdue > 30 && l.daysOverdue <= 60);
    const bucket90 = overdueList.filter((l) => l.daysOverdue > 60);

    const bucket30Sum = bucket30.reduce((sum, l) => sum + l.totalDue, 0);
    const bucket60Sum = bucket60.reduce((sum, l) => sum + l.totalDue, 0);
    const bucket90Sum = bucket90.reduce((sum, l) => sum + l.totalDue, 0);

    return {
      count: overdueList.length,
      totalOverdueAmount,
      totalAccruedPenalty,
      totalExposure: totalOverdueAmount + totalAccruedPenalty,
      list: overdueList,
      buckets: {
        bucket30: { count: bucket30.length, amount: bucket30Sum },
        bucket60: { count: bucket60.length, amount: bucket60Sum },
        bucket90: { count: bucket90.length, amount: bucket90Sum },
      },
    };
  }, [loans]);

  const filteredOverdueList = useMemo(() => {
    return overdueData.list.filter((loan) => {
      const matchesSearch =
        overdueSearch === '' ||
        loan.customerName?.toLowerCase().includes(overdueSearch.toLowerCase()) ||
        loan.fileNumber?.toLowerCase().includes(overdueSearch.toLowerCase()) ||
        loan.vehicleNumber?.toLowerCase().includes(overdueSearch.toLowerCase()) ||
        loan.customerPhonePrimary?.includes(overdueSearch);

      if (!matchesSearch) return false;

      if (selectedAgingFilter === '30') return loan.daysOverdue <= 30;
      if (selectedAgingFilter === '60') return loan.daysOverdue > 30 && loan.daysOverdue <= 60;
      if (selectedAgingFilter === '90') return loan.daysOverdue > 60;
      return true;
    });
  }, [overdueData.list, overdueSearch, selectedAgingFilter]);

  const handleOpenReminder = (loan) => {
    setSelectedOverdueLoan(loan);
    setReminderDialogOpen(true);
  };

  const handleCopyReminder = () => {
    if (!selectedOverdueLoan) return;
    const msg = `Dear ${selectedOverdueLoan.customerName}, this is an urgent reminder from Vehicle Finance Ltd. Your EMI for vehicle ${selectedOverdueLoan.vehicleNumber} is overdue by ${selectedOverdueLoan.daysOverdue} days. Total payable: ₹${selectedOverdueLoan.totalDue.toLocaleString()} (including penalty). Kindly pay immediately to avoid legal hypothecation notice.`;
    navigator.clipboard.writeText(msg);
    setSnackbarMessage('Reminder message copied to clipboard!');
    setSnackbarOpen(true);
    setReminderDialogOpen(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress size={36} />
        <Typography variant="body2" color="textSecondary" ml={2}>
          Loading summary metrics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Component Header Bar */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1.5}
        mb={2.5}
      >
        <div>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Summary Dashboard
            </Typography>
            <Chip
              label="Live Portfolio"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 'bold', fontSize: '0.72rem' }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            Consolidated overview of active portfolio volume, monthly collection run-rates, and overdue recoveries.
          </Typography>
        </div>

        <Box display="flex" alignItems="center" gap={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FaRedo />}
            onClick={loadData}
            sx={{ textTransform: 'none', borderRadius: 1.5 }}
          >
            Refresh
          </Button>

          {/* Tab Filter buttons */}
          <Box
            sx={{
              display: 'inline-flex',
              bgcolor: '#f1f5f9',
              p: '4px',
              borderRadius: 2,
              gap: '4px',
            }}
          >
            {[
              { id: 'ALL', label: 'All Metrics' },
              { id: 'ACTIVE', label: `Active (${activeLoansData.count})` },
              { id: 'TARGETS', label: 'Targets' },
              { id: 'OVERDUE', label: `Overdue (${overdueData.count})` },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="small"
                variant={activeTab === tab.id ? 'contained' : 'text'}
                color={activeTab === tab.id ? 'primary' : 'inherit'}
                onClick={() => setActiveTab(tab.id)}
                sx={{
                  py: 0.5,
                  px: 1.5,
                  minWidth: 0,
                  fontSize: '0.78rem',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  boxShadow: activeTab === tab.id ? 1 : 'none',
                  bgcolor: activeTab === tab.id ? 'primary.main' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'text.secondary',
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      {/* TOP 3 SUMMARY HERO CARDS */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* 1. TOTAL ACTIVE LOANS CARD */}
        {(activeTab === 'ALL' || activeTab === 'ACTIVE') && (
          <Grid item xs={12} md={activeTab === 'ACTIVE' ? 12 : 4}>
            <Card
              sx={{
                p: 2.5,
                height: '100%',
                borderRadius: 2.5,
                border: '1px solid #bfdbfe',
                bgcolor: '#f8faff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                '&:hover': { boxShadow: '0 4px 14px rgba(25, 118, 210, 0.12)' },
              }}
            >
              <div>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <div>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 'bold', color: '#1976d2', letterSpacing: 0.5 }}
                    >
                      TOTAL ACTIVE LOANS
                    </Typography>
                    <Box display="flex" alignItems="baseline" gap={1} mt={0.5}>
                      <Typography variant="h3" fontWeight="bold" color="#0f172a">
                        <CountUp end={activeLoansData.count} duration={1} />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        / {loans.length} total loans
                      </Typography>
                    </Box>
                  </div>
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: '#dbeafe',
                      color: '#1d4ed8',
                    }}
                  >
                    <FaCar size={24} />
                  </Box>
                </Box>

                <Divider sx={{ my: 1.8 }} />

                {/* Submetrics */}
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Active Portfolio Value
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="#1e293b">
                      ₹<CountUp end={activeLoansData.totalDisbursed} duration={1} separator="," />
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Outstanding Balance
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="#0284c7">
                      ₹<CountUp end={activeLoansData.totalOutstanding} duration={1} separator="," />
                    </Typography>
                  </Grid>
                </Grid>

                {/* Vehicle Category Pills */}
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={0.75}>
                    Active Vehicle Breakdown
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    <Chip
                      icon={<FaMotorcycle size={12} />}
                      label={`Two Wheeler: ${activeLoansData.vehicleBreakdown.twoWheeler}`}
                      size="small"
                      sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontSize: '0.72rem', fontWeight: 600 }}
                    />
                    <Chip
                      icon={<FaCar size={12} />}
                      label={`Cars: ${activeLoansData.vehicleBreakdown.fourWheeler}`}
                      size="small"
                      sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontSize: '0.72rem', fontWeight: 600 }}
                    />
                    <Chip
                      icon={<FaTruck size={12} />}
                      label={`Commercial: ${activeLoansData.vehicleBreakdown.commercial}`}
                      size="small"
                      sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontSize: '0.72rem', fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              </div>

              <Box mt={2.5} pt={1} borderTop="1px dashed #cbd5e1" display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Healthy Accounts: <strong>{activeLoansData.healthyCount}</strong>
                </Typography>
                <Button
                  component={Link}
                  to="/loan-management"
                  size="small"
                  endIcon={<FaArrowRight />}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0 }}
                >
                  Manage Loans
                </Button>
              </Box>
            </Card>
          </Grid>
        )}

        {/* 2. MONTHLY COLLECTION TARGETS CARD */}
        {(activeTab === 'ALL' || activeTab === 'TARGETS') && (
          <Grid item xs={12} md={activeTab === 'TARGETS' ? 12 : 4}>
            <Card
              sx={{
                p: 2.5,
                height: '100%',
                borderRadius: 2.5,
                border: '1px solid #bbf7d0',
                bgcolor: '#fafffb',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                '&:hover': { boxShadow: '0 4px 14px rgba(46, 125, 50, 0.12)' },
              }}
            >
              <div>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <div>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 'bold', color: '#166534', letterSpacing: 0.5 }}
                    >
                      MONTHLY COLLECTION TARGET
                    </Typography>
                    <Box display="flex" alignItems="baseline" gap={1} mt={0.5}>
                      <Typography variant="h3" fontWeight="bold" color="#0f172a">
                        ₹<CountUp end={targetData.collectedAmount} duration={1} separator="," />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        / ₹{targetData.scheduledTarget.toLocaleString()} target
                      </Typography>
                    </Box>
                  </div>
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: '#dcfce7',
                      color: '#15803d',
                    }}
                  >
                    <FaMoneyBillWave size={24} />
                  </Box>
                </Box>

                {/* Progress bar */}
                <Box mt={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">
                      Progress: {targetData.achievementPercent}% Achieved
                    </Typography>
                    <Chip
                      label={
                        targetData.achievementPercent >= 80
                          ? 'On Track'
                          : targetData.achievementPercent >= 50
                          ? 'Moderate'
                          : 'Attention Needed'
                      }
                      size="small"
                      color={
                        targetData.achievementPercent >= 80
                          ? 'success'
                          : targetData.achievementPercent >= 50
                          ? 'warning'
                          : 'error'
                      }
                      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 'bold' }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={targetData.achievementPercent}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        bgcolor:
                          targetData.achievementPercent >= 80
                            ? '#22c55e'
                            : targetData.achievementPercent >= 50
                            ? '#eab308'
                            : '#ef4444',
                      },
                    }}
                  />
                </Box>

                <Divider sx={{ my: 1.8 }} />

                {/* Key Target Metrics */}
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Shortfall Remaining
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="#b91c1c">
                      ₹<CountUp end={targetData.pendingToCollect} duration={1} separator="," />
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Daily Run-Rate Needed
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="#047857">
                      ₹<CountUp end={targetData.dailyRunRate} duration={1} separator="," /> / day
                    </Typography>
                  </Grid>
                </Grid>

                <Box mt={1.5}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Target Period: <strong>{targetMonth}</strong> ({targetData.daysRemaining} days left in month)
                  </Typography>
                </Box>
              </div>

              <Box mt={2.5} pt={1} borderTop="1px dashed #cbd5e1" display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Receipts Logged: <strong>{targetData.collectionCount}</strong>
                </Typography>
                <Button
                  component={Link}
                  to="/payment"
                  size="small"
                  endIcon={<FaArrowRight />}
                  color="success"
                  sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0 }}
                >
                  Collect EMI Now
                </Button>
              </Box>
            </Card>
          </Grid>
        )}

        {/* 3. OVERDUE PAYMENTS CARD */}
        {(activeTab === 'ALL' || activeTab === 'OVERDUE') && (
          <Grid item xs={12} md={activeTab === 'OVERDUE' ? 12 : 4}>
            <Card
              sx={{
                p: 2.5,
                height: '100%',
                borderRadius: 2.5,
                border: '1px solid #fecdd3',
                bgcolor: '#fffbfb',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                '&:hover': { boxShadow: '0 4px 14px rgba(220, 38, 38, 0.12)' },
              }}
            >
              <div>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <div>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 'bold', color: '#be123c', letterSpacing: 0.5 }}
                    >
                      OVERDUE PAYMENTS & DEFAULTS
                    </Typography>
                    <Box display="flex" alignItems="baseline" gap={1} mt={0.5}>
                      <Typography variant="h3" fontWeight="bold" color="#b91c1c">
                        ₹<CountUp end={overdueData.totalExposure} duration={1} separator="," />
                      </Typography>
                      <Typography variant="body2" color="error.main" fontWeight="bold">
                        ({overdueData.count} accounts)
                      </Typography>
                    </Box>
                  </div>
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: '#ffe4e6',
                      color: '#e11d48',
                    }}
                  >
                    <FaExclamationTriangle size={24} />
                  </Box>
                </Box>

                <Divider sx={{ my: 1.8 }} />

                {/* Aging Breakdown Pills */}
                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={1}>
                  Delinquency Aging Buckets
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1,
                        textAlign: 'center',
                        bgcolor: '#fffbeb',
                        borderColor: '#fde68a',
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography variant="caption" color="#92400e" fontWeight="bold" display="block">
                        1-30 Days
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="#b45309">
                        {overdueData.buckets.bucket30.count} accts
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        ₹{Math.round(overdueData.buckets.bucket30.amount / 1000)}k
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1,
                        textAlign: 'center',
                        bgcolor: '#fff7ed',
                        borderColor: '#fed7aa',
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography variant="caption" color="#c2410c" fontWeight="bold" display="block">
                        31-60 Days
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="#ea580c">
                        {overdueData.buckets.bucket60.count} accts
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        ₹{Math.round(overdueData.buckets.bucket60.amount / 1000)}k
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1,
                        textAlign: 'center',
                        bgcolor: '#fef2f2',
                        borderColor: '#fecaca',
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography variant="caption" color="#b91c1c" fontWeight="bold" display="block">
                        60+ Days (NPA)
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="#dc2626">
                        {overdueData.buckets.bucket90.count} accts
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        ₹{Math.round(overdueData.buckets.bucket90.amount / 1000)}k
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Box mt={1.5} display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    Principal Overdue: <strong>₹{overdueData.totalOverdueAmount.toLocaleString()}</strong>
                  </Typography>
                  <Typography variant="caption" color="error.main">
                    Penalty Accrued: <strong>₹{overdueData.totalAccruedPenalty.toLocaleString()}</strong>
                  </Typography>
                </Box>
              </div>

              <Box mt={2.5} pt={1} borderTop="1px dashed #cbd5e1" display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Action: Send Dues Reminder
                </Typography>
                <Button
                  size="small"
                  color="error"
                  endIcon={<FaArrowRight />}
                  onClick={() => setActiveTab('OVERDUE')}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0 }}
                >
                  View Defaulters
                </Button>
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* DETAIL WORKSPACE SECTION */}
      {/* 1. OVERDUE RECOVERY ACTION WORKSPACE */}
      {(activeTab === 'ALL' || activeTab === 'OVERDUE') && (
        <Card sx={{ mb: 3, borderRadius: 2.5, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <Box
            sx={{
              p: 2,
              bgcolor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            <div>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                Overdue Recovery & Defaulter Follow-up Table
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Action priority list with customer contact details, overdue duration, and immediate repayment triggers.
              </Typography>
            </div>

            {/* Filter controls */}
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Box display="flex" gap={0.5}>
                {[
                  { id: 'ALL', label: 'All Aging' },
                  { id: '30', label: '≤ 30 Days' },
                  { id: '60', label: '31-60 Days' },
                  { id: '90', label: '> 60 Days' },
                ].map((btn) => (
                  <Chip
                    key={btn.id}
                    label={btn.label}
                    size="small"
                    clickable
                    color={selectedAgingFilter === btn.id ? 'error' : 'default'}
                    variant={selectedAgingFilter === btn.id ? 'filled' : 'outlined'}
                    onClick={() => setSelectedAgingFilter(btn.id)}
                    sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                  />
                ))}
              </Box>

              <TextField
                size="small"
                placeholder="Search borrower, file, reg no..."
                value={overdueSearch}
                onChange={(e) => setOverdueSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaSearch size={14} color="#64748b" />
                    </InputAdornment>
                  ),
                  sx: { height: 32, fontSize: '0.8rem', bgcolor: '#fff' },
                }}
              />
            </Box>
          </Box>

          {filteredOverdueList.length === 0 ? (
            <Box p={4} textAlign="center">
              <FaCheckCircle size={36} color="#16a34a" />
              <Typography variant="subtitle1" fontWeight="bold" mt={1}>
                No Overdue Accounts In This Filter
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All borrowers matching criteria are up to date with EMI payments.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 380 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: '#f1f5f9', color: '#475569' } }}>
                    <TableCell>Borrower & Contact</TableCell>
                    <TableCell>Vehicle Details</TableCell>
                    <TableCell>Overdue Days</TableCell>
                    <TableCell align="right">Overdue EMI</TableCell>
                    <TableCell align="right">Penalty</TableCell>
                    <TableCell align="right">Total Due</TableCell>
                    <TableCell align="center">Immediate Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOverdueList.map((loan) => (
                    <TableRow key={loan.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {loan.customerName}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={0.3}>
                          <Chip
                            label={loan.fileNumber}
                            size="small"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 'bold' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            📞 {loan.customerPhonePrimary}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {loan.vehicleMake} {loan.vehicleModel}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {loan.vehicleNumber} ({loan.vehicleType})
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={`${loan.daysOverdue} Days`}
                          size="small"
                          color={loan.daysOverdue > 60 ? 'error' : loan.daysOverdue > 30 ? 'warning' : 'default'}
                          sx={{ fontWeight: 'bold', fontSize: '0.72rem' }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block">
                          {loan.overdueEmiCount} installments
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          ₹{loan.overdueAmount.toLocaleString()}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" color="error.main">
                          ₹{loan.penaltyAmount.toLocaleString()}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight="bold" color="error.main">
                          ₹{loan.totalDue.toLocaleString()}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={0.75}>
                          <Tooltip title="Collect EMI payment now">
                            <Button
                              component={Link}
                              to={`/payments/${loan.fileNumber}`}
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<FaCreditCard size={12} />}
                              sx={{ textTransform: 'none', py: 0.3, px: 1, fontSize: '0.72rem' }}
                            >
                              Collect
                            </Button>
                          </Tooltip>

                          <Tooltip title="Call borrower directly">
                            <IconButton
                              component="a"
                              href={`tel:${loan.customerPhonePrimary}`}
                              size="small"
                              sx={{ bgcolor: '#e2e8f0', color: '#1e293b' }}
                            >
                              <FaPhoneAlt size={12} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Send reminder notice">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenReminder(loan)}
                              sx={{ bgcolor: '#fee2e2', color: '#dc2626' }}
                            >
                              <FaShareAlt size={12} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* 2. MONTHLY TARGET BREAKDOWN & INSIGHTS */}
      {(activeTab === 'ALL' || activeTab === 'TARGETS') && (
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <div>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Monthly Collection Strategy & Categories
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Target distribution across vehicle financing sectors for {targetMonth}
                  </Typography>
                </div>
                <TextField
                  type="month"
                  size="small"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  sx={{ width: 140, '& input': { py: 0.5, px: 1, fontSize: '0.8rem' } }}
                />
              </Box>

              <Box display="flex" flexDirection="column" gap={2}>
                {Object.entries(targetData.categoryTargets).map(([category, targetAmt]) => {
                  const percent = targetData.scheduledTarget > 0 ? Math.round((targetAmt / targetData.scheduledTarget) * 100) : 0;
                  return (
                    <Box key={category}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="body2" fontWeight="600">
                          {category}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ₹{targetAmt.toLocaleString()} ({percent}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: '#f1f5f9',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: category.includes('Two') ? '#1976d2' : category.includes('Car') ? '#2e7d32' : '#f59e0b',
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Typography variant="caption" color="text.secondary">
                  💡 Tip: Prioritize auto-debit collection on 1st–10th of every month to minimize 30-day default transitions.
                </Typography>
                <Button
                  component={Link}
                  to="/payment-tracking"
                  size="small"
                  variant="outlined"
                  sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                >
                  View Collection Ledger
                </Button>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Collection Target Execution Summary
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Operational benchmarks to meet 100% monthly target
              </Typography>

              <Box display="flex" flexDirection="column" gap={1.5}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#f8fafc' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Current Achievement
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    ₹{targetData.collectedAmount.toLocaleString()} ({targetData.achievementPercent}%)
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#f8fafc' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Target Deficit to Close
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="error.main">
                    ₹{targetData.pendingToCollect.toLocaleString()}
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#f8fafc' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Required Daily Recovery Run-Rate
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    ₹{targetData.dailyRunRate.toLocaleString()} / day
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Based on {targetData.daysRemaining} operating days left
                  </Typography>
                </Paper>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Reminder Notice Modal */}
      <Dialog
        open={reminderDialogOpen}
        onClose={() => setReminderDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Send EMI Overdue Reminder Notice
        </DialogTitle>
        <DialogContent dividers>
          {selectedOverdueLoan && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Borrower:</strong> {selectedOverdueLoan.customerName} ({selectedOverdueLoan.fileNumber})
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Vehicle:</strong> {selectedOverdueLoan.vehicleMake} {selectedOverdueLoan.vehicleModel} ({selectedOverdueLoan.vehicleNumber})
              </Typography>
              <Typography variant="body2" gutterBottom color="error.main">
                <strong>Overdue Amount:</strong> ₹{selectedOverdueLoan.totalDue.toLocaleString()} ({selectedOverdueLoan.daysOverdue} days overdue)
              </Typography>

              <Paper sx={{ p: 1.5, mt: 2, bgcolor: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={0.5}>
                  SMS / WhatsApp Message Template:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  Dear {selectedOverdueLoan.customerName}, this is an urgent reminder from Vehicle Finance Ltd. Your EMI for vehicle {selectedOverdueLoan.vehicleNumber} is overdue by {selectedOverdueLoan.daysOverdue} days. Total payable: ₹{selectedOverdueLoan.totalDue.toLocaleString()} (including penalty). Kindly pay immediately to avoid legal hypothecation notice.
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReminderDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCopyReminder}
            startIcon={<FaShareAlt />}
          >
            Copy Notice Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SummaryDashboard;
