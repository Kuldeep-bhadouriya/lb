import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import ScreenWrapper from "../components/ScreenWrapper";

export default function Feedback() {
  const { colors } = useTheme();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    if (!message.trim()) {
      alert("Please enter feedback before submitting.");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const response: any = await apiFetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ message }),
      });

      if (response.success) {
        alert("Thank you! Your feedback has been submitted.");
        setMessage("");
      } else {
        alert(response.message || "Failed to submit feedback.");
      }
    } catch (err: any) {
      alert(err.message || "Server error. Try again later.");
    }

    setLoading(false);
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
            fontSize: 26,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 14,
          }}
        >
          Feedback
        </Text>

        <Text
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: colors.textMuted,
            marginBottom: 24,
          }}
        >
          Tell us what you think. Your feedback helps us improve the app and
          provide a better experience.
        </Text>

        <Card
          style={{
            borderRadius: 26,
            padding: 20,
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            Your Message
          </Text>

          <TextInput
            multiline
            placeholder="Write your feedback here..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            style={{
              minHeight: 160,
              borderRadius: 18,
              paddingVertical: 16,
              paddingHorizontal: 16,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text,
              textAlignVertical: "top",
            }}
          />

          <View style={{ marginTop: 24 }}>
            <Button onPress={submitFeedback} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}
