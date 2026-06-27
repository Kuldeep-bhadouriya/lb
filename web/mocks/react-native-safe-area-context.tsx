import React from "react";

export function SafeAreaProvider({ children }: any) {
  return <>{children}</>;
}

export function SafeAreaView({ children, style }: any) {
  return <div style={{ flex: 1, ...style }}>{children}</div>;
}

export function useSafeAreaInsets() {
  return { top: 0, bottom: 0, left: 0, right: 0 };
}
