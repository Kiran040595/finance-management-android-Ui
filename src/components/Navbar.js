import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { 
  FaTachometerAlt, 
  FaFileInvoiceDollar, 
  FaChartLine, 
  FaCreditCard, 
  FaCalendarAlt,
  FaBalanceScale,
  FaBars, 
  FaAndroid, 
  FaMobileAlt,
  FaDownload,
  FaCode,
  FaTimes
} from 'react-icons/fa';

function Navbar() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [rnModalOpen, setRnModalOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setInfoOpen(true);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <FaTachometerAlt /> },
    { label: 'Finances', path: '/financial-overview', icon: <FaBalanceScale /> },
    { label: 'EMI Tracker', path: '/emi-tracker', icon: <FaCalendarAlt /> },
    { label: 'Loans', path: '/loan-management', icon: <FaFileInvoiceDollar /> },
    { label: 'Tracking', path: '/payment-tracking', icon: <FaChartLine /> },
    { label: 'Payment', path: '/payment', icon: <FaCreditCard /> },
  ];

  const currentNavIndex = navItems.findIndex(item => item.path === location.pathname);

  return (
    <>
      <AppBar position="fixed" color="primary" sx={{ zIndex: 1201 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { xs: 'flex', md: 'none' } }}
              aria-label="menu"
            >
              <FaBars />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              FMS
              <Chip 
                label="Android & React Native" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white', 
                  fontSize: '0.65rem', 
                  height: 20, 
                  display: { xs: 'none', sm: 'inline-flex' } 
                }} 
              />
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                sx={{
                  color: location.pathname === item.path ? '#90caf9' : 'white',
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                  '&:hover': { color: 'lightblue' },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Mobile & Desktop Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setRnModalOpen(true)}
              startIcon={<FaMobileAlt />}
              sx={{
                borderColor: 'rgba(255,255,255,0.6)',
                color: 'white',
                fontWeight: '600',
                textTransform: 'none',
                fontSize: { xs: '0.75rem', sm: '0.825rem' },
                px: { xs: 1, sm: 1.5 },
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              React Native App
            </Button>

            {!isInstalled && (
              <Button
                variant="contained"
                size="small"
                onClick={handleInstallClick}
                startIcon={<FaAndroid />}
                sx={{
                  bgcolor: '#4caf50',
                  color: 'white',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1.5, sm: 2 },
                  '&:hover': { bgcolor: '#388e3c' },
                }}
              >
                Install App
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Side Drawer for Mobile */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 270, pt: 2 }} role="presentation">
          <Box sx={{ px: 2, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              Vehicle Finance
            </Typography>
            <IconButton size="small" onClick={() => setDrawerOpen(false)}>
              <FaTimes />
            </IconButton>
          </Box>
          <List onClick={() => setDrawerOpen(false)}>
            {navItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton 
                  component={Link} 
                  to={item.path}
                  selected={location.pathname === item.path}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Box sx={{ p: 2, mt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<FaMobileAlt />}
              onClick={() => {
                setDrawerOpen(false);
                setRnModalOpen(true);
              }}
            >
              React Native App
            </Button>

            <Button
              fullWidth
              variant="outlined"
              color="success"
              startIcon={<FaAndroid />}
              onClick={() => {
                setDrawerOpen(false);
                handleInstallClick();
              }}
            >
              Install PWA on Android
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Mobile Android Bottom Navigation Bar */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1200, 
          display: { xs: 'block', md: 'none' },
          borderTop: '1px solid #e0e0e0',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
        }} 
        elevation={4}
      >
        <BottomNavigation
          showLabels
          value={currentNavIndex !== -1 ? currentNavIndex : 0}
          sx={{ height: 60 }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
              component={Link}
              to={item.path}
              sx={{
                minWidth: 'auto',
                color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 'bold',
                }
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>

      {/* React Native Conversion & Download Dialog */}
      <Dialog open={rnModalOpen} onClose={() => setRnModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1e3a8a', fontWeight: 'bold' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FaMobileAlt color="#1e40af" size={22} /> React Native Mobile Project
          </Box>
          <Chip label="Expo & Android Ready" size="small" color="success" />
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ fontWeight: '600', mb: 1, color: '#0f172a' }}>
            The entire codebase has been converted into React Native!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Located in the <code>react-native-app/</code> directory with complete native screens, AsyncStorage local persistence, vector icons, bottom tab navigation, WhatsApp reminders, and direct calling.
          </Typography>

          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaCode color="#1e40af" /> Converted Native Architecture:
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, m: 0, '& li': { fontSize: '0.85rem', mb: 0.5 } }}>
              <li><strong>App.js</strong>: NavigationContainer, StatusBar & AsyncStorage initialization</li>
              <li><strong>AppNavigator.js</strong>: Native Bottom Tabs (Dashboard, EMI Tracker, Loans, Payments) & Native Stack</li>
              <li><strong>DashboardScreen.js</strong>: KPI cards, portfolio stats & upcoming obligations</li>
              <li><strong>EmiTrackerScreen.js</strong>: Urgency filter chips, search, WhatsApp reminder & Call</li>
              <li><strong>LoansListScreen.js & LoanDetailScreen.js</strong>: Amortization schedule & EMI actions</li>
              <li><strong>AddLoanScreen.js</strong>: 4-step wizard with real-time EMI auto-calculation</li>
              <li><strong>PaymentScreen.js & PaymentModal.js</strong>: Instant payment recording</li>
            </Box>
          </Box>

          <Box sx={{ bgcolor: '#eff6ff', p: 2, borderRadius: 2, border: '1px solid #bfdbfe', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1e3a8a', mb: 0.5 }}>
              ⚡ How to run on your Android device:
            </Typography>
            <Box component="pre" sx={{ bgcolor: '#1e293b', color: '#f8fafc', p: 1.5, borderRadius: 1, fontSize: '0.78rem', overflowX: 'auto', my: 1 }}>
              cd react-native-app{'\n'}
              npm install{'\n'}
              npx expo start
            </Box>
            <Typography variant="caption" color="text.secondary">
              Scan the QR code with the <strong>Expo Go</strong> app on your Android phone to run immediately!
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            href="/react-native-app.zip"
            download="react-native-app.zip"
            startIcon={<FaDownload />}
            sx={{ bgcolor: '#1e40af', py: 1.2, fontWeight: 'bold', textTransform: 'none' }}
          >
            Download React Native Project (.ZIP)
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRnModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Install App Instruction Dialog for Mobile Users */}
      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1976d2', fontWeight: 'bold' }}>
          <FaAndroid size={24} color="#4caf50" /> Install on Android
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You can install this app directly onto your Android home screen as a full-screen app:
          </Typography>
          <Box component="ol" sx={{ pl: 2.5, m: 0, '& li': { mb: 1.5, fontSize: '0.95rem' } }}>
            <li>
              Tap the <strong>Chrome menu (three dots ⋮)</strong> in the top right or bottom of your browser.
            </li>
            <li>
              Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
            </li>
            <li>
              Tap <strong>"Install"</strong> to confirm.
            </li>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1 }}>
            🚀 Once installed, it launches directly from your Android app drawer just like an APK, with no browser URL bar and instant loading!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoOpen(false)} variant="contained" fullWidth>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Navbar;

