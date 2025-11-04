import { DoseLog, MedicationSchedule } from '@/types/task';
import { scheduleReminder } from '@/utils/notifications';
import { loadDoseLogs, loadMedications, saveDoseLogs, saveMedications } from '@/utils/storage';
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
    View
} from 'react-native';

export default function MedicationsScreen() {
  const [medications, setMedications] = useState<MedicationSchedule[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'custom',
    times: [] as string[],
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveMedications(medications);
  }, [medications]);

  const loadData = async () => {
    const loadedMeds = await loadMedications();
    const loadedLogs = await loadDoseLogs();
    setMedications(loadedMeds);
    setDoseLogs(loadedLogs);
  };

  const addMedication = () => {
    if (!newMedication.name.trim() || newMedication.times.length === 0) {
      Alert.alert('Error', 'Please enter medication name and at least one time');
      return;
    }

    const newMed: MedicationSchedule = {
      id: Date.now().toString(),
      ...newMedication,
      createdAt: new Date().toISOString(),
    };

    setMedications([...medications, newMed]);
    setNewMedication({
      name: '',
      dosage: '',
      frequency: 'daily',
      times: [],
      notes: '',
    });
    setShowAddModal(false);

    // Schedule notifications for first time
    newMed.times.forEach((time) => {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      scheduleReminder(newMed.id, newMed.name, `Time to take ${newMed.dosage}`, scheduledTime);
    });

    Alert.alert('Success', 'Medication added and reminders scheduled!');
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
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medication</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

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
                <Text style={styles.label}>Times</Text>
                <TouchableOpacity onPress={addTime} style={styles.addTimeButton}>
                  <Plus size={18} color="#2563EB" />
                  <Text style={styles.addTimeText}>Add Time</Text>
                </TouchableOpacity>
              </View>

              {newMedication.times.map((time, idx) => (
                <View key={idx} style={styles.timeInputRow}>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="HH:MM"
                    value={time}
                    onChangeText={(text) => updateTime(idx, text)}
                  />
                  <TouchableOpacity onPress={() => removeTime(idx)}>
                    <X size={20} color="#EF4444" />
                  </TouchableOpacity>
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

            <TouchableOpacity
              style={styles.saveButton}
              onPress={addMedication}
              disabled={!newMedication.name.trim() || newMedication.times.length === 0}
            >
              <Save size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Medication</Text>
            </TouchableOpacity>
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
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
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
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

