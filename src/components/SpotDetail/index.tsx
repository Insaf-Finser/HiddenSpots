import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';


const { width, height } = Dimensions.get('window');




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

interface HiddenSpot {
  id: string | number;
  title: string;
  description: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: 'lake' | 'cafe' | 'art' | 'nature';
  image: string | any;
  rating: number;
  ratingCount?: number;
  gallery?: string[];
  comments?: Comment[];
  stories?: Story[];
  createdAt?: string;
  updatedAt?: string;
}

interface SpotDetailProps {
  spot: HiddenSpot;
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
  onAddSpot?: () => void;
  onGetDirections?: () => void;
  currentCoordinate?: {
    latitude: number;
    longitude: number;
  };
}

type RootStackParamList = {
    SpotDetails: { spotId: string };
    // Add other routes if needed
};


const SpotDetail: React.FC<SpotDetailProps> = ({
  spot,
  expanded,
  onExpand,
  onClose,
  onAddSpot,
  onGetDirections,
  currentCoordinate,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();


  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const bookmarkedIds = await AsyncStorage.getItem('bookmarkedSpotIds');
        if (bookmarkedIds) {
          const ids = JSON.parse(bookmarkedIds);
          setIsBookmarked(ids.includes(spot.id.toString()));
        }
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    };

    if (!spot.id.toString().startsWith('temp-')) {
      checkBookmarkStatus();
    }
  }, [spot.id]);

  const getMarkerIcon = (type: string): keyof typeof MaterialIcons.glyphMap => {
    switch (type) {
      case 'lake': return 'waves';
      case 'cafe': return 'local-cafe';
      case 'art': return 'palette';
      case 'nature': return 'park';
      default: return 'place';
    }
  };

  const toggleBookmark = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const bookmarkedIds = await AsyncStorage.getItem('bookmarkedSpotIds');
      let ids = bookmarkedIds ? JSON.parse(bookmarkedIds) : [];
      
      if (isBookmarked) {
        ids = ids.filter((id: string) => id !== spot.id.toString());
        Alert.alert('Removed', 'Spot removed from bookmarks');
      } else {
        ids.push(spot.id.toString());
        Alert.alert('Saved', 'Spot added to bookmarks');
      }
      
      await AsyncStorage.setItem('bookmarkedSpotIds', JSON.stringify(ids));
      setIsBookmarked(ids.includes(spot.id.toString()));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmarks');
    }
  };

  const copyCoordinates = () => {
    if (!currentCoordinate) return;
    Clipboard.setStringAsync(
      `${currentCoordinate.latitude.toFixed(6)}, ${currentCoordinate.longitude.toFixed(6)}`
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Coordinates copied to clipboard');
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <Image
        source={spot.image}
        style={[
          styles.spotImage,
          { height: expanded ? 250 : 150 }
        ]}
        contentFit="cover"
        transition={500}
      />

      <View style={styles.spotContent}>
        <View style={styles.spotHeader}>
          <Text style={styles.spotTitle}>{spot.title}</Text>
          <View style={styles.rating}>
            <FontAwesome name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{spot.rating.toFixed(1)}</Text>
            {spot.ratingCount !== undefined && (
              <Text style={styles.ratingCount}>({spot.ratingCount})</Text>
            )}
          </View>
        </View>

        <Text 
          style={styles.spotDescription}
          numberOfLines={expanded ? undefined : 3}
        >
          {spot.description}
        </Text>

        {expanded && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location Details</Text>
              <View style={styles.coordinateContainer}>
                <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Type:</Text>
                  <View style={styles.typeBadge}>
                    <MaterialIcons 
                      name={getMarkerIcon(spot.type)} 
                      size={16} 
                      color="white" 
                    />
                    <Text style={styles.typeText}>
                      {spot.type.charAt(0).toUpperCase() + spot.type.slice(1)}
                    </Text>
                  </View>
                </View>
                {currentCoordinate && (
                  <>
                    <View style={styles.coordinateRow}>
                      <Text style={styles.coordinateLabel}>Latitude:</Text>
                      <Text style={styles.coordinateValue}>
                        {currentCoordinate.latitude.toFixed(6)}
                      </Text>
                    </View>
                    <View style={styles.coordinateRow}>
                      <Text style={styles.coordinateLabel}>Longitude:</Text>
                      <Text style={styles.coordinateValue}>
                        {currentCoordinate.longitude.toFixed(6)}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={copyCoordinates}
                    >
                      <Text style={styles.copyButtonText}>Copy Coordinates</Text>
                      <Ionicons name="copy-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </>
        )}

        

        <View style={styles.actionButtons}>
          {spot.id.toString().startsWith('temp-') ? (
            <TouchableOpacity 
              style={styles.addSpotButton}
              onPress={onAddSpot}
            >
              <Text style={styles.addSpotText}>Add Spot</Text>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.saveButton, isBookmarked && styles.bookmarkedButton]}
                onPress={toggleBookmark}
              >
                <Ionicons 
                  name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={expanded ? styles.directionButton : styles.detailButton}
                onPress={() => {
                        if (expanded && onGetDirections) {
                  onGetDirections();
                } else if (!expanded) {
                  navigation.navigate('SpotDetails', { 
                    spotId: spot.id.toString() 
                  });
                }
                    }}
              >
                <Text style={styles.detailText}>
                  {expanded ? 'Get Directions' : 'More Details'}
                </Text>
                <Ionicons 
                  name={expanded ? "navigate" : "arrow-forward"} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  spotImage: {
    width: '100%',
    borderRadius: 15,
    marginBottom: 15
  },
  spotContent: {
    paddingHorizontal: 5
  },
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  spotTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333'
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  ratingText: {
    marginLeft: 5,
    fontWeight: '600'
  },
  ratingCount: {
    marginLeft: 5,
    color: '#888',
    fontSize: 12,
  },
  spotDescription: {
    color: '#666',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  saveButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6E45E2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bookmarkedButton: {
    backgroundColor: '#4CAF50',
  },
  detailButton: {
    flex: 1,
    marginLeft: 15,
    backgroundColor: '#6E45E2',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  directionButton: {
    flex: 1,
    marginLeft: 15,
    backgroundColor: '#4285F4',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  detailText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 10
  },
  addSpotButton: {
    flex: 1,
    backgroundColor: '#6E45E2',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  addSpotText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 10,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  coordinateContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
  },
  coordinateRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  coordinateLabel: {
    fontWeight: '600',
    width: 90,
    color: '#666',
  },
  coordinateValue: {
    flex: 1,
    color: '#333',
    fontFamily: 'monospace',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6E45E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  typeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6E45E2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  copyButtonText: {
    color: 'white',
    fontWeight: '500',
    marginRight: 8,
  },
});

export default SpotDetail;