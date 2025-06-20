import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import Slider from '@react-native-community/slider';
import { Switch } from 'react-native';

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

  const renderSpot = ({ item }: { item: Spot }) => {
    const avgRating = Array.isArray(item.rating) && item.rating.length > 0 ? (item.rating.reduce((a: number, b: number) => a + b, 0) / item.rating.length).toFixed(1) : (typeof item.rating === 'number' ? item.rating.toFixed(1) : 'N/A');
    return (
      <TouchableOpacity style={styles.spotCard}>
        <Image source={item.image ? { uri: item.image } : require('@/assets/images/map-pin.png')} style={styles.spotImage} />
        <View style={styles.spotInfo}>
          <Text style={styles.spotTitle}>{item.title}</Text>
          <Text style={styles.spotDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.spotMeta}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.spotRating}>{avgRating}</Text>
            <Text style={styles.spotType}>{item.type}</Text>
          </View>
        </View>
        <View style={styles.spotActions}>
          <TouchableOpacity>
            <Ionicons name="bookmark-outline" size={22} color="#6E45E2" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="share-social-outline" size={22} color="#6E45E2" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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
    <View style={styles.container}>
      <LinearGradient colors={["#6E45E2", "#88D3CE"]} style={styles.header}>
        <Text style={styles.headerTitle}>Your Feed</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
          <Ionicons name="options" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
      {showFilters && <FilterPanel />}
      {loading ? (
        <ActivityIndicator size="large" color="#6E45E2" style={{ marginTop: 40 }} />
      ) : filteredSpots.length === 0 ? (
        <View style={styles.emptyFeed}><Text>No spots match your preferences.</Text></View>
      ) : (
        <FlatList
          data={filteredSpots}
          renderItem={renderSpot}
          keyExtractor={(item, index) => (item._id || item.id || index.toString())}
          contentContainerStyle={styles.feedList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
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
    color: '#fff',
  },
  filterBtn: {
    backgroundColor: '#6E45E2',
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
  spotTitle: { fontSize: 18, fontWeight: '700', color: '#2d3436' },
  spotDesc: { color: '#636e72', fontSize: 14, marginTop: 4 },
  spotMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  spotRating: { marginLeft: 4, color: '#6E45E2', fontWeight: '600' },
  spotType: { marginLeft: 12, color: '#888', fontSize: 12, textTransform: 'capitalize' },
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
  filterTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  filterSection: { marginBottom: 20 },
  filterSectionTitle: { fontSize: 16, fontWeight: '500', color: '#666', marginBottom: 10 },
  ratingFilterContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 },
  sortOptionText: { fontSize: 16, color: '#333' },
  applyFilterButton: { backgroundColor: '#6E45E2', borderRadius: 25, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  applyFilterButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

export default Feed; 