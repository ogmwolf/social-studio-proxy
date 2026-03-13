import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthContext';
import LoginScreen    from '../screens/LoginScreen';
import TweetsScreen   from '../screens/TweetsScreen';
import ReplyScreen    from '../screens/ReplyScreen';
import LinkedInScreen from '../screens/LinkedInScreen';
import { colors }     from '../constants/theme';

const Tab = createBottomTabNavigator();

// Minimal indicator — a small dot only when active, invisible space when not.
function TabDot({ focused, color }) {
  return (
    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: focused ? color : 'transparent' }} />
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.blue} size="small" />
      </SafeAreaView>
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
            borderTopWidth: 1,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor:   colors.blue,
          tabBarInactiveTintColor: '#333333',
          tabBarLabelStyle: {
            fontFamily: 'DMMono_500Medium',
            fontSize: 10,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          },
          tabBarIcon: ({ focused, color }) => <TabDot focused={focused} color={color} />,
          tabBarItemStyle: {
            paddingTop: 6,
          },
        })}
      >
        <Tab.Screen name="Tweets"   component={TweetsScreen}   />
        <Tab.Screen name="Reply"    component={ReplyScreen}    />
        <Tab.Screen name="LinkedIn" component={LinkedInScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
