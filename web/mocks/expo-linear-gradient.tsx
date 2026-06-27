import React from "react";
import { View } from "react-native";

export function LinearGradient({ colors, style, children, start, end }: any) {
  // Convert start/end to angles or standard css directions if needed, otherwise 135deg is a great default.
  let angle = "135deg";
  if (start && end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const rad = Math.atan2(dy, dx);
    const deg = (rad * 180) / Math.PI;
    // Map to CSS gradient coordinates
    angle = `${Math.round(deg + 90)}deg`;
  }

  const gradientStr = `linear-gradient(${angle}, ${colors.join(", ")})`;

  return (
    <View style={[{ backgroundImage: gradientStr }, style]}>
      {children}
    </View>
  );
}
