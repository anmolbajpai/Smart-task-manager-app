import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const showToast = (msg: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert("Message", msg);
    }
  };

  const handleLogin = async () => {
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setLoading(false);
      showToast("Email and password are required ❌");
      return;
    }

    const formData = { email, password };
    console.log("Request body:", JSON.stringify(formData));

    try {
      const res = await fetch("https://10.202.227.247:8888/taskmanager/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Login response data:", data);

        await AsyncStorage.setItem("token", data.token);
        showToast("User login successful 🎉");

        setEmail("");
        setPassword("");
        setLoading(false);

        router.push("/"); // navigate to Home screen
      } else {
        const error = await res.json();
        showToast(error.message || "Something went wrong ❌");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      showToast("Server error 🚨");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Login</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.text}>
        Don’t have an account?{" "}
        <Text style={styles.link} onPress={() => router.push("/signup")}>
          Register yourself
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", color: "#007AFF", marginBottom: 30, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, marginBottom: 15 },
  btn: { backgroundColor: "#007AFF", borderRadius: 10, padding: 15, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 18 },
  text: { textAlign: "center", marginTop: 20, fontSize: 16 },
  link: { color: "#007AFF", fontWeight: "bold" },
});
