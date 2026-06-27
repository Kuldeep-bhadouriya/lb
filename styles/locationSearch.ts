import { StyleSheet } from "react-native";
import { lightTheme } from "../theme/colors";

export const locationSearchStyles = (colors = lightTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      padding: 8,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontWeight: "700",
      fontSize: 16,
      color: colors.text,
    },
    input: {
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: colors.card,
      color: colors.text,
    },
    listView: {
      backgroundColor: colors.background,
      borderRadius: 8,
      elevation: 2,
    },
    actionBtn: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    actionRow: {
      flexDirection: "row",
      marginTop: 12,
      gap: 8,
    },
  });
