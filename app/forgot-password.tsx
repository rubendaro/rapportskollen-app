import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "../constants/theme";

export default function ForgotPassword() {
  const theme = useTheme();
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
      const response = await fetch(
        "https://rapportskollen.com/user/forget_do.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `email=${encodeURIComponent(email)}`,
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert("✅ E-post skickad", "Kolla din inkorg.");
        router.replace("/login");
      } else {
        Alert.alert("Fel", data.message || "Kunde inte skicka e-post.");
      }
    } catch {
      Alert.alert("Fel", "Serverfel. Försök igen.");
    }

    setLoading(false);
  };

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: theme.COLORS.background }
      ]}
    >

      <Text style={[styles.title, { color: theme.COLORS.text }]}>
        Glömt lösenord?
      </Text>

      <Text style={[styles.info, { color: theme.COLORS.textSecondary }]}>
        Ange din e-postadress så skickar vi instruktioner.
      </Text>

      <View 
        style={[
          styles.inputContainer,
          { 
            backgroundColor: theme.COLORS.card,
            borderColor: theme.COLORS.border
          }
        ]}
      >
        <MaterialIcons 
          name="email" 
          size={22} 
          color={theme.COLORS.gray} 
          style={styles.icon} 
        />

        <TextInput
          style={[
            styles.input,
            { color: theme.COLORS.text }
          ]}
          placeholder="E-postadress"
          placeholderTextColor={theme.COLORS.gray}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme.COLORS.primary }
        ]}
        disabled={loading}
        onPress={handleReset}
      >
        <Text style={styles.buttonText}>
          {loading ? "Skickar…" : "Skicka återställningslänk"}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },

  info: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    marginBottom: 15,
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
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
