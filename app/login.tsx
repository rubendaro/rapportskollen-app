import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../constants/theme";

const logo: any = require("../assets/images/logo.png");

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Load saved login data
  useEffect(() => {
    const loadSavedLogin = async () => {
      const savedEmail = await SecureStore.getItemAsync("savedEmail");
      const savedPassword = await SecureStore.getItemAsync("savedPassword");

      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
    };
    loadSavedLogin();
  }, []);

  // LOGIN HANDLER
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Fel", "Fyll i både e-post och lösenord.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://rapportskollen.com/mobile/login.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body:
            `username=${encodeURIComponent(email)}` +
            `&password=${encodeURIComponent(password)}`,
        }
      );

      const data = JSON.parse(await response.text());

      if (!data.success) {
        Alert.alert("Fel", data.message || "Felaktig inloggning.");
        return;
      }

      // 🔐 Save session
      await SecureStore.setItemAsync("phpSessionId", String(data.session_id ?? ""));
      await SecureStore.setItemAsync("userID", String(data.user_id ?? ""));
      await SecureStore.setItemAsync("userName", String(data.name ?? ""));

      // 🔐 Save manual mode
      await SecureStore.deleteItemAsync("userManual");
      if (data.manual != null) {
        await SecureStore.setItemAsync("userManual", String(data.manual));
      }

      // 🔐 Save address if present
      if (data.address) {
        await SecureStore.setItemAsync("checkedAddress", data.address);
      } else {
        await SecureStore.deleteItemAsync("checkedAddress");
      }

      // Save email/password locally
      await SecureStore.setItemAsync("savedEmail", email);
      await SecureStore.setItemAsync("savedPassword", password);

      router.replace("/");
    } catch (e) {
      Alert.alert("Fel", "Kunde inte ansluta till servern.");
    } finally {
      setLoading(false);
    }
  };

  // FORGOT PASSWORD HANDLER
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert("Fel", "Du måste ange e-post.");
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch(
        "https://rapportskollen.com/user/forget_do.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `mail=${encodeURIComponent(forgotEmail)}`,
        }
      );

      const txt = await res.text();

      if (txt.includes("OK")) {
        Alert.alert("OK", "Instruktion skickad.");
        setForgotModalVisible(false);
        setForgotEmail("");
      } else {
        Alert.alert("Fel", "Kunde inte skicka.");
      }
    } catch {
      Alert.alert("Fel", "Serverfel.");
    }

    setForgotLoading(false);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.COLORS.background },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="large" color={theme.COLORS.primary} />
      ) : (
        <>
          {/* LOGO */}
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} />
            <Text style={[styles.tagline, { color: theme.COLORS.primary }]}>
              Rapportskollen
            </Text>
            <Text style={[styles.subtitle, { color: theme.COLORS.gray }]}>
              Smart tidrapportering
            </Text>
          </View>

          {/* TITLE */}
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: theme.COLORS.text,
              marginBottom: 10,
            }}
          >
            Logga in
          </Text>

          {/* EMAIL */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.COLORS.card,
                color: theme.COLORS.text,
                borderColor: theme.COLORS.border,
              },
            ]}
            placeholder="E-postadress"
            placeholderTextColor={theme.COLORS.gray}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          {/* PASSWORD */}
          <View
            style={[
              styles.passwordContainer,
              {
                backgroundColor: theme.COLORS.card,
                borderColor: theme.COLORS.border,
              },
            ]}
          >
            <TextInput
              style={{
                flex: 1,
                color: theme.COLORS.text,
                paddingVertical: 12,
                fontSize: 16,
              }}
              placeholder="Lösenord"
              placeholderTextColor={theme.COLORS.gray}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color={theme.COLORS.gray}
              />
            </TouchableOpacity>
          </View>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.COLORS.primary },
            ]}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>Logga in</Text>
          </TouchableOpacity>

          {/* FORGOT PASSWORD */}
          <TouchableOpacity onPress={() => setForgotModalVisible(true)}>
            <Text
              style={[
                styles.forgotPasswordText,
                { color: theme.COLORS.textSecondary },
              ]}
            >
              Glömt lösenord?
            </Text>
          </TouchableOpacity>

          {/* MODAL */}
          <Modal visible={forgotModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContainer,
                  { backgroundColor: theme.COLORS.card },
                ]}
              >
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.COLORS.text },
                  ]}
                >
                  Återställ lösenord
                </Text>

                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.COLORS.card,
                      color: theme.COLORS.text,
                      borderColor: theme.COLORS.border,
                    },
                  ]}
                  placeholder="Din e-post"
                  placeholderTextColor={theme.COLORS.gray}
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                />

                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: theme.COLORS.primary },
                  ]}
                  onPress={handleForgotPassword}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color={theme.COLORS.white} />
                  ) : (
                    <Text style={styles.buttonText}>Skicka</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setForgotModalVisible(false)}
                  style={{ marginTop: 14 }}
                >
                  <Text style={{ color: theme.COLORS.textSecondary }}>
                    Avbryt
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 8,
  },

  tagline: { fontSize: 20, fontWeight: "700" },

  subtitle: { fontSize: 14, marginTop: 2 },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },

  passwordContainer: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 15,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  forgotPasswordText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  modalContainer: {
    width: "85%",
    padding: 24,
    borderRadius: 14,
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },

  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    width: "100%",
    marginBottom: 16,
  },

  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
});

