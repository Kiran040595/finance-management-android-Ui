import React, { useState, useEffect } from "react";
import { BarChart, PieChart } from "@mui/x-charts";
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  Container, 
  Button, 
  Chip, 
  Divider, 
  Paper, 
  CircularProgress
} from "@mui/material";
import { Link } from "react-router-dom";
import LoanService from "../services/loanService";
import PaymentTrackingService from "../services/PaymentTrackingService";
import SummaryDashboard from "../components/SummaryDashboard";
import { 
  FaCar, 
  FaMotorcycle, 
  FaPlus, 
  FaMoneyBillWave, 
  FaShieldAlt, 
  FaArrowRight,
  FaChartPie,
  FaListAlt
} from "react-icons/fa";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("summary"); // "summary" | "detailed"

  const fetchData = () => {
    Promise.all([
      LoanService.getLoanStats(),
      LoanService.getLoans(),
      PaymentTrackingService.getPayments(),
    ])
      .then(([statsData, loansData, txnsData]) => {
        setStats(statsData);
        setLoans(loansData || []);
        setTransactions(txnsData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading dashboard data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  }

  // Calculate dynamic vehicle type breakdown
  const vehicleTypeCounts = {};
  loans.forEach((l) => {
    const type = l.vehicleType || "Two Wheeler";
    vehicleTypeCounts[type] = (vehicleTypeCounts[type] || 0) + 1;
  });

  const vehiclePieData = Object.keys(vehicleTypeCounts).map((type, idx) => ({
    id: idx,
    value: vehicleTypeCounts[type],
    label: type,
  }));

  // Calculate status breakdown
  const activeCount = loans.filter((l) => l.status === "Active").length;
  const overdueCount = loans.filter((l) => l.status === "Overdue").length;
  const closedCount = loans.filter((l) => l.status === "Closed").length;

  const statusPieData = [
    { id: 0, value: activeCount, label: "Active Loans", color: "#1976d2" },
    { id: 1, value: overdueCount, label: "Overdue / NPA", color: "#d32f2f" },
    { id: 2, value: closedCount, label: "Closed / NOC", color: "#2e7d32" },
  ];

  // Insurance expiry alerts: find vehicles expiring within 30 days or expired
  const today = new Date();
  const insuranceAlerts = loans
    .filter((l) => l.status !== "Closed" && l.vehicleInsuranceExpiryDate)
    .map((l) => {
      const exp = new Date(l.vehicleInsuranceExpiryDate);
      const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      return { ...l, diffDays };
    })
    .filter((l) => l.diffDays <= 45)
    .sort((a, b) => a.diffDays - b.diffDays);

  // Collections bar data
  const monthlyCollections = [
    { month: "Oct", amount: 48000 },
    { month: "Nov", amount: 56000 },
    { month: "Dec", amount: 62000 },
    { month: "Jan", amount: 59000 },
    { month: "Feb", amount: 71000 },
    { month: "Mar", amount: 84000 },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Top Header & Quick Action Bar */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={3} 
        flexWrap="wrap" 
        gap={1.5}
      >
        <div>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Vehicle Finance Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Portfolio performance, collections, vehicle hypothecation, and insurance tracking
          </Typography>
        </div>

        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            component={Link}
            to="/payment"
            variant="outlined"
            color="success"
            startIcon={<FaMoneyBillWave />}
            size="small"
          >
            Collect EMI
          </Button>
          <Button
            component={Link}
            to="/loan-management"
            variant="contained"
            color="primary"
            startIcon={<FaPlus />}
            size="small"
          >
            New Vehicle Loan
          </Button>
        </Box>
      </Box>

      {/* View Switcher Tabs */}
      <Box 
        display="flex" 
        gap={1} 
        mb={3} 
        pb={1.5} 
        borderBottom="1px solid #e2e8f0"
        alignItems="center"
        flexWrap="wrap"
      >
        <Button
          variant={activeView === "summary" ? "contained" : "outlined"}
          color="primary"
          size="small"
          startIcon={<FaChartPie />}
          onClick={() => setActiveView("summary")}
          sx={{ textTransform: "none", fontWeight: "bold", borderRadius: 2 }}
        >
          Summary Dashboard (Active, Targets & Overdues)
        </Button>
        <Button
          variant={activeView === "detailed" ? "contained" : "outlined"}
          color="primary"
          size="small"
          startIcon={<FaListAlt />}
          onClick={() => setActiveView("detailed")}
          sx={{ textTransform: "none", fontWeight: "bold", borderRadius: 2 }}
        >
          Portfolio Breakdown & Analytics
        </Button>
      </Box>

      {activeView === "summary" ? (
        <SummaryDashboard 
          initialLoans={loans} 
          initialTransactions={transactions} 
          onRefresh={fetchData} 
        />
      ) : (
        <>
          {/* Primary KPI Row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ p: 2, bgcolor: "#e3f2fd", borderRadius: 2, border: "1px solid #bbdefb" }}>
            <Typography variant="caption" color="textSecondary" fontWeight="bold">
              TOTAL VEHICLES FINANCED
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="primary.main" mt={0.5}>
              {stats?.totalLoans || loans.length}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Active: {activeCount} | Closed: {closedCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ p: 2, bgcolor: "#f0fdf4", borderRadius: 2, border: "1px solid #bbf7d0" }}>
            <Typography variant="caption" color="textSecondary" fontWeight="bold">
              TOTAL CAPITAL DISBURSED
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main" mt={0.5}>
              ₹{Number(stats?.totalLoanAmountGiven || 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Vehicle loans disbursed
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
            <Typography variant="caption" color="textSecondary" fontWeight="bold">
              AMOUNT RECOVERED
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="info.main" mt={0.5}>
              ₹{Number(stats?.totalAmountReceived || 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Principal + Interest collected
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ p: 2, bgcolor: "#fff1f2", borderRadius: 2, border: "1px solid #fecdd3" }}>
            <Typography variant="caption" color="textSecondary" fontWeight="bold">
              OUTSTANDING BALANCE
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="error.main" mt={0.5}>
              ₹{Number(stats?.totalOutstandingAmount || 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Future EMI receivables
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4} md={2.4}>
          <Card sx={{ p: 2, bgcolor: "#fffbeb", borderRadius: 2, border: "1px solid #fde68a" }}>
            <Typography variant="caption" color="textSecondary" fontWeight="bold">
              OVERDUE / DEFAULTERS
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="warning.main" mt={0.5}>
              {overdueCount} Accounts
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Action required
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Insurance Expiry Alert Ribbon */}
      {insuranceAlerts.length > 0 && (
        <Card sx={{ mb: 3, p: 2, bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <FaShieldAlt color="#c2410c" />
            <Typography variant="subtitle2" fontWeight="bold" color="#9a3412">
              Vehicle Insurance Renewal Action Alerts ({insuranceAlerts.length} vehicles)
            </Typography>
          </Box>
          <Grid container spacing={1.5}>
            {insuranceAlerts.map((v) => (
              <Grid item xs={12} sm={6} md={4} key={v.id}>
                <Paper sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 1.5, border: '1px solid #fed7aa' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight="bold">
                      {v.vehicleNumber} ({v.vehicleMake} {v.vehicleModel})
                    </Typography>
                    <Chip 
                      label={v.diffDays < 0 ? `Expired ${Math.abs(v.diffDays)}d ago` : `Expires in ${v.diffDays}d`}
                      size="small"
                      color={v.diffDays < 0 ? "error" : "warning"}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary" display="block">
                    Borrower: {v.customerName} (📞 {v.customerPhonePrimary})
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      {/* Analytics Charts Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Vehicle Categories Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: "100%", borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Vehicles Financed by Category
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block" mb={2}>
              Distribution across 2-wheelers, cars, and commercial
            </Typography>
            <Box display="flex" justifyContent="center" height={240}>
              <PieChart
                series={[
                  {
                    data: vehiclePieData,
                    innerRadius: 30,
                    outerRadius: 80,
                    paddingAngle: 4,
                    cornerRadius: 4,
                  },
                ]}
                width={280}
                height={220}
              />
            </Box>
          </Card>
        </Grid>

        {/* Portfolio Health (Status) */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: "100%", borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Loan Portfolio Health
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block" mb={2}>
              Active vs Overdue vs Fully Settled loans
            </Typography>
            <Box display="flex" justifyContent="center" height={240}>
              <PieChart
                series={[
                  {
                    data: statusPieData,
                    innerRadius: 40,
                    outerRadius: 85,
                    paddingAngle: 5,
                    cornerRadius: 4,
                  },
                ]}
                width={280}
                height={220}
              />
            </Box>
          </Card>
        </Grid>

        {/* Monthly Collections Trend */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: "100%", borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Monthly EMI Collections (₹)
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block" mb={2}>
              Recent collection performance trend
            </Typography>
            <Box height={240}>
              <BarChart
                dataset={monthlyCollections}
                xAxis={[{ scaleType: "band", dataKey: "month" }]}
                series={[{ dataKey: "amount", label: "Collections (₹)", color: "#2e7d32" }]}
                height={220}
              />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity & Direct Navigation */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 2, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="subtitle1" fontWeight="bold">
                Recent Financed Vehicles
              </Typography>
              <Button component={Link} to="/loan-management" size="small" endIcon={<FaArrowRight />}>
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 1.5 }} />

            <Box display="flex" flexDirection="column" gap={1.5}>
              {loans.slice(0, 4).map((loan) => (
                <Paper 
                  key={loan.id} 
                  variant="outlined" 
                  sx={{ 
                    p: 1.5, 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    borderRadius: 1.5
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ p: 1, bgcolor: "#e3f2fd", borderRadius: 1 }}>
                      {loan.vehicleType?.includes("Two") ? (
                        <FaMotorcycle color="#1976d2" size={18} />
                      ) : (
                        <FaCar color="#2e7d32" size={18} />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {loan.customerName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {loan.vehicleMake} {loan.vehicleModel} • {loan.vehicleNumber}
                      </Typography>
                    </Box>
                  </Box>

                  <Box textAlign="right">
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      ₹{Number(loan.loanAmount).toLocaleString()}
                    </Typography>
                    <Chip 
                      label={loan.status} 
                      size="small" 
                      color={loan.status === "Closed" ? "success" : loan.status === "Overdue" ? "error" : "primary"}
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                  </Box>
                </Paper>
              ))}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ p: 2, borderRadius: 2, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Recent Transactions Ledger
            </Typography>
            <Divider sx={{ mb: 1.5 }} />

            <Box display="flex" flexDirection="column" gap={1.5}>
              {transactions.slice(0, 4).map((txn) => (
                <Box 
                  key={txn.id || txn.transactionId} 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  p={1}
                  sx={{ bgcolor: "#f8fafc", borderRadius: 1 }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="600">
                      {txn.customerName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {txn.transactionType} • {txn.paymentMode} ({txn.vehicleNumber || txn.fileNumber})
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold" 
                    color={txn.transactionType === "EMI Paid" ? "success.main" : "primary.main"}
                  >
                    {txn.transactionType === "EMI Paid" ? "+" : ""}₹{Number(txn.amount).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box mt={2} textAlign="center">
              <Button component={Link} to="/payment-tracking" size="small" variant="text">
                View Full Cash Flow Ledger →
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
      </>
      )}
    </Container>
  );
};

export default Dashboard;
