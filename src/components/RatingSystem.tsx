import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const RatingSystem = () => {
    const [ratings, setRatings] = useState({
        uniqueness: 0,
        vibe: 0,
        safety: 0,
        crowd: 0,
    });

    const handleRating = (category, value) => {
        setRatings(prevRatings => ({
            ...prevRatings,
            [category]: value,
        }));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Rate This Spot</Text>
            {Object.keys(ratings).map((category) => (
                <View key={category} style={styles.ratingContainer}>
                    <Text style={styles.category}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => handleRating(category, star)}>
                                <Text style={star <= ratings[category] ? styles.filledStar : styles.emptyStar}>★</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    ratingContainer: {
        marginBottom: 15,
    },
    category: {
        fontSize: 16,
        marginBottom: 5,
    },
    starsContainer: {
        flexDirection: 'row',
    },
    filledStar: {
        color: '#FFD700',
        fontSize: 24,
    },
    emptyStar: {
        color: '#ccc',
        fontSize: 24,
    },
});

export default RatingSystem;