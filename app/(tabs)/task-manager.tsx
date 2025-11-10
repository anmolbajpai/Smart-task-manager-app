import { TaskItem } from '@/types/task';
import { suggestModeAndPriority } from '@/utils/ai';
import { loadTasks, saveTasks } from '@/utils/storage';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import * as Notifications from 'expo-notifications';
import {
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  Edit3,
  GripVertical,
  Mic,
  MicOff,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// API Configuration
const API_BASE_URL = 'http://localhost:8888/taskmanager';

export default function SmartTaskManager() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [dueDateTime, setDueDateTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Request notification permissions on mount
  useEffect(() => {
    requestNotificationPermissions();
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
    // Get the stored auth token
    const AUTH_TOKEN = await AsyncStorage.getItem("token");
    if(!AUTH_TOKEN) {
      return;
    }
    console.log("auth token =", AUTH_TOKEN);

    // Make API call
    const response = await fetch(`${API_BASE_URL}/tasks/getTasks`, {
      method: "GET",
      headers: {
          Authorization: AUTH_TOKEN ?? '', // ✅ fallback if null
          'Content-Type': 'application/json',
        },
    });

    // Handle response
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched tasks:", data);
    return data;

  } catch (error) {
    console.error("Failed to fetch tasks from backend:", error);
    throw error;
  }
  };

  const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('Permission Required', 'Please enable notifications to receive task reminders.');
    }
  };

  // Schedule notification for task
  // const scheduleTaskNotification = async (task: TaskItem) => {
  //   if (!task.dueDate) return;

  //   try {
  //     const triggerDate = new Date(task.dueDate);
  //     const now = new Date();
      
  //     // Only schedule if the due date is in the future
  //     if (triggerDate > now) {
  //       const seconds = Math.max(
  //         1,
  //         Math.ceil((triggerDate.getTime() - now.getTime()) / 1000)
  //       );
  //       const notificationId = await Notifications.scheduleNotificationAsync({
  //         content: {
  //           title: '⏰ Task Reminder',
  //           body: `Time to work on: ${task.title}`,
  //           data: { taskId: task.id },
  //           sound: true,
  //         },
  //         trigger: {
  //           type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, // ✅ required
  //           seconds,
  //         },
  //       });
        
  //       return notificationId;  
  //     }
  //   } catch (error) {
  //     console.error('Failed to schedule notification:', error);
  //   }
  // };



  // Schedule notification for task
const scheduleTaskNotification = async (task: TaskItem) => {
  if (!task.dueDate) return;

  try {
    const triggerDate = new Date(task.dueDate);
    const now = new Date();

    // Only schedule if the due date is in the future
    if (triggerDate > now) {
      const seconds = Math.max(1, Math.ceil((triggerDate.getTime() - now.getTime()) / 1000));

      // 🔔 Schedule the first due-time notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Task Reminder',
          body: `Time to complete: ${task.title}`,
          data: { taskId: task.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
        },
      });

      // 🕒 Schedule a repeating 10-minute reminder AFTER the due time
      const repeatReminderId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Pending Task Reminder',
          body: `Your task "${task.title}" is still not completed!`,
          data: { taskId: task.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: seconds + 600, // starts 10 min after due time
          repeats: true, // every 10 minutes
        },
      });

      return { notificationId, repeatReminderId };
    }
  } catch (error) {
    console.error('Failed to schedule notification:', error);
  }
};


  // Cancel notification
  const cancelTaskNotification = async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  };

  // Add task to backend API
  const addTaskToBackend = async (taskTitle: string, dueDateTime: Date | null) => {
    const AUTH_TOKEN = await AsyncStorage.getItem('token');
    console.log("auth token = ",AUTH_TOKEN)
    try {
      
      const response = await fetch(`${API_BASE_URL}/tasks/add`, {
        method: 'POST',
        headers: {
          Authorization: AUTH_TOKEN ?? '', // ✅ fallback if null
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: taskTitle,
          duedatetime: dueDateTime ? dueDateTime.toISOString() : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      setShowAddModal(false);
      fetchTasks();
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to add task to backend:', error);
      throw error;
    }
  };

  // Voice recognition listeners
  useSpeechRecognitionEvent('start', () => setIsRecording(true));
  useSpeechRecognitionEvent('end', () => setIsRecording(false));
  useSpeechRecognitionEvent('result', (event) => {
    if (event.results?.length > 0) {
      const transcript = event.results[0]?.transcript || '';
      setRecognizedText(transcript);
      setNewTask(transcript);
    }
  });
  useSpeechRecognitionEvent('error', () => {
    setIsRecording(false);
    Alert.alert('Error', 'Failed to recognize speech.');
  });

  // Load tasks
  useEffect(() => {
    (async () => {
      const existing = await loadTasks();
      if (existing.length > 0) {
        setTasks(existing);
        updateStats(existing);
        return;
      }
      const sampleTasks: TaskItem[] = [
        {
          id: '1',
          title: 'Complete project',
          description: 'Prepare slides for Smart Task Manager',
          priority: 'high',
          mode: 'important',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          completed: false,
          estimatedTimeMinutes: 120,
          category: 'work',
          createdAt: new Date().toISOString(),
        },
      ];
      setTasks(sampleTasks);
      updateStats(sampleTasks);
      await saveTasks(sampleTasks);
    })();
  }, []);

  // Save tasks to storage
  useEffect(() => {
  (async () => {
    try {
      setLoading(true);

      // Fetch tasks from backend
      const data = await fetchTasks();

      // Convert API response to TaskItem format
      const apiTasks: TaskItem[] = data.map((t: any) => ({
        id: t.id.toString(),
        title: t.task,
        dueDate: t.duedatetime,
        completed: false, // default false since backend doesn’t provide it
        createdAt: new Date().toISOString(),
        mode: 'normal',
        priority: t.priority,
        aiSuggested: false,
      }));

      setTasks(apiTasks);
      updateStats(apiTasks);
      await saveTasks(apiTasks);

    } catch (error) {
      console.error("Failed to load tasks:", error);
      Alert.alert("Error", "Failed to load tasks from backend.");
    } finally {
      setLoading(false);
    }
  })();
}, []);


  const startVoiceRecording = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Microphone access is required.');
        return;
      }
      setRecognizedText('');
      setNewTask('');
      const options: any = { lang: 'en-US', interimResults: true };
      await ExpoSpeechRecognitionModule.start(options);
    } catch (error) {
      setIsRecording(false);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopVoiceRecording = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
    } catch {
      setIsRecording(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) stopVoiceRecording();
    else startVoiceRecording();
  };

  const updateStats = (list: TaskItem[]) => {
    const total = list.length;
    const completed = list.filter((t) => t.completed).length;
    setStats({ total, completed, pending: total - completed });
  };

  // Add new task (with API and notification)
  const addTask = async () => {
    if (!newTask.trim()) {
      Alert.alert('Error', 'Please enter or speak a task title');
      return;
    }

    setLoading(true);

    try {
      // Add task to backend API
      await addTaskToBackend(newTask.trim(), dueDateTime);

      // Create task with AI suggestions
      const base: Partial<TaskItem> = {
        title: newTask.trim(),
        dueDate: dueDateTime?.toISOString(),
      };
      const ai = suggestModeAndPriority(base);
      
      const newItem: TaskItem = {
        id: Date.now().toString(),
        title: base.title!,
        completed: false,
        createdAt: new Date().toISOString(),
        mode: ai.mode,
        priority: ai.priority,
        aiSuggested: true,
        dueDate: base.dueDate,
      };

      // Schedule notification if due date is set
      // if (dueDateTime) {
      //   const notificationId = await scheduleTaskNotification(newItem);
      //   if (notificationId) {
      //     newItem.notificationId = notificationId;
      //   }
      // }

      if (dueDateTime) {
  const notificationData = await scheduleTaskNotification(newItem);
  if (notificationData) {
    newItem.notificationId = notificationData.notificationId;
    newItem.repeatReminderId = notificationData.repeatReminderId;
  }
}


      const updated = [...tasks, newItem];
      setTasks(updated);
      setNewTask('');
      setRecognizedText('');
      setDueDateTime(null);
      setShowAddModal(false);
      updateStats(updated);
      
      Alert.alert('Success', 'Task added successfully with notification scheduled!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add task. Please check your connection and try again.');
      console.error('Add task error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle task completion
  // const toggleTask = (id: string): void => {
  //   const updated: TaskItem[] = tasks.map((t: TaskItem) =>
  //     t.id === id ? { ...t, completed: !t.completed } : t
  //   );
  //   setTasks(updated);
  //   updateStats(updated);
  // };


  const toggleTask = async (id: string): Promise<void> => {
  const updatedTasks: TaskItem[] = await Promise.all(
    tasks.map(async (t: TaskItem) => {
      if (t.id === id) {
        const completed = !t.completed;

        // 🧹 Stop notifications if user completes the task
        if (completed) {
          if (t.notificationId) await cancelTaskNotification(t.notificationId);
          if (t.repeatReminderId) await cancelTaskNotification(t.repeatReminderId);
        }

        return { ...t, completed };
      }
      return t;
    })
  );

  setTasks(updatedTasks);
  updateStats(updatedTasks);
};


  const deleteTask = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const taskToDelete = tasks.find((t) => t.id === id);
          
          // Cancel notification if exists
          if (taskToDelete?.notificationId) {
            await cancelTaskNotification(taskToDelete.notificationId);
          }
          
          const updated = tasks.filter((t) => t.id !== id);
          setTasks(updated);
          updateStats(updated);
        },
      },
    ]);
  };

  const handleDragEnd = ({ data }: { data: TaskItem[] }) => {
    setTasks(data);
    updateStats(data);
  };

  const getModeColor = (mode?: string) => {
    switch (mode) {
      case 'urgent': return '#EF4444';
      case 'important': return '#F59E0B';
      case 'optional': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#9CA3AF';
    }
  };

  const renderTaskItem = ({ item, drag, isActive }: RenderItemParams<TaskItem>) => (
    <ScaleDecorator>
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        style={[styles.taskCard, isActive && styles.taskCardActive]}
      >
        <View style={styles.taskLeft}>
          <TouchableOpacity onPress={() => toggleTask(item.id)} style={styles.checkboxContainer}>
            {item.completed ? (
              <CheckCircle color="#4CAF50" size={22} />
            ) : (
              <Circle color="#999" size={22} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.dragHandle} onLongPress={drag}>
            <GripVertical color="#999" size={20} />
          </TouchableOpacity>
          <View style={styles.taskContent}>
            <Text style={[styles.taskTitle, item.completed && styles.completedText]}>
              {item.title}
            </Text>
            {item.dueDate && (
              <View style={styles.metaItem}>
                <Calendar size={14} color="#6B7280" />
                <Text style={styles.metaText}>{new Date(item.dueDate).toLocaleString()}</Text>
              </View>
            )}
          </View>
          {item.priority && (
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
              </View>
            )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
  {item.dueDate && (
    <View style={styles.metaItem}>
      <Calendar size={14} color="#6B7280" />
      <Text style={styles.metaText}>{new Date(item.dueDate).toLocaleString()}</Text>
    </View>
  )}
  {item.priority && (
    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
      <Text style={styles.priorityText}>{item.priority}</Text>
    </View>
  )}
</View>

        <View style={styles.taskActions}>
          <TouchableOpacity onPress={() => Alert.alert('Edit', 'Edit feature coming soon!')}>
            <Edit3 size={18} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteTask(item.id)}>
            <Trash2 size={18} color="#E57373" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Task Manager</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statBox}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
        <View style={styles.statBox}><Text style={styles.statValue}>{stats.completed}</Text><Text style={styles.statLabel}>Completed</Text></View>
        <View style={styles.statBox}><Text style={styles.statValue}>{stats.pending}</Text><Text style={styles.statLabel}>Pending</Text></View>
      </View>

      <View style={styles.taskListContainer}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks yet</Text>
          </View>
        ) : (
          <DraggableFlatList
            data={tasks}
            onDragEnd={handleDragEnd}
            keyExtractor={(item) => item.id}
            renderItem={renderTaskItem}
            contentContainerStyle={styles.taskListContent}
          />
        )}
      </View>

      {/* Add Task Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Task</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Enter task title..."
              value={newTask}
              onChangeText={setNewTask}
              multiline
            />

            {/* DateTime Picker Section */}
            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                Select Due Date & Time
              </Text>
              <TouchableOpacity
                style={styles.dateTimeBox}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={18} color="#2563EB" />
                <Text style={styles.dateTimeText}>
                  {dueDateTime ? dueDateTime.toLocaleString() : 'Pick date & time'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={dueDateTime || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDueDateTime(selectedDate);
                      setShowTimePicker(true);
                    }
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={dueDateTime || new Date()}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime && dueDateTime) {
                      const finalDateTime = new Date(dueDateTime);
                      finalDateTime.setHours(selectedTime.getHours());
                      finalDateTime.setMinutes(selectedTime.getMinutes());
                      setDueDateTime(finalDateTime);
                    }
                  }}
                />
              )}
            </View>

            {/* Voice Button */}
            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
              onPress={toggleVoiceRecording}
            >
              {isRecording ? <MicOff color="#fff" size={24} /> : <Mic color="#fff" size={24} />}
              <Text style={styles.voiceButtonText}>
                {isRecording ? 'Stop Recording' : 'Start Voice Input'}
              </Text>
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, (!newTask.trim() || loading) && styles.saveBtnDisabled]}
              onPress={addTask}
              disabled={!newTask.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Save color="#fff" size={20} />
                  <Text style={styles.saveText}>Save Task</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#2563EB' },
  statLabel: { color: '#777', fontSize: 13 },
  taskListContainer: { flex: 1 },
  taskListContent: { padding: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#999' },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    justifyContent: 'space-between',
  },
  taskCardActive: { transform: [{ scale: 1.02 }], elevation: 8 },
  taskLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkboxContainer: { marginRight: 8 },
  dragHandle: { marginRight: 8 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, color: '#333', fontWeight: '600' },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  taskActions: { flexDirection: 'row', gap: 12 },
  completedText: { textDecorationLine: 'line-through', color: '#999' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff', width: '90%', borderRadius: 15,
    padding: 20, maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, padding: 12,
    fontSize: 16, minHeight: 50,
    marginBottom: 15, color: '#333',
  },
  dateTimeBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateTimeText: { fontSize: 15, color: '#333' },
  voiceButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  voiceButtonActive: { backgroundColor: '#EF4444' },
  voiceButtonText: { color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#9CA3AF' },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 },

  priorityBadge: {
  paddingVertical: 4,
  paddingHorizontal: 10,
  borderRadius: 8,
  alignSelf: 'flex-start',
  marginLeft: 8,
  justifyContent: 'center',
  alignItems: 'center',
},

priorityText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 12,
  textTransform: 'capitalize',
},

});