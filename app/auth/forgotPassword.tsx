import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { globalStyles } from "../../styles/global";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import ScreenWrapper from "../components/ScreenWrapper";

export default function ForgotPassword() {
  const { colors } = useTheme();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (cooldown === 0) return;
    const t = setInterval(() => {
      setCooldown((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendOtp = async () => {
    if (!contact.includes("@"))
      return Alert.alert("Invalid", "Enter a valid email");

    const res: any = await apiFetch(`${API_URL}/forgot-password/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact }),
    });

    if (!res.success) return Alert.alert("Error", res.message);
    Alert.alert("OTP Sent", "A reset code was sent", [
      { text: "OK", onPress: () => setStep(2) },
    ]);
    setCooldown(30);
  };

  const verifyOtp = async () => {
    const res: any = await apiFetch(`${API_URL}/forgot-password/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact, code: otp }),
    });

    if (!res.success) return Alert.alert("Error", res.message);

    Alert.alert("Verified", "OTP is correct", [
      { text: "OK", onPress: () => setStep(3) },
    ]);
  };

  const resetPassword = async () => {
    if (password !== confirm)
      return Alert.alert("Mismatch", "Passwords do not match");

    if (password.length < 6)
      return Alert.alert("Weak Password", "At least 6 characters required");

    const res: any = await apiFetch(`${API_URL}/forgot-password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact, password }),
    });

    if (!res.success) return Alert.alert("Error", res.message);

    Alert.alert("Success", "Password updated", [
      { text: "Login", onPress: () => router.replace("./login") },
    ]);
  };

  const renderStep1 = () => (
    <>
      <Text style={[globalStyles.title, { color: colors.text }]}>
        Forgot Password
      </Text>

      <Text style={{ color: colors.textMuted, marginVertical: 10 }}>
        Enter your registered email
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        style={[
          globalStyles.input,
          { color: colors.text },
          { borderColor: colors.text, color: colors.text },
        ]}
        value={contact}
        onChangeText={setContact}
      />

      <TouchableOpacity
        style={[globalStyles.button, { backgroundColor: colors.primary }]}
        onPress={sendOtp}
      >
        <Text style={[globalStyles.buttonText, { color: colors.background }]}>
          Send OTP
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={[globalStyles.title, { color: colors.text }]}>
        Verify OTP
      </Text>

      <Text style={{ color: colors.textMuted, marginVertical: 10 }}>
        Enter the code sent to {contact}
      </Text>

      <TextInput
        placeholder="Enter OTP"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        maxLength={6}
        style={[globalStyles.input, { color: colors.text }]}
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity
        style={[globalStyles.button, { backgroundColor: colors.primary }]}
        onPress={verifyOtp}
      >
        <Text style={[globalStyles.buttonText, { color: colors.background }]}>
          Verify
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={sendOtp}
        disabled={cooldown > 0}
        style={{ marginTop: 12 }}
      >
        <Text
          style={{ color: cooldown > 0 ? colors.textMuted : colors.primary }}
        >
          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={[globalStyles.title, { color: colors.text }]}>
        Reset Password
      </Text>

      <TextInput
        placeholder="New Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        style={[globalStyles.input, { color: colors.text, marginTop: 20 }]}
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        style={[globalStyles.input, { color: colors.text, marginTop: 12 }]}
        value={confirm}
        onChangeText={setConfirm}
      />

      <TouchableOpacity
        style={[globalStyles.button, { backgroundColor: colors.primary }]}
        onPress={resetPassword}
      >
        <Text style={[globalStyles.buttonText, { color: colors.background }]}>
          Reset Password
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <ScreenWrapper>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Card>
          {step === 1 && (
            <>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  marginBottom: 16,
                  textAlign: "center",
                  color: colors.text,
                }}
              >
                Forgot Password
              </Text>

              <Text
                style={{
                  color: colors.textMuted,
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                Enter your registered email
              </Text>

              <Input
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={contact}
                onChangeText={setContact}
              />

              <Button onPress={sendOtp}>Send OTP</Button>
            </>
          )}

          {step === 2 && (
            <>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  marginBottom: 16,
                  textAlign: "center",
                  color: colors.text,
                }}
              >
                Verify OTP
              </Text>

              <Text
                style={{
                  color: colors.textMuted,
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                Enter the code sent to {contact}
              </Text>

              <Input
                placeholder="Enter OTP"
                keyboardType="numeric"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />

              <Button onPress={verifyOtp}>Verify</Button>

              <Text
                style={{
                  marginTop: 14,
                  textAlign: "center",
                  color: cooldown > 0 ? colors.textMuted : colors.primary,
                  textDecorationLine: cooldown > 0 ? "none" : "underline",
                }}
                onPress={cooldown > 0 ? undefined : sendOtp}
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
              </Text>
            </>
          )}

          {step === 3 && (
            <>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  marginBottom: 20,
                  textAlign: "center",
                  color: colors.text,
                }}
              >
                Reset Password
              </Text>

              <Input
                placeholder="New Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Input
                placeholder="Confirm Password"
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />

              <Button onPress={resetPassword}>Reset Password</Button>
            </>
          )}
        </Card>
      </View>
    </ScreenWrapper>
  );
}
