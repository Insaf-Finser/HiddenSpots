import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';

const SpotDetails = ({ route }) => {
    const { spot } = route.params;

    return (
        <ScrollView style={styles.container}>
            <Image source={{ uri: spot.image }} style={styles.image} />
            <Text style={styles.title}>{spot.name}</Text>
            <Text style={styles.description}>{spot.description}</Text>
            <Text style={styles.vibe}>Vibe: {spot.vibe}</Text>
            <Text style={styles.communityTips}>Community Tips:</Text>
            {spot.tips.map((tip, index) => (
                <Text key={index} style={styles.tip}>
                    - {tip}
                </Text>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        marginBottom: 8,
    },
    vibe: {
        fontSize: 16,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    communityTips: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    tip: {
        fontSize: 16,
        marginBottom: 4,
    },
});

export default SpotDetails;