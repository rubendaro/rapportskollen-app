import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";

const COLORS = {
  background: "#FFFFFF",
  primary: "#7EB734",
  secondary: "#2D3748",
  gray: "#718096",
};

export default function Profile() {
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
    <View style={styles.container}>

      {/* ✅ Tap circle to pick image */}
      <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
        <Image source={displayImage} style={styles.avatar} />
      </TouchableOpacity>

      <Text style={styles.nameText}>{name ?? "Användare"}</Text>
      <Text style={styles.emailText}>{email ?? ""}</Text>

      <TouchableOpacity style={styles.button} onPress={() => alert("Edit profile coming soon!")}>
        <MaterialIcons name="edit" size={22} color="#fff" />
        <Text style={styles.buttonText}>Redigera profil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/profile/change-password")}
      >
        <MaterialIcons name="lock" size={22} color="#fff" />
        <Text style={styles.buttonText}>Ändra lösenord</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => alert("Rapportskollen App\nVersion 1.0")}>
        <MaterialIcons name="info" size={22} color="#fff" />
        <Text style={styles.buttonText}>Om appen</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    alignItems: "center",
    paddingTop: 50,
  },

 avatarWrapper: {
  width: 120,
  height: 120,
  borderRadius: 60,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12,
},

avatar: {
  width: 120,
  height: 120,
  borderRadius: 60,
  resizeMode: "cover",   // ✅ full image crop like real avatar
  backgroundColor: "#eee", // subtle background in case no logo
},


  nameText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.secondary,
  },

  emailText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 25,
  },

  button: {
    width: "90%",
    backgroundColor: COLORS.primary,
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
