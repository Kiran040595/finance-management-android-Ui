import React from 'react';
import { Container } from '@mui/material';
import EmiTracker from '../components/EmiTracker';

const EmiTrackerPage = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }} id="emi-tracker-page-container">
      <EmiTracker />
    </Container>
  );
};

export default EmiTrackerPage;
