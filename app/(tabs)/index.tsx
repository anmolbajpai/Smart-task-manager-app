<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const [task, setTask] = useState("");
  const [todos, setTodos] = useState([]);
  const [username, setUsername] = useState("");
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // ✅ Fetch token from AsyncStorage on load
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        setToken(storedToken);
      } catch (err) {
        console.error("Error fetching token:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  // ✅ Fetch username when token is available
  useEffect(() => {
    if (token) getUsername();
  }, [token]);

  const getUsername = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8888/taskmanager/auth/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUsername(data.username);
      } else {
        const error = await res.json();
        setErrMsg(error.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      setErrMsg("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    setUsername("");
    setToken(null);
    Alert.alert("Success", "Logged out successfully");
    router.push("/");
  };

  // ✅ Add a new task
  const addTask = () => {
    if (task.trim() === "") return;
    const newTask = { id: Date.now(), text: task, done: false };
    setTodos([newTask, ...todos]);
    setTask("");
  };

  // ✅ Toggle task completion
  const toggleDone = (id) => {
    setTodos(
      todos.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  // ✅ Delete a task
  const deleteTask = (id) => {
    setTodos(todos.filter((item) => item.id !== id));
  };

  const renderItem = ({ item }) => (
    <View style={styles.todoItem}>
      <TouchableOpacity onPress={() => toggleDone(item.id)} style={{ flex: 1 }}>
        <Text
          style={[
            styles.todoText,
            item.done && { textDecorationLine: "line-through", color: "#999" },
          ]}
        >
          {item.text}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteTask(item.id)}>
        <Text style={styles.deleteBtn}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📝 My To-Do List</Text>

        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : username ? (
          <View style={styles.userBox}>
            <Text style={styles.username}>👋 {username}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleLogout}>
              <Text style={styles.addText}>Logout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.loginBtn}>Login/Signup</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter a new task..."
          value={task}
          onChangeText={setTask}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTask}>
          <Text style={styles.addText}>＋</Text>
        </TouchableOpacity>
      </View>

      {todos.length === 0 ? (
        <Text style={styles.emptyText}>No tasks yet. Add one 👇</Text>
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      )}
    </KeyboardAvoidingView>
=======
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  // Example user data (replace with your authentication context or Supabase user)
  const [userName, setUserName] = useState("Mayank");
  const [reminders, setReminders] = useState([
    { id: 1, title: "Complete project", time: "10:00 AM" },
    { id: 2, title: "Team meeting", time: "2:00 PM" },
  ]);
  const [taskData, setTaskData] = useState({
    completed: 7,
    pending: 3,
  });

  // Chart data
  const chartData = [
    {
      name: "Completed",
      population: taskData.completed,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Pending",
      population: taskData.pending,
      color: "#F44336",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ];

  // Features list
  const features = [
    {
      icon: "notifications",
      title: "Smart Reminders",
      desc: "Get notified for upcoming deadlines and daily goals.",
      color: "#FFA726",
    },
    {
      icon: "mic",
      title: "Voice Commands",
      desc: "Add tasks or reminders using speech recognition.",
      color: "#42A5F5",
    },
    {
      icon: "bar-chart",
      title: "Analytics",
      desc: "Visualize your progress with daily stats.",
      color: "#AB47BC",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Animated.View entering={FadeInDown.duration(700)}>
        <Text style={styles.welcome}>Welcome back,</Text>
        <Text style={styles.username}>{userName} 👋</Text>
      </Animated.View>

      {/* Reminders Section */}
      <Animated.View entering={FadeInDown.delay(200).duration(700)} style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Reminders</Text>
        {reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderCard}>
            <Ionicons name="alarm-outline" size={22} color="#FF7043" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.reminderTitle}>{reminder.title}</Text>
              <Text style={styles.reminderTime}>{reminder.time}</Text>
            </View>
          </View>
        ))}
      </Animated.View>

      {/* Task Progress Chart */}
      <Animated.View entering={FadeInDown.delay(400).duration(700)} style={styles.section}>
        <Text style={styles.sectionTitle}>Your Task Progress</Text>
        <PieChart
          data={chartData}
          width={screenWidth - 40}
          height={180}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#f9f9f9",
            backgroundGradientTo: "#fff",
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor={"population"}
          backgroundColor={"transparent"}
          paddingLeft={"15"}
          hasLegend={true}
          absolute
        />
      </Animated.View>

      {/* Features Section */}
      <Animated.View entering={FadeInDown.delay(600).duration(700)} style={styles.section}>
        <Text style={styles.sectionTitle}>App Features</Text>
        {features.map((feature, index) => (
          <View key={index} style={[styles.featureCard, { backgroundColor: feature.color + "20" }]}>
            <Ionicons name={feature.icon as any} size={26} color={feature.color} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          </View>
        ))}
      </Animated.View>

      {/* Add Task Button */}
      {/* <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add-circle" size={60} color="#4CAF50" />
      </TouchableOpacity> */}
    </ScrollView>
>>>>>>> origin/master
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 50 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#007AFF" },
  loginBtn: { fontSize: 16, color: "#007AFF", fontWeight: "bold" },
  username: { fontSize: 16, color: "#007AFF", fontWeight: "bold" },
  inputContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  input: {
    flex: 1,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  userBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  addBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginLeft: 10,
  },
  addText: { color: "white", fontSize: 16 },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  todoText: { fontSize: 16 },
  deleteBtn: { fontSize: 18, color: "red", marginLeft: 10 },
  emptyText: { textAlign: "center", color: "#999", marginTop: 50, fontSize: 16 },
});
=======
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 20,
  },
  welcome: {
    fontSize: 20,
    color: "#444",
  },
  username: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 15,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  reminderTime: {
    color: "#666",
    fontSize: 13,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  featureDesc: {
    fontSize: 13,
    color: "#555",
  },
  addButton: {
    alignItems: "center",
    marginTop: 10,
  },
});

>>>>>>> origin/master
