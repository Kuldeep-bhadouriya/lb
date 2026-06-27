import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import ScreenWrapper from "../components/ScreenWrapper";

export default function Register() {
  const router = useRouter();
  const { colors } = useTheme();

  const [step, setStep] = useState<"form" | "otp" | "email">("form");
  const [emailOtp, setEmailOtp] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSendOtp = async () => {
    const { firstName, lastName, email, phone, password, confirmPassword } =
      form;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    )
      return Alert.alert("Missing Fields", "Please fill in all fields.");
    if (password !== confirmPassword)
      return Alert.alert("Password Mismatch", "Passwords do not match.");
    if (!agreed)
      return Alert.alert(
        "Terms Required",
        "You must accept the Terms and Privacy Policy.",
      );

    setLoading(true);
    try {
      const data: any = await apiFetch(`${API_URL}/register/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, email: form.email }),
      });
      if (!data.success) return Alert.alert("Error", data.message);

      if (data.verified) {
        await completeRegistration();
        return;
      }

      setStep("otp");
      Alert.alert("OTP Sent", "Check your WhatsApp for the verification code.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async () => {
    setLoading(true);
    try {
      const data: any = await apiFetch(`${API_URL}/register/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, code: otp }),
      });
      if (!data.success) return Alert.alert("Error", data.message);

      const otpRes: any = await apiFetch(
        `${API_URL}/forgot-password/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact: form.email }),
        },
      );
      if (!otpRes.success) {
        Alert.alert(
          "Account Created",
          "Registration successful! Please login.",
          [{ text: "OK", onPress: () => router.push("./login") }],
        );
        return;
      }
      setStep("email");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otp || otp.length < 6)
      return Alert.alert("Invalid OTP", "Enter the 6-digit OTP.");
    await completeRegistration();
  };

  const handleVerifyEmail = async () => {
    if (!emailOtp || emailOtp.length < 6)
      return Alert.alert("Invalid Code", "Enter the 6-digit code.");

    setLoading(true);
    try {
      const data: any = await apiFetch(`${API_URL}/register/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code: emailOtp }),
      });
      if (!data.success) return Alert.alert("Error", data.message);

      Alert.alert("🎉 All set!", "Your account is ready. Please login.", [
        { text: "OK", onPress: () => router.push("./login") },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    setLoading(true);
    try {
      await apiFetch(`${API_URL}/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: form.email }),
      });
      Alert.alert("Resent", "A new code has been sent to your email.");
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
            justifyContent: "center",
          }}
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                marginBottom: 24,
                textAlign: "center",
                color: colors.text,
              }}
            >
              {step === "form"
                ? "Create Account"
                : step === "otp"
                  ? "Verify Phone"
                  : "Verify Email"}
            </Text>

            {step === "form" && (
              <>
                {[
                  { placeholder: "First Name", key: "firstName" },
                  { placeholder: "Last Name", key: "lastName" },
                  { placeholder: "Email", key: "email", type: "email-address" },
                  {
                    placeholder: "Phone Number",
                    key: "phone",
                    type: "phone-pad",
                  },
                  { placeholder: "Password", key: "password", secure: true },
                  {
                    placeholder: "Confirm Password",
                    key: "confirmPassword",
                    secure: true,
                  },
                ].map((field) => (
                  <Input
                    key={field.key}
                    placeholder={field.placeholder}
                    secureTextEntry={field.secure}
                    keyboardType={field.type as any}
                    value={form[field.key as keyof typeof form]}
                    onChangeText={(v: string) =>
                      handleChange(field.key as any, v)
                    }
                  />
                ))}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 10,
                    marginBottom: 20,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setAgreed(!agreed)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: colors.primary,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 10,
                      backgroundColor: agreed ? colors.primary : "transparent",
                    }}
                  >
                    {agreed && (
                      <Text style={{ color: "#fff", fontSize: 14 }}>✓</Text>
                    )}
                  </TouchableOpacity>
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                    I agree to the{" "}
                    <Text
                      onPress={() => router.push("../profile/privacy")}
                      style={{
                        color: colors.primary,
                        textDecorationLine: "underline",
                      }}
                    >
                      Terms & Privacy Policy
                    </Text>
                  </Text>
                </View>

                {loading ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                  <Button onPress={handleSendOtp}>Continue</Button>
                )}
              </>
            )}

            {step === "otp" && (
              <>
                <Text
                  style={{
                    color: colors.textMuted,
                    marginBottom: 16,
                    lineHeight: 20,
                  }}
                >
                  Enter the 6-digit OTP sent to your WhatsApp{"\n"}
                  <Text style={{ color: colors.primary, fontWeight: "600" }}>
                    {form.phone}
                  </Text>
                </Text>

                <Input
                  placeholder="Enter OTP"
                  keyboardType="numeric"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />

                {loading ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                  <Button onPress={handleVerifyAndRegister}>
                    Verify & Continue
                  </Button>
                )}

                <TouchableOpacity
                  onPress={() => setStep("form")}
                  style={{ marginTop: 16, alignItems: "center" }}
                >
                  <Text style={{ color: colors.textMuted }}>
                    ← Back to form
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === "email" && (
              <>
                <Text
                  style={{
                    color: colors.textMuted,
                    marginBottom: 16,
                    lineHeight: 20,
                  }}
                >
                  A 6-digit code was sent to{"\n"}
                  <Text style={{ color: colors.primary, fontWeight: "600" }}>
                    {form.email}
                  </Text>
                </Text>

                <Input
                  placeholder="Enter email code"
                  keyboardType="numeric"
                  maxLength={6}
                  value={emailOtp}
                  onChangeText={setEmailOtp}
                />

                {loading ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                  <Button onPress={handleVerifyEmail}>Verify Email</Button>
                )}

                <TouchableOpacity
                  onPress={handleResendEmailOtp}
                  style={{ marginTop: 16, alignItems: "center" }}
                >
                  <Text style={{ color: colors.primary }}>Resend code</Text>
                </TouchableOpacity>
              </>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
