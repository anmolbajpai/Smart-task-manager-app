import { View, Text, FlatList, StyleSheet } from 'react-native';
import React, { useState } from 'react';

interface Alert {
    id: string;
    title: string;
    message: string;
    timestamp: string;
}

export default function Alerts() {
    const [alerts] = useState<Alert[]>([
        {
            id: '1',
            title: 'Task Due',
            message: 'Complete project presentation',
            timestamp: '2 hours ago',
        },
        {
            id: '2',
            title: 'Reminder',
            message: 'Team meeting at 3 PM',
            timestamp: '30 minutes ago',
        },
    ]);

    const renderAlert = ({ item }: { item: Alert }) => (
        <View style={styles.alertItem}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Alerts</Text>
            <FlatList
                data={alerts}
                renderItem={renderAlert}
                keyExtractor={(item) => item.id}
                style={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    list: {
        flex: 1,
    },
    alertItem: {
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    message: {
        fontSize: 16,
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
    },
});