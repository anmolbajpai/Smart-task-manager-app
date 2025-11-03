import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  CheckCircle,
  Circle,
  Plus,
  Trash2,
  X,
  Save,
  Mic,
  MicOff,
} from 'lucide-react-native';
import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule,
  AudioEncodingAndroid,
} from 'expo-speech-recognition';

type Task = {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  completed: boolean;
  estimatedTime?: number;
  category?: string;
  createdAt?: string;
};

export default function SmartTaskManager() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [medications, setMedications] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState('');
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  
  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  // Listen to speech recognition events
  useSpeechRecognitionEvent('start', () => {
    console.log('Speech recognition started');
    setIsRecording(true);
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('Speech recognition ended');
    setIsRecording(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    console.log('Speech result:', event);
    if (event.results && event.results.length > 0) {
      const transcript = event.results[0]?.transcript || '';
      setRecognizedText(transcript);
      setNewTask(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.log('Speech recognition error:', event);
    setIsRecording(false);
    Alert.alert('Error', 'Failed to recognize speech. Please try again.');
  });

  // Sample data on first load
  useEffect(() => {
    const sampleTasks = [
      {
        id: '1',
        title: 'Complete project',
        description: 'Prepare slides for Smart Task Manager',
        priority: 'urgent',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        completed: false,
        estimatedTime: 120,
        category: 'work',
      },
      {
        id: '2',
        title: 'Morning exercise',
        description: '30 minutes cardio workout',
        priority: 'important',
        dueDate: new Date(Date.now() + 43200000).toISOString(),
        completed: false,
        estimatedTime: 30,
        category: 'health',
      },
    ];

    setTasks(sampleTasks);
    updateStats(sampleTasks);
  }, []);

  // Start Voice Recording with Expo Speech Recognition
  const startVoiceRecording = async () => {
    try {
      // Request permissions
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!result.granted) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required to use voice input.',
          [{ text: 'OK' }]
        );
        return;
      }

      setRecognizedText('');
      setNewTask('');

      // Start speech recognition
      const options: any = {
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
        contextualStrings: ['task', 'reminder', 'todo'],
      };

      // Add platform-specific options
      if (Platform.OS === 'android') {
        options.androidIntentOptions = {
          EXTRA_LANGUAGE_MODEL: 'free_form',
          EXTRA_MAX_RESULTS: 5,
        };
      }

      if (Platform.OS === 'ios') {
        options.iosTaskHint = 'dictation';
      }

      await ExpoSpeechRecognitionModule.start(options);
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsRecording(false);
      Alert.alert(
        'Error',
        'Failed to start voice recognition. Please check microphone permissions.'
      );
    }
  };

  // Stop Voice Recording
  const stopVoiceRecording = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      setIsRecording(false);
    }
  };

  // Toggle Recording
  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  // Update statistics
  const updateStats = (list: Task[]): void => {
    const total: number = list.length;
    const completed: number = list.filter((t: Task) => t.completed).length;
    setStats({ total, completed, pending: total - completed });
  };

  // Add new task
  const addTask = () => {
    if (!newTask.trim()) {
      Alert.alert('Error', 'Please enter or speak a task title');
      return;
    }
    const newItem: Task = {
      id: Date.now().toString(),
      title: newTask,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...tasks, newItem];
    setTasks(updated);
    setNewTask('');
    setRecognizedText('');
    setShowAddModal(false);
    updateStats(updated);
    Alert.alert('Success', 'Task added successfully!');
  };

  // Toggle task completion
  const toggleTask = (id: string): void => {
    const updated: Task[] = tasks.map((t: Task) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    updateStats(updated);
  };

  // Delete task
  const deleteTask = (id: string): void => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated: Task[] = tasks.filter((t: Task) => t.id !== id);
            setTasks(updated);
            updateStats(updated);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Task Manager</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Plus size={28} color="#f9f2f2ff" />
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Voice Recording Feature Banner */}
      <View style={styles.featureBanner}>
        <Mic size={20} color="#2563EB" />
        <Text style={styles.featureBannerText}>
          🎤 Tap the microphone to add tasks by voice!
        </Text>
      </View>

      Task List
       <ScrollView style={styles.scroll}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button or use voice to add your first task
            </Text>
          </View>
        ) : (
          tasks.map((task) => {
            return (
              <View  style={styles.taskCard}>
                <TouchableOpacity onPress={() => toggleTask(task.id)}>
                  {task.completed ? (
                    <CheckCircle color="#4CAF50" size={22} />
                  ) : (
                    <Circle color="#999" size={22} />
                  )}
                </TouchableOpacity>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text
                    style={[
                      styles.taskTitle,
                      task.completed && styles.completedText,
                    ]}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  )}
                </View>

                <TouchableOpacity onPress={() => deleteTask(task.id)}>
                  <Trash2 size={20} color="#E57373" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
      

      


      {/* Add Task Modal with Voice Recording */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          setNewTask('');
          setRecognizedText('');
          if (isRecording) {
            stopVoiceRecording();
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Task</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setNewTask('');
                  setRecognizedText('');
                  if (isRecording) {
                    stopVoiceRecording();
                  }
                }}
              >
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            {/* Voice Recording Status */}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.pulseCircle} />
                <Text style={styles.recordingText}>Listening...</Text>
              </View>
            )}

            {/* Text Input */}
            <TextInput
              style={styles.input}
              placeholder="Enter task title or use voice..."
              value={newTask}
              onChangeText={setNewTask}
              multiline
              placeholderTextColor="#9CA3AF"
            />

            {/* Voice Recording Button */}
            <TouchableOpacity
              style={[
                styles.voiceButton,
                isRecording && styles.voiceButtonActive,
              ]}
              onPress={toggleVoiceRecording}
            >
              {isRecording ? (
                <>
                  <MicOff color="#fff" size={24} />
                  <Text style={styles.voiceButtonText}>Stop Recording</Text>
                </>
              ) : (
                <>
                  <Mic color="#fff" size={24} />
                  <Text style={styles.voiceButtonText}>Start Voice Input</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Instructions */}
            <Text style={styles.instructionText}>
              💡 Tip: Tap the microphone and speak your task clearly
            </Text>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, !newTask.trim() && styles.saveBtnDisabled]}
              onPress={addTask}
              disabled={!newTask.trim()}
            >
              <Save color="#fff" size={20} />
              <Text style={styles.saveText}>Save Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563EB',
  },
  statLabel: {
    color: '#777',
    fontSize: 13,
  },
  featureBanner: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  featureBannerText: {
    marginLeft: 10,
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
    textAlign: 'center',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  pulseCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginRight: 10,
  },
  recordingText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    minHeight: 50,
    textAlignVertical: 'top',
    color: '#333',
  },
  voiceButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  voiceButtonActive: {
    backgroundColor: '#EF4444',
  },
  voiceButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});