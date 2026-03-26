import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../components/dashboard/DashboardScreen';
import ScanScreen from '../screens/scanScreen';
import HistoriqueScreen from '../screens/HistoriquesScreen';
import SanctionsScreen from '../screens/SanctionsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SaisieManuelleScreen from '../screens/SaisieManuelleScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashboardMain" component={DashboardScreen} />
  </Stack.Navigator>
);

const ScanStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ScanMain" component={ScanScreen} />
    <Stack.Screen name="SaisieManuelle" component={SaisieManuelleScreen} />
  </Stack.Navigator>
);

const HistoriqueStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HistoriqueMain" component={HistoriqueScreen} />
  </Stack.Navigator>
);

const SanctionsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SanctionsMain" component={SanctionsScreen} />
  </Stack.Navigator>
);

const NotificationsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NotificationsMain" component={NotificationsScreen} />
  </Stack.Navigator>
);

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            switch (route.name) {
              case 'Accueil':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Scanner':
                iconName = focused ? 'qr-code' : 'qr-code-outline';
                break;
              case 'Historique':
                iconName = focused ? 'time' : 'time-outline';
                break;
              case 'Sanctions':
                iconName = focused ? 'alert-circle' : 'alert-circle-outline';
                break;
              case 'Notifications':
                iconName = focused ? 'notifications' : 'notifications-outline';
                break;
              default:
                iconName = 'help';
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4f46e5',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Accueil" component={DashboardStack} />
        <Tab.Screen name="Scanner" component={ScanStack} />
        <Tab.Screen name="Historique" component={HistoriqueStack} />
        <Tab.Screen name="Sanctions" component={SanctionsStack} />
        <Tab.Screen name="Notifications" component={NotificationsStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;