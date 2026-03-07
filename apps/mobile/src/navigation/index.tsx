import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import UniversitySearchScreen from '../screens/onboarding/UniversitySearchScreen';
import OTPScreen from '../screens/onboarding/OTPScreen';
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';
import ActivityFeedScreen from '../screens/main/ActivityFeedScreen';
import ChatListScreen from '../screens/main/ChatListScreen';
import MessageScreen from '../screens/main/MessageScreen';

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
    token: string;
  };
  ActivityFeed: undefined;
  ChatList: undefined;
  MessageScreen: {
    threadId: string;
    otherUser: {
      id: string;
      displayName: string;
      avatarUrl?: string;
    };
  };
};

const Stack = createStackNavigator();


export default function AppNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="UniversitySearch" component={UniversitySearchScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="ActivityFeed" component={ActivityFeedScreen} />
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen name="MessageScreen" component={MessageScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
