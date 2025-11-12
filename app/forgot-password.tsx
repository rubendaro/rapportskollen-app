import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Fel", "Fyll i din e-postadress.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://rapportskollen.com/user/forget_do.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `email=${encodeURIComponent(email)}`,
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert("✅ E-post skickad", "Kolla din inkorg för återställningslänk.");
        router.replace("/login");
      } else {
        Alert.alert("Fel", data.message || "Kunde inte skicka e-post.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Fel", "Kunde inte ansluta till servern.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Glömt lösenord?</Text>
      <Text style={styles.info}>
        Ange din e-postadress så skickar vi instruktioner för att återställa ditt lösenord.
      </Text>

      <View style={styles.inputContainer}>
        <MaterialIcons name="email" size={22} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="E-postadress"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? "Skickar..." : "Skicka återställningslänk"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f3f4f6",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  info: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
    color: "#555",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
