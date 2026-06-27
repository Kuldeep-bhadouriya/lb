import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
});
