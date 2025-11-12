import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button, Vibration } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

export default function QrScan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  if (!permission) return <Text>Laddar kamera...</Text>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Behöver kameratillstånd</Text>
        <Button title="Tillåt kamera" onPress={requestPermission} />
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
    <View style={styles.container}>
      <Text style={styles.title}>Skanna QR-kod</Text>

      <View style={styles.box}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanned ? undefined : handleScan}
        />
      </View>

      {scanned && (
        <Button title="Skanna igen" onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  box: { width: "90%", height: 300, borderRadius: 10, overflow: "hidden" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
