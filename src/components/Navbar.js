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
  FaBars, 
  FaAndroid, 
  FaDownload,
  FaTimes
} from 'react-icons/fa';

function Navbar() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
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
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      setInfoOpen(true);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <FaTachometerAlt /> },
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
                label="Android PWA" 
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

          {/* Mobile & Desktop Install Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
        <Box sx={{ width: 260, pt: 2 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <Box sx={{ px: 2, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              Finance App
            </Typography>
            <IconButton size="small" onClick={() => setDrawerOpen(false)}>
              <FaTimes />
            </IconButton>
          </Box>
          <List>
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
          <Box sx={{ p: 2, mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              color="success"
              startIcon={<FaAndroid />}
              onClick={handleInstallClick}
            >
              Install on Android
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

