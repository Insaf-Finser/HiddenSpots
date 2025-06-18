import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button } from 'react-native';
import { fetchExperiences } from '../services/api';

const ExperienceFeed = ({ spotId }) => {
    const [experiences, setExperiences] = useState([]);
    const [comment, setComment] = useState('');
    const [isPublic, setIsPublic] = useState(true);

    useEffect(() => {
        const loadExperiences = async () => {
            const data = await fetchExperiences(spotId);
            setExperiences(data);
        };
        loadExperiences();
    }, [spotId]);

    const handleCommentSubmit = async () => {
        if (comment.trim()) {
            // Logic to submit the comment to the backend
            // await submitComment(spotId, comment, isPublic);
            setComment('');
            // Reload experiences after submitting
            const data = await fetchExperiences(spotId);
            setExperiences(data);
        }
    };

    return (
        <View>
            <FlatList
                data={experiences}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View>
                        <Text>{item.username}:</Text>
                        <Text>{item.comment}</Text>
                    </View>
                )}
            />
            <TextInput
                placeholder="Share your experience..."
                value={comment}
                onChangeText={setComment}
            />
            <Button title="Submit" onPress={handleCommentSubmit} />
            <Text>Share as:</Text>
            <Button title="Public" onPress={() => setIsPublic(true)} />
            <Button title="Anonymous" onPress={() => setIsPublic(false)} />
        </View>
    );
};

export default ExperienceFeed;