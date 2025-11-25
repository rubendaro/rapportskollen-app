import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detta är ett popup-fönster</Text>

      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Tillbaka hem</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  link: {
    marginTop: 20,
  },
  linkText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007aff",
  },
});
