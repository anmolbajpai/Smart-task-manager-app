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
import { useRouter } from "expo-router";

export default function SignupScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

  const showToast = (msg: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert("Message", msg);
    }
  };

  const handleSignup = async () => {
    setLoading(true);

    if (!username.trim() || !email.trim() || !password.trim()) {
      setLoading(false);
      showToast("All fields are required ❌");
      return;
    }

    if (!emailRegex.test(email)) {
      setLoading(false);
      showToast("Please enter a valid email 📧");
      return;
    }

    if (!passwordRegex.test(password)) {
      setLoading(false);
      showToast(
        "Password must include letters, numbers & special characters 🔒"
      );
      return;
    }

    const formData = { username, email, password };
    console.log("Request body:", JSON.stringify(formData));

    try {
      const res = await fetch("https://10.202.227.247:8888/taskmanager/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast("User registered successfully 🎉");
        setUsername("");
        setEmail("");
        setPassword("");
        setLoading(false);
        router.push("/login");
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
      <Text style={styles.title}>Sign Up</Text>

      <TextInput
        placeholder="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        placeholder="Email"
        style={styles.input}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
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
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.text}>
        Already have an account?{" "}
        <Text style={styles.link} onPress={() => router.push("/login")}>
          Login
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
