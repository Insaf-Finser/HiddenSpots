import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const SpotForm = () => {
    const [spotName, setSpotName] = useState('');
    const [story, setStory] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState(null);

    const handleImagePick = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.cancelled) {
            setImage(result.uri);
        }
    };

    const handleSubmit = () => {
        // Logic to submit the form data to the backend
        console.log('Spot Name:', spotName);
        console.log('Story:', story);
        console.log('Category:', category);
        console.log('Image URI:', image);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Spot Name</Text>
            <TextInput
                style={styles.input}
                value={spotName}
                onChangeText={setSpotName}
            />
            <Text style={styles.label}>Story</Text>
            <TextInput
                style={styles.input}
                value={story}
                onChangeText={setStory}
                multiline
                numberOfLines={4}
            />
            <Text style={styles.label}>Category</Text>
            <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
            />
            <Button title="Pick an image from camera roll" onPress={handleImagePick} />
            {image && <Image source={{ uri: image }} style={styles.image} />}
            <Button title="Submit" onPress={handleSubmit} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    label: {
        marginBottom: 5,
        fontWeight: 'bold',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    image: {
        width: 200,
        height: 200,
        marginVertical: 10,
    },
});

export default SpotForm;