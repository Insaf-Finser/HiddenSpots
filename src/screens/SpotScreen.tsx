import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import SpotDetails from '../components/SpotDetails';
import RatingSystem from '../components/RatingSystem';
import ExperienceFeed from '../components/ExperienceFeed';
import PhotoGallery from '../components/PhotoGallery';

const SpotScreen = ({ route }) => {
    const { spot } = route.params;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{spot.name}</Text>
            <SpotDetails spot={spot} />
            <RatingSystem spotId={spot.id} />
            <PhotoGallery photos={spot.photos} />
            <ExperienceFeed spotId={spot.id} />
        </ScrollView>
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

export default SpotScreen;