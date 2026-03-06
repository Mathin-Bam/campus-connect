import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import UniversitySearchScreen from '../screens/onboarding/UniversitySearchScreen';
import OTPScreen from '../screens/onboarding/OTPScreen';
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';
import ActivityFeedScreen from '../screens/main/ActivityFeedScreen';

export type RootStackParamList = {
  Welcome: undefined;
  UniversitySearch: undefined;
  OTP: {
    university: {
      id: string;
      name: string;
      emailDomain: string;
      city: string;
    };
  };
  ProfileSetup: {
    userId: string;
    email: string;
  };
  MainTabs: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0D2137' },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="UniversitySearch" component={UniversitySearchScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="MainTabs" component={ActivityFeedScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
