import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, Linking } from "react-native";
import VersionCheck from "react-native-version-check";
import { apiFetch } from "../lib/apiFetch";
import { API_URL } from "../lib/config";
import LiftBuddyLoader from "./components/LiftBuddyLoader";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const res = await fetch(`${API_URL}/app-version`);

        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType?.includes("application/json")) {
          return false;
        }

        const data = await res.json();

        if (!data?.success) return false;

        const currentVersion = VersionCheck.getCurrentVersion();

        const isForceUpdate = (
          await VersionCheck.needUpdate({
            currentVersion,
            latestVersion: data.minRequiredVersion,
          })
        ).isNeeded;

        const isOptionalUpdate = (
          await VersionCheck.needUpdate({
            currentVersion,
            latestVersion: data.latestVersion,
          })
        ).isNeeded;

        if (isForceUpdate) {
          Alert.alert(
            "Update Required",
            "You must update the app to continue.",
            [
              {
                text: "Update",
                onPress: () => Linking.openURL(data.updateUrl),
              },
            ],
            { cancelable: false },
          );
          return true;
        }

        if (isOptionalUpdate) {
          Alert.alert("Update Available", "A new version is available.", [
            { text: "Later" },
            {
              text: "Update",
              onPress: () => Linking.openURL(data.updateUrl),
            },
          ]);
        }

        return false;
      } catch (err) {
        return false;
      }
    };

    const init = async () => {
      const shouldBlock = await checkForUpdate();
      if (shouldBlock) return;
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          router.replace("/onboarding");
          return;
        }

        const data: any = await apiFetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!data?.success) {
          await AsyncStorage.multiRemove(["token", "user"]);
          router.replace("/auth/login");
          return;
        }

        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        const lastResponse =
          await Notifications.getLastNotificationResponseAsync();
        if (lastResponse) {
          const notifData = lastResponse.notification.request.content
            .data as any;

          if (notifData?.sessionId) {
            const sid = String(notifData.sessionId);
            const mod = notifData.mode ?? "passenger";
            await AsyncStorage.setItem(
              "active_session",
              JSON.stringify({ sessionId: sid, mode: mod }),
            );
            router.replace({
              pathname: "/ride/tracking",
              params: { sessionId: sid, mode: mod },
            });
            return;
          }
          if (
            notifData?.screen === "/home/requests" ||
            notifData?.screen === "/home/driver"
          ) {
            router.replace("/home/Myrides");
            return;
          }
          if (notifData?.screen) {
            router.replace(notifData.screen as any);
            return;
          }
        }

        const activeRes: any = await apiFetch(`${API_URL}/active-session`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (activeRes?.success && activeRes?.session) {
          const { sessionId, mode: mod } = activeRes.session;
          const sid = String(sessionId);
          await AsyncStorage.setItem(
            "active_session",
            JSON.stringify({ sessionId: sid, mode: mod }),
          );
          router.replace({
            pathname: "/ride/tracking",
            params: { sessionId: sid, mode: mod },
          });
          return;
        }

        const rawSession = await AsyncStorage.getItem("active_session");
        if (rawSession) {
          try {
            const session = JSON.parse(rawSession);
            const sid = session?.sessionId ? String(session.sessionId) : null;
            const mod = session?.mode ?? "passenger";

            if (sid) {
              const res: any = await apiFetch(
                `${API_URL}/ride-session-status?sessionId=${sid}`,
                { headers: { Authorization: `Bearer ${token}` } },
              );

              if (res?.status === "ongoing" || res?.status === "accepted") {
                await AsyncStorage.setItem(
                  "active_session",
                  JSON.stringify({ sessionId: sid, mode: mod }),
                );
                router.replace({
                  pathname: "/ride/tracking",
                  params: { sessionId: sid, mode: mod },
                });
                return;
              }

              await AsyncStorage.removeItem("active_session");
            }
          } catch {
            await AsyncStorage.removeItem("active_session");
          }
        }

        router.replace("/home/passenger");
      } catch (err) {
        await AsyncStorage.multiRemove(["token", "user"]);
        router.replace("/auth/login");
      }
    };

    init();
  }, []);

  return <LiftBuddyLoader text="Starting LiftBuddy..." />;
}
