import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";
import Card from "../components/Card";
import ScreenWrapper from "../components/ScreenWrapper";

const CREDITS_PER_INR = 10;

function StatBox({
  label,
  value,
  emoji,
  colors,
}: {
  label: string;
  value: string | number;
  emoji: string;
  colors: any;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 16,
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 26 }}>{emoji}</Text>
      <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary }}>
        {value}
      </Text>
      <Text
        style={{ fontSize: 11, color: colors.textMuted, textAlign: "center" }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function Dashboard() {
  const { colors } = useTheme();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("token");
      const u = JSON.parse((await AsyncStorage.getItem("user")) || "null");
      setToken(t);
      setUser(u);
    })();
  }, []);

  useEffect(() => {
    if (token) fetchAll();
  }, [token]);

  const fetchAll = async () => {
    try {
      const [statsRes, lbRes] = await Promise.all([
        apiFetch(`${API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch(`${API_URL}/dashboard/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (lbRes.success) setLeaderboard(lbRes.leaderboard ?? []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 80 }}
        />
      </ScreenWrapper>
    );
  }

  const isFaculty = user?.isFaculty === true;
  const creditsEarned = stats
    ? Math.round((stats.totalEarningsInr ?? 0) * CREDITS_PER_INR)
    : 0;

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 20 }}>
          {isFaculty && (
            <View
              style={{
                backgroundColor: "#1a3a6b",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ fontSize: 14 }}>🏛️</Text>
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                Faculty Dashboard
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>
            Hi, {user?.firstName ?? "there"} 👋
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>
            {isFaculty ? "Your faculty ride summary" : "Your ride summary"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <StatBox
            label="Rides Taken"
            value={stats?.ridesTaken ?? 0}
            emoji="🎫"
            colors={colors}
          />
          <StatBox
            label="Rides Given"
            value={stats?.ridesGiven ?? 0}
            emoji="🚗"
            colors={colors}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          <StatBox
            label="Credits Earned"
            value={`🪙 ${creditsEarned}`}
            emoji="💰"
            colors={colors}
          />
          <StatBox
            label="Avg Rating"
            value={
              stats?.avgRating
                ? `⭐ ${Number(stats.avgRating).toFixed(1)}`
                : "—"
            }
            emoji="⭐"
            colors={colors}
          />
        </View>

        <Card style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 12,
            }}
          >
            🪙 Credits Breakdown
          </Text>
          <View style={{ gap: 8 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: colors.textMuted }}>
                Total credits earned
              </Text>
              <Text style={{ color: "#f59e0b", fontWeight: "700" }}>
                {creditsEarned}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: colors.textMuted }}>
                Equivalent INR value
              </Text>
              <Text style={{ color: colors.text, fontWeight: "600" }}>
                ₹{stats?.totalEarningsInr ?? 0}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: colors.textMuted }}>Rides as driver</Text>
              <Text style={{ color: colors.text }}>
                {stats?.ridesGiven ?? 0}
              </Text>
            </View>
            {isFaculty && (
              <View
                style={{
                  marginTop: 8,
                  padding: 10,
                  backgroundColor: "#f0f4ff",
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#1a3a6b", fontSize: 12 }}>
                  As a faculty driver, your rides are physically confirmed
                  before departure. Admin will contact you via email if needed.
                </Text>
              </View>
            )}
          </View>
        </Card>

        <Card>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 14,
            }}
          >
            🏆 Credits Leaderboard
          </Text>
          <Text
            style={{ fontSize: 12, color: colors.textMuted, marginBottom: 14 }}
          >
            {isFaculty
              ? "Faculty drivers ranked by credits earned"
              : "Top drivers by credits earned"}
          </Text>
          {leaderboard.length === 0 ? (
            <Text
              style={{
                color: colors.textMuted,
                textAlign: "center",
                paddingVertical: 16,
              }}
            >
              No data yet. Complete rides to appear on the leaderboard!
            </Text>
          ) : (
            leaderboard.slice(0, 10).map((entry, idx) => {
              const isMe = entry.userId === user?.Id;
              const medal =
                idx === 0
                  ? "🥇"
                  : idx === 1
                    ? "🥈"
                    : idx === 2
                      ? "🥉"
                      : `#${idx + 1}`;
              return (
                <View
                  key={entry.userId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderRadius: 10,
                    marginBottom: 4,
                    backgroundColor: isMe
                      ? colors.primary + "15"
                      : "transparent",
                    borderWidth: isMe ? 1 : 0,
                    borderColor: isMe ? colors.primary : "transparent",
                  }}
                >
                  <Text
                    style={{ fontSize: 18, width: 36, textAlign: "center" }}
                  >
                    {medal}
                  </Text>
                  {entry.profilePic ? (
                    <Image
                      source={{ uri: entry.profilePic }}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        marginRight: 10,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: colors.primary + "20",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>🧑</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontWeight: isMe ? "700" : "500",
                        color: colors.text,
                        fontSize: 14,
                      }}
                    >
                      {entry.name} {isMe ? "(You)" : ""}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {entry.ridesGiven} rides as driver
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        color: "#f59e0b",
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      🪙 {entry.credits}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>
                      credits
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}
