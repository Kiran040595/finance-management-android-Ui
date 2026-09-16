import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import authService, { USER_ROLES } from '../services/authService';

export const LoginScreen = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState('pin'); // 'pin' | 'credentials'
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.ADMIN);

  useEffect(() => {
    if (selectedRole === USER_ROLES.ADMIN) {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('manager');
      setPassword('manager123');
    }
  }, [selectedRole]);

  const handlePinPress = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handlePinBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const verifyPin = async (pinToVerify) => {
    setLoading(true);
    try {
      const user = await authService.loginWithPin(pinToVerify);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      Alert.alert('Access Denied', err.message || 'Incorrect PIN. Try 1234 (Admin) or 5678 (Manager)');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login(username, password);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setLoading(true);
    try {
      const user =
        role === USER_ROLES.ADMIN
          ? await authService.login('admin', 'admin123')
          : await authService.login('manager', 'manager123');
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      Alert.alert('Quick Login Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Branding Banner */}
        <View style={styles.brandContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={42} color={colors.primary} />
          </View>
          <Text style={styles.appTitle}>Vehicle Finance Manager</Text>
          <Text style={styles.appSubtitle}>Secure Commercial Lending & Collections</Text>
        </View>

        {/* Auth Mode Toggle */}
        <View style={styles.modeToggleRow}>
          <TouchableOpacity
            style={[styles.modeTab, authMode === 'pin' && styles.modeTabActive]}
            onPress={() => setAuthMode('pin')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="keypad-outline"
              size={18}
              color={authMode === 'pin' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.modeTabText, authMode === 'pin' && styles.modeTabTextActive]}>
              Quick PIN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, authMode === 'credentials' && styles.modeTabActive]}
            onPress={() => setAuthMode('credentials')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={authMode === 'credentials' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.modeTabText, authMode === 'credentials' && styles.modeTabTextActive]}>
              Password Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* PIN Entry Mode */}
        {authMode === 'pin' ? (
          <View style={styles.pinSection}>
            <Text style={styles.pinPrompt}>Enter 4-Digit Security PIN</Text>
            <Text style={styles.pinHint}>Default: 1234 (Admin) • 5678 (Manager)</Text>

            {/* PIN Dots */}
            <View style={styles.pinDotsRow}>
              {[0, 1, 2, 3].map((idx) => (
                <View
                  key={idx}
                  style={[styles.pinDot, pin.length > idx && styles.pinDotFilled]}
                />
              ))}
            </View>

            {/* Number Pad */}
            <View style={styles.keypadContainer}>
              {[[1, 2, 3], [4, 5, 6], [7, 8, 9]].map((row, rIdx) => (
                <View key={rIdx} style={styles.keypadRow}>
                  {row.map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={styles.keypadKey}
                      onPress={() => handlePinPress(String(num))}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.keypadText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={styles.keypadRow}>
                <TouchableOpacity
                  style={[styles.keypadKey, styles.keypadSpecial]}
                  onPress={() => setPin('')}
                  activeOpacity={0.6}
                >
                  <Text style={styles.keypadSpecialText}>C</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.keypadKey}
                  onPress={() => handlePinPress('0')}
                  activeOpacity={0.6}
                >
                  <Text style={styles.keypadText}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.keypadKey, styles.keypadSpecial]}
                  onPress={handlePinBackspace}
                  activeOpacity={0.6}
                >
                  <Ionicons name="backspace-outline" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* Credentials Mode */
          <View style={styles.card}>
            {/* Role Switcher */}
            <Text style={styles.inputLabel}>Select Login Role</Text>
            <View style={styles.rolePickerRow}>
              <TouchableOpacity
                style={[styles.roleOption, selectedRole === USER_ROLES.ADMIN && styles.roleOptionActive]}
                onPress={() => setSelectedRole(USER_ROLES.ADMIN)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={selectedRole === USER_ROLES.ADMIN ? '#ffffff' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedRole === USER_ROLES.ADMIN && styles.roleOptionTextActive,
                  ]}
                >
                  Admin
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, selectedRole === USER_ROLES.MANAGER && styles.roleOptionActive]}
                onPress={() => setSelectedRole(USER_ROLES.MANAGER)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={20}
                  color={selectedRole === USER_ROLES.MANAGER ? '#ffffff' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedRole === USER_ROLES.MANAGER && styles.roleOptionTextActive,
                  ]}
                >
                  Manager
                </Text>
              </TouchableOpacity>
            </View>

            {/* Username Input */}
            <Text style={styles.inputLabel}>Username</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCredentialsLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    Sign In as {selectedRole === USER_ROLES.ADMIN ? 'Admin' : 'Manager'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Quick One-Tap Testing Buttons */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.quickAccessTitle}>Instant 1-Tap Access</Text>
          <View style={styles.quickAccessRow}>
            <TouchableOpacity
              style={[styles.quickBadge, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
              onPress={() => handleQuickLogin(USER_ROLES.ADMIN)}
              activeOpacity={0.7}
            >
              <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
              <Text style={[styles.quickBadgeText, { color: colors.primary }]}>Admin Mode</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickBadge, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
              onPress={() => handleQuickLogin(USER_ROLES.MANAGER)}
              activeOpacity={0.7}
            >
              <Ionicons name="briefcase" size={16} color={colors.success} />
              <Text style={[styles.quickBadgeText, { color: colors.success }]}>Manager Mode</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 60,
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: borderRadius.md,
    padding: 3,
    width: '100%',
    marginBottom: spacing.lg,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
  },
  modeTabActive: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginLeft: 6,
  },
  modeTabTextActive: {
    color: colors.primary,
  },
  pinSection: {
    width: '100%',
    alignItems: 'center',
  },
  pinPrompt: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pinHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  pinDotsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary,
    marginHorizontal: 10,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: colors.primary,
  },
  keypadContainer: {
    width: 280,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  keypadKey: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  keypadText: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  keypadSpecial: {
    backgroundColor: '#f8fafc',
  },
  keypadSpecialText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rolePickerRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  roleOptionTextActive: {
    color: '#ffffff',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  eyeBtn: {
    padding: spacing.xs,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 50,
    marginTop: spacing.sm,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  quickAccessSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  quickAccessTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  quickAccessRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    borderWidth: 1,
  },
  quickBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default LoginScreen;
