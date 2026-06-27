import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../../theme/ThemeContext";

function getProfileCompletion(user: any): {
  percent: number;
  missing: string[];
} {
  const fields: { key: string; label: string; check: (u: any) => boolean }[] = [
    {
      key: "firstName",
      label: "First name",
      check: (u) => !!u?.firstName?.trim(),
    },
    {
      key: "lastName",
      label: "Last name",
      check: (u) => !!u?.lastName?.trim(),
    },
    { key: "email", label: "Email", check: (u) => !!u?.email?.trim() },
    {
      key: "phone",
      label: "Phone number",
      check: (u) => !!(u?.phone || u?.Phone),
    },
    { key: "gender", label: "Gender", check: (u) => !!u?.gender },
    { key: "dob", label: "Date of birth", check: (u) => !!u?.dob },
    {
      key: "profile_pic",
      label: "Profile photo",
      check: (u) => !!u?.profile_pic,
    },
    {
      key: "vehicleNumber",
      label: "Vehicle number",
      check: (u) => !!u?.vehicleNumber?.trim(),
    },
    {
      key: "availableSeats",
      label: "Available seats",
      check: (u) => !!(u?.availableSeats && Number(u.availableSeats) > 0),
    },
  ];

  const missing: string[] = [];
  let done = 0;

  for (const f of fields) {
    if (f.check(user)) {
      done++;
    } else {
      missing.push(f.label);
    }
  }

  return {
    percent: Math.round((done / fields.length) * 100),
    missing,
  };
}

function ProgressRing({
  size,
  strokeWidth,
  percent,
  color,
  trackColor,
}: {
  size: number;
  strokeWidth: number;
  percent: number;
  color: string;
  trackColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (percent / 100);
  const strokeDashoffset = circumference - filled;

  return (
    <Svg width={size} height={size} style={{ position: "absolute" }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

function ringColor(percent: number): string {
  if (percent === 100) return "#22c55e";
  if (percent >= 70) return "#f59e0b";
  return "#ef4444";
}

export default function ProfileHeaderCard({
  user,
  onPress,
}: {
  user: any;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const { percent, missing } = getProfileCompletion(user);

  const RING_SIZE = 72;
  const STROKE = 3.5;
  const AVATAR_SIZE = 56;
  const AVATAR_OFFSET = (RING_SIZE - AVATAR_SIZE) / 2;

  const pColor = ringColor(percent);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={{ width: RING_SIZE, height: RING_SIZE, marginRight: 12 }}>
        <View
          style={{
            position: "absolute",
            top: AVATAR_OFFSET,
            left: AVATAR_OFFSET,
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            overflow: "hidden",
          }}
        >
          {user?.profile_pic ? (
            <Image
              source={{ uri: user.profile_pic }}
              style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                {
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text style={{ color: colors.text, fontSize: 20 }}>
                {(user?.firstName || "U").charAt(0)}
              </Text>
            </View>
          )}
        </View>

        <ProgressRing
          size={RING_SIZE}
          strokeWidth={STROKE}
          percent={percent}
          color={pColor}
          trackColor={colors.border}
        />

        <View
          style={{
            position: "absolute",
            bottom: -2,
            right: -4,
            backgroundColor: pColor,
            borderRadius: 10,
            paddingHorizontal: 5,
            paddingVertical: 2,
            minWidth: 28,
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: colors.card,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff" }}>
            {percent}%
          </Text>
        </View>
      </View>

      <View style={styles.middle}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {user?.firstName || ""} {user?.lastName || ""}
        </Text>
        <Text style={[styles.phone, { color: colors.textMuted }]}>
          {user?.phone ? `+91 ${user.phone}` : ""}
        </Text>

        {percent < 100 && (
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}
          >
            <View
              style={{
                height: 4,
                flex: 1,
                borderRadius: 2,
                backgroundColor: colors.border,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 4,
                  width: `${percent}%`,
                  borderRadius: 2,
                  backgroundColor: pColor,
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 10,
                color: colors.textMuted,
                marginLeft: 6,
                minWidth: 60,
              }}
            >
              {percent === 100
                ? "Complete ✓"
                : `${missing.length} field${missing.length > 1 ? "s" : ""} left`}
            </Text>
          </View>
        )}

        {percent === 100 && (
          <Text
            style={{
              fontSize: 11,
              color: "#22c55e",
              marginTop: 4,
              fontWeight: "600",
            }}
          >
            Profile complete ✓
          </Text>
        )}
      </View>

      <ChevronRight size={22} color={colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  middle: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
  },
  phone: {
    marginTop: 2,
    fontSize: 13,
  },
});
