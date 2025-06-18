import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';

interface PhotoGalleryProps {
    photos: string[];
    narratives: string[];
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, narratives }) => {
    return (
        <View style={styles.container}>
            <ScrollView>
                {photos.map((photo, index) => (
                    <View key={index} style={styles.photoContainer}>
                        <Image source={{ uri: photo }} style={styles.photo} />
                        {narratives[index] && (
                            <Text style={styles.narrative}>{narratives[index]}</Text>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    photoContainer: {
        marginBottom: 15,
    },
    photo: {
        width: '100%',
        height: 200,
        borderRadius: 10,
    },
    narrative: {
        marginTop: 5,
        fontSize: 14,
        color: '#555',
    },
});

export default PhotoGallery;