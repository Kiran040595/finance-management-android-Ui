import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Tooltip,
  Alert,
  LinearProgress,
  Divider,
  Tab,
  Tabs,
  CircularProgress,
} from '@mui/material';
import { Link } from 'react-router-dom';
import PaymentService from '../../services/paymentService';
import {
  FaCalendarAlt,
  FaMoneyBillWave,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSearch,
  FaFileCsv,
  FaPrint,
  FaWhatsapp,
  FaPhone,
  FaCreditCard,
  FaMotorcycle,
  FaCar,
  FaTruck,
  FaFileInvoiceDollar,
  FaTimes,
  FaList,
  FaThLarge,
  FaBell,
  FaCopy,
} from 'react-icons/fa';

const EmiTracker = ({ embedded = false, maxItems = null }) => {
  const [upcomingList, setUpcomingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframeTab, setTimeframeTab] = useState('all'); // all, 7days, 15days, thisMonth, nextMonth, overdue
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('dueDateAsc'); // dueDateAsc, dueDateDesc, amountDesc, customerAsc, urgency
  const [viewMode, setViewMode] = useState('cards'); // cards, table

  // Pay Dialog state
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedEmi, setSelectedEmi] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [processingPay, setProcessingPay] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState(null);

  // Reminder Dialog state
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderEmi, setReminderEmi] = useState(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Fetch data
  const loadUpcomingEMIs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PaymentService.getUpcomingEMIs();
      setUpcomingList(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading upcoming EMIs:', err);
      setError('Unable to load upcoming EMI schedule. Please try again.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUpcomingEMIs();
  }, [loadUpcomingEMIs]);

  // Filtered and Sorted Upcoming EMIs
  const filteredAndSorted = useMemo(() => {
    let list = [...upcomingList];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.customerName?.toLowerCase().includes(q) ||
          item.customerPhone?.includes(q) ||
          item.vehicleNumber?.toLowerCase().includes(q) ||
          item.fileNumber?.toLowerCase().includes(q) ||
          item.vehicleModel?.toLowerCase().includes(q)
      );
    }

    // Vehicle Type filter
    if (vehicleFilter !== 'ALL') {
      list = list.filter((item) => item.vehicleType === vehicleFilter);
    }

    // Timeframe tab filter
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (timeframeTab === '7days') {
      list = list.filter((item) => item.daysUntilDue >= 0 && item.daysUntilDue <= 7);
    } else if (timeframeTab === '15days') {
      list = list.filter((item) => item.daysUntilDue >= 0 && item.daysUntilDue <= 15);
    } else if (timeframeTab === 'thisMonth') {
      list = list.filter((item) => {
        const d = new Date(item.emiDate);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });
    } else if (timeframeTab === 'nextMonth') {
      const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
      const targetMonth = nextMonthDate.getMonth();
      const targetYear = nextMonthDate.getFullYear();
      list = list.filter((item) => {
        const d = new Date(item.emiDate);
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      });
    } else if (timeframeTab === 'overdue') {
      list = list.filter((item) => item.daysUntilDue < 0);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'dueDateAsc') {
        return new Date(a.emiDate) - new Date(b.emiDate);
      }
      if (sortBy === 'dueDateDesc') {
        return new Date(b.emiDate) - new Date(a.emiDate);
      }
      if (sortBy === 'amountDesc') {
        return (b.remainingAmount || b.emiAmount) - (a.remainingAmount || a.emiAmount);
      }
      if (sortBy === 'customerAsc') {
        return (a.customerName || '').localeCompare(b.customerName || '');
      }
      if (sortBy === 'urgency') {
        // Overdue first, then today, then days until due
        return a.daysUntilDue - b.daysUntilDue;
      }
      return 0;
    });

    if (maxItems && maxItems > 0) {
      return list.slice(0, maxItems);
    }

    return list;
  }, [upcomingList, searchQuery, vehicleFilter, timeframeTab, sortBy, maxItems]);

  // Financial obligations aggregates
  const aggregates = useMemo(() => {
    let totalDue30Days = 0;
    let countDue30Days = 0;
    let totalDue7Days = 0;
    let countDue7Days = 0;
    let totalDueToday = 0;
    let countDueToday = 0;
    let totalOverdue = 0;
    let countOverdue = 0;
    let totalPenalties = 0;

    upcomingList.forEach((item) => {
      const amount = item.remainingAmount || item.emiAmount || 0;
      if (item.daysUntilDue < 0) {
        totalOverdue += amount;
        countOverdue += 1;
        totalPenalties += item.penaltyAmount || 0;
      } else if (item.daysUntilDue === 0) {
        totalDueToday += amount;
        countDueToday += 1;
      } else if (item.daysUntilDue <= 7) {
        totalDue7Days += amount;
        countDue7Days += 1;
      }

      if (item.daysUntilDue >= 0 && item.daysUntilDue <= 30) {
        totalDue30Days += amount;
        countDue30Days += 1;
      }
    });

    return {
      totalDue30Days,
      countDue30Days,
      totalDue7Days,
      countDue7Days,
      totalDueToday,
      countDueToday,
      totalOverdue,
      countOverdue,
      totalPenalties,
      totalInstallments: upcomingList.length,
    };
  }, [upcomingList]);

  // Format INR Currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Helper for due date badge
  const getUrgencyBadge = (item) => {
    const { daysUntilDue, penaltyAmount } = item;
    if (daysUntilDue < 0) {
      const absDays = Math.abs(daysUntilDue);
      return (
        <Chip
          id={`badge-overdue-${item.fileNumber}-${item.emiNumber}`}
          icon={<FaExclamationTriangle size={12} />}
          label={`${absDays}d Overdue${penaltyAmount > 0 ? ` (+₹${penaltyAmount})` : ''}`}
          color="error"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    }
    if (daysUntilDue === 0) {
      return (
        <Chip
          id={`badge-today-${item.fileNumber}-${item.emiNumber}`}
          icon={<FaBell size={12} />}
          label="Due Today"
          color="warning"
          size="small"
          sx={{ fontWeight: 'bold', bgcolor: '#ed6c02', color: '#fff' }}
        />
      );
    }
    if (daysUntilDue <= 3) {
      return (
        <Chip
          id={`badge-soon-${item.fileNumber}-${item.emiNumber}`}
          icon={<FaClock size={12} />}
          label={`Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}
          size="small"
          sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 'bold', border: '1px solid #ffe0b2' }}
        />
      );
    }
    if (daysUntilDue <= 7) {
      return (
        <Chip
          id={`badge-week-${item.fileNumber}-${item.emiNumber}`}
          icon={<FaClock size={12} />}
          label={`Due in ${daysUntilDue} days`}
          size="small"
          sx={{ bgcolor: '#e3f2fd', color: '#0d47a1', fontWeight: 600 }}
        />
      );
    }
    if (daysUntilDue <= 30) {
      return (
        <Chip
          id={`badge-month-${item.fileNumber}-${item.emiNumber}`}
          icon={<FaCalendarAlt size={12} />}
          label={`In ${daysUntilDue} days`}
          size="small"
          variant="outlined"
          color="primary"
        />
      );
    }
    return (
      <Chip
        id={`badge-future-${item.fileNumber}-${item.emiNumber}`}
        label={`In ${daysUntilDue} days`}
        size="small"
        variant="outlined"
        sx={{ color: '#718096', borderColor: '#cbd5e0' }}
      />
    );
  };

  // Vehicle Icon helper
  const getVehicleIcon = (type) => {
    switch (type) {
      case 'Two Wheeler':
        return <FaMotorcycle className="text-blue-500" />;
      case 'Car / Four Wheeler':
        return <FaCar className="text-emerald-500" />;
      case 'Commercial / Three Wheeler':
      case 'Commercial Vehicle':
        return <FaTruck className="text-amber-500" />;
      default:
        return <FaCar className="text-blue-500" />;
    }
  };

  // Open Pay Modal
  const handleOpenPay = (emi) => {
    setSelectedEmi(emi);
    setPayAmount(emi.remainingAmount || emi.emiAmount);
    setPayMode('UPI');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayNotes(`Payment for EMI #${emi.emiNumber} (${emi.fileNumber})`);
    setPayDialogOpen(true);
  };

  // Confirm Payment
  const handleConfirmPayment = async () => {
    if (!selectedEmi) return;
    try {
      setProcessingPay(true);
      await PaymentService.payEMI(
        selectedEmi.fileNumber,
        selectedEmi.emiNumber,
        parseFloat(payAmount),
        payDate,
        payMode,
        payNotes
      );
      setProcessingPay(false);
      setPayDialogOpen(false);
      setPaySuccessMsg(
        `Successfully recorded payment of ${formatCurrency(payAmount)} for ${selectedEmi.customerName} (EMI #${selectedEmi.emiNumber})!`
      );
      // Reload upcoming list
      loadUpcomingEMIs();
      setTimeout(() => setPaySuccessMsg(null), 6000);
    } catch (err) {
      console.error('Payment failed:', err);
      setProcessingPay(false);
      alert('Failed to record payment: ' + (err.message || 'Unknown error'));
    }
  };

  // Open Reminder Dialog
  const handleOpenReminder = (emi) => {
    setReminderEmi(emi);
    setCopiedNotification(false);
    setReminderDialogOpen(true);
  };

  // Generate Reminder Message
  const getReminderMessage = (emi) => {
    if (!emi) return '';
    const formattedDate = new Date(emi.emiDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const amountStr = formatCurrency(emi.remainingAmount || emi.emiAmount);
    if (emi.daysUntilDue < 0) {
      return `Dear ${emi.customerName}, your vehicle loan EMI #${emi.emiNumber} of ${amountStr} for vehicle ${emi.vehicleNumber} (${emi.vehicleMake} ${emi.vehicleModel}) was due on ${formattedDate} and is currently OVERDUE by ${Math.abs(
        emi.daysUntilDue
      )} days. Please clear the payment immediately to avoid additional penalties. - FMS Vehicle Finance`;
    }
    if (emi.daysUntilDue === 0) {
      return `Dear ${emi.customerName}, reminder that your vehicle loan EMI #${emi.emiNumber} of ${amountStr} for ${emi.vehicleMake} ${emi.vehicleModel} (${emi.vehicleNumber}) is DUE TODAY (${formattedDate}). Please make the payment to maintain a good credit record. - FMS Vehicle Finance`;
    }
    return `Dear ${emi.customerName}, this is a gentle reminder that your vehicle loan EMI #${emi.emiNumber} of ${amountStr} for ${emi.vehicleMake} ${emi.vehicleModel} (${emi.vehicleNumber}) is due on ${formattedDate} (in ${emi.daysUntilDue} days). Thank you, FMS Vehicle Finance`;
  };

  // Copy Reminder Message
  const handleCopyReminder = () => {
    if (!reminderEmi) return;
    const msg = getReminderMessage(reminderEmi);
    navigator.clipboard.writeText(msg);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  // WhatsApp Click
  const handleSendWhatsApp = (emi) => {
    if (!emi) return;
    const cleanPhone = (emi.customerPhone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(getReminderMessage(emi));
    window.open(`https://wa.me/${phoneWithCountry}?text=${msg}`, '_blank');
  };

  // Export CSV of upcoming list
  const handleExportCSV = () => {
    if (!filteredAndSorted.length) return;
    const headers = [
      'File Number',
      'Customer Name',
      'Phone Number',
      'Vehicle Number',
      'Vehicle Model',
      'EMI Number',
      'Due Date',
      'Days Until Due',
      'Status',
      'EMI Amount',
      'Principal',
      'Interest',
      'Penalty',
    ];

    const rows = filteredAndSorted.map((item) => [
      `"${item.fileNumber}"`,
      `"${item.customerName}"`,
      `"${item.customerPhone}"`,
      `"${item.vehicleNumber}"`,
      `"${item.vehicleMake} ${item.vehicleModel}"`,
      item.emiNumber,
      item.emiDate,
      item.daysUntilDue,
      item.status,
      item.remainingAmount || item.emiAmount,
      item.principalComponent,
      item.interestComponent,
      item.penaltyAmount || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Upcoming_EMIs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print schedule
  const handlePrint = () => {
    window.print();
  };

  if (loading && !embedded) {
    return (
      <Box id="emi-tracker-loading" display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2, color: 'text.secondary' }}>
          Loading upcoming EMI payment obligations...
        </Typography>
      </Box>
    );
  }

  return (
    <Box id="emi-tracker-container" sx={{ width: '100%' }}>
      {/* Success Banner */}
      {paySuccessMsg && (
        <Alert
          id="emi-pay-success-alert"
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setPaySuccessMsg(null)}
        >
          {paySuccessMsg}
        </Alert>
      )}

      {error && (
        <Alert id="emi-tracker-error-alert" severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Header (if not embedded in a tight widget) */}
      {!embedded && (
        <Box id="emi-tracker-header" sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <div>
              <Typography variant="h4" fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <FaCalendarAlt size={28} className="text-blue-600" />
                EMI Tracker & Upcoming Obligations
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                Real-time tracking of repayment schedules, upcoming due dates, and collection priorities across all active loans
              </Typography>
            </div>

            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                id="btn-export-emi-csv"
                variant="outlined"
                size="small"
                startIcon={<FaFileCsv />}
                onClick={handleExportCSV}
                disabled={filteredAndSorted.length === 0}
              >
                Export CSV
              </Button>
              <Button
                id="btn-print-emi-schedule"
                variant="outlined"
                size="small"
                startIcon={<FaPrint />}
                onClick={handlePrint}
              >
                Print Schedule
              </Button>
              <Button
                id="btn-refresh-emi-tracker"
                variant="contained"
                size="small"
                color="primary"
                onClick={loadUpcomingEMIs}
              >
                Refresh Data
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Financial Obligation KPI Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }} id="emi-kpi-cards-row">
        {/* Next 30 Days Due */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            id="card-due-30-days"
            sx={{
              p: 2,
              bgcolor: '#f0fdf4',
              borderRadius: 2,
              border: '1px solid #bbf7d0',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Next 30 Days Due
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#166534', my: 0.5 }}>
                {formatCurrency(aggregates.totalDue30Days)}
              </Typography>
            </div>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Typography variant="caption" sx={{ color: '#15803d' }}>
                {aggregates.countDue30Days} payments scheduled
              </Typography>
              <FaCalendarAlt color="#15803d" size={18} />
            </Box>
          </Card>
        </Grid>

        {/* Due Next 7 Days */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            id="card-due-7-days"
            sx={{
              p: 2,
              bgcolor: '#fff7ed',
              borderRadius: 2,
              border: '1px solid #fed7aa',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Due Within 7 Days
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#9a3412', my: 0.5 }}>
                {formatCurrency(aggregates.totalDue7Days)}
              </Typography>
            </div>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Typography variant="caption" sx={{ color: '#c2410c' }}>
                {aggregates.countDue7Days} immediate EMIs
              </Typography>
              <FaClock color="#c2410c" size={18} />
            </Box>
          </Card>
        </Grid>

        {/* Due Today */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            id="card-due-today"
            sx={{
              p: 2,
              bgcolor: '#eff6ff',
              borderRadius: 2,
              border: '1px solid #bfdbfe',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Due Today
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e40af', my: 0.5 }}>
                {formatCurrency(aggregates.totalDueToday)}
              </Typography>
            </div>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Typography variant="caption" sx={{ color: '#1d4ed8' }}>
                {aggregates.countDueToday} customers payable today
              </Typography>
              <FaBell color="#1d4ed8" size={18} />
            </Box>
          </Card>
        </Grid>

        {/* Overdue Obligations */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            id="card-overdue-emis"
            sx={{
              p: 2,
              bgcolor: '#fef2f2',
              borderRadius: 2,
              border: '1px solid #fecaca',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Overdue / Missed
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#991b1b', my: 0.5 }}>
                {formatCurrency(aggregates.totalOverdue)}
              </Typography>
            </div>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Typography variant="caption" sx={{ color: '#b91c1c' }}>
                {aggregates.countOverdue} loans (+₹{aggregates.totalPenalties} penalties)
              </Typography>
              <FaExclamationTriangle color="#b91c1c" size={18} />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Control Bar */}
      <Paper
        id="emi-tracker-filters-paper"
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
        }}
      >
        {/* Timeframe Quick Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            id="emi-timeframe-tabs"
            value={timeframeTab}
            onChange={(e, newVal) => setTimeframeTab(newVal)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              },
            }}
          >
            <Tab id="tab-all-upcoming" label={`All Upcoming (${upcomingList.length})`} value="all" />
            <Tab
              id="tab-due-7-days"
              label={
                <Box display="flex" alignItems="center" gap={0.8}>
                  <span>Due in 7 Days</span>
                  {aggregates.countDue7Days > 0 && (
                    <Chip label={aggregates.countDue7Days} size="small" sx={{ height: 18, fontSize: '0.7rem', bgcolor: '#ffedd5', color: '#c2410c' }} />
                  )}
                </Box>
              }
              value="7days"
            />
            <Tab id="tab-due-15-days" label="Due in 15 Days" value="15days" />
            <Tab id="tab-due-this-month" label="Due This Month" value="thisMonth" />
            <Tab id="tab-due-next-month" label="Due Next Month" value="nextMonth" />
            <Tab
              id="tab-overdue"
              label={
                <Box display="flex" alignItems="center" gap={0.8}>
                  <span>Overdue</span>
                  {aggregates.countOverdue > 0 && (
                    <Chip label={aggregates.countOverdue} size="small" color="error" sx={{ height: 18, fontSize: '0.7rem' }} />
                  )}
                </Box>
              }
              value="overdue"
            />
          </Tabs>
        </Box>

        {/* Search, Filters, and View Toggles */}
        <Grid container spacing={1.5} alignItems="center">
          {/* Search Bar */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              id="input-search-emi"
              fullWidth
              size="small"
              placeholder="Search Customer, Phone, Vehicle, File #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaSearch color="#94a3b8" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <FaTimes size={12} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Grid>

          {/* Vehicle Type Filter */}
          <Grid item xs={6} sm={3} md={2.5}>
            <TextField
              id="select-vehicle-filter"
              select
              fullWidth
              size="small"
              label="Vehicle Type"
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Vehicles</MenuItem>
              <MenuItem value="Two Wheeler">Two Wheeler</MenuItem>
              <MenuItem value="Car / Four Wheeler">Car / Four Wheeler</MenuItem>
              <MenuItem value="Commercial / Three Wheeler">Commercial / Three Wheeler</MenuItem>
            </TextField>
          </Grid>

          {/* Sort By Dropdown */}
          <Grid item xs={6} sm={3} md={2.5}>
            <TextField
              id="select-sort-by"
              select
              fullWidth
              size="small"
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="dueDateAsc">Due Date (Earliest First)</MenuItem>
              <MenuItem value="dueDateDesc">Due Date (Latest First)</MenuItem>
              <MenuItem value="amountDesc">Amount (Highest First)</MenuItem>
              <MenuItem value="customerAsc">Customer Name (A-Z)</MenuItem>
              <MenuItem value="urgency">Urgency (Overdue First)</MenuItem>
            </TextField>
          </Grid>

          {/* View Mode Toggle */}
          <Grid item xs={12} sm={12} md={3} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
            <Box display="flex" alignItems="center" gap={1} border="1px solid #e2e8f0" borderRadius={1} p={0.5}>
              <IconButton
                id="btn-view-cards"
                size="small"
                color={viewMode === 'cards' ? 'primary' : 'default'}
                onClick={() => setViewMode('cards')}
                sx={{ bgcolor: viewMode === 'cards' ? '#e0f2fe' : 'transparent' }}
              >
                <FaThLarge size={14} />
              </IconButton>
              <IconButton
                id="btn-view-table"
                size="small"
                color={viewMode === 'table' ? 'primary' : 'default'}
                onClick={() => setViewMode('table')}
                sx={{ bgcolor: viewMode === 'table' ? '#e0f2fe' : 'transparent' }}
              >
                <FaList size={14} />
              </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', ml: 1 }}>
              Showing <strong>{filteredAndSorted.length}</strong> payments
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Main EMI List Display */}
      {filteredAndSorted.length === 0 ? (
        <Paper
          id="emi-tracker-empty-state"
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px dashed #cbd5e1',
            bgcolor: '#f8fafc',
          }}
        >
          <FaCheckCircle size={44} className="text-emerald-500 mx-auto mb-3" />
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            No Upcoming Payments Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 450, mx: 'auto' }}>
            {searchQuery || timeframeTab !== 'all' || vehicleFilter !== 'ALL'
              ? 'No scheduled EMI obligations matched your active filters. Try adjusting your search query or timeframe tab.'
              : 'All active loan obligations are currently up to date or completed.'}
          </Typography>
          {(searchQuery || timeframeTab !== 'all' || vehicleFilter !== 'ALL') && (
            <Button
              id="btn-reset-filters"
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
              onClick={() => {
                setSearchQuery('');
                setTimeframeTab('all');
                setVehicleFilter('ALL');
              }}
            >
              Reset Filters
            </Button>
          )}
        </Paper>
      ) : viewMode === 'cards' ? (
        /* Card View */
        <Grid container spacing={2} id="emi-cards-grid">
          {filteredAndSorted.map((item) => {
            const formattedDate = new Date(item.emiDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const isOverdue = item.daysUntilDue < 0;
            const isToday = item.daysUntilDue === 0;

            return (
              <Grid item xs={12} sm={6} lg={4} key={`${item.fileNumber}-${item.emiNumber}`}>
                <Card
                  id={`card-emi-${item.fileNumber}-${item.emiNumber}`}
                  elevation={0}
                  sx={{
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: isOverdue ? '#fca5a5' : isToday ? '#fed7aa' : '#e2e8f0',
                    bgcolor: isOverdue ? '#fffafa' : isToday ? '#fffdfa' : '#ffffff',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      borderColor: '#93c5fd',
                    },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    {/* Top Row: File #, Vehicle Tag & Urgency Badge */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                      <div>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={item.fileNumber}
                            size="small"
                            sx={{ fontWeight: 'bold', bgcolor: '#f1f5f9', color: '#1e293b' }}
                          />
                          <Chip
                            icon={getVehicleIcon(item.vehicleType)}
                            label={item.vehicleType}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </Box>
                      </div>
                      <div>{getUrgencyBadge(item)}</div>
                    </Box>

                    {/* Customer & Vehicle Info */}
                    <Box mb={2}>
                      <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ lineHeight: 1.3 }}>
                        {item.customerName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <span className="font-semibold text-slate-700">{item.vehicleMake} {item.vehicleModel}</span>
                        <span>•</span>
                        <span className="font-mono text-xs px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                          {item.vehicleNumber}
                        </span>
                      </Typography>
                    </Box>

                    {/* Due Date & Amount Grid */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        mb: 2,
                        borderRadius: 1.5,
                        bgcolor: isOverdue ? '#fef2f2' : isToday ? '#fff7ed' : '#f8fafc',
                        border: '1px solid',
                        borderColor: isOverdue ? '#fee2e2' : isToday ? '#ffedd5' : '#f1f5f9',
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <div>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Due Date
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" color={isOverdue ? 'error.main' : 'text.primary'}>
                            {formattedDate}
                          </Typography>
                        </div>
                        <div className="text-right">
                          <Typography variant="caption" color="text.secondary" display="block">
                            EMI Amount Due
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="primary.main">
                            {formatCurrency(item.remainingAmount || item.emiAmount)}
                          </Typography>
                        </div>
                      </Box>

                      {/* Principal & Interest Breakdown */}
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Installment: <strong>#{item.emiNumber}</strong> of {item.totalTenure}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Principal: ₹{item.principalComponent} | Int: ₹{item.interestComponent}
                        </Typography>
                      </Box>
                    </Paper>

                    {/* Loan Progress Meter */}
                    <Box mb={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Repayment Progress
                        </Typography>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary">
                          {item.paidEmiCount} / {item.totalTenure} paid ({item.remainingEmiCount} left)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.round((item.paidEmiCount / (item.totalTenure || 1)) * 100)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: isOverdue ? '#ef4444' : '#10b981',
                          },
                        }}
                      />
                    </Box>
                  </CardContent>

                  {/* Actions Footer */}
                  <Box
                    sx={{
                      p: 2,
                      pt: 0,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Send WhatsApp / SMS Reminder">
                        <IconButton
                          id={`btn-reminder-${item.fileNumber}-${item.emiNumber}`}
                          size="small"
                          color="success"
                          onClick={() => handleOpenReminder(item)}
                          sx={{ border: '1px solid #bbf7d0', bgcolor: '#f0fdf4' }}
                        >
                          <FaWhatsapp size={14} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={`Call: ${item.customerPhone}`}>
                        <IconButton
                          id={`btn-call-${item.fileNumber}-${item.emiNumber}`}
                          size="small"
                          component="a"
                          href={`tel:${item.customerPhone}`}
                          sx={{ border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}
                        >
                          <FaPhone size={12} className="text-slate-600" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Loan Details">
                        <IconButton
                          id={`btn-view-loan-${item.fileNumber}-${item.emiNumber}`}
                          size="small"
                          component={Link}
                          to={`/loan/${item.loanId}`}
                          sx={{ border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}
                        >
                          <FaFileInvoiceDollar size={13} className="text-blue-600" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Button
                      id={`btn-pay-${item.fileNumber}-${item.emiNumber}`}
                      variant="contained"
                      size="small"
                      color={isOverdue ? 'error' : isToday ? 'warning' : 'primary'}
                      startIcon={<FaCreditCard size={12} />}
                      onClick={() => handleOpenPay(item)}
                      sx={{ textTransform: 'none', fontWeight: 'bold' }}
                    >
                      Record Payment
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        /* Table View */
        <TableContainer
          id="emi-tracker-table-container"
          component={Paper}
          elevation={0}
          sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}
        >
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>File #</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customer & Contact</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vehicle Details</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Installment</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Due Date & Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Amount Due</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSorted.map((item) => {
                const formattedDate = new Date(item.emiDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const isOverdue = item.daysUntilDue < 0;

                return (
                  <TableRow
                    id={`table-row-emi-${item.fileNumber}-${item.emiNumber}`}
                    key={`${item.fileNumber}-${item.emiNumber}`}
                    hover
                    sx={{ bgcolor: isOverdue ? '#fff5f5' : 'inherit' }}
                  >
                    <TableCell>
                      <Link to={`/loan/${item.loanId}`} className="font-bold text-blue-600 hover:underline">
                        {item.fileNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {item.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.customerPhone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.vehicleMake} {item.vehicleModel}
                      </Typography>
                      <Typography variant="caption" className="font-mono text-slate-500">
                        {item.vehicleNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`EMI #${item.emiNumber} of ${item.totalTenure}`}
                        size="small"
                        sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {formattedDate}
                      </Typography>
                      <Box mt={0.5}>{getUrgencyBadge(item)}</Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {formatCurrency(item.remainingAmount || item.emiAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        P: ₹{item.principalComponent} | I: ₹{item.interestComponent}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                        <Tooltip title="Send WhatsApp Reminder">
                          <IconButton
                            id={`table-btn-wa-${item.fileNumber}-${item.emiNumber}`}
                            size="small"
                            color="success"
                            onClick={() => handleOpenReminder(item)}
                          >
                            <FaWhatsapp size={14} />
                          </IconButton>
                        </Tooltip>
                        <Button
                          id={`table-btn-pay-${item.fileNumber}-${item.emiNumber}`}
                          variant="contained"
                          size="small"
                          color={isOverdue ? 'error' : 'primary'}
                          onClick={() => handleOpenPay(item)}
                          sx={{ textTransform: 'none', py: 0.25, px: 1.5, fontSize: '0.75rem' }}
                        >
                          Pay
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Record Payment Dialog */}
      <Dialog
        id="dialog-record-emi-payment"
        open={payDialogOpen}
        onClose={() => !processingPay && setPayDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, color: '#1e40af' }}>
          <FaMoneyBillWave color="#10b981" />
          Record EMI Payment
        </DialogTitle>
        <DialogContent dividers>
          {selectedEmi && (
            <Box sx={{ pt: 1 }}>
              <Paper elevation={0} sx={{ p: 2, mb: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Customer Name</Typography>
                    <Typography variant="body2" fontWeight="bold">{selectedEmi.customerName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">File Number</Typography>
                    <Typography variant="body2" fontWeight="bold">{selectedEmi.fileNumber}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Vehicle Details</Typography>
                    <Typography variant="body2">{selectedEmi.vehicleMake} {selectedEmi.vehicleModel} ({selectedEmi.vehicleNumber})</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Installment Due</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      EMI #{selectedEmi.emiNumber} • {formatCurrency(selectedEmi.remainingAmount || selectedEmi.emiAmount)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    id="input-pay-amount"
                    label="Payment Amount (₹)"
                    type="number"
                    fullWidth
                    size="small"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    id="select-pay-mode"
                    label="Payment Mode"
                    select
                    fullWidth
                    size="small"
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                  >
                    <MenuItem value="UPI">UPI (GPay / PhonePe / Paytm)</MenuItem>
                    <MenuItem value="Cash">Cash Counter</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    id="input-pay-date"
                    label="Payment Date"
                    type="date"
                    fullWidth
                    size="small"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    id="input-pay-notes"
                    label="Transaction ID / Notes"
                    fullWidth
                    size="small"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. UPI-Ref-982103"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button id="btn-cancel-pay" onClick={() => setPayDialogOpen(false)} disabled={processingPay}>
            Cancel
          </Button>
          <Button
            id="btn-confirm-pay"
            variant="contained"
            color="primary"
            onClick={handleConfirmPayment}
            disabled={processingPay || !payAmount || parseFloat(payAmount) <= 0}
            startIcon={processingPay ? <CircularProgress size={16} color="inherit" /> : <FaCheckCircle />}
          >
            {processingPay ? 'Processing...' : 'Confirm & Generate Receipt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reminder Notification Dialog */}
      <Dialog
        id="dialog-send-emi-reminder"
        open={reminderDialogOpen}
        onClose={() => setReminderDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, color: '#15803d' }}>
          <FaWhatsapp color="#10b981" />
          Send EMI Payment Reminder
        </DialogTitle>
        <DialogContent dividers>
          {reminderEmi && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" mb={1.5}>
                Ready-to-send payment reminder for <strong>{reminderEmi.customerName}</strong> ({reminderEmi.customerPhone}):
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {getReminderMessage(reminderEmi)}
              </Paper>

              {copiedNotification && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Reminder text copied to clipboard!
                </Alert>
              )}

              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  id="btn-copy-reminder-text"
                  variant="outlined"
                  size="small"
                  startIcon={<FaCopy />}
                  onClick={handleCopyReminder}
                >
                  Copy Message
                </Button>
                <Button
                  id="btn-send-whatsapp"
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<FaWhatsapp />}
                  onClick={() => handleSendWhatsApp(reminderEmi)}
                >
                  Open WhatsApp Web / App
                </Button>
                <Button
                  id="btn-call-customer"
                  variant="outlined"
                  size="small"
                  startIcon={<FaPhone />}
                  component="a"
                  href={`tel:${reminderEmi.customerPhone}`}
                >
                  Call ({reminderEmi.customerPhone})
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button id="btn-close-reminder" onClick={() => setReminderDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmiTracker;
