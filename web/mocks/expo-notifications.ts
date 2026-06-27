export const AndroidImportance = {
  MAX: 5,
  HIGH: 4,
  DEFAULT: 3,
  LOW: 2,
  MIN: 1,
};

export const setNotificationHandler = () => {};

export const addNotificationReceivedListener = () => {
  return {
    remove: () => {},
  };
};

export const addNotificationResponseReceivedListener = () => {
  return {
    remove: () => {},
  };
};

export const getPermissionsAsync = async () => {
  return { status: "granted" };
};

export const requestPermissionsAsync = async () => {
  return { status: "granted" };
};

export const getExpoPushTokenAsync = async () => {
  return { data: "web-mock-push-token-12345" };
};

export const getLastNotificationResponseAsync = async () => {
  return null;
};

export const setNotificationChannelAsync = async () => {};
export const cancelAllScheduledNotificationsAsync = async () => {};
export const dismissAllNotificationsAsync = async () => {};
export const scheduleNotificationAsync = async () => "mock-id";
