import { DoseLog, MedicationSchedule } from '@/types/task';
import { scheduleReminder } from '@/utils/notifications';
import { loadDoseLogs, loadMedications, saveDoseLogs, saveMedications } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    CheckCircle,
    Clock,
    Pill,
    Plus,
    Save,
    Trash2,
    X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';

// API Configuration
const API_BASE_URL = 'http://localhost:8888/taskmanager/medication';


export default function MedicationsScreen() {
  const [medications, setMedications] = useState<MedicationSchedule[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'custom',
    times: [] as string[],
    notes: '',
  });
  const [modalStep, setModalStep] = useState<'times' | 'details'>('times');
  const [numberOfTimes, setNumberOfTimes] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);

useEffect(() => {
  const fetchToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setAuthToken(token);
      console.log('Fetched auth token:', token);  
    } catch (e) {
      console.error('Error loading auth token', e);
    }
  };
  fetchToken();
}, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveMedications(medications);
  }, [medications]);

  const fetchMedicationsFromAPI = async () => {
    setIsLoading(true);
    try {
      const authToken = await AsyncStorage.getItem('token');
      console.log('Fetching medications with auth token:', authToken);
      const response = await fetch(`${API_BASE_URL}/getMedications`, {
        method: 'GET',
        headers: {
          'Authorization': authToken ? authToken : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch medications');
      }

      const data = await response.json();
      
      // Transform API response to match local MedicationSchedule format
      const transformedMedications: MedicationSchedule[] = data.map((med: any, index: number) => ({
        id: `med_${Date.now()}_${index}`, // Generate unique ID
        name: med.name,
        dosage: med.dosage,
        frequency: 'daily', // Default to daily since API returns "X times a day"
        times: med.localtimeList && med.localtimeList.length > 0 
          ? med.localtimeList.map((time: string) => time.substring(0, 5)) // Convert "08:00:00" to "08:00"
          : [],
        notes: med.notes || '',
        // active: true,
      }));

      setMedications(transformedMedications);
      saveMedications(transformedMedications);
    } catch (error) {
      console.error('Error fetching medications:', error);
      Alert.alert(
        'Error',
        'Failed to load medications from server. Loading local data instead.'
      );
      // Fallback to local storage if API fails
      const loadedMeds = await loadMedications();
      setMedications(loadedMeds);
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    // Fetch medications from API
    await fetchMedicationsFromAPI();
    
    // Load dose logs from local storage
    const loadedLogs = await loadDoseLogs();
    setDoseLogs(loadedLogs);
  };

  const handleTimesSubmit = () => {
    const count = parseInt(numberOfTimes);
    if (isNaN(count) || count < 1 || count > 10) {
      Alert.alert('Error', 'Please enter a valid number between 1 and 10');
      return;
    }
    
    // Initialize times array with default values
    const defaultTimes = Array(count).fill('').map((_, idx) => {
      const hour = 9 + (idx * 3); // Start at 9am, 3 hours apart
      return `${hour.toString().padStart(2, '0')}:00`;
    });
    
    setNewMedication({ ...newMedication, times: defaultTimes });
    setModalStep('details');
  };

  const addMedication = async (currentMedications: MedicationSchedule[]) => {
    // Validate required fields
    if (!newMedication.name.trim() || !newMedication.dosage.trim() || newMedication.times.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare the API payload
      const payload = {
        name: newMedication.name.trim(),
        dosage: newMedication.dosage.trim(),
        frequency: `${newMedication.times.length} times a day`,
        notes: newMedication.notes.trim() || '',
        times: newMedication.times.length,
        localtimeList: newMedication.times
      };

      // Make the API call
      const response = await fetch(`${API_BASE_URL}/addMedication`, {
        method: 'POST',
        headers: {
          'Authorization': authToken ? authToken : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add medication');
      }

      // Create medication object for local storage
      const medication: MedicationSchedule = {
        id: data.id || Date.now().toString(), // Use API response ID if available
        name: newMedication.name,
        dosage: newMedication.dosage,
        frequency: newMedication.frequency,
        times: newMedication.times,
        notes: newMedication.notes,
       
      };

      // Update local state
      const updatedMedications = [...currentMedications, medication];
      setMedications(updatedMedications);

      // Schedule reminders for each time
      // newMedication.times.forEach((time) => {
      //   scheduleReminder(medication, time);
      // });

      Alert.alert('Success', 'Medication added successfully!');
      resetModal();
    } catch (error) {
      console.error('Error adding medication:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add medication. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setNewMedication({
      name: '',
      dosage: '',
      frequency: 'daily',
      times: [],
      notes: '',
    });
    setNumberOfTimes('');
    setModalStep('times');
    setShowAddModal(false);
  };

  const logDose = (medicationId: string) => {
    const medication = medications.find((m) => m.id === medicationId);
    if (!medication) return;

    const newLog: DoseLog = {
      id: Date.now().toString(),
      medicationId,
      takenAt: new Date().toISOString(),
      dose: medication.dosage,
    };

    setDoseLogs([...doseLogs, newLog]);
    saveDoseLogs([...doseLogs, newLog]);

    Alert.alert('Success', 'Dose logged successfully!');
  };

  const deleteMedication = (id: string) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setMedications(medications.filter((m) => m.id !== id));
          },
        },
      ]
    );
  };

  const addTime = () => {
    const newTimes = [...newMedication.times, '09:00'];
    setNewMedication({ ...newMedication, times: newTimes });
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...newMedication.times];
    newTimes[index] = value;
    setNewMedication({ ...newMedication, times: newTimes });
  };

  const removeTime = (index: number) => {
    if (newMedication.times.length <= 1) {
      Alert.alert('Error', 'You must have at least one time');
      return;
    }
    const newTimes = newMedication.times.filter((_, i) => i !== index);
    setNewMedication({ ...newMedication, times: newTimes });
  };

  const getTodayDoses = (medicationId: string) => {
    const today = new Date().toDateString();
    return doseLogs.filter(
      (log) =>
        log.medicationId === medicationId && new Date(log.takenAt).toDateString() === today
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Medications</Text>
          <Text style={styles.headerSubtitle}>Manage your schedule</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Medications List */}
      <ScrollView style={styles.content}>
        {medications.length === 0 ? (
          <View style={styles.emptyState}>
            <Pill size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No medications yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first medication
            </Text>
          </View>
        ) : (
          medications.map((med) => (
            <View key={med.id} style={styles.medicationCard}>
              <View style={styles.medicationHeader}>
                <View style={styles.medicationInfo}>
                  <Text style={styles.medicationName}>{med.name}</Text>
                  <Text style={styles.medicationDosage}>{med.dosage}</Text>
                </View>
                <TouchableOpacity onPress={() => logDose(med.id)} style={styles.logButton}>
                  <CheckCircle size={24} color="#10B981" />
                  <Text style={styles.logButtonText}>Log</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.scheduleInfo}>
                <View style={styles.scheduleItem}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.scheduleText}>{med.frequency.toUpperCase()}</Text>
                </View>
                <View style={styles.timesContainer}>
                  {med.times.map((time, idx) => (
                    <View key={idx} style={styles.timeBadge}>
                      <Text style={styles.timeText}>{time}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {getTodayDoses(med.id).length > 0 && (
                <View style={styles.todayDoses}>
                  <Text style={styles.todayDosesText}>
                    Taken today: {getTodayDoses(med.id).length}
                  </Text>
                </View>
              )}

              {med.notes && (
                <Text style={styles.notesText}>📝 {med.notes}</Text>
              )}

              <TouchableOpacity
                onPress={() => deleteMedication(med.id)}
                style={styles.deleteButton}
              >
                <Trash2 size={18} color="#EF4444" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Medication Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={resetModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalStep === 'times' ? 'How many times per day?' : 'Medication Details'}
              </Text>
              <TouchableOpacity onPress={resetModal}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {modalStep === 'times' ? (
                // Step 1: Ask for number of times
                <View>
                  <Text style={styles.stepDescription}>
                    Enter how many times per day you need to take this medication
                  </Text>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Number of times (1-10)"
                    value={numberOfTimes}
                    onChangeText={setNumberOfTimes}
                    keyboardType="number-pad"
                    maxLength={2}
                  />

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleTimesSubmit}
                  >
                    <Text style={styles.saveButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Step 2: Show details form with times
                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Medication name"
                    value={newMedication.name}
                    onChangeText={(text) => setNewMedication({ ...newMedication, name: text })}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Dosage (e.g., 500mg, 1 tablet)"
                    value={newMedication.dosage}
                    onChangeText={(text) => setNewMedication({ ...newMedication, dosage: text })}
                  />

                  <View style={styles.frequencySelector}>
                    <Text style={styles.label}>Frequency</Text>
                    <View style={styles.frequencyButtons}>
                      {(['daily', 'weekly', 'custom'] as const).map((freq) => (
                        <TouchableOpacity
                          key={freq}
                          style={[
                            styles.frequencyButton,
                            newMedication.frequency === freq && styles.frequencyButtonActive,
                          ]}
                          onPress={() => setNewMedication({ ...newMedication, frequency: freq })}
                        >
                          <Text
                            style={[
                              styles.frequencyButtonText,
                              newMedication.frequency === freq && styles.frequencyButtonTextActive,
                            ]}
                          >
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.timesSection}>
                    <View style={styles.timesHeader}>
                      <Text style={styles.label}>Times ({newMedication.times.length})</Text>
                      <TouchableOpacity onPress={addTime} style={styles.addTimeButton}>
                        <Plus size={18} color="#2563EB" />
                        <Text style={styles.addTimeText}>Add Time</Text>
                      </TouchableOpacity>
                    </View>

                    {newMedication.times.map((time, idx) => (
                      <View key={idx} style={styles.timeInputRow}>
                        <Text style={styles.timeLabel}>Time {idx + 1}</Text>
                        <TextInput
                          style={styles.timeInput}
                          placeholder="HH:MM"
                          value={time}
                          onChangeText={(text) => updateTime(idx, text)}
                        />
                        {newMedication.times.length > 1 && (
                          <TouchableOpacity onPress={() => removeTime(idx)}>
                            <X size={20} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>

                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Notes (optional)"
                    value={newMedication.notes}
                    onChangeText={(text) => setNewMedication({ ...newMedication, notes: text })}
                    multiline
                  />

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setModalStep('times')}
                      disabled={isLoading}
                    >
                      <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.saveButton, 
                        styles.saveButtonFlex,
                        (isLoading || !newMedication.name.trim() || newMedication.times.length === 0) && styles.saveButtonDisabled
                      ]}
                      onPress={() => addMedication(medications)}
                      disabled={isLoading || !newMedication.name.trim() || newMedication.times.length === 0}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Save size={20} color="#fff" />
                          <Text style={styles.saveButtonText}>Save Medication</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#10B981',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
    textAlign: 'center',
  },
  medicationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#6B7280',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  logButtonText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 14,
  },
  scheduleInfo: {
    marginBottom: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scheduleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeBadge: {
    backgroundColor: '#2563EB20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  todayDoses: {
    backgroundColor: '#10B98120',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  todayDosesText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 12,
  },
  notesText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
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
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  frequencySelector: {
    marginBottom: 20,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#2563EB',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  frequencyButtonTextActive: {
    color: '#fff',
  },
  timesSection: {
    marginBottom: 20,
  },
  timesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addTimeText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 60,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  stepDescription: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 16,
  },
  saveButtonFlex: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});