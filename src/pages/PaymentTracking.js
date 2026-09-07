import React, { useState, useEffect, useMemo } from "react";
import { 
  Container, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  CircularProgress, 
  Alert, 
  Grid, 
  Box,
  Card,
  TextField,
  MenuItem,
  Button,
  Chip,
  TablePagination
} from "@mui/material";
import PaymentTrackingService from "../services/PaymentTrackingService";
import { Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement 
} from 'chart.js';
import { FaFileCsv, FaArrowUp, FaArrowDown, FaExchangeAlt } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
);

const PaymentTracking = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    PaymentTrackingService.getPayments()
      .then((data) => {
        setTransactions(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching transactions:", err);
        setError("Failed to load payment transactions.");
        setLoading(false);
      });
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        (t.fileNumber && String(t.fileNumber).toLowerCase().includes(q)) ||
        (t.vehicleNumber && t.vehicleNumber.toLowerCase().includes(q)) ||
        (t.receiptNumber && t.receiptNumber.toLowerCase().includes(q));

      const matchesType = typeFilter === "ALL" || t.transactionType === typeFilter;
      const matchesMode = modeFilter === "ALL" || t.paymentMode === modeFilter;

      return matchesSearch && matchesType && matchesMode;
    });
  }, [transactions, searchTerm, typeFilter, modeFilter]);

  // Financial summary metrics
  const totalCollections = useMemo(() => {
    return transactions
      .filter((t) => t.transactionType === "EMI Paid" || t.transactionType === "Down Payment")
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  }, [transactions]);

  const totalDisbursed = useMemo(() => {
    return transactions
      .filter((t) => t.transactionType === "Loan Given")
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  }, [transactions]);

  // Chart data calculations
  const { labels, emiCollections, loanGiven } = useMemo(() => {
    if (!transactions.length) {
      return { labels: [], emiCollections: [], loanGiven: [] };
    }

    const validDates = transactions
      .map((t) => new Date(t.transactionDate))
      .filter((d) => !isNaN(d.getTime()));

    if (!validDates.length) {
      return { labels: [], emiCollections: [], loanGiven: [] };
    }

    const minDate = new Date(Math.min(...validDates));
    const dayLabels = [];
    const emiArray = Array(15).fill(0);
    const disbArray = Array(15).fill(0);

    for (let i = 0; i < 15; i++) {
      const d = new Date(minDate);
      d.setDate(d.getDate() + i * 2);
      dayLabels.push(d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }));
    }

    transactions.forEach((t) => {
      const tDate = new Date(t.transactionDate);
      if (isNaN(tDate.getTime())) return;
      const diffDays = Math.floor((tDate - minDate) / (1000 * 60 * 60 * 24));
      const bucket = Math.min(14, Math.max(0, Math.floor(diffDays / 2)));

      if (t.transactionType === "EMI Paid") {
        emiArray[bucket] += parseFloat(t.amount) || 0;
      } else if (t.transactionType === "Loan Given") {
        disbArray[bucket] += parseFloat(t.amount) || 0;
      }
    });

    return { labels: dayLabels, emiCollections: emiArray, loanGiven: disbArray };
  }, [transactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
  };

  const lineChartData = {
    labels,
    datasets: [
      {
        label: "EMI Collections (₹)",
        data: emiCollections,
        borderColor: "#2e7d32",
        backgroundColor: "rgba(46, 125, 50, 0.15)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "Disbursements (₹)",
        data: loanGiven,
        borderColor: "#1976d2",
        backgroundColor: "rgba(25, 118, 210, 0.15)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const barChartData = {
    labels,
    datasets: [
      {
        label: "EMI Collections (₹)",
        data: emiCollections,
        backgroundColor: "#2e7d32",
      },
      {
        label: "Loans Disbursed (₹)",
        data: loanGiven,
        backgroundColor: "#d32f2f",
      },
    ],
  };

  const exportToCSV = () => {
    const headers = "Transaction ID,File Number,Customer Name,Vehicle Number,Type,Amount (INR),Date,Mode,Receipt Number\n";
    const rows = filteredTransactions.map((t) =>
      `"${t.transactionId || t.id}","${t.fileNumber || ''}","${t.customerName || ''}","${t.vehicleNumber || ''}","${t.transactionType}","${t.amount}","${t.transactionDate}","${t.paymentMode || ''}","${t.receiptNumber || ''}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Vehicle_Finance_Transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Banner */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          p: { xs: 2.5, sm: 3.5 }, 
          mb: 3, 
          borderRadius: 2, 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <div>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Vehicle Finance Cash Flow & Collections Ledger
          </Typography>
          <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
            Audit trail of vehicle loan disbursements, monthly EMI recoveries, and receipts
          </Typography>
        </div>

        <Button
          variant="contained"
          sx={{ bgcolor: '#ffffff', color: 'primary.main', fontWeight: 'bold', '&:hover': { bgcolor: '#f0f0f0' } }}
          startIcon={<FaFileCsv />}
          onClick={exportToCSV}
        >
          Export CSV Report
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                TOTAL EMI RECOVERIES
              </Typography>
              <FaArrowDown color="#2e7d32" />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="success.main" mt={1}>
              ₹{totalCollections.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Inward cash flow from borrower EMIs
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                TOTAL CAPITAL DISBURSED
              </Typography>
              <FaArrowUp color="#1976d2" />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="primary.main" mt={1}>
              ₹{totalDisbursed.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Outward disbursements to auto dealers/borrowers
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, bgcolor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                TOTAL TRANSACTIONS LOGGED
              </Typography>
              <FaExchangeAlt color="#7e22ce" />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="#7e22ce" mt={1}>
              {transactions.length} Records
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Immutable ledger entries
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Charts */}
      {labels.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2, height: 320, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Cash Flow Trends: Collections vs Disbursements
              </Typography>
              <Box height={260}>
                <Line data={lineChartData} options={chartOptions} />
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2, height: 320, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Comparative Distribution (₹)
              </Typography>
              <Box height={260}>
                <Bar data={barChartData} options={chartOptions} />
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Transactions Table & Filters */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
          Detailed Financial Transactions Ledger
        </Typography>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 2.5, mt: 0.5 }}>
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              size="small"
              fullWidth
              label="Search Customer, Vehicle Reg, File #, or Receipt #"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={3}>
            <TextField
              select
              size="small"
              fullWidth
              label="Transaction Type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="ALL">All Types</MenuItem>
              <MenuItem value="EMI Paid">EMI Paid</MenuItem>
              <MenuItem value="Loan Given">Loan Given</MenuItem>
              <MenuItem value="Down Payment">Down Payment</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={4}>
            <TextField
              select
              size="small"
              fullWidth
              label="Payment Mode"
              value={modeFilter}
              onChange={(e) => {
                setModeFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="ALL">All Payment Modes</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
              <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <TableContainer sx={{ borderRadius: 1.5, border: '1px solid #eee' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell><strong>Transaction #</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>File #</strong></TableCell>
                <TableCell><strong>Customer & Vehicle</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Mode</strong></TableCell>
                <TableCell align="right"><strong>Amount</strong></TableCell>
                <TableCell align="center"><strong>Receipt / Reference</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      No transactions found matching your filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((t) => (
                    <TableRow key={t.id || t.transactionId} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {t.transactionId || t.id}
                      </TableCell>
                      <TableCell>{t.transactionDate}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {t.fileNumber || '-'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">{t.customerName}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {t.vehicleNumber || ''} {t.vehicleType ? `(${t.vehicleType})` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t.transactionType}
                          size="small"
                          color={t.transactionType === 'EMI Paid' ? 'success' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={t.paymentMode || 'Cash'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                        <span style={{ color: t.transactionType === 'EMI Paid' ? '#2e7d32' : '#1976d2' }}>
                          ₹{Number(t.amount).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', px: 1, py: 0.3, borderRadius: 0.5 }}>
                          {t.receiptNumber || 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredTransactions.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Container>
  );
};

export default PaymentTracking;
