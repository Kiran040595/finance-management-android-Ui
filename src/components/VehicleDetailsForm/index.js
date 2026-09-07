import React from "react";
import { Grid, TextField, MenuItem, Typography, Paper, Box } from "@mui/material";

const vehicleTypes = [
  "Two Wheeler",
  "Car / Four Wheeler",
  "Commercial Vehicle",
  "Auto Rickshaw",
  "Tractor / Agriculture",
  "Electric Vehicle (EV)",
];

const popularMakes = [
  "Honda",
  "Maruti Suzuki",
  "Hero MotoCorp",
  "Bajaj Auto",
  "Tata Motors",
  "Hyundai",
  "Mahindra & Mahindra",
  "TVS Motor",
  "Royal Enfield",
  "Toyota",
  "Kia",
  "Other",
];

const insuranceCompanies = [
  "ICICI Lombard General Insurance",
  "Bajaj Allianz General Insurance",
  "HDFC ERGO General Insurance",
  "New India Assurance",
  "National Insurance",
  "United India Insurance",
  "Tata AIG General Insurance",
  "Reliance General Insurance",
  "Go Digit General Insurance",
  "Other",
];

const VehicleDetailsForm = ({ loanDetails, handleInputChange }) => {
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
        Vehicle & Hypothecation Details
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Enter vehicle specifications, registration, valuation, and insurance information for hypothecation.
      </Typography>

      <Grid container spacing={2}>
        {/* Vehicle Type */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            label="Vehicle Category *"
            name="vehicleType"
            value={loanDetails.vehicleType || "Two Wheeler"}
            onChange={handleInputChange}
          >
            {vehicleTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Vehicle Make / Brand */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            label="Vehicle Make / Brand *"
            name="vehicleMake"
            value={loanDetails.vehicleMake || "Honda"}
            onChange={handleInputChange}
          >
            {popularMakes.map((make) => (
              <MenuItem key={make} value={make}>
                {make}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Model & Variant */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Model & Variant *"
            name="vehicleModel"
            placeholder="e.g. Activa 6G DLX / Swift VXI"
            value={loanDetails.vehicleModel || ""}
            onChange={handleInputChange}
          />
        </Grid>

        {/* Registration Number */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Registration Number *"
            name="vehicleNumber"
            placeholder="e.g. MH-12-AB-1234 / AP-09-CD-5678"
            value={loanDetails.vehicleNumber || ""}
            onChange={handleInputChange}
          />
        </Grid>

        {/* Model Manufacturing Year */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            label="Manufacturing Year"
            name="vehicleModelYear"
            value={loanDetails.vehicleModelYear || new Date().getFullYear()}
            onChange={handleInputChange}
          >
            {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Vehicle Price / Valuation */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            type="number"
            label="On-Road Price / Valuation (₹)"
            name="vehicleCost"
            placeholder="e.g. 100000"
            value={loanDetails.vehicleCost || ""}
            onChange={handleInputChange}
          />
        </Grid>

        {/* Down Payment */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Customer Down Payment (₹)"
            name="downPayment"
            placeholder="e.g. 25000"
            value={loanDetails.downPayment || ""}
            onChange={handleInputChange}
          />
        </Grid>

        {/* Engine Number */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Engine Number"
            name="engineNumber"
            placeholder="e.g. JF91E8392019"
            value={loanDetails.engineNumber || ""}
            onChange={handleInputChange}
          />
        </Grid>

        {/* Chassis Number / VIN */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Chassis Number (VIN)"
            name="chassisNumber"
            placeholder="e.g. ME4JF9139P8392019"
            value={loanDetails.chassisNumber || ""}
            onChange={handleInputChange}
          />
        </Grid>

        {/* Insurance Company */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            label="Insurance Company"
            name="insuranceCompany"
            value={loanDetails.insuranceCompany || "ICICI Lombard General Insurance"}
            onChange={handleInputChange}
          >
            {insuranceCompanies.map((comp) => (
              <MenuItem key={comp} value={comp}>
                {comp}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Insurance Policy Number */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Insurance Policy Number"
            name="insurancePolicyNumber"
            placeholder="e.g. POL-84920184"
            value={loanDetails.insurancePolicyNumber || ""}
            onChange={handleInputChange}
          />
        </Grid>

        {/* Insurance Expiry Date */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            type="date"
            label="Insurance Expiry Date"
            name="vehicleInsuranceExpiryDate"
            value={loanDetails.vehicleInsuranceExpiryDate || ""}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Hypothecation Status */}
        <Grid item xs={12}>
          <Box sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" color="primary" fontWeight="bold">
              Hypothecation Clause:
            </Typography>
            <Typography variant="body2" color="textSecondary">
              The vehicle with Registration #{loanDetails.vehicleNumber || '___'} will be hypothecated to <strong>FMS Vehicle Finance Ltd</strong> until all EMI installments and final dues are fully settled.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default VehicleDetailsForm;
