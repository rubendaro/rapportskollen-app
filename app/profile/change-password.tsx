import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { BUTTON, COLORS, FONT, SPACING } from "../../constants/theme";

export default function ChangePasswordScreen() {
  const router = useRouter();
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

     const response = await fetch("https://rapportskollen.com/mobile/change_password.php", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: `PHPSESSID=${sessionId}`,
  },
  body: `current=${encodeURIComponent(currentPass)}&new=${encodeURIComponent(newPass)}&confirm=${encodeURIComponent(confirmPass)}`,
});

      const text = await response.text();
      console.log("🔐 Change pass response:", text);
      const data = JSON.parse(text);

      if (data.success) {
        Alert.alert("✅ Klart", "Lösenordet ändrades.");
        router.back();
      } else {
        Alert.alert("Fel", data.message || "Misslyckades med att ändra lösenord.");
      }

    } catch (error) {
      console.log("❌ ERROR:", error);
      Alert.alert("Fel", "Serverproblem. Försök igen.");
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Byt lösenord</Text>

      <TextInput
        style={styles.input}
        placeholder="Nuvarande lösenord"
        secureTextEntry
        value={currentPass}
        onChangeText={setCurrentPass}
      />

      <TextInput
        style={styles.input}
        placeholder="Nytt lösenord"
        secureTextEntry
        value={newPass}
        onChangeText={setNewPass}
      />

      <TextInput
        style={styles.input}
        placeholder="Bekräfta nytt lösenord"
        secureTextEntry
        value={confirmPass}
        onChangeText={setConfirmPass}
      />

      <TouchableOpacity style={BUTTON.primary} onPress={handleChangePassword} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={BUTTON.primaryText}>Uppdatera</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.l, backgroundColor: COLORS.background },
  title: { ...FONT.title, color: COLORS.secondary, marginBottom: SPACING.l, textAlign: "center" },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.gray,
    fontSize: 16,
    marginBottom: SPACING.m,
  },
});
