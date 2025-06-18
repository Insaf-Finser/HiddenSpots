import React from 'react';
import { View, StyleSheet } from 'react-native';
import SpotForm from '../components/SpotForm';

const AddSpotScreen = () => {
    return (
        <View style={styles.container}>
            <SpotForm />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
});

export default AddSpotScreen;