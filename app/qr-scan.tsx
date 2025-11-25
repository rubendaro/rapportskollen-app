import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, Vibration, View } from "react-native";
import { useTheme } from "../constants/theme";

export default function QrScan() {
  const theme = useTheme();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  if (!permission)
    return (
      <View style={[styles.center, { backgroundColor: theme.COLORS.background }]}>
        <Text style={{ color: theme.COLORS.text }}>Laddar kamera...</Text>
      </View>
    );

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: theme.COLORS.background }]}>
        <Text style={{ color: theme.COLORS.text }}>Behöver kameratillstånd</Text>

        <TouchableOpacity style={theme.BUTTON.primary} onPress={requestPermission}>
          <Text style={theme.BUTTON.primaryText}>Tillåt kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = ({ data }: any) => {
    if (scanned) return;

    if (!data) return;
    setScanned(true);
    Vibration.vibrate(50);

    setTimeout(() => {
      router.push(`/qr-check?token=${encodeURIComponent(data)}`);
    }, 150);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.COLORS.background }]}>
      <Text style={[styles.title, { color: theme.COLORS.text }]}>
        Skanna QR-kod
      </Text>

      <View style={[styles.box, { borderColor: theme.COLORS.primary }]}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanned ? undefined : handleScan}
        />
      </View>

      {scanned && (
        <TouchableOpacity
          style={[theme.BUTTON.secondary, { marginTop: 20 }]}
          onPress={() => setScanned(false)}
        >
          <Text style={theme.BUTTON.secondaryText}>Skanna igen</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, alignItems: "center", gap: 20 },
  title: { fontSize: 22, fontWeight: "700" },
  box: {
    width: "90%",
    height: 300,
    borderWidth: 3,
    borderRadius: 15,
    overflow: "hidden",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
