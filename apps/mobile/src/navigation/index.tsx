import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import UniversitySearchScreen from '../screens/onboarding/UniversitySearchScreen';
import OTPScreen from '../screens/onboarding/OTPScreen';
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#0D2137' },
            cardStyleInterpolator: ({ current, layouts }) => ({
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            }),
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="UniversitySearch" component={UniversitySearchScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
