import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthContext';
import LoginScreen   from '../screens/LoginScreen';
import TweetsScreen  from '../screens/TweetsScreen';
import ReplyScreen   from '../screens/ReplyScreen';
import LinkedInScreen from '../screens/LinkedInScreen';
import { colors }    from '../constants/theme';

const Tab = createBottomTabNavigator();

function TabIcon({ label, color }) {
  // Simple text-based tab icons — no icon library dependency.
  const icons = { Tweets: '✦', Reply: '↩', LinkedIn: 'in' };
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: color === colors.blue ? `${colors.blue}22` : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <View style={{
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: color,
        }} />
      </View>
    </View>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  // Show nothing while SecureStore is being read on launch.
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 80,
            paddingBottom: 20,
          },
          tabBarActiveTintColor:   colors.blue,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: {
            fontFamily: 'DM_Mono_500Medium',
            fontSize: 10,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginTop: 2,
          },
        })}
      >
        <Tab.Screen
          name="Tweets"
          component={TweetsScreen}
          options={{
            tabBarIcon: ({ color }) => <TabIcon label="Tweets" color={color} />,
          }}
        />
        <Tab.Screen
          name="Reply"
          component={ReplyScreen}
          options={{
            tabBarIcon: ({ color }) => <TabIcon label="Reply" color={color} />,
          }}
        />
        <Tab.Screen
          name="LinkedIn"
          component={LinkedInScreen}
          options={{
            tabBarIcon: ({ color }) => <TabIcon label="LinkedIn" color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
