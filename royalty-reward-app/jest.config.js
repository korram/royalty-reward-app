/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    // Ensure RN/Expo libs and CSS interop get transformed
    'node_modules/(?!(react-native|@react-native|react-native-safe-area-context|react-native-gesture-handler|expo(nent)?|expo-.*|@expo/.*|@react-navigation/.*|nativewind|react-native-css-interop)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
