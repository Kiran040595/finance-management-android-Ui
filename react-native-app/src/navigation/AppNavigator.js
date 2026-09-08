import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import EmiTrackerScreen from '../screens/EmiTrackerScreen';
import LoansListScreen from '../screens/LoansListScreen';
import LoanDetailScreen from '../screens/LoanDetailScreen';
import AddLoanScreen from '../screens/AddLoanScreen';
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
          } else if (route.name === 'EmiTrackerTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'LoansTab') {
            iconName = focused ? 'car-sport' : 'car-sport-outline';
          } else if (route.name === 'PaymentTab') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'TrackingTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
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
        name="EmiTrackerTab"
        component={EmiTrackerScreen}
        options={{ tabBarLabel: 'EMI Tracker' }}
      />
      <Tab.Screen
        name="LoansTab"
        component={LoansListScreen}
        options={{ tabBarLabel: 'Loans' }}
      />
      <Tab.Screen
        name="PaymentTab"
        component={PaymentScreen}
        options={{ tabBarLabel: 'Collect' }}
      />
      <Tab.Screen
        name="TrackingTab"
        component={PaymentTrackingScreen}
        options={{ tabBarLabel: 'Ledger' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
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
        name="AddLoan"
        component={AddLoanScreen}
        options={{ animation: 'slide_from_bottom' }}
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

export default AppNavigator;
