import React from "react";

// Web stub for @react-native-community/datetimepicker
// Falls back to a native HTML date/time input
export default function DateTimePicker({
  value,
  mode = "date",
  onChange,
  minimumDate,
  maximumDate,
  style,
}: any) {
  const inputType =
    mode === "time" ? "time" : mode === "datetime" ? "datetime-local" : "date";

  const formatValue = (d: Date) => {
    if (!d) return "";
    if (mode === "time") {
      return d.toTimeString().slice(0, 5);
    }
    if (mode === "datetime") {
      return d.toISOString().slice(0, 16);
    }
    return d.toISOString().slice(0, 10);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = new Date(e.target.value);
    if (!isNaN(dateValue.getTime()) && onChange) {
      onChange({ type: "set", nativeEvent: {} }, dateValue);
    }
  };

  return (
    <input
      type={inputType}
      value={formatValue(value)}
      min={minimumDate ? formatValue(minimumDate) : undefined}
      max={maximumDate ? formatValue(maximumDate) : undefined}
      onChange={handleChange}
      style={{
        border: "1px solid #334155",
        borderRadius: 10,
        padding: "8px 12px",
        background: "#1e293b",
        color: "#f1f5f9",
        fontSize: 14,
        outline: "none",
        cursor: "pointer",
        ...(style || {}),
      }}
    />
  );
}
