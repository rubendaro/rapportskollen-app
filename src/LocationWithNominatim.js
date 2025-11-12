import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';

export default function LocationWithNominatim() {
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    setErrorMsg(null);
    setAddress(null);
    setLoading(true);

    // Ask for permission
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      setLoading(false);
      return;
    }

    // Get coordinates
    const loc = await Location.getCurrentPositionAsync({});
    setCoords(loc.coords);

    try {
      // Reverse geocoding with Nominatim (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'RapportskollenApp/1.0 (your-email@example.com)', // 👈 change this
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch address');
      const data = await response.json();
      setAddress(data);
    } catch (error) {
      setErrorMsg('Failed to get address');
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Button title="📍 Get My Location" onPress={getLocation} />

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

      {coords && (
        <Text style={styles.text}>
          Latitude: {coords.latitude.toFixed(6)}{"\n"}
          Longitude: {coords.longitude.toFixed(6)}
        </Text>
      )}

      {address && (
        <Text style={styles.text}>
          🏠 {address.display_name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginTop: 20,
  },
});
