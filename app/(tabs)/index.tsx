import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { COLORS } from "../../constants/theme";

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [checkedAddress, setCheckedAddress] = useState<string | null>(null);
  const [manual, setManual] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  const validateSession = async () => {
    const sessionId = await SecureStore.getItemAsync("phpSessionId");
    if (!sessionId) return false;

    try {
      const response = await fetch(
        "https://rapportskollen.com/mobile/session_check.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `session_id=${encodeURIComponent(sessionId)}`,
        }
      );

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return false;
      }
      return data.success === true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      const valid = await validateSession();
      if (!valid) return router.replace("/login");

      const name = await SecureStore.getItemAsync("userName");
      const manualValue = await SecureStore.getItemAsync("userManual");
      const logo = await SecureStore.getItemAsync("companyLogo");

      setUserName(name);
      setManual(manualValue);
      if (logo) setCompanyLogo(logo);
    };

    init();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const refresh = async () => {
        const valid = await validateSession();
        if (!valid) return router.replace("/login");

        setManual(await SecureStore.getItemAsync("userManual"));
        setCheckedAddress(await SecureStore.getItemAsync("checkedAddress"));
      };

      refresh();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert("Logga ut", "Är du säker?", [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Logga ut",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("phpSessionId");
          await SecureStore.deleteItemAsync("userID");
          await SecureStore.deleteItemAsync("userName");
          await SecureStore.deleteItemAsync("userManual");
          await SecureStore.deleteItemAsync("checkedAddress");
          await SecureStore.deleteItemAsync("companyLogo");

          router.replace("/login");
        },
      },
    ]);
  };

  const renderManualButton = () => {
    switch (manual) {
      case "0":
        return (
          <Card
            icon="my-location"
            label="Check GPS"
            onPress={() => router.push("/gps-check")}
          />
        );
      case "1":
        return (
          <Card
            icon="edit-location-alt"
            label="Check in/ut"
            onPress={() => router.push("/manual-check")}
          />
        );
      case "2":
        return (
          <Card
            icon="schedule"
            label="Rapportera Tid"
            onPress={() => router.push("/report-hours")}
          />
        );
      case "3":
        return (
          <Card
            icon="nfc"
            label="NFC Check"
            onPress={() => router.push("/nfc-check")}
          />
        );
      case "4":
        return (
          <Card
            icon="qr-code"
            label="QR Check"
            onPress={() => router.push("/qr-scan")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ✅ Profile Header */}
      <View style={styles.headerBox}>
        <View style={styles.logoWrapper}>
          {companyLogo ? (
            <Image source={{ uri: companyLogo }} style={styles.companyLogo} />
          ) : (
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.companyLogo}
            />
          )}
        </View>

        <Text style={styles.welcomeText}>
          {userName ? `Hej ${userName}!` : "Laddar användare..."}
        </Text>

        {checkedAddress && (
          <View style={styles.checkedBox}>
            <MaterialIcons name="check-circle" size={20} color="#fff" />
            <Text style={styles.checkedText}>
              Incheckad på{" "}
              <Text style={{ fontWeight: "700" }}>{checkedAddress}</Text>
            </Text>
          </View>
        )}
      </View>

      {/* ✅ Dashboard Grid */}
      <View style={styles.grid}>
        <Card
          icon="history"
          label="Historik"
          onPress={() => router.push("/old-hours-screen")}
        />

        <Card
          icon="access-time"
          label="Tidrapport"
          onPress={() => router.push("/reported-hours-screen")}
        />

        <Card
          icon="place"
          label="Plats"
          onPress={() => router.push("/plats")}
        />

        {renderManualButton()}
      </View>

      {/* ✅ Profile Menu */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/profile")}
        >
          <MaterialIcons name="person" size={24} color={COLORS.primary} />
          <Text style={styles.menuText}>Profil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color={COLORS.error} />
          <Text style={[styles.menuText, { color: COLORS.error }]}>
            Logga ut
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ✅ FIXED: FULLY TYPED CARD COMPONENT */
type CardProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
};

function Card({ icon, label, onPress }: CardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <MaterialIcons name={icon} size={34} color="#fff" />
      <Text style={styles.cardLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 40,
    paddingBottom: 60,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },

  headerBox: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },

  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },

  companyLogo: {
    width: "60%",
    height: "60%",
    resizeMode: "contain",
  },

  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 12,
    color: COLORS.secondary,
  },

  checkedBox: {
    marginTop: 12,
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  checkedText: {
    color: "#fff",
    fontSize: 14,
  },

  grid: {
    width: "90%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 40,
  },

  card: {
    width: "47%",
    aspectRatio: 1,
    backgroundColor: COLORS.success,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  cardLabel: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
  },

  menuContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },

  menuItem: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ececec",
  },

  menuText: {
    fontSize: 18,
    color: COLORS.secondary,
    fontWeight: "500",
  },
});
