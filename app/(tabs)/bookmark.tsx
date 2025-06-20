import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const API_URL = 'http://192.168.1.240:5000/api/spots';

type Spot = {
    id: string;
    name: string;
    description: string;
    image?: string;
    type?: string;
    rating?: number;
};

// Define the navigation param list for this stack/tab
type RootStackParamList = {
    SpotDetails: { spotId: string };
    // Add other routes if needed
};

const BookmarkPage = () => {
    const [spots, setSpots] = useState<Spot[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<import('@react-navigation/native').NavigationProp<RootStackParamList>>();

    // Debugging function to log storage contents
    const debugStorage = async () => {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            console.log('All storage keys:', allKeys);
            const bookmarks = await AsyncStorage.getItem('bookmarkedSpotIds');
            console.log('Bookmarked IDs:', bookmarks);
        } catch (error) {
            console.error('Debug storage error:', error);
        }
    };

    const getBookmarkedIds = async (): Promise<string[]> => {
        try {
            const ids = await AsyncStorage.getItem('bookmarkedSpotIds');
            console.log('Retrieved bookmarks:', ids); // Debug log
            return ids ? JSON.parse(ids) : [];
        } catch (error) {
            console.error('Error getting bookmarks:', error);
            return [];
        }
    };

    const fetchSpotById = async (id: string): Promise<Spot | null> => {
        try {
            console.log(`Fetching spot with ID: ${id}`);
            const response = await fetch(`${API_URL}?id=${id}`); // or `${API_URL}/${id}`
            
            if (!response.ok) {
                console.error('Response not OK:', response.status);
                return null;
            }
            
            const data = await response.json();
            console.log('API Response:', data);

            // Handle both array and single object responses
            const spot = Array.isArray(data) ? 
                data.find(spot => spot._id === id || spot.id === id) : 
                data;

            if (!spot) {
                console.error('Spot not found in response');
                return null;
            }

            console.log('Matched spot:', spot);
            
            return {
                id: spot._id || spot.id,
                name: spot.title || spot.name || 'Unnamed Spot',
                description: spot.description || 'No description available',
                image: spot.image,
                type: spot.type,
                rating: spot.rating,
            };
        } catch (error) {
            console.error(`Error fetching spot ${id}:`, error);
            return null;
        }
    };

    const loadBookmarkedSpots = async () => {
        try {
            console.log('Loading bookmarked spots...'); // Debug log
            await debugStorage(); // Debug storage contents
            
            const ids = await getBookmarkedIds();
            console.log('Bookmarked IDs:', ids); // Debug log
            
            if (!ids || ids.length === 0) {
                setSpots([]);
                return;
            }
            
            const spotPromises = ids.map(fetchSpotById);
            const spotsData = await Promise.all(spotPromises);
            
            console.log('Fetched spots data:', spotsData); // Debug log
            
            const validSpots = spotsData.filter(spot => spot !== null) as Spot[];
            setSpots(validSpots);
            
            console.log('Valid spots:', validSpots); // Debug log
        } catch (error) {
            console.error('Error loading bookmarks:', error);
            Alert.alert('Error', 'Failed to load bookmarked spots');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadBookmarkedSpots();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadBookmarkedSpots();
        }, [])
    );

    const handleRemoveBookmark = async (id: string) => {
        try {
            const currentIds = await getBookmarkedIds();
            const newIds = currentIds.filter(spotId => spotId !== id);
            await AsyncStorage.setItem('bookmarkedSpotIds', JSON.stringify(newIds));
            setSpots(prev => prev.filter(spot => spot.id !== id));
            // Double-check removal from AsyncStorage
            const updatedIds = await AsyncStorage.getItem('bookmarkedSpotIds');
            if (updatedIds && JSON.parse(updatedIds).includes(id)) {
                // If still present, remove again (should not happen, but for safety)
                const filtered = JSON.parse(updatedIds).filter((spotId: string) => spotId !== id);
                await AsyncStorage.setItem('bookmarkedSpotIds', JSON.stringify(filtered));
            }
        } catch (error) {
            console.error('Error removing bookmark:', error);
            Alert.alert('Error', 'Failed to remove bookmark');
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadBookmarkedSpots();
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6E45E2" />
            </View>
        );
    }

    if (spots.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="bookmark-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No bookmarked spots yet</Text>
                <Text style={styles.emptySubtext}>Save your favorite spots to see them here</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={spots}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.85}
                    onPress={() => {
                        navigation.navigate('SpotDetails', { spotId: item.id });
                    }}
                >
                    {item.image ? (
                        <Image 
                            source={{ uri: item.image }} 
                            style={styles.cardImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.cardImage, styles.noImage]}>
                            <Ionicons name="image-outline" size={48} color="#ccc" />
                        </View>
                    )}
                    
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => handleRemoveBookmark(item.id)}
                                style={styles.bookmarkButton}
                            >
                                <Ionicons name="bookmark" size={24} color="#6E45E2" />
                            </TouchableOpacity>
                        </View>
                        
                        {item.type && (
                            <View style={styles.tagContainer}>
                                <Text style={styles.tagText}>{item.type}</Text>
                            </View>
                        )}
                        
                        <Text style={styles.cardDescription} numberOfLines={2}>
                            {item.description}
                        </Text>
                        
                        {item.rating !== undefined && (
                            <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={16} color="#FFD700" />
                                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            )}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
        />
    );
};

const styles = StyleSheet.create({
    center: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        color: '#555',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
        textAlign: 'center',
        maxWidth: 300,
    },
    listContainer: {
        paddingVertical: 16,
        backgroundColor: '#f8f9fa',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardImage: {
        width: '100%',
        height: 180,
    },
    noImage: {
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2d3436',
        flex: 1,
        marginRight: 8,
    },
    bookmarkButton: {
        padding: 4,
    },
    cardDescription: {
        color: '#636e72',
        fontSize: 14,
        lineHeight: 20,
        marginTop: 4,
    },
    tagContainer: {
        alignSelf: 'flex-start',
        backgroundColor: '#E6E6FA',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 12,
    },
    tagText: {
        color: '#6E45E2',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    ratingText: {
        marginLeft: 4,
        color: '#555',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default BookmarkPage;