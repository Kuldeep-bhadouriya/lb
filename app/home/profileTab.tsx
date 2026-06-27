import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import ProfileHeaderCard from "../components/ProfileHeaderCard";
import ScreenWrapper from "../components/ScreenWrapper";

function StarDisplay({
  rating,
  total,
  size = 16,
}: {
  rating: number | null;
  total?: number;
  size?: number;
}) {
  const { colors } = useTheme();

  if (!rating) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={size}
            color={colors.border}
            fill="transparent"
            strokeWidth={1.5}
          />
        ))}
        <Text
          style={{ fontSize: size - 2, color: colors.textMuted, marginLeft: 4 }}
        >
          No ratings yet
        </Text>
      </View>
    );
  }

  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          color="#f59e0b"
          fill={
            s <= fullStars
              ? "#f59e0b"
              : s === fullStars + 1 && hasHalf
                ? "#f59e0b"
                : "transparent"
          }
          strokeWidth={1.5}
        />
      ))}
      <Text
        style={{
          fontSize: size - 2,
          color: "#f59e0b",
          fontWeight: "600",
          marginLeft: 5,
        }}
      >
        {rating.toFixed(1)}
      </Text>
      {total !== undefined && total > 0 && (
        <Text style={{ fontSize: size - 4, color: colors.textMuted }}>
          ({total} ratings)
        </Text>
      )}
    </View>
  );
}

export default function Profile() {
  const { colors, theme, setTheme } = useTheme();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) router.replace("../auth/register");
    };
    checkAuth();
  }, []);

  useEffect(() => {
    loadLocal();
    fetchProfile();
  }, []);

  const loadLocal = async () => {
    const json = await AsyncStorage.getItem("user");
    if (json) setUser(JSON.parse(json));
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("../auth/register");
        return;
      }
      const data: any = await apiFetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      } else {
        await AsyncStorage.multiRemove(["token", "user"]);
        router.replace("../auth/login");
      }
    } catch {}
    setLoading(false);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace("../auth/login");
  };

  const cycleTheme = () => {
    const next = theme === "eco" ? "dark" : "eco";
    InteractionManager.runAfterInteractions(() => setTheme(next));
  };

  const isDriver = user?.role === "driver";

  const Section = ({ title, children }: any) => (
    <View style={{ marginTop: 28 }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <Card style={{ marginTop: 12, borderRadius: 24, paddingVertical: 8 }}>
        {children}
      </Card>
    </View>
  );

  const Item = ({ label, onPress, highlight }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{ paddingVertical: 16, paddingHorizontal: 18 }}
    >
      <Text
        style={{
          fontSize: 16,
          color: highlight ? colors.primary : colors.text,
          fontWeight: highlight ? "600" : "500",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingTop: 24,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerName, { color: colors.text }]}>Profile</Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 20,
            marginTop: -8,
          }}
        >
          {isDriver && (
            <View
              style={{
                width: "48%",
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 14,
                borderWidth: 0.5,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{ fontSize: 22, fontWeight: "700", color: colors.text }}
              >
                {user?.CompletedRides ?? 0}
              </Text>
              <Text
                style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}
              >
                Rides Given
              </Text>
            </View>
          )}

          <View
            style={{
              width: isDriver ? "48%" : "100%",
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 14,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{ fontSize: 22, fontWeight: "700", color: colors.text }}
            >
              {user?.RidesTaken ?? 0}
            </Text>
            <Text
              style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}
            >
              Rides Taken
            </Text>
          </View>

          {isDriver && (
            <View
              style={{
                width: "100%",
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 14,
                borderWidth: 0.5,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  marginBottom: 6,
                }}
              >
                Rider Rating
              </Text>

              <StarDisplay
                rating={user?.avgRating ?? null}
                total={user?.totalRatings}
                size={18}
              />
            </View>
          )}
        </View>
        <ProfileHeaderCard
          user={user}
          onPress={() => router.push("/profile/editProfile")}
        />

        <Section title="Account">
          <Item
            label="Change Password"
            onPress={() => router.push("/profile/changePassword")}
          />
          {!user?.EmailVerified && (
            <Item
              label="Verify Email"
              highlight
              onPress={() => router.push("/verify/verifyEmail")}
            />
          )}
          {!user?.LicenceVerified && (
            <Item
              label="Verify ID"
              highlight
              onPress={() => router.push("/verify/verifyLicence")}
            />
          )}
        </Section>

        <Section title="Support">
          <Item
            label="Help & Support"
            onPress={() => router.push("/profile/help")}
          />
          <Item
            label="Feedback"
            onPress={() => router.push("/profile/feedback")}
          />
          <Item
            label="Privacy Policy"
            onPress={() => router.push("/profile/privacy")}
          />
        </Section>

        <Section title="Appearance">
          <Item
            label={`Theme: ${theme === "eco" ? "Eco" : "Dark"}`}
            highlight
            onPress={cycleTheme}
          />
        </Section>

        <Button onPress={logout} style={{ marginTop: 40 }}>
          Logout
        </Button>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerName: { fontSize: 28, fontWeight: "700", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600" },
});
