import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Platform, ScrollView, Animated } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import Slider from '@react-native-community/slider';
import { Switch } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://192.168.1.240:5000/api/spots';

// Add Spot type
interface Spot {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  image?: string;
  type: string;
  rating: number | number[];
  createdAt?: string;
}

function SpotCard({ item, theme }: { item: Spot, theme: any }) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const navigation: any = useNavigation();

  React.useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const bookmarkedIds = await AsyncStorage.getItem('bookmarkedSpotIds');
        const id = item._id ?? item.id;
        if (bookmarkedIds && id) {
          const ids = JSON.parse(bookmarkedIds);
          setIsBookmarked(ids.includes(id.toString()));
        }
      } catch {}
    };
    const id = item._id ?? item.id;
    if (id && !id.toString().startsWith('temp-')) {
      checkBookmarkStatus();
    }
  }, [item._id, item.id]);

  const handleCardPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };
  const handleCardPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  const avgRating = Array.isArray(item.rating) && item.rating.length > 0 ? (item.rating.reduce((a: number, b: number) => a + b, 0) / item.rating.length).toFixed(1) : (typeof item.rating === 'number' ? item.rating.toFixed(1) : 'N/A');

  const toggleBookmark = async () => {
    try {
      const id = item._id ?? item.id;
      if (!id) return;
      const idStr = id.toString();
      const bookmarkedIds = await AsyncStorage.getItem('bookmarkedSpotIds');
      let ids = bookmarkedIds ? JSON.parse(bookmarkedIds) : [];
      if (isBookmarked) {
        ids = ids.filter((bid: string) => bid !== idStr);
        Alert.alert('Removed', 'Spot removed from bookmarks');
      } else {
        ids.push(idStr);
        Alert.alert('Saved', 'Spot added to bookmarks');
      }
      await AsyncStorage.setItem('bookmarkedSpotIds', JSON.stringify(ids));
      setIsBookmarked(ids.includes(idStr));
    } catch (error) {
      Alert.alert('Error', 'Failed to update bookmarks');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.title}\n${item.description}\nType: ${item.type}`
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share spot');
    }
  };

  const handleCardPress = () => {
    const id = item._id ?? item.id;
    if (!id) return;
    navigation.navigate('SpotDetails', { spotId: id.toString() });
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 20 }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        onPress={handleCardPress}
      >
        <BlurView intensity={40} tint={theme.background === '#151718' ? 'dark' : 'light'} style={[styles.spotCard, { backgroundColor: 'rgba(255,255,255,0.7)', shadowColor: theme.shadow, borderColor: theme.border, borderWidth: 1 }]}> 
          <Image source={item.image ? { uri: item.image } : require('@/assets/images/map-pin.png')} style={styles.spotImage} />
          <View style={styles.spotInfo}>
            <Text style={[styles.spotTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.spotDesc, { color: theme.icon }]} numberOfLines={2}>{item.description}</Text>
            <View style={styles.spotMeta}>
              <Ionicons name="star" size={16} color={theme.accent} />
              <Text style={[styles.spotRating, { color: theme.accent, fontWeight: 'bold' }]}>{avgRating}</Text>
              <Text style={[styles.spotType, { color: theme.accent2 }]}>{item.type}</Text>
            </View>
          </View>
          <View style={styles.spotActions}>
            <TouchableOpacity onPress={toggleBookmark} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={theme.accent2} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="share-social-outline" size={22} color={theme.accent2} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

const Feed = () => {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    rating: 0,
    types: ['lake', 'cafe', 'art', 'nature'],
    minRatings: 0,
    hasGallery: false,
    featured: false,
    newestFirst: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [fabScale] = useState(new Animated.Value(1));

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setSpots(response.data);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const filteredSpots = spots
    .filter((spot: Spot) => (filters.rating > 0 ? (Array.isArray(spot.rating) ? (spot.rating.reduce((a: number, b: number) => a + b, 0) / spot.rating.length) >= filters.rating : spot.rating >= filters.rating) : true))
    .sort((a: Spot, b: Spot) => {
      if (filters.newestFirst) {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

  const renderSpot = ({ item }: { item: Spot }) => <SpotCard item={item} theme={theme} />;

  // Animated gradient header
  const [gradientAnim] = useState(new Animated.Value(0));
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(gradientAnim, { toValue: 0, duration: 4000, useNativeDriver: false }),
      ])
    ).start();
  }, []);
  const animatedGradient = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.tint, theme.accent2],
  });

  const FilterPanel = () => (
    <View style={styles.filterPanel}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Feed Filters</Text>
        <TouchableOpacity onPress={() => setShowFilters(false)}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
        <View style={styles.ratingFilterContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={`rating-${star}`}
              onPress={() => setFilters(prev => ({ ...prev, rating: prev.rating === star ? 0 : star }))}
            >
              <Ionicons
                name={filters.rating >= star ? 'star' : 'star-outline'}
                size={28}
                color={filters.rating >= star ? '#FFD700' : '#ccc'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.filterSection}>
        <View style={styles.sortOption}>
          <Text style={styles.sortOptionText}>Newest First</Text>
          <Switch
            value={filters.newestFirst}
            onValueChange={val => setFilters(prev => ({ ...prev, newestFirst: val }))}
            trackColor={{ false: "#ddd", true: "#6E45E2" }}
            thumbColor="#fff"
          />
        </View>
      </View>
      <TouchableOpacity style={styles.applyFilterButton} onPress={() => setShowFilters(false)}>
        <Text style={styles.applyFilterButtonText}>Apply Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>  
      <Animated.View style={{
        width: '100%',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        backgroundColor: theme.tint,
      }}>
        <LinearGradient
          colors={[theme.tint, animatedGradient as any]}
          style={styles.header}
        >
          <Text style={[styles.headerTitle, { color: theme.background, textShadowColor: theme.accent2, textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }]}>Your Feed</Text>
          <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.accent2 }]} onPress={() => setShowFilters(true)}>
            <Ionicons name="options" size={22} color={theme.background} />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
      {showFilters && <FilterPanel />}
      {loading ? (
        <ActivityIndicator size="large" color={theme.tint} style={{ marginTop: 40 }} />
      ) : filteredSpots.length === 0 ? (
        <View style={styles.emptyFeed}><Text style={{ color: theme.text }}>No spots match your preferences.</Text></View>
      ) : (
        <FlatList
          data={filteredSpots}
          renderItem={renderSpot}
          keyExtractor={(item, index) => (item._id || item.id || index.toString())}
          contentContainerStyle={styles.feedList}
        />
      )}
      {/* Floating Action Button */}
      <Animated.View style={{
        position: 'absolute',
        right: 24,
        bottom: 36,
        shadowColor: theme.accent2,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        transform: [{ scale: fabScale }],
      }}>
        
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  filterBtn: {
    borderRadius: 20,
    padding: 8,
  },
  feedList: {
    padding: 16,
    paddingBottom: 40,
  },
  spotCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    padding: 12,
    alignItems: 'center',
  },
  spotImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  spotInfo: { flex: 1 },
  spotTitle: { fontSize: 18, fontWeight: '700' },
  spotDesc: { fontSize: 14, marginTop: 4 },
  spotMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  spotRating: { marginLeft: 4, fontWeight: '600' },
  spotType: { marginLeft: 12, fontSize: 12, textTransform: 'capitalize' },
  spotActions: { flexDirection: 'column', alignItems: 'center', marginLeft: 8 },
  emptyFeed: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  filterPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  filterTitle: { fontSize: 18, fontWeight: '600' },
  filterSection: { marginBottom: 20 },
  filterSectionTitle: { fontSize: 16, fontWeight: '500', marginBottom: 10 },
  ratingFilterContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 },
  sortOptionText: { fontSize: 16 },
  applyFilterButton: { borderRadius: 25, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  applyFilterButtonText: { fontSize: 16, fontWeight: '600' },
});

export default Feed; 