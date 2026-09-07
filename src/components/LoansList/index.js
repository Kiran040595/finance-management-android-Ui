import React, { useState, useEffect } from 'react';
import LoanService from '../../services/loanService';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Select,
  MenuItem,
  Pagination,
  Box,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Grid
} from '@mui/material';
import { Link } from 'react-router-dom';
import { FaEye, FaMoneyBillWave, FaTrash, FaCar, FaMotorcycle, FaTruck } from 'react-icons/fa';

function LoanList({ refreshTrigger }) {
  const [loans, setLoans] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'fileNumber', direction: 'asc' });
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const fetchLoans = () => {
    setLoading(true);
    LoanService.getLoans()
      .then((data) => {
        setLoans(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching loans:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLoans();
  }, [refreshTrigger]);

  const handleDelete = async (id, fileNumber) => {
    if (window.confirm(`Are you sure you want to delete Loan ${fileNumber}?`)) {
      await LoanService.deleteLoan(id);
      fetchLoans();
    }
  };

  const getVehicleIcon = (type = '') => {
    if (type.toLowerCase().includes('two') || type.toLowerCase().includes('bike')) return <FaMotorcycle color="#1976d2" />;
    if (type.toLowerCase().includes('commercial') || type.toLowerCase().includes('truck')) return <FaTruck color="#ed6c02" />;
    return <FaCar color="#2e7d32" />;
  };

  const getStatusChip = (status) => {
    if (status === 'Closed') {
      return <Chip label="Closed (NOC)" size="small" color="success" variant="outlined" />;
    }
    if (status === 'Overdue') {
      return <Chip label="Overdue" size="small" color="error" />;
    }
    return <Chip label="Active" size="small" color="primary" />;
  };

  // Filter
  const filteredLoans = loans.filter((loan) => {
    const lowerFilter = filter.toLowerCase();
    const matchesSearch =
      !filter ||
      (loan.customerName && loan.customerName.toLowerCase().includes(lowerFilter)) ||
      (loan.fileNumber && loan.fileNumber.toString().toLowerCase().includes(lowerFilter)) ||
      (loan.vehicleNumber && loan.vehicleNumber.toLowerCase().includes(lowerFilter)) ||
      (loan.customerPhonePrimary && loan.customerPhonePrimary.includes(filter)) ||
      (loan.vehicleModel && loan.vehicleModel.toLowerCase().includes(lowerFilter));

    const matchesStatus = statusFilter === 'ALL' || loan.status === statusFilter;
    const matchesVehicleType = vehicleTypeFilter === 'ALL' || loan.vehicleType === vehicleTypeFilter;

    return matchesSearch && matchesStatus && matchesVehicleType;
  });

  // Sort
  const sortedLoans = [...filteredLoans].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedLoans.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLoans = sortedLoans.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <Card sx={{ maxWidth: 1300, margin: 'auto', mt: 3, p: { xs: 1.5, sm: 3 }, boxShadow: 2, borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <div>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Vehicle Loans Portfolio
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Showing {filteredLoans.length} vehicle loans
            </Typography>
          </div>
        </Box>

        {/* Filter Toolbar */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              label="Search by File #, Customer, Vehicle Plate, or Phone"
              variant="outlined"
              size="small"
              fullWidth
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Overdue">Overdue / Defaulters</MenuItem>
                <MenuItem value="Closed">Closed / NOC Issued</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                value={vehicleTypeFilter}
                label="Vehicle Type"
                onChange={(e) => {
                  setVehicleTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <MenuItem value="ALL">All Vehicle Types</MenuItem>
                <MenuItem value="Two Wheeler">Two Wheeler (Bikes/Scooters)</MenuItem>
                <MenuItem value="Car / Four Wheeler">Car / Four Wheeler</MenuItem>
                <MenuItem value="Commercial Vehicle">Commercial Vehicle</MenuItem>
                <MenuItem value="Auto Rickshaw">Auto Rickshaw</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f7fa' }}>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === 'fileNumber'}
                        direction={sortConfig.direction}
                        onClick={() => handleSort('fileNumber')}
                      >
                        <strong>File #</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === 'customerName'}
                        direction={sortConfig.direction}
                        onClick={() => handleSort('customerName')}
                      >
                        <strong>Customer Name</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <strong>Vehicle Details</strong>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortConfig.key === 'loanAmount'}
                        direction={sortConfig.direction}
                        onClick={() => handleSort('loanAmount')}
                      >
                        <strong>Loan Amount</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Monthly EMI</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Repayment</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentLoans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="textSecondary">
                          No vehicle loans match your search criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentLoans.map((loan) => (
                      <TableRow key={loan.id || loan.fileNumber} hover>
                        <TableCell>
                          <Link to={`/loan/${loan.id || loan.fileNumber}`} style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}>
                            {loan.fileNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {loan.customerName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            📞 {loan.customerPhonePrimary}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getVehicleIcon(loan.vehicleType)}
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {loan.vehicleMake} {loan.vehicleModel}
                              </Typography>
                              <Typography variant="caption" sx={{ bgcolor: '#eee', px: 0.8, py: 0.2, borderRadius: 0.5, fontFamily: 'monospace' }}>
                                {loan.vehicleNumber}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            ₹{Number(loan.loanAmount).toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {loan.tenure} mos @ {loan.interestRate}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="primary.main" fontWeight="bold">
                            ₹{Number(loan.emi).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="caption" display="block">
                            {loan.paidEmiCount || 0} of {loan.tenure} Paid
                          </Typography>
                          <Box sx={{ width: '100%', bgcolor: '#e0e0e0', height: 6, borderRadius: 1, mt: 0.5 }}>
                            <Box
                              sx={{
                                width: `${Math.min(100, Math.round(((loan.paidEmiCount || 0) / (loan.tenure || 1)) * 100))}%`,
                                bgcolor: loan.status === 'Closed' ? '#4caf50' : loan.status === 'Overdue' ? '#f44336' : '#1976d2',
                                height: 6,
                                borderRadius: 1,
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {getStatusChip(loan.status)}
                          {loan.pendingDays > 0 && (
                            <Typography variant="caption" color="error" display="block" sx={{ fontWeight: 'bold', mt: 0.3 }}>
                              {loan.pendingDays}d overdue
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center" gap={0.5}>
                            <Tooltip title="View Loan & Repayment Schedule">
                              <IconButton
                                size="small"
                                component={Link}
                                to={`/loan/${loan.id || loan.fileNumber}`}
                                color="primary"
                              >
                                <FaEye />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Collect EMI Payment">
                              <IconButton
                                size="small"
                                component={Link}
                                to={`/payments/${loan.fileNumber}`}
                                color="success"
                              >
                                <FaMoneyBillWave />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Loan">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(loan.id, loan.fileNumber)}
                              >
                                <FaTrash size={14} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination & page count */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="caption">Items per page:</Typography>
                <Select
                  size="small"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  sx={{ height: 32 }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </Box>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                color="primary"
                size="small"
              />
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default LoanList;
