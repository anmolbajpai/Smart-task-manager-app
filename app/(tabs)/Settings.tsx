import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Settings = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>
            {/* Add your settings options/components here */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
    },
});

export default Settings;