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
  );
}

const styles = StyleSheet.create({
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
