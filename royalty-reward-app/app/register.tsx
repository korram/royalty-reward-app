import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ThemedView className="flex-1 justify-center px-6">
        <View className="mb-8">
          <ThemedText type="title">Create account</ThemedText>
          <ThemedText className="opacity-70 mt-1">Join us to continue</ThemedText>
        </View>

        <View className="gap-4">
          <View>
            <ThemedText className="mb-2 opacity-70">Name</ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
              className="h-12 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20"
            />
          </View>

          <View>
            <ThemedText className="mb-2 opacity-70">Email</ThemedText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              className="h-12 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20"
            />
          </View>

          <View>
            <ThemedText className="mb-2 opacity-70">Password</ThemedText>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              className="h-12 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20"
            />
          </View>

          <Pressable
            onPress={onSubmit}
            disabled={loading || !name || !email || !password}
            className="h-12 rounded-xl items-center justify-center bg-blue-600 disabled:opacity-50"
          >
            <ThemedText className="text-white">
              {loading ? 'Creating…' : 'Create account'}
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
