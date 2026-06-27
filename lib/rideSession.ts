import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ActiveSession {
  sessionId: string;
  rideId?: number | string | null;
  mode?: "passenger" | "driver";
  driverName?: string;
}

const KEY = "activeSession";

export const saveActiveSession = async (s: ActiveSession) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
};

export const getActiveSession = async (): Promise<ActiveSession | null> => {
  const s = await AsyncStorage.getItem(KEY);
  return s ? (JSON.parse(s) as ActiveSession) : null;
};

export const clearActiveSession = async () => {
  await AsyncStorage.removeItem(KEY);
};
