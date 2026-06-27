import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";

export function CompleteRideOtpModal({
  visible,
  sessionId,
  mode,
  onVerified,
  onClose,
}: {
  visible: boolean;
  sessionId: string;
  mode: string;
  onVerified: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();

  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"sending" | "input" | "verifying">(
    "sending",
  );
  const [error, setError] = useState("");

  const otherRole = mode === "driver" ? "passenger" : "driver";

  useEffect(() => {
    if (visible) {
      setOtp("");
      setError("");
      sendOtp();
    }
  }, [visible]);

  const sendOtp = async () => {
    setStep("sending");
    setError("");

    try {
      const token = await AsyncStorage.getItem("token");

      const res: any = await apiFetch(`${API_URL}/complete-ride/send-otp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      setStep("input");

      if (!res?.success) {
        setError(res?.message || "Failed to send OTP");
      }
    } catch {
      setError("Network error");
      setStep("input");
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 4) {
      setError("Enter 4-digit OTP");
      return;
    }

    setStep("verifying");
    setError("");

    try {
      const token = await AsyncStorage.getItem("token");

      const res: any = await apiFetch(`${API_URL}/complete-ride/verify-otp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          otp,
          role: mode,
        }),
      });

      if (res?.success) {
        onVerified();
      } else {
        setError(res?.message || "Invalid OTP");
        setStep("input");
      }
    } catch {
      setError("Network error");
      setStep("input");
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Complete Ride
          </Text>

          <Text
            style={{
              color: colors.textMuted,
              marginBottom: 20,
            }}
          >
            {step === "sending"
              ? "Sending OTP..."
              : `Enter OTP from ${otherRole}`}
          </Text>

          {step === "sending" && (
            <ActivityIndicator size="large" color={colors.primary} />
          )}

          {(step === "input" || step === "verifying") && (
            <>
              <TextInput
                placeholder="Enter 4-digit OTP"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={4}
                value={otp}
                onChangeText={(t) => {
                  setOtp(t.replace(/\D/g, ""));
                  setError("");
                }}
                style={{
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  fontSize: 14,
                  textAlign: "center",
                  letterSpacing: 8,
                  marginBottom: 10,
                }}
              />

              {!!error && (
                <Text
                  style={{
                    color: "red",
                    marginBottom: 10,
                    textAlign: "center",
                  }}
                >
                  {error}
                </Text>
              )}

              <TouchableOpacity
                onPress={verifyOtp}
                disabled={otp.length !== 4 || step === "verifying"}
                style={{
                  backgroundColor:
                    otp.length === 4 ? "#16a34a" : colors.surface,
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <Text
                  style={{
                    color: otp.length === 4 ? "#fff" : colors.textMuted,
                    fontWeight: "600",
                  }}
                >
                  {step === "verifying" ? "Verifying..." : "Confirm Completion"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={sendOtp} style={{ marginTop: 12 }}>
                <Text
                  style={{
                    color: colors.primary,
                    textAlign: "center",
                  }}
                >
                  Resend OTP
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }}>
            <Text
              style={{
                textAlign: "center",
                color: colors.textMuted,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
