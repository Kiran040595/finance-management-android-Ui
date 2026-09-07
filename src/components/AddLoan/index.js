import React, { useState } from "react";
import PropTypes from "prop-types";
import LoanService from "../../services/loanService";
import LoanDetailsForm from "../LoanDetailsForm";
import CustomerDetailsForm from "../CustomerDetailsForm";
import VehicleDetailsForm from "../VehicleDetailsForm";
import GuarantorDetailsForm from "../GuarantorDetailsForm";
import { 
    Box, 
    Button, 
    CircularProgress, 
    Paper, 
    Step, 
    StepLabel, 
    Stepper, 
    Typography, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogTitle,
    Alert,
    Grid
} from "@mui/material";
import { FaCheckCircle } from "react-icons/fa";

const steps = ["Loan Terms", "Customer Details", "Vehicle & Hypothecation", "Guarantor Details"];

const AddLoan = ({ onSave, onClose }) => {
    const [loanDetails, setLoanDetails] = useState({
        fileNumber: "",
        loanAmount: "80000",
        interestRate: "1.4",
        tenure: "24",
        emi: "4453",
        loanCreationDate: new Date().toISOString().split("T")[0],
        customerName: "",
        customerPhonePrimary: "",
        customerPhoneSecondary: "",
        customerEmail: "",
        customerAadhaarNumber: "",
        customerPanNumber: "",
        customerFatherName: "",
        houseNo: "",
        street: "",
        landmark: "",
        city: "",
        state: "",
        pinCode: "",
        customerFullAddress: "",
        vehicleType: "Two Wheeler",
        vehicleMake: "Honda",
        vehicleModel: "",
        vehicleNumber: "",
        vehicleModelYear: new Date().getFullYear(),
        vehicleCost: "110000",
        downPayment: "30000",
        engineNumber: "",
        chassisNumber: "",
        insuranceCompany: "ICICI Lombard General Insurance",
        insurancePolicyNumber: "",
        vehicleInsuranceExpiryDate: "",
        guarantorName: "",
        guarantorPhonePrimary: "",
        guarantorAadhaarNumber: "",
        guarantorRelation: "",
        guarantorOccupation: "",
        guarantorFullAddress: "",
    });

    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [savedLoan, setSavedLoan] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    const nextStep = () => {
      setErrorMessage("");
      // Simple validations per step
      if (currentStep === 0) {
        if (!loanDetails.loanAmount || Number(loanDetails.loanAmount) <= 0) {
          setErrorMessage("Please enter a valid loan amount");
          return;
        }
        if (!loanDetails.tenure || Number(loanDetails.tenure) <= 0) {
          setErrorMessage("Please enter tenure in months");
          return;
        }
      } else if (currentStep === 1) {
        if (!loanDetails.customerName || !loanDetails.customerPhonePrimary) {
          setErrorMessage("Please enter customer name and primary mobile number");
          return;
        }
      } else if (currentStep === 2) {
        if (!loanDetails.vehicleNumber) {
          setErrorMessage("Please enter vehicle registration number");
          return;
        }
      }
      setCurrentStep((prev) => prev + 1);
    };

    const prevStep = () => {
      setErrorMessage("");
      setCurrentStep((prev) => prev - 1);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setLoanDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const handleSaveLoan = async () => {
        if (!loanDetails.customerName || !loanDetails.vehicleNumber) {
            setErrorMessage("Customer name and vehicle registration number are required!");
            return;
        }

        try {
            setIsLoading(true);
            setErrorMessage("");
            
            const saved = await LoanService.createLoan(loanDetails);
            setSavedLoan(saved);
            setOpenDialog(true);
            if (onSave) {
              onSave(saved);
            }
        } catch (error) {
            console.error("Error saving vehicle loan:", error);
            setErrorMessage("Failed to save the vehicle loan. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDone = () => {
      setOpenDialog(false);
      onClose();
    };

    return (
        <Paper 
            sx={{ 
                p: { xs: 2, sm: 4 }, 
                width: "100%", 
                margin: "auto", 
                position: "relative" 
            }}
        >
            <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1} color="primary">
                Vehicle Loan Application
            </Typography>
            <Typography variant="body2" textAlign="center" color="textSecondary" mb={3}>
                Register a new two-wheeler, four-wheeler, or commercial vehicle finance loan
            </Typography>

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}

            <Stepper activeStep={currentStep} alternativeLabel sx={{ width: "100%", mb: 3 }}>
                {steps.map((label, index) => (
                    <Step key={index}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Box sx={{ width: "100%", minHeight: "45vh" }}>
                {currentStep === 0 && <LoanDetailsForm loanDetails={loanDetails} handleInputChange={handleInputChange} />}
                {currentStep === 1 && <CustomerDetailsForm loanDetails={loanDetails} handleInputChange={handleInputChange} />}
                {currentStep === 2 && <VehicleDetailsForm loanDetails={loanDetails} handleInputChange={handleInputChange} />}
                {currentStep === 3 && <GuarantorDetailsForm loanDetails={loanDetails} handleInputChange={handleInputChange} />}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
                <Button variant="outlined" color="inherit" onClick={onClose} disabled={isLoading}>
                    Cancel
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {currentStep > 0 && (
                        <Button variant="outlined" onClick={prevStep} disabled={isLoading}>
                            Back
                        </Button>
                    )}
                    {currentStep < steps.length - 1 ? (
                        <Button variant="contained" color="primary" onClick={nextStep} disabled={isLoading}>
                            Next Step
                        </Button>
                    ) : (
                        <Button 
                            variant="contained" 
                            color="success" 
                            onClick={handleSaveLoan} 
                            disabled={isLoading}
                            startIcon={<FaCheckCircle />}
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : "Disburse & Save Loan"}
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Confirmation Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleDone}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ bgcolor: '#4caf50', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaCheckCircle /> Vehicle Loan Created Successfully!
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {savedLoan && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 1 }}>
                        <Alert severity="success">
                          Loan has been disbursed and registered under File #{savedLoan.fileNumber}. Repayment amortization schedule of {savedLoan.tenure} EMIs has been generated.
                        </Alert>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">File Number:</Typography>
                            <Typography variant="subtitle1" fontWeight="bold">{savedLoan.fileNumber}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Customer Name:</Typography>
                            <Typography variant="subtitle1" fontWeight="bold">{savedLoan.customerName}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Vehicle:</Typography>
                            <Typography variant="subtitle2">{savedLoan.vehicleMake} {savedLoan.vehicleModel} ({savedLoan.vehicleNumber})</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Loan Amount:</Typography>
                            <Typography variant="subtitle1" color="primary" fontWeight="bold">₹{Number(savedLoan.loanAmount).toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Monthly EMI:</Typography>
                            <Typography variant="subtitle1" color="success.main" fontWeight="bold">₹{Number(savedLoan.emi).toLocaleString()}/month</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Tenure:</Typography>
                            <Typography variant="subtitle2">{savedLoan.tenure} Months</Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleDone} variant="contained" color="primary" fullWidth>
                        Go to Loans List
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

AddLoan.propTypes = {
    onSave: PropTypes.func,
    onClose: PropTypes.func.isRequired,
};

export default AddLoan;
