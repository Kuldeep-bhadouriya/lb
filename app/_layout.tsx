import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Stack, usePathname, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { BackHandler, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { registerPushToken } from "../lib/notifications";
import { ThemeProvider } from "../theme/ThemeContext";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const notifListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const redirect = await AsyncStorage.getItem("redirect_after_reload");
        if (redirect) {
          await AsyncStorage.removeItem("redirect_after_reload");
          router.replace(redirect as any);
        }
      } catch (e) {}
    };
    checkRedirect();
  }, []);

  useEffect(() => {
    registerPushToken();

    notifListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {},
    );

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          const notifData = response.notification.request.content.data as any;

          if (notifData?.sessionId) {
            await AsyncStorage.setItem(
              "active_session",
              JSON.stringify({
                sessionId: notifData.sessionId,
                mode: notifData.mode ?? "passenger",
              }),
            );
            router.push({
              pathname: "/ride/tracking",
              params: {
                sessionId: notifData.sessionId,
                mode: notifData.mode ?? "passenger",
              },
            });
            return;
          }

          if (notifData?.screen === "/home/Myrides") {
            router.push("/home/Myrides");
            return;
          }

          if (notifData?.screen) {
            router.push(notifData.screen as any);
          }
        },
      );

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const onBackPress = () => {
      if (pathname.startsWith("/profile") || pathname === "/home/profileTab") {
        router.replace("/home/profileTab");
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [pathname]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
