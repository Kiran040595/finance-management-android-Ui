import React, { useEffect, useState } from "react";
import LoanService from "../services/loanService";
import { Card, Typography, Box, CircularProgress, Grid } from "@mui/material";
import CountUp from "react-countup";
import { FaCar, FaMoneyBillWave, FaClock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const LoanManagementDashboard = ({ refreshTrigger }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LoanService.getLoanStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching loan stats:", error);
        setLoading(false);
      });
  }, [refreshTrigger]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={2}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  const metricCards = [
    {
      title: "Total Vehicles Financed",
      value: stats?.totalLoans || 0,
      color: "#1976d2",
      bg: "#e3f2fd",
      icon: <FaCar size={20} color="#1976d2" />,
      isCurrency: false,
    },
    {
      title: "Total Loan Disbursed",
      value: stats?.totalLoanAmountGiven || 0,
      color: "#0288d1",
      bg: "#e1f5fe",
      icon: <FaMoneyBillWave size={20} color="#0288d1" />,
      isCurrency: true,
    },
    {
      title: "Total Amount Recovered",
      value: stats?.totalAmountReceived || 0,
      color: "#2e7d32",
      bg: "#e8f5e9",
      icon: <FaCheckCircle size={20} color="#2e7d32" />,
      isCurrency: true,
    },
    {
      title: "Outstanding Portfolio",
      value: stats?.totalOutstandingAmount || 0,
      color: "#d32f2f",
      bg: "#ffebee",
      icon: <FaClock size={20} color="#d32f2f" />,
      isCurrency: true,
    },
    {
      title: "Active Loans",
      value: stats?.activeLoans || 0,
      color: "#7b1fa2",
      bg: "#f3e5f5",
      icon: <FaCar size={20} color="#7b1fa2" />,
      isCurrency: false,
    },
    {
      title: "Overdue / Defaulters",
      value: stats?.overdueLoans || 0,
      color: "#ed6c02",
      bg: "#fff3e0",
      icon: <FaExclamationTriangle size={20} color="#ed6c02" />,
      isCurrency: false,
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {metricCards.map((item, index) => (
        <Grid item xs={6} sm={4} md={2} key={index}>
          <Card
            sx={{
              p: 2,
              backgroundColor: item.bg,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: 2,
              boxShadow: 1,
              border: `1px solid ${item.color}20`,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', lineHeight: 1.2 }}>
                {item.title}
              </Typography>
              {item.icon}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: item.color }}>
              {item.isCurrency ? '₹' : ''}
              <CountUp end={item.value} duration={1} separator="," />
            </Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default LoanManagementDashboard;
