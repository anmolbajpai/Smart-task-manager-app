import { TaskItem } from '@/types/task';
import { suggestModeAndPriority } from '@/utils/ai';
import { loadTasks, saveTasks } from '@/utils/storage';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
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
  View
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

export default function SmartTaskManager() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [medications, setMedications] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
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

  // Load tasks on first mount
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
        {
          id: '2',
          title: 'Morning exercise',
          description: '30 minutes cardio workout',
          priority: 'medium',
          mode: 'important',
          dueDate: new Date(Date.now() + 43200000).toISOString(),
          completed: false,
          estimatedTimeMinutes: 30,
          category: 'health',
          createdAt: new Date().toISOString(),
        },
      ];
      setTasks(sampleTasks);
      updateStats(sampleTasks);
      await saveTasks(sampleTasks);
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    (async () => {
      await saveTasks(tasks);
    })();
  }, [tasks]);

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
  const updateStats = (list: TaskItem[]): void => {
    const total: number = list.length;
    const completed: number = list.filter((t: TaskItem) => t.completed).length;
    setStats({ total, completed, pending: total - completed });
  };

  // Add new task
  const addTask = () => {
    if (!newTask.trim()) {
      Alert.alert('Error', 'Please enter or speak a task title');
      return;
    }
    const base: Partial<TaskItem> = {
      title: newTask.trim(),
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
    const updated: TaskItem[] = tasks.map((t: TaskItem) =>
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
            const updated: TaskItem[] = tasks.filter((t: TaskItem) => t.id !== id);
            setTasks(updated);
            updateStats(updated);
          },
        },
      ]
    );
  };

  // Handle drag and drop
  const handleDragEnd = ({ data }: { data: TaskItem[] }) => {
    setTasks(data);
    updateStats(data);
  };

  // Get mode badge color
  const getModeColor = (mode?: string) => {
    switch (mode) {
      case 'urgent':
        return '#EF4444';
      case 'important':
        return '#F59E0B';
      case 'optional':
        return '#6B7280';
      default:
        return '#9CA3AF';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return '#DC2626';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#10B981';
      default:
        return '#9CA3AF';
    }
  };

  // Render task item for drag and drop
  const renderTaskItem = ({ item, drag, isActive }: RenderItemParams<TaskItem>) => {
    return (
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
              <View style={styles.taskHeaderRow}>
                <Text style={[styles.taskTitle, item.completed && styles.completedText]}>
                  {item.title}
                </Text>
                {item.aiSuggested && (
                  <Sparkles color="#8B5CF6" size={16} style={styles.aiBadge} />
                )}
              </View>

              {item.description && (
                <Text style={styles.taskDescription}>{item.description}</Text>
              )}

              <View style={styles.taskMeta}>
                {item.mode && (
                  <View style={[styles.badge, { backgroundColor: getModeColor(item.mode) + '20' }]}>
                    <Text style={[styles.badgeText, { color: getModeColor(item.mode) }]}>
                      {item.mode.toUpperCase()}
                    </Text>
                  </View>
                )}
                {item.priority && (
                  <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                    <Text style={[styles.badgeText, { color: getPriorityColor(item.priority) }]}>
                      {item.priority.toUpperCase()}
                    </Text>
                  </View>
                )}
                {item.dueDate && (
                  <View style={styles.metaItem}>
                    <Calendar size={14} color="#6B7280" />
                    <Text style={styles.metaText}>
                      {new Date(item.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {item.estimatedTimeMinutes && (
                  <View style={styles.metaItem}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{item.estimatedTimeMinutes}m</Text>
                  </View>
                )}
              </View>
            </View>
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

      {/* Task List with Drag and Drop */}
      <View style={styles.taskListContainer}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button or use voice to add your first task
            </Text>
          </View>
        ) : (
          <DraggableFlatList
            data={tasks}
            onDragEnd={handleDragEnd}
            keyExtractor={(item) => item.id}
            renderItem={renderTaskItem}
            contentContainerStyle={styles.taskListContent}
            ListFooterComponent={() => <View style={{ height: 20 }} />}
          />
        )}
      </View>
      

      


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
  taskListContainer: {
    flex: 1,
  },
  taskListContent: {
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
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: 'space-between',
  },
  taskCardActive: {
    transform: [{ scale: 1.02 }],
    elevation: 8,
    shadowOpacity: 0.3,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxContainer: {
    marginRight: 8,
  },
  dragHandle: {
    marginRight: 8,
    padding: 4,
  },
  taskContent: {
    flex: 1,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  taskDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  aiBadge: {
    marginLeft: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
    opacity: 0.6,
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