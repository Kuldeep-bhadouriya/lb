import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // React Native core → react-native-web
      'react-native/Libraries/Utilities/codegenNativeComponent': path.resolve(__dirname, 'web/mocks/codegenNativeComponent.ts'),
      'react-native/Libraries/Image/resolveAssetSource': path.resolve(__dirname, 'web/mocks/resolveAssetSource.ts'),
      'react-native': path.resolve(__dirname, 'web/mocks/react-native.ts'),

      // Expo packages
      'expo-router': path.resolve(__dirname, 'web/mocks/expo-router.tsx'),
      'expo-location': path.resolve(__dirname, 'web/mocks/expo-location.ts'),
      'expo-image-picker': path.resolve(__dirname, 'web/mocks/expo-image-picker.ts'),
      'expo-notifications': path.resolve(__dirname, 'web/mocks/expo-notifications.ts'),
      'expo-updates': path.resolve(__dirname, 'web/mocks/expo-updates.ts'),
      'expo-constants': path.resolve(__dirname, 'web/mocks/expo-constants.ts'),
      'expo-navigation-bar': path.resolve(__dirname, 'web/mocks/expo-navigation-bar.ts'),
      'expo-linear-gradient': path.resolve(__dirname, 'web/mocks/expo-linear-gradient.tsx'),
      'expo-image': path.resolve(__dirname, 'web/mocks/expo-image.tsx'),

      // Icons — map to lucide-react (web version)
      'lucide-react-native': 'lucide-react',

      // Storage
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'web/mocks/async-storage.ts'),

      // Safe area
      'react-native-safe-area-context': path.resolve(__dirname, 'web/mocks/react-native-safe-area-context.tsx'),

      // Maps
      'react-native-maps': path.resolve(__dirname, 'web/mocks/react-native-maps.tsx'),
      'react-native-maps-directions': path.resolve(__dirname, 'web/mocks/react-native-maps-directions.tsx'),

      // Places autocomplete
      '@hammim-in/react-native-places-autocomplete': path.resolve(__dirname, 'web/mocks/places-autocomplete.tsx'),

      // Version check
      'react-native-version-check': path.resolve(__dirname, 'web/mocks/react-native-version-check.ts'),

      // Date/Time picker (uses Flow types, must be mocked)
      '@react-native-community/datetimepicker': path.resolve(__dirname, 'web/mocks/datetimepicker.tsx'),

      // SVG
      'react-native-svg': path.resolve(__dirname, 'web/mocks/react-native-svg.tsx'),
    },
  },
  optimizeDeps: {
    exclude: [
      '@react-native-google-signin/google-signin',
      'react-native-gesture-handler',
      'react-native-reanimated',
      'moti',
      'expo-camera',
      'react-native-maps',
      'react-native-maps-directions',
      '@hammim-in/react-native-places-autocomplete',
    ],
  },
  define: {
    'process.env': {},
    '__DEV__': false,
  },
});
