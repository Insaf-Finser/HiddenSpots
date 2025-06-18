import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView from '../components/MapView';
import { fetchHiddenSpots } from '../services/api';

const HomeScreen = () => {
    const [spots, setSpots] = useState([]);

    useEffect(() => {
        const loadSpots = async () => {
            const fetchedSpots = await fetchHiddenSpots();
            setSpots(fetchedSpots);
        };

        loadSpots();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Discover Hidden Spots</Text>
            <MapView spots={spots} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
});

export default HomeScreen;