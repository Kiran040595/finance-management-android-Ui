import React, { useState, useEffect } from 'react';
import LoanPaymentTable from '../components/LoanPaymentTable';
import PaymentService from '../services/paymentService';
import { 
  Card, 
  Typography, 
  Box, 
  LinearProgress, 
  Container, 
  Grid, 
  TextField, 
  Button, 
  ButtonGroup 
} from '@mui/material';
import CountUp from 'react-countup';
import { FaMoneyBillWave, FaClock, FaExclamationTriangle, FaUsers } from 'react-icons/fa';

const PaymentPage = () => {
  const [loanPayments, setLoanPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'fileNumber', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'UPCOMING'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalLoans, setTotalLoans] = useState(0);
  const [pendingEmiCount, setPendingEmiCount] = useState(0);
  const [pendingEmiAmount, setPendingEmiAmount] = useState(0);
  const [pendingCustomerCount, setPendingCustomerCount] = useState(0);

  const fetchPayments = () => {
    setLoading(true);
    PaymentService.getLoanPayments(currentPage, pageSize, searchQuery, sortConfig.key, sortConfig.direction)
      .then((data) => {
        setLoanPayments(data.payments.content);
        setTotalItems(data.payments.totalElements);
        setTotalLoans(data.totalLoans);
        setPendingEmiCount(data.pendingEmiCount);
        setPendingEmiAmount(data.pendingEmiAmount);
        setPendingCustomerCount(data.pendingCustomerCount);
        setLoading(false);
      })
      .catch((err) => {
        setError('Error fetching loan payments');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, pageSize, searchQuery, sortConfig]);

  useEffect(() => {
    let filtered = [...loanPayments];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (payment) =>
          (payment.customerName && payment.customerName.toLowerCase().includes(q)) ||
          (payment.vehicleNumber && payment.vehicleNumber.toLowerCase().includes(q)) ||
          (payment.fileNumber && String(payment.fileNumber).toLowerCase().includes(q))
      );
    }

    if (statusTab === 'OVERDUE') {
      filtered = filtered.filter((p) => p.pendingDays > 0);
    } else if (statusTab === 'UPCOMING') {
      filtered = filtered.filter((p) => p.pendingDays === 0 && p.status === 'Active');
    }

    setFilteredPayments(filtered);
  }, [searchQuery, statusTab, loanPayments]);

  const headers = [
    { label: 'File Number', key: 'fileNumber' },
    { label: 'Customer Name', key: 'customerName' },
    { label: 'Phone Numbers', key: 'phoneNumbers' },
    { label: 'Vehicle Number', key: 'vehicleNumber' },
    { label: 'Pending Days', key: 'pendingDays' },
    { label: 'Pending Amount (₹)', key: 'totalPendingEmiAmount' },
    { label: 'Paid EMI / Tenure', key: 'paidEmiCount' },
    { label: 'Action', key: 'pay' },
  ];

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePageChange = (page, rowsPerPage) => {
    setCurrentPage(page);
    setPageSize(rowsPerPage);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Title */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Vehicle EMI Payment & Collections
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Track upcoming dues, overdue penalties, and collect monthly installments
        </Typography>
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #bbdefb' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                TOTAL BORROWERS
              </Typography>
              <FaUsers color="#1976d2" />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="primary.main" mt={0.5}>
              <CountUp end={totalLoans} duration={1} /> Accounts
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 2, bgcolor: '#fce4ec', borderRadius: 2, border: '1px solid #f8bbd0' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                PENDING EMI COUNT
              </Typography>
              <FaClock color="#c2185b" />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="#c2185b" mt={0.5}>
              <CountUp end={pendingEmiCount} duration={1} /> Installments
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2, border: '1px solid #c8e6c9' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                PENDING RECEIVABLES
              </Typography>
              <FaMoneyBillWave color="#2e7d32" />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="success.main" mt={0.5}>
              ₹<CountUp end={pendingEmiAmount} duration={1} separator="," />
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 2, border: '1px solid #ffcdd2' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                DEFAULTERS / OVERDUE
              </Typography>
              <FaExclamationTriangle color="#d32f2f" />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="error.main" mt={0.5}>
              <CountUp end={pendingCustomerCount} duration={1} /> Borrowers
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={2.5} 
        flexWrap="wrap" 
        gap={1.5}
      >
        <TextField
          size="small"
          placeholder="Search by customer name, vehicle number, or file number..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          sx={{ width: { xs: '100%', sm: 380 } }}
        />

        <ButtonGroup variant="outlined" size="small">
          <Button
            variant={statusTab === 'ALL' ? 'contained' : 'outlined'}
            onClick={() => setStatusTab('ALL')}
          >
            All Loans
          </Button>
          <Button
            variant={statusTab === 'OVERDUE' ? 'contained' : 'outlined'}
            color="error"
            onClick={() => setStatusTab('OVERDUE')}
          >
            Overdue Only
          </Button>
          <Button
            variant={statusTab === 'UPCOMING' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setStatusTab('UPCOMING')}
          >
            Up to Date
          </Button>
        </ButtonGroup>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ width: '100%', py: 4 }}>
          <LinearProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <LoanPaymentTable
          headers={headers}
          data={filteredPayments}
          onSort={handleSort}
          sortConfig={sortConfig}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
        />
      )}
    </Container>
  );
};

export default PaymentPage;
