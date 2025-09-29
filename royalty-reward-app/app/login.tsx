import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('aaa@aaa.com');
  const [password, setPassword] = useState('test');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // TODO: integrate with your auth API
      await new Promise((r) => setTimeout(r, 800));
      router.replace('/(tabs)');
    } catch (e) {
      console.warn('Login error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <SafeAreaView edges={['top']} className="flex-1 bg-white">
        <ThemedView lightColor="#ffffff" darkColor="#ffffff" className="flex-1 px-6 pb-6">
        <View className="items-center mb-8">
          <ThemedText type="title">Welcome</ThemedText>
        </View>

        <View>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email or Phone"
            placeholderTextColor="#8A6B61"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="h-14 px-4 rounded-2xl bg-[#F5F2F0] text-[#8A6B61] mb-4"
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#8A6B61"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            className="h-14 px-4 rounded-2xl bg-[#F5F2F0] text-[#8A6B61]"
          />

          <View className="items-center mt-4">
            <Link href="/forgot-password" asChild>
              <Pressable>
                <ThemedText className="text-[#8A6B61]">Forgot Password?</ThemedText>
              </Pressable>
            </Link>
          </View>

          <Pressable
            onPress={onSubmit}
            disabled={loading || !email || !password}
            className="h-12 rounded-xl items-center justify-center bg-[#F24A0D] mt-4 disabled:opacity-50"
          >
            <ThemedText className="text-white font-semibold">
              {loading ? 'Signing in…' : 'Sign In'}
            </ThemedText>
          </Pressable>
        </View>

        {/* Social login section */}
        <View className="mt-8">
          <ThemedText className="mb-4 text-base font-semibold">Or continue with</ThemedText>
          <View className="flex-row justify-between">
            <Pressable className="flex-1 rounded-xl bg-[#F5F2F0] py-3 mr-3 items-center">
              <ThemedText className="font-semibold">Facebook</ThemedText>
            </Pressable>
            <Pressable className="flex-1 rounded-xl bg-[#F5F2F0] py-3 ml-3 items-center">
              <ThemedText className="font-semibold">Google</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Sign up links */}
        <View className="items-center mt-6">
          <ThemedText className="text-[#8A6B61]">Don&apos;t have an account?</ThemedText>
          <Link href="/register">
            <ThemedText className="mt-1 font-semibold">Sign Up</ThemedText>
          </Link>
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Continue as Guest at bottom */}
        <View className="items-center mb-2">
          <Pressable onPress={() => router.replace('/(tabs)')}>
            <ThemedText className="font-semibold">Continue as Guest</ThemedText>
          </Pressable>
        </View>
        </ThemedView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
