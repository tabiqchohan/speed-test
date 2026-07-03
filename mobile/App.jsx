import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar, useColorScheme } from 'react-native'
import HomeScreen from './src/screens/HomeScreen'
import HistoryScreen from './src/screens/HistoryScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import SupportScreen from './src/screens/SupportScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  const isDark = useColorScheme() === 'dark'

  return (
    <NavigationContainer>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#030712' : '#f8fafc'}
      />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: isDark ? '#111827' : '#ffffff' },
          headerTintColor: isDark ? '#e2e8f0' : '#1e293b',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: isDark ? '#030712' : '#f8fafc' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Transworld Speed Test' }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Test History' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Support' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
