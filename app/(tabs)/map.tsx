import React, { useRef, useState } from 'react';
import { Image } from 'expo-image';
import { 
  Platform, 
  StyleSheet, 
  View, 
  Dimensions, 
  Text, 
  TouchableOpacity,
  Animated,
  Easing
} from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface HiddenSpot {
  id: number;
  title: string;
  description: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: 'lake' | 'cafe' | 'art' | 'garden';
  image: string;
  rating: number;
}

const { width, height } = Dimensions.get('window');

const hiddenSpots: HiddenSpot[] = [
  {
    id: 1,
    title: 'Sunset Lake',
    description: 'A peaceful lakeside perfect for reflection at golden hour.',
    coordinate: { latitude: 26.2183, longitude: 78.1828 },
    type: 'lake',
    image: require('@/assets/images/lake.jpg'),
    rating: 4.8
  },
  // ... other spots with images
];

// Returns the MaterialIcons icon name for each spot type
function getMarkerIcon(type: HiddenSpot['type']): keyof typeof MaterialIcons.glyphMap {
  switch (type) {
    case 'lake':
      return 'waves';
    case 'cafe':
      return 'local-cafe';
    case 'art':
      return 'palette';
    case 'garden':
      return 'park';
    default:
      return 'place';
  }
}

const HomeScreen = () => {
  const mapRef = useRef<MapView>(null);
  const [selectedSpot, setSelectedSpot] = useState<HiddenSpot | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const focusOnSpot = (spot: HiddenSpot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSpot(spot);
    
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();

    mapRef.current?.animateToRegion({
      ...spot.coordinate,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 500);
    
    setShowDetail(true);
  };

  const closeDetail = () => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => setShowDetail(false));
  };

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  });

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 26.2183,
          longitude: 78.1828,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        customMapStyle={mapStyle}
      >
        {hiddenSpots.map(spot => (
          <Marker
            key={spot.id}
            coordinate={spot.coordinate}
            onPress={() => focusOnSpot(spot)}
          >
            <Animated.View style={[styles.markerWrapper, {
              transform: [{
                scale: selectedSpot?.id === spot.id ? 
                  animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.3]
                  }) : 1
              }]
            }]}>
              <LinearGradient
                colors={['#6E45E2', '#88D3CE']}
                style={styles.marker}
              >
                <MaterialIcons 
                  name={getMarkerIcon(spot.type)} 
                  size={20} 
                  color="white" 
                />
              </LinearGradient>
            </Animated.View>
          </Marker>
        ))}
      </MapView>

      {/* Header */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Hidden Gwalior</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <Text style={styles.searchText}>Find hidden spots...</Text>
        </View>
      </LinearGradient>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, {
        transform: [{ translateY }]
      }]}>
        <View style={styles.sheetHandle} />
        
        {selectedSpot && (
          <>
            <Image 
              source={selectedSpot.image} 
              style={styles.spotImage}
              contentFit="cover"
            />
            
            <View style={styles.spotContent}>
              <View style={styles.spotHeader}>
                <Text style={styles.spotTitle}>{selectedSpot.title}</Text>
                <View style={styles.rating}>
                  <FontAwesome name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{selectedSpot.rating}</Text>
                </View>
              </View>
              
              <Text style={styles.spotDescription}>{selectedSpot.description}</Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.saveButton}>
                  <Ionicons name="bookmark-outline" size={20} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.directionButton}>
                  <Text style={styles.directionText}>Get Directions</Text>
                  <MaterialIcons name="directions" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </Animated.View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <Ionicons name="filter" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

// Custom map styling
const mapStyle = [
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      { "color": "#193341" }
    ]
  },
  // ... more custom map styles
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 1
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 15
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  searchText: {
    marginLeft: 10,
    color: '#999',
    fontSize: 16
  },
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: height * 0.4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15
  },
  spotImage: {
    width: '100%',
    height: 150,
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
  directionText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 10
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: height * 0.45,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6E45E2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  }
});

export default HomeScreen;