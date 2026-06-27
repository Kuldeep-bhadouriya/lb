export * from "react-native-web";

// Stub for native registry module
export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => null,
};

// Add other common React Native native stubs if needed
export const NativeModules = {};
export const DeviceEventEmitter = {
  addListener: () => ({ remove: () => {} }),
  removeListener: () => {},
  emit: () => {},
};

// react-native-web doesn't have a default export in all versions, provide a safe fallback
const ReactNativeWebDefault = {};
export default ReactNativeWebDefault;
