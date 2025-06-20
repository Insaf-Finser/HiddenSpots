import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Linking,
  Share,
  Dimensions,
  FlatList,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  RefreshControl
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import ImageViewer from 'react-native-image-zoom-viewer';
import axios from 'axios';

const { width } = Dimensions.get('window');

interface Story {
    _id: string;
    title: string;
    content: string;
    author: string;
    images: string[];
    timestamp: string;
}

interface Comment {
    _id?: string;
    author: string;
    text: string;
    createdAt?: string;
}

interface Spot {
    _id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    type: string;
    image?: string;
    rating?: number;
    ratingCount?: number;
    gallery?: string[];
    comments?: Comment[];
    stories?: Story[];
    createdAt?: string;
    updatedAt?: string;
}

const API_URL = 'http://192.168.1.240:5000/api/spots';

const SpotDetails: React.FC = () => {
    const route = useRoute();
    const { spotId } = route.params as { spotId: string };
    const [spot, setSpot] = useState<Spot | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [authorName, setAuthorName] = useState('Anonymous');
    const [userRating, setUserRating] = useState(0);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const imageOpacity = useRef(new Animated.Value(0)).current;

    const fetchSpot = async (id: string) => {
        try {
            if (!id) {
                console.error('No spot ID provided');
                setLoading(false);
                return;
            }
            setRefreshing(true);
            const response = await axios.get(`${API_URL}/${id}`);
            const spotData = response.data;

            console.log('Fetched spot data:', spotData);

            if (!spotData) throw new Error('Spot not found');

            setSpot(spotData);

            // Image load animation
            Animated.timing(imageOpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }).start();

            // Content fade animation
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: 300,
                useNativeDriver: true,
            }).start();

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSpot(spotId);
    }, [spotId]);

    const handleShare = async () => {
        if (!spot) return;
        
        try {
            const message = `Check out ${spot.title} at ${spot.latitude}, ${spot.longitude}`;
            await Share.share({
                message,
                title: spot.title,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleOpenMap = () => {
        if (!spot) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`;
        Linking.openURL(url);
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !spot) return;
        
        try {
            const newComment = {
                author: authorName.trim() || 'Anonymous',
                text: commentText.trim()
            };

            const response = await axios.post(`${API_URL}/${spot._id}/comment`, newComment);
            
            if (response.data) {
                setSpot(prev => ({
                    ...prev!,
                    comments: [...(prev?.comments || []), response.data]
                }));
                setCommentText('');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleRateSpot = async (rating: number) => {
        if (!spot) return;
        
        try {
            setUserRating(rating);
            const response = await axios.post(`${API_URL}/${spot._id}/rating`, { rating });
            
            if (response.data) {
                setSpot(prev => ({
                    ...prev!,
                    rating: response.data.newRating,
                    ratingCount: response.data.ratingCount
                }));
            }
        } catch (error) {
            console.error('Error rating spot:', error);
        }
    };

    const openImageViewer = (index: number, images: string[]) => {
        setCurrentImageIndex(index);
        setImageViewerVisible(true);
    };

    const getTypeIcon = () => {
        switch(spot?.type) {
            case 'nature':
                return <Ionicons name="leaf" size={24} color="#4CAF50" />;
            case 'urban':
                return <MaterialIcons name="location-city" size={24} color="#2196F3" />;
            case 'historic':
                return <MaterialIcons name="history" size={24} color="#795548" />;
            default:
                return <Ionicons name="location" size={24} color="#9E9E9E" />;
        }
    };

    const renderGalleryItem = ({ item, index }: { item: string, index: number }) => (
        <TouchableOpacity 
            style={styles.galleryItem}
            onPress={() => openImageViewer(index, spot?.gallery || [])}
        >
            <Image 
                source={{ uri: item }} 
                style={styles.galleryImage}
                resizeMode="cover"
            />
        </TouchableOpacity>
    );

    const renderStoryItem = ({ item }: { item: Story }) => (
        <View style={styles.storyItem}>
            <Text style={styles.storyTitle}>{item.title}</Text>
            <Text style={styles.storyAuthor}>By {item.author}</Text>
            <Text style={styles.storyContent}>{item.content}</Text>
            
            {item.images && item.images.length > 0 && (
                <FlatList
                    horizontal
                    data={item.images}
                    renderItem={({ item: img, index }) => (
                        <TouchableOpacity 
                            style={styles.galleryItem}
                            onPress={() => openImageViewer(index, item.images)}
                        >
                            <Image 
                                source={{ uri: img }} 
                                style={styles.galleryImage}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    )}
                    keyExtractor={(img, index) => `story-img-${index}`}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.storyImagesContainer}
                />
            )}
            
            <Text style={styles.storyDate}>
                {moment(item.timestamp).format('MMM D, YYYY [at] h:mm A')}
            </Text>
        </View>
    );

    const renderRatingStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={`star-${i}`} onPress={() => handleRateSpot(i)}>
                    <Ionicons 
                        name={i <= userRating ? 'star' : 'star-outline'} 
                        size={32} 
                        color={i <= userRating ? '#FFD700' : '#ccc'} 
                        style={styles.starIcon}
                    />
                </TouchableOpacity>
            );
        }
        return stars;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6E45E2" />
            </View>
        );
    }

    if (!spot) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
                <Text style={styles.errorText}>Spot not found</Text>
            </View>
        );
    }

    const imagesForViewer = [
    ...(spot.gallery ? spot.gallery.map(img => ({ url: img })) : []),
    ...(spot.stories ? spot.stories.flatMap(story =>
        story.images.map(img => ({ url: img }))
    ) : [])
];

    return (
        <ScrollView 
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => fetchSpot(spotId)}
                    colors={['#6E45E2']}
                    tintColor="#6E45E2"
                />
            }
        >
            {/* Image with gradient overlay */}
            <View style={styles.imageContainer}>
                {spot.image ? (
                    <Animated.Image 
                        source={{ uri: spot.image }} 
                        style={[styles.image, { opacity: imageOpacity }]}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Ionicons name="image-outline" size={48} color="#ccc" />
                    </View>
                )}
                <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'transparent']}
                    style={styles.gradient}
                />
            </View>

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Header with title and rating */}
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{spot.title}</Text>
                        <View style={styles.typeContainer}>
                            {getTypeIcon()}
                            <Text style={styles.typeText}>{spot.type}</Text>
                        </View>
                    </View>
                    
                    {spot.rating !== undefined && (
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={18} color="#FFD700" />
                            <Text style={styles.ratingText}>{spot.rating.toFixed(1)}</Text>
                            <Text style={styles.ratingCount}>({spot.ratingCount || 0})</Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                <Text style={styles.description}>{spot.description}</Text>

                {/* Rating Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rate this spot</Text>
                    <View style={styles.ratingStarsContainer}>
                        {renderRatingStars()}
                    </View>
                </View>

                {/* Gallery Section */}
                {spot.gallery && spot.gallery.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Gallery</Text>
                        <FlatList
                            horizontal
                            data={spot.gallery}
                            renderItem={renderGalleryItem}
                            keyExtractor={(item, index) => `gallery-${index}`}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.galleryContainer}
                        />
                    </View>
                )}

                {/* Location section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Location</Text>
                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            initialRegion={{
                                latitude: spot.latitude,
                                longitude: spot.longitude,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            }}
                            scrollEnabled={false}
                            zoomEnabled={false}
                        >
                            <Marker
                                coordinate={{
                                    latitude: spot.latitude,
                                    longitude: spot.longitude,
                                }}
                            >
                                <View style={styles.marker}>
                                    <Ionicons name="location" size={24} color="#6E45E2" />
                                </View>
                            </Marker>
                        </MapView>
                        <TouchableOpacity 
                            style={styles.mapButton}
                            onPress={handleOpenMap}
                        >
                            <Text style={styles.mapButtonText}>Open in Maps</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stories Section */}
                {spot.stories && spot.stories.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Stories</Text>
                        <FlatList
                            data={spot.stories}
                            renderItem={renderStoryItem}
                            keyExtractor={(item) => item._id}
                            scrollEnabled={false}
                        />
                    </View>
                )}

                {/* Comments Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Comments {spot.comments ? `(${spot.comments.length})` : ''}
                    </Text>
                    
                    {/* Add Comment Form */}
                    <View style={styles.commentForm}>
                        <TextInput
                            style={styles.authorInput}
                            placeholder="Your name (optional)"
                            value={authorName}
                            onChangeText={setAuthorName}
                        />
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Add your comment..."
                            multiline
                            value={commentText}
                            onChangeText={setCommentText}
                        />
                        <TouchableOpacity 
                            style={styles.submitCommentButton}
                            onPress={handleAddComment}
                            disabled={!commentText.trim()}
                        >
                            <Text style={styles.submitCommentButtonText}>Post Comment</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Comments List */}
                    {spot.comments && spot.comments.length > 0 ? (
                        spot.comments.map((comment, index) => (
                            <View key={`comment-${index}`} style={styles.commentItem}>
                                <Text style={styles.commentAuthor}>{comment.author || 'Anonymous'}</Text>
                                <Text style={styles.commentText}>{comment.text}</Text>
                                {comment.createdAt && (
                                    <Text style={styles.commentDate}>
                                        {moment(comment.createdAt).format('MMM D, YYYY')}
                                    </Text>
                                )}
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
                    )}
                </View>

                {/* Action buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={handleShare}
                    >
                        <Ionicons name="share-social" size={20} color="#6E45E2" />
                        <Text style={styles.actionButtonText}>Share</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.navigationButton]}
                        onPress={handleOpenMap}
                    >
                        <Ionicons name="navigate" size={20} color="#fff" />
                        <Text style={[styles.actionButtonText, { color: '#fff' }]}>Navigate</Text>
                    </TouchableOpacity>
                </View>

                {/* Metadata */}
                <View style={styles.metaContainer}>
                    <Text style={styles.metaText}>
                        Added: {moment(spot.createdAt).format('MMM D, YYYY')}
                    </Text>
                    {spot.updatedAt && (
                        <Text style={styles.metaText}>
                            Last updated: {moment(spot.updatedAt).format('MMM D, YYYY')}
                        </Text>
                    )}
                </View>
            </Animated.View>

            {/* Image Viewer Modal */}
            <Modal visible={imageViewerVisible} transparent={true}>
                <TouchableWithoutFeedback onPress={() => setImageViewerVisible(false)}>
                    <View style={styles.imageViewerOverlay}>
                        <ImageViewer
                            imageUrls={imagesForViewer}
                            index={currentImageIndex}
                            enableSwipeDown
                            onSwipeDown={() => setImageViewerVisible(false)}
                            swipeDownThreshold={50}
                            backgroundColor="rgba(0,0,0,0.9)"
                            renderIndicator={() => <View />}
                        />
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#ff6b6b',
        marginTop: 16,
    },
    container: {
        backgroundColor: '#f8f9fa',
        paddingBottom: 20,
    },
    imageContainer: {
        height: 300,
        width: '100%',
        position: 'relative',
    },
    image: {
        height: '100%',
        width: '100%',
    },
    placeholderImage: {
        height: '100%',
        width: '100%',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 150,
    },
    content: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    titleContainer: {
        flex: 1,
        marginRight: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2d3436',
        marginBottom: 8,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typeText: {
        color: '#636e72',
        fontSize: 16,
        marginLeft: 8,
        textTransform: 'capitalize',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f4ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    ratingText: {
        marginLeft: 4,
        color: '#6E45E2',
        fontWeight: '600',
    },
    ratingCount: {
        marginLeft: 4,
        color: '#888',
        fontSize: 12,
    },
    description: {
        color: '#636e72',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2d3436',
        marginBottom: 16,
    },
    mapContainer: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    map: {
        height: 200,
        width: '100%',
    },
    marker: {
        backgroundColor: 'white',
        padding: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#eee',
    },
    mapButton: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        alignItems: 'center',
    },
    mapButtonText: {
        color: '#6E45E2',
        fontWeight: '600',
    },
    galleryContainer: {
        paddingRight: 24,
    },
    galleryItem: {
        width: 150,
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 12,
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    storyItem: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    storyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2d3436',
        marginBottom: 4,
    },
    storyAuthor: {
        fontSize: 14,
        color: '#636e72',
        marginBottom: 8,
    },
    storyContent: {
        fontSize: 16,
        color: '#2d3436',
        lineHeight: 22,
        marginBottom: 12,
    },
    storyImagesContainer: {
        marginBottom: 12,
    },
    storyDate: {
        fontSize: 12,
        color: '#888',
        textAlign: 'right',
    },
    commentForm: {
        marginBottom: 16,
    },
    authorInput: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        fontSize: 14,
    },
    commentInput: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
        marginBottom: 8,
        fontSize: 14,
        textAlignVertical: 'top',
    },
    submitCommentButton: {
        backgroundColor: '#6E45E2',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitCommentButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    commentItem: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2d3436',
        marginBottom: 4,
    },
    commentText: {
        fontSize: 14,
        paddingLeft: 18,
        paddingTop: 5,
        color: '#000000',
        lineHeight: 20,
        marginBottom: 4,
    },
    commentDate: {
        fontSize: 12,
        color: '#888',
        textAlign: 'right',
    },
    noCommentsText: {
        color: '#888',
        textAlign: 'center',
        marginVertical: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
    },
    navigationButton: {
        backgroundColor: '#6E45E2',
    },
    actionButtonText: {
        color: '#6E45E2',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    metaContainer: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 16,
    },
    metaText: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
    },
    ratingStarsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 8,
    },
    starIcon: {
        marginHorizontal: 4,
    },
    imageViewerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
});

export default SpotDetails;