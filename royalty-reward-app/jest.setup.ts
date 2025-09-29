/// <reference types="jest" />
import '@testing-library/jest-native/extend-expect';
import { jest } from '@jest/globals';

// Mock expo-router navigation
jest.mock('expo-router', () => {
  const actual = jest.requireActual('expo-router') as Record<string, any>;
  return {
    ...actual,
    // Make useRouter a jest mock so tests can override its return value per test
    useRouter: jest.fn(() => ({
      replace: jest.fn(),
      push: jest.fn(),
      back: jest.fn(),
    })),
    Link: ({ children }: any) => children,
  };
});
