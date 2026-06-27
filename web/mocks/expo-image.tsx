import React from "react";

// Web stub for expo-image — renders a standard <img> tag
export function Image({
  source,
  style,
  contentFit,
  alt,
  resizeMode,
  ...props
}: any) {
  const src =
    typeof source === "object" && source !== null
      ? source.uri
      : source;

  const objectFit =
    contentFit === "contain"
      ? "contain"
      : contentFit === "fill"
      ? "fill"
      : contentFit === "none"
      ? "none"
      : "cover";

  return (
    <img
      src={src}
      alt={alt || ""}
      style={{
        objectFit,
        ...(style || {}),
      }}
      {...props}
    />
  );
}

export default Image;
