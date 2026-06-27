import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Updates from "expo-updates";
import React, { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import ScreenWrapper from "../components/ScreenWrapper";

export default function VerifyEmail() {
  const { colors } = useTheme();
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [contact, setContact] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await AsyncStorage.getItem("user");
      if (u) {
        const obj = JSON.parse(u);
        setContact(obj.email);
      }
    })();
  }, []);

  useEffect(() => {
    if (contact) {
      resendOtp();
    }
  }, [contact]);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => {
      setCooldown((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const resendOtp = async () => {
    if (sending || cooldown > 0) return;

    setSending(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const res: any = await apiFetch(`${API_URL}/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contact }),
      });

      if (!res.success) {
        Alert.alert("Error", res.message);
      } else {
        Alert.alert("OTP Sent", "A new OTP has been sent");
        setCooldown(30);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed");
    }

    setSending(false);
  };

  const verifyOtp = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res: any = await apiFetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contact, code: otp }),
      });

      if (!res.success) return Alert.alert("Error", res.message);

      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const prof: any = await apiFetch(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null);
          if (prof?.success)
            await AsyncStorage.setItem("user", JSON.stringify(prof.user));
        }
        await Updates.reloadAsync();
      } catch {
        router.replace("/home/passenger");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed");
    }
  };

  return (
    <ScreenWrapper>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 20 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 20,
            }}
          >
            Verify Email
          </Text>

          <Card>
            <Text
              style={{
                color: colors.textMuted,
                marginBottom: 20,
                lineHeight: 20,
              }}
            >
              Enter the 6-digit OTP sent to{" "}
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                {contact}
              </Text>
            </Text>

            <TextInput
              placeholder="Enter OTP"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              style={{
                backgroundColor: colors.surface,
                color: colors.text,
                borderRadius: 18,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 16,
              }}
            />

            <Button onPress={verifyOtp}>Verify</Button>

            <TouchableOpacity
              disabled={cooldown > 0}
              onPress={resendOtp}
              style={{ marginTop: 16, alignItems: "center" }}
            >
              <Text
                style={{
                  color: cooldown > 0 ? colors.textMuted : colors.primary,
                  fontWeight: "500",
                }}
              >
                {sending
                  ? "Sending..."
                  : cooldown > 0
                    ? `Resend OTP in ${cooldown}s`
                    : "Resend OTP"}
              </Text>
            </TouchableOpacity>
          </Card>
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
}
