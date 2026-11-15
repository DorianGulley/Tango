import { ConvexError } from 'convex/values';
import { Alert } from 'react-native';

export function errorMessage(error: unknown) {
  if (error instanceof ConvexError && typeof error.data === 'string') return error.data;
  return 'Something went wrong. Please try again.';
}

export function showError(error: unknown) {
  Alert.alert('Tango', errorMessage(error));
}
