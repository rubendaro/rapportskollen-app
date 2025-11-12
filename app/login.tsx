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
import { BUTTON, COLORS, FONT, SPACING } from "../constants/theme";

const logo: any = require("../assets/images/logo.png");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const router = useRouter();

  // ✅ Load saved login
  useEffect(() => {
    const loadSavedLogin = async () => {
      const savedEmail = await SecureStore.getItemAsync("savedEmail");
      const savedPassword = await SecureStore.getItemAsync("savedPassword");

      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
    };
    loadSavedLogin();
  }, []);

  // ✅ Login + Save session + Validate it using Cookie header
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Fel", "Fyll i både e-post och lösenord.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Login request
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

      const text = await response.text();
      console.log(" SERVER RAW RESPONSE:", text);

      const data = JSON.parse(text);

      if (!data.success) {
        Alert.alert("Fel", data.message || "Felaktig inloggning.");
        return;
      }

      const sessionId = String(data.session_id ?? "");
      const userId = String(data.user_id ?? "");

      // ✅ Save session
      await SecureStore.setItemAsync("phpSessionId", sessionId);
      await SecureStore.setItemAsync("userID", userId);
      await SecureStore.setItemAsync("userName", String(data.name ?? ""));

      // ✅ Save manual (reset first)
      await SecureStore.deleteItemAsync("userManual");
      if (data.manual != null) {
        await SecureStore.setItemAsync("userManual", String(data.manual));
      }
      console.log("✅ Login stored manual =", data.manual);

      // ✅ Save company logo only once
      if (data.company_logo) {
        const existing = await SecureStore.getItemAsync("companyLogo");
        if (!existing) {
          await SecureStore.setItemAsync("companyLogo", data.company_logo);
          console.log("✅ Saved company logo:", data.company_logo);
        }
      }

      // ✅ Save autofill
      await SecureStore.setItemAsync("savedEmail", email);
      await SecureStore.setItemAsync("savedPassword", password);

      // ✅ VALIDATE SESSION (IMPORTANT FOR REAL iPHONE)
      const checkRes = await fetch(
        "https://rapportskollen.com/mobile/session_check.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: `PHPSESSID=${sessionId}`, // ✅ MUST FOR iPhone
          },
          body: `session_id=${sessionId}&rid=${userId}`,
        }
      );

      const checkText = await checkRes.text();
      console.log("📥 Session check response:", checkText);

      const checkJson = JSON.parse(checkText);

      if (!checkJson.success) {
        Alert.alert("Session fel", "Kan inte verifiera sessionen.");
        return;
      }

      // ✅ Everything OK → Go home
      router.replace("/");

    } catch (err) {
      console.log("❌ LOGIN ERROR:", err);
      Alert.alert("Fel", "Kunde inte ansluta till servern.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Forgot password
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert("Fel", "Ange din e-postadress.");
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

      const text = await res.text();
      console.log("📩 Forgot password response:", text);

      if (text.includes("OK")) {
        Alert.alert("✅ E-post skickad", "Instruktioner har skickats till din e-post.");
        setForgotModalVisible(false);
        setForgotEmail("");
      } else {
        Alert.alert("Fel", "Kunde inte skicka e-post.");
      }

    } catch (err) {
      console.log("❌ Forgot error:", err);
      Alert.alert("Fel", "Ett fel uppstod.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} />
            <Text style={styles.tagline}>Rapportskollen</Text>
            <Text style={styles.subtitle}>Smart tidrapportering.</Text>
          </View>

          <Text style={[FONT.title, { color: COLORS.secondary }]}>Logga in</Text>

          <TextInput
            style={styles.input}
            placeholder="E-postadress"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0 }]}
              placeholder="Lösenord"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color={COLORS.gray}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[BUTTON.primary, { marginTop: SPACING.l }]}
            onPress={handleLogin}
          >
            <Text style={BUTTON.primaryText}>Logga in</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setForgotModalVisible(true)}>
            <Text style={styles.forgotPasswordText}>Glömt lösenord?</Text>
          </TouchableOpacity>

          {/* ✅ Forgot password modal */}
          <Modal
            visible={forgotModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setForgotModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Återställ lösenord</Text>

                <TextInput
                  style={styles.modalInput}
                  placeholder="Din e-postadress"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                />

                <TouchableOpacity
                  style={[BUTTON.primary, { marginTop: SPACING.m }]}
                  onPress={handleForgotPassword}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={BUTTON.primaryText}>Skicka</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setForgotModalVisible(false)}
                  style={{ marginTop: SPACING.m }}
                >
                  <Text style={{ color: COLORS.secondary }}>Avbryt</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

// ✅ Styles stay the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: SPACING.l,
    backgroundColor: COLORS.background,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SPACING.l,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 8,
  },
  tagline: { fontSize: 20, fontWeight: "700", color: COLORS.primary },
  subtitle: { fontSize: 14, color: COLORS.gray, marginTop: 2 },

  input: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginBottom: SPACING.m,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.gray,
    fontSize: 16,
    width: "100%",
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray,
    marginBottom: SPACING.m,
    paddingHorizontal: 10,
  },

  eyeButton: { paddingHorizontal: 8, paddingVertical: 8 },

  forgotPasswordText: {
    marginTop: SPACING.m,
    textAlign: "center",
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    backgroundColor: COLORS.white,
    width: "85%",
    borderRadius: 12,
    padding: SPACING.l,
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: SPACING.m,
  },

  modalInput: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginBottom: SPACING.m,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.gray,
    fontSize: 16,
    width: "100%",
  },
});
