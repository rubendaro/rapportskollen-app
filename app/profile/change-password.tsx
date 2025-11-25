import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../constants/theme";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert("Fel", "Alla fält måste fyllas i.");      
      return;
    }

    if (newPass !== confirmPass) {
      Alert.alert("Fel", "Lösenorden matchar inte.");
      return;
    }

    setLoading(true);

    try {
      const sessionId = await SecureStore.getItemAsync("phpSessionId");
      if (!sessionId) {
        Alert.alert("Fel", "Inte inloggad. Logga in igen.");
        router.replace("/login");
        return;
      }

      const response = await fetch(
        "https://rapportskollen.com/mobile/change_password.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: `PHPSESSID=${sessionId}`,
          },
          body: `current=${encodeURIComponent(currentPass)}&new=${encodeURIComponent(newPass)}&confirm=${encodeURIComponent(confirmPass)}`,
        }
      );

      const text = await response.text();
      const data = JSON.parse(text);

      if (data.success) {
        Alert.alert("✅ Klart", "Lösenordet ändrades.");
        router.back();
      } else {
        Alert.alert("Fel", data.message || "Misslyckades med att ändra lösenord.");
      }

    } catch (error) {
      Alert.alert("Fel", "Serverproblem. Försök igen.");
    }

    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.COLORS.background }]}>
      <Text style={[styles.title, { color: theme.COLORS.text }]}>
        Byt lösenord
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.COLORS.card,
            color: theme.COLORS.text,
            borderColor: theme.COLORS.border,
          },
        ]}
        placeholder="Nuvarande lösenord"
        placeholderTextColor={theme.COLORS.gray}
        secureTextEntry
        value={currentPass}
        onChangeText={setCurrentPass}
      />

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.COLORS.card,
            color: theme.COLORS.text,
            borderColor: theme.COLORS.border,
          },
        ]}
        placeholder="Nytt lösenord"
        placeholderTextColor={theme.COLORS.gray}
        secureTextEntry
        value={newPass}
        onChangeText={setNewPass}
      />

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.COLORS.card,
            color: theme.COLORS.text,
            borderColor: theme.COLORS.border,
          },
        ]}
        placeholder="Bekräfta nytt lösenord"
        placeholderTextColor={theme.COLORS.gray}
        secureTextEntry
        value={confirmPass}
        onChangeText={setConfirmPass}
      />

      <TouchableOpacity
        style={[styles.buttonPrimary, { backgroundColor: theme.COLORS.primary }]}
        onPress={handleChangePassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonPrimaryText}>Uppdatera</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },

  input: {
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
  },

  buttonPrimary: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },

  buttonPrimaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
  },
});
