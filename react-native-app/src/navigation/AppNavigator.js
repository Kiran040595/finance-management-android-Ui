import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';

// Auth
import authService from '../services/authService';
import LoginScreen from '../screens/LoginScreen';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import EmiTrackerScreen from '../screens/EmiTrackerScreen';
import LoansListScreen from '../screens/LoansListScreen';
import LoanDetailScreen from '../screens/LoanDetailScreen';
import AddLoanScreen from '../screens/AddLoanScreen';
import EditLoanScreen from '../screens/EditLoanScreen';
import DayEndSummaryScreen from '../screens/DayEndSummaryScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentTrackingScreen from '../screens/PaymentTrackingScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === 'DashboardTab') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'LoansTab') {
            iconName = focused ? 'car-sport' : 'car-sport-outline';
          } else if (route.name === 'AnalyticsTab') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'DayEndTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'EmiTrackerTab') {
            iconName = focused ? 'alarm' : 'alarm-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="LoansTab"
        component={LoansListScreen}
        options={{ tabBarLabel: 'Loans' }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsScreen}
        options={{ tabBarLabel: 'Analytics' }}
      />
      <Tab.Screen
        name="DayEndTab"
        component={DayEndSummaryScreen}
        options={{ tabBarLabel: 'Day-End' }}
      />
      <Tab.Screen
        name="EmiTrackerTab"
        component={EmiTrackerScreen}
        options={{ tabBarLabel: 'EMI Due' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const [currentUser, setCurrentUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check existing login session
    authService.init().then((user) => {
      setCurrentUser(user);
      setInitializing(false);
    });

    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Auth gate: If not authenticated, require PIN or credentials login
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen
        name="LoanDetail"
        component={LoanDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="EditLoan"
        component={EditLoanScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AddLoan"
        component={AddLoanScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="DayEndSummary"
        component={DayEndSummaryScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="EmiTracker"
        component={EmiTrackerScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PaymentTracking"
        component={PaymentTrackingScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
