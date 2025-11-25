import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useTheme } from "../../constants/theme";

export default function Profile() {
  const theme = useTheme();
  const router = useRouter();

  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      setName(await SecureStore.getItemAsync("userName"));
      setEmail(await SecureStore.getItemAsync("savedEmail"));

      const savedAvatar = await SecureStore.getItemAsync("userAvatar");
      const savedCompanyLogo = await SecureStore.getItemAsync("companyLogo");

      if (savedAvatar) setAvatar(savedAvatar);
      if (savedCompanyLogo) setCompanyLogo(savedCompanyLogo);
    };

    loadUser();
  }, []);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Behörighet krävs", "Du måste tillåta åtkomst till bilder.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      await SecureStore.setItemAsync("userAvatar", uri);
    }
  };

  const displayImage =
    avatar
      ? { uri: avatar }
      : companyLogo
      ? { uri: companyLogo }
      : require("../../assets/images/logo.png");

  return (
    <View style={[styles.container, { backgroundColor: theme.COLORS.background }]}>
      {/* Avatar */}
      <TouchableOpacity
        style={[
          styles.avatarWrapper,
          { borderColor: theme.COLORS.primary },
        ]}
        onPress={pickImage}
      >
        <Image source={displayImage} style={styles.avatar} />
      </TouchableOpacity>

      <Text style={[styles.nameText, { color: theme.COLORS.text }]}>
        {name ?? "Användare"}
      </Text>

      <Text style={[styles.emailText, { color: theme.COLORS.gray }]}>
        {email ?? ""}
      </Text>

      {/* Buttons */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.COLORS.primary }]}
        onPress={() => alert("Edit profile coming soon!")}
      >
        <MaterialIcons name="edit" size={22} color="#fff" />
        <Text style={styles.buttonText}>Redigera profil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.COLORS.primary }]}
        onPress={() => router.push("/profile/change-password")}
      >
        <MaterialIcons name="lock" size={22} color="#fff" />
        <Text style={styles.buttonText}>Ändra lösenord</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.COLORS.primary }]}
        onPress={() => alert("Rapportskollen App\nVersion 1.0")}
      >
        <MaterialIcons name="info" size={22} color="#fff" />
        <Text style={styles.buttonText}>Om appen</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    paddingTop: 50,
  },

  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: "cover",
    backgroundColor: "#eee",
  },

  nameText: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },

  emailText: {
    fontSize: 14,
    marginBottom: 25,
  },

  button: {
    width: "90%",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 12,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
});
