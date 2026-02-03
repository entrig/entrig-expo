import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import Constants from 'expo-constants';
import Entrig from 'entrig';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [entrigInitialized, setEntrigInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // Initialize Entrig
  useEffect(() => {
    const initEntrig = async () => {
      try {
        const apiKey = Constants.expoConfig?.extra?.entrigApiKey as string;
        if (!apiKey) {
          console.warn('Entrig API key not found');
          return;
        }

        await Entrig.init({ apiKey });
        setEntrigInitialized(true);
        console.log('Entrig initialized successfully');

        // Set up notification listeners
        Entrig.addListener('onForegroundNotification', (event) => {
          console.log('Foreground notification:', event);
        });

        Entrig.addListener('onNotificationOpened', (event) => {
          console.log('Notification opened:', event);
        });
      } catch (error) {
        console.error('Failed to initialize Entrig:', error);
      }
    };

    initEntrig();
  }, []);

  // Handle auth state and Entrig registration
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (!entrigInitialized) return;

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await Entrig.register(session.user.id);
          console.log('User registered with Entrig:', session.user.id);
        } catch (error) {
          console.error('Failed to register with Entrig:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        try {
          await Entrig.unregister();
          console.log('User unregistered from Entrig');
        } catch (error) {
          console.error('Failed to unregister from Entrig:', error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [entrigInitialized]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'rooms' || segments[0] === 'chat';

    if (!session && inAuthGroup) {
      router.replace('/sign-in');
    } else if (session && segments[0] === 'sign-in') {
      router.replace('/rooms');
    }
  }, [session, segments, isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="rooms" options={{ title: 'Rooms' }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
