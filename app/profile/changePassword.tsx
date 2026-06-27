import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import ScreenWrapper from "../components/ScreenWrapper";

export default function ChangePassword() {
  const { colors } = useTheme();
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) return;

      const u = JSON.parse(raw);
      setIsGoogleUser(!!u.isGoogleUser);
    };

    loadUser();
  }, []);

  const handleChangePassword = async () => {
    if (!password || !confirm || (!isGoogleUser && !oldPassword)) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");

      const data: any = await apiFetch(`${API_URL}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          isGoogleUser
            ? { password }
            : { oldPassword, password },
        ),
      });

      if (data.success) {
        Alert.alert("Success", "Password changed successfully.", [
          { text: "OK", onPress: () => router.replace("/home/profileTab") },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to change password.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to connect to the server.");
    }
  };

  const inputStyle = {
    marginTop: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  };

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={{
          flex: 1,
          padding: 20,
          paddingTop: 60,
          paddingBottom: 140,
          justifyContent: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 26,
            fontWeight: "700",
            marginBottom: 24,
          }}
        >
          {isGoogleUser ? "Set Password" : "Change Password"}
        </Text>

        <Card
          style={{
            borderRadius: 26,
            padding: 20,
          }}
        >
          {!isGoogleUser && (
            <>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                Old Password
              </Text>
              <TextInput
                placeholder="Enter old password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
                style={inputStyle}
              />
            </>
          )}

          <Text
            style={{
              color: colors.textMuted,
              fontSize: 13,
              marginTop: 18,
              marginBottom: 6,
            }}
          >
            New Password
          </Text>
          <TextInput
            placeholder="Enter new password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={inputStyle}
          />

          <Text
            style={{
              color: colors.textMuted,
              fontSize: 13,
              marginTop: 18,
              marginBottom: 6,
            }}
          >
            Confirm New Password
          </Text>
          <TextInput
            placeholder="Confirm new password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            style={inputStyle}
          />

          <View style={{ marginTop: 24 }}>
            <Button onPress={handleChangePassword}>Update Password</Button>
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}
