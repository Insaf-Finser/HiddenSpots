import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useUserProfile } from '../hooks/useUserProfile'; // Custom hook to fetch user profile data
import PhotoGallery from '../components/PhotoGallery';
import ExperienceFeed from '../components/ExperienceFeed';

const ProfileScreen = () => {
    const { userProfile, submittedSpots, experiences } = useUserProfile();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.profileHeader}>
                <Text style={styles.username}>{userProfile.username}</Text>
                <Text style={styles.bio}>{userProfile.bio}</Text>
            </View>
            <View style={styles.submittedSpots}>
                <Text style={styles.sectionTitle}>Submitted Spots</Text>
                {submittedSpots.map((spot) => (
                    <Text key={spot.id} style={styles.spotName}>{spot.name}</Text>
                ))}
            </View>
            <View style={styles.experienceFeed}>
                <Text style={styles.sectionTitle}>Experiences</Text>
                <ExperienceFeed experiences={experiences} />
            </View>
            <View style={styles.photoGallery}>
                <Text style={styles.sectionTitle}>Photo Gallery</Text>
                <PhotoGallery photos={userProfile.photos} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    bio: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    submittedSpots: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    spotName: {
        fontSize: 16,
        color: '#333',
    },
    experienceFeed: {
        marginBottom: 20,
    },
    photoGallery: {
        marginBottom: 20,
    },
});

export default ProfileScreen;