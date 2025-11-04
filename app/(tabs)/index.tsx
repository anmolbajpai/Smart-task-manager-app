import { TaskItem } from "@/types/task";
import { loadMedications, loadTasks } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import Animated, { FadeInDown } from "react-native-reanimated";

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [medications, setMedications] = useState<any[]>([]);

  // Real task stats from loaded data
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const urgentTasks = tasks.filter((t) => t.mode === "urgent" && !t.completed).length;

  // Chart data
  const pieChartData = [
    {
      name: "Completed",
      population: completedTasks,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Pending",
      population: pendingTasks,
      color: "#F44336",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ];

  // Mode distribution
  const modeChartData = [
    {
      name: "Urgent",
      population: tasks.filter((t) => t.mode === "urgent" && !t.completed).length,
      color: "#EF4444",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "Important",
      population: tasks.filter((t) => t.mode === "important" && !t.completed).length,
      color: "#F59E0B",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "Optional",
      population: tasks.filter((t) => t.mode === "optional" && !t.completed).length,
      color: "#6B7280",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
  ];

  // Fetch token and username
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        setToken(storedToken);
        if (!storedToken) return setLoading(false);

        const res = await fetch("http://localhost:8888/taskmanager/auth/user", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: storedToken,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUsername(data.username);
        } else {
          setUsername(null);
        }
      } catch (err) {
        console.error(err);
        setUsername(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Load tasks and medications
  useEffect(() => {
    const loadData = async () => {
      const loadedTasks = await loadTasks();
      const loadedMeds = await loadMedications();
      setTasks(loadedTasks);
      setMedications(loadedMeds);
    };
    loadData();
  }, []);

  const upcomingTasks = tasks
    .filter((t) => !t.completed && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    setUsername(null);
    setToken(null);
    Alert.alert("Success", "Logged out successfully!");
    router.push("/login");
  };

  const features = [
    {
      icon: "notifications",
      title: "Smart Reminders",
      desc: "Get notified before your tasks are due.",
      color: "#FFA726",
    },
    {
      icon: "mic",
      title: "Voice Tasks",
      desc: "Add new tasks using voice recognition.",
      color: "#42A5F5",
    },
    {
      icon: "bar-chart",
      title: "Progress Analytics",
      desc: "Visualize your productivity trends.",
      color: "#AB47BC",
    },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Animated.View entering={FadeInDown.duration(600)}>
        <Text style={styles.welcome}>Welcome back,</Text>
        <Text style={styles.username}>
          {username ? `${username} 👋` : "Guest 👋"}
        </Text>
      </Animated.View>

      <TouchableOpacity>
        <Text style={{ color: "#007AFF", marginBottom: 15 }}>Login/Signup</Text>
      </TouchableOpacity>

      {/* Logout Button */}
      {username && (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      )}

      {/* Stats Cards */}
      <Animated.View
        entering={FadeInDown.delay(150).duration(600)}
        style={styles.statsContainer}
      >
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={32} color="#10B981" />
          <Text style={styles.statNumber}>{completedTasks}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={32} color="#F59E0B" />
          <Text style={styles.statNumber}>{pendingTasks}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="warning" size={32} color="#EF4444" />
          <Text style={styles.statNumber}>{urgentTasks}</Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
      </Animated.View>

      {/* Task Overview Chart */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(600)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Task Completion</Text>
        {tasks.length > 0 ? (
          <PieChart
            data={pieChartData}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            hasLegend={true}
            absolute
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>No tasks yet</Text>
          </View>
        )}
      </Animated.View>

      {/* Mode Distribution */}
      {tasks.filter((t) => t.mode && !t.completed).length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(450).duration(600)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Task Priority Distribution</Text>
          <PieChart
            data={modeChartData}
            width={screenWidth - 40}
            height={180}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
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
      )}

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
          {upcomingTasks.map((task) => (
            <View key={task.id} style={styles.reminderCard}>
              <Ionicons name="calendar-outline" size={22} color="#2563EB" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.reminderTitle}>{task.title}</Text>
                <Text style={styles.reminderTime}>
                  {new Date(task.dueDate!).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      )}

      {/* Features */}
      <Animated.View
        entering={FadeInDown.delay(450).duration(600)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>App Features</Text>
        {features.map((f, i) => (
          <View
            key={i}
            style={[styles.featureCard, { backgroundColor: f.color + "22" }]}
          >
            <Ionicons name={f.icon as any} size={26} color={f.color} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  welcome: { fontSize: 20, color: "#444" },
  username: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 15,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  logoutText: { color: "#fff", marginLeft: 6, fontWeight: "600" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
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
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 10 },
  emptyChart: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyChartText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  reminderCard: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  reminderTitle: { fontSize: 16, fontWeight: "500" },
  reminderTime: { color: "#666", fontSize: 13 },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
  },
  featureTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  featureDesc: { fontSize: 13, color: "#555" },
});
