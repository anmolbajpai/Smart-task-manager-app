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
  );
}

const styles = StyleSheet.create({
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

