import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { Image } from 'expo-image';
import { 
  StyleSheet, 
  View, 
  Dimensions, 
  Text, 
  TouchableOpacity,
  Animated,
  Easing,
  PanResponder,
  Platform,
  ScrollView,
  Clipboard,
  Linking
} from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import SpotDetail from '@/src/components/SpotDetail';
import * as Location from 'expo-location';

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
  type: 'lake' | 'cafe' | 'art' | 'nature'; // Use 'nature' if that's what your backend returns
  image: string | any;
  rating: number;
  ratingCount?: number;
    gallery?: string[];
    comments?: Comment[];
    stories?: Story[];
    createdAt?: string;
    updatedAt?: string;
}

const { width, height } = Dimensions.get('window');

// REMOVE the hardcoded hiddenSpots array

function getMarkerIcon(type: HiddenSpot['type']): keyof typeof MaterialIcons.glyphMap {
  switch (type) {
    case 'lake': return 'waves';
    case 'cafe': return 'local-cafe';
    case 'art': return 'palette';
    case 'nature': return 'park'; // Use 'nature' if that's your backend type
    default: return 'place';
  }
}

// Define your navigation types (add this above your component)
type RootStackParamList = {
  savespot: { coordinate: { latitude: number; longitude: number } };
  // ... other screen definitions
};

const HomeScreen = () => {
  const mapRef = useRef<MapView>(null);
  const [hiddenSpots, setHiddenSpots] = useState<HiddenSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<HiddenSpot | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  // Add expanded state before using it
  const [expanded, setExpanded] = useState(false);
  // Sheet height is dynamic: expanded = full screen, else 40%
  const sheetHeight = expanded ? height * 0.9 : height * 0.4;
  const [currentZoom, setCurrentZoom] = useState(0.05);
  const [showFilter, setShowFilter] = useState(false);
  const [filterTypes, setFilterTypes] = useState({
    lake: true,
    cafe: true,
    art: true,
    nature: true // Use 'nature' if that's your backend type
  });
  const [fabVisible, setFabVisible] = useState(true);
  const [ignoreMapPress, setIgnoreMapPress] = useState(false);
  const [currentCoordinate, setCurrentCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const filterPressTimer = useRef<NodeJS.Timeout | number | null>(null);

  const filterAnim = useRef(new Animated.Value(0)).current;

  const filterTranslateY = filterAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [20, 0],
});


  const toggleFilter = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const newShowFilter = !showFilter;
  setShowFilter(newShowFilter);
  setIgnoreMapPress(true);

  if (filterPressTimer.current) {
    clearTimeout(filterPressTimer.current);
  }

  Animated.timing(filterAnim, {
    toValue: newShowFilter ? 1 : 0,
    duration: 200,
    useNativeDriver: true,
  }).start(() => {
    filterPressTimer.current = setTimeout(() => {
      setIgnoreMapPress(false);
    }, 100);
  });
};

  const toggleType = (type: keyof typeof filterTypes) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const filterOpacity = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const filterHeight = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical gestures
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 2);
      },
      onPanResponderGrant: () => {
        // Reset any existing animations when gesture starts
        panY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward movement (closing)
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Close if dragged down significantly or with enough velocity
        if (gestureState.dy > sheetHeight * 0.25 || gestureState.vy > 0.5) {
          closeDetail();
        } else {
          // Return to open position with spring animation
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            stiffness: 500,
            damping: 30,
          }).start();
        }
      },
    })
  ).current;

  const zoomIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentZoom(prev => prev / 2);
    mapRef.current?.getCamera().then(camera => {
      mapRef.current?.animateCamera({
        center: camera.center,
        zoom: (camera.zoom ?? 10) + 1,
      }, { duration: 300 });
    });
  };

  const zoomOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentZoom(prev => prev * 2);
    mapRef.current?.getCamera().then(camera => {
      mapRef.current?.animateCamera({
        center: camera.center,
        zoom: (camera.zoom ?? 10) - 1,
      }, { duration: 300 });
    });
  };

  const focusOnSpot = (spot: HiddenSpot) => {
    if (ignoreMapPress) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSpot(spot);
    setCurrentCoordinate(spot.coordinate);
    setFabVisible(false);
    setExpanded(false); // Reset expanded state when new spot is selected

    // Start both animations together
    Animated.parallel([
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        stiffness: 500,
        damping: 30,
      }),
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
        stiffness: 500,
        damping: 30,
      })
    ]).start();

    mapRef.current?.animateToRegion({
      ...spot.coordinate,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 500);

    setShowDetail(true);
  };

  const closeDetail = () => {
    Animated.timing(panY, {
      toValue: sheetHeight,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowDetail(false);
      setFabVisible(true);
      setSelectedSpot(null);
      setExpanded(false);
      panY.setValue(0);
      animatedValue.setValue(0);
    });
  };

  // Improved translateY calculation
  const translateY = panY.interpolate({
    inputRange: [0, height],
    outputRange: [0, height],
    extrapolate: 'clamp',
  });

  const [tappedCoordinate, setTappedCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const handleMapPress = (e: MapPressEvent) => {
    if (ignoreMapPress) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const coordinate = e.nativeEvent.coordinate;
    setCurrentCoordinate(coordinate); // <-- update here

    setSelectedSpot({
      id: `temp-${Date.now()}`,
      title: 'Selected Location',
      description: 'Tap to save this location',
      coordinate,
      type: 'art',
      image: require('@/assets/images/map-pin.png'),
      rating: 0
    });
    setFabVisible(false);
    setShowDetail(true);

    mapRef.current?.animateToRegion({
      ...coordinate,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 500);
  };

  const copyCoordinates = () => {
    if (!currentCoordinate) return;
    const coords = `${currentCoordinate.latitude.toFixed(6)}, ${currentCoordinate.longitude.toFixed(6)}`;
    Clipboard.setString(coords);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Fetch data from backend
  const fetchSpots = async (region?: {latitude: number, longitude: number}) => {
  try {
    const response = await axios.get('http://192.168.1.240:5000/api/spots');
    const spots = response.data.map((spot: any) => ({
      id: spot._id,
      title: spot.title,
      description: spot.description,
      coordinate: {
        latitude: spot.latitude,
        longitude: spot.longitude,
      },
      type: spot.type,
      image: spot.image ? { uri: spot.image } : require('@/assets/images/map-pin.png'),
      rating: spot.rating || 0,
    }));
    setHiddenSpots(spots);
  } catch (error) {
    console.error('Error fetching spots:', error);
    // Optionally show error to user
  }
};

  useEffect(() => {
    fetchSpots();
  }, []);

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (filterPressTimer.current) {
        clearTimeout(filterPressTimer.current);
      }
    };
  }, []);

  // Add this useEffect to handle sheetHeight changes
  useEffect(() => {
    if (showDetail) {
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
        stiffness: 500,
        damping: 30,
      }).start();
    }
  }, [sheetHeight]);

  // Get user's current location on mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // Function to open directions in Google/Apple Maps
  const openDirections = (destination: { latitude: number; longitude: number }) => {
    if (!userLocation) {
      alert('Current location not available');
      return;
    }
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const dest = `${destination.latitude},${destination.longitude}`;
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?saddr=${origin}&daddr=${dest}`
        : `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
    Linking.openURL(url);
  };

  // Use typed navigation
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
 
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 26.2183,
          longitude: 78.1828,
          latitudeDelta: currentZoom,
          longitudeDelta: currentZoom,
        }}
        onPress={handleMapPress}
        onRegionChangeComplete={(region) => {
          setCurrentZoom(region.latitudeDelta);
          fetchSpots(region); // <-- fetch spots on map refresh
        }}
      >
        {hiddenSpots
          .filter(
            spot =>
              spot.coordinate &&
              typeof spot.coordinate.latitude === 'number' &&
              typeof spot.coordinate.longitude === 'number'
          )
          .map((spot, idx) => (
            filterTypes[spot.type] && (
              <Marker
                key={spot.id ?? `spot-${idx}`}
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
            )
        ))}

        {selectedSpot && typeof selectedSpot.id === 'string' && selectedSpot.id.toString().startsWith('temp-') && showDetail && (
          <Marker coordinate={selectedSpot.coordinate}>
            <View style={styles.temporaryMarker}>
              <Ionicons name="pin" size={24} color="#FF3B30" />
            </View>
          </Marker>
        )}
      </MapView>

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

      <View style={styles.zoomControls}>
        <TouchableOpacity 
          style={styles.zoomButton}
          onPress={zoomIn}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#6E45E2" />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity 
          style={styles.zoomButton}
          onPress={zoomOut}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={24} color="#6E45E2" />
        </TouchableOpacity>
      </View>

      {fabVisible && (
        <View style={styles.fabContainer} pointerEvents="box-none">
          <Animated.View
  style={[
    styles.filterPanel,
    {
      opacity: filterOpacity,
      transform: [{ scaleY: filterHeight }],
      pointerEvents: showFilter ? 'auto' : 'none',
    },
  ]}
  pointerEvents={showFilter ? 'auto' : 'none'}
>
  <View style={styles.filterContent}>
    <Text style={styles.filterTitle}>Filter by Type</Text>
    {Object.keys(filterTypes).map((type) => (
      <TouchableOpacity
        key={type}
        style={styles.filterItem}
        onPress={() => {
          // Set ignore map press when filter item is tapped
          setIgnoreMapPress(true);
          toggleType(type as keyof typeof filterTypes);
          
          // Clear any existing timer
          if (filterPressTimer.current) {
            clearTimeout(filterPressTimer.current);
          }
          
          // Set timer to re-enable map press after a short delay
          filterPressTimer.current = setTimeout(() => {
            setIgnoreMapPress(false);
          }, 300);
        }}
        activeOpacity={0.7}
        onPressIn={() => setIgnoreMapPress(true)}
        onPressOut={() => {
          // Set timer to re-enable map press after a short delay
          if (filterPressTimer.current) {
            clearTimeout(filterPressTimer.current);
          }
          filterPressTimer.current = setTimeout(() => {
            setIgnoreMapPress(false);
          }, 300);
        }}
      >
        <View style={styles.checkboxContainer}>
          {filterTypes[type as keyof typeof filterTypes] ? (
            <Ionicons name="checkbox" size={24} color="#6E45E2" />
          ) : (
            <Ionicons name="square-outline" size={24} color="#6E45E2" />
          )}
        </View>
        <Text style={styles.filterItemText}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</Animated.View>

          <TouchableOpacity 
            style={styles.fab}
            onPress={toggleFilter}
            onPressIn={() => setIgnoreMapPress(true)}
            onPressOut={() => setTimeout(() => setIgnoreMapPress(false), 300)}
          >
            <Ionicons 
              name={showFilter ? "close" : "filter"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      )}

      {showDetail && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              height: sheetHeight,
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.sheetHandleContainer}>
            <View style={styles.sheetHandle} />
          </View>

          {selectedSpot && (
            <SpotDetail
            //fix the type of selectedSpot
              spot={selectedSpot as HiddenSpot}
              expanded={expanded}
              onExpand={() => setExpanded(true)}
              onClose={closeDetail}
              onAddSpot={() => {
                if (currentCoordinate) {
                  navigation.navigate('savespot', { coordinate: currentCoordinate });
                  closeDetail();
                }
              }}
              onGetDirections={() => {
                openDirections(selectedSpot.coordinate);
              }}
              currentCoordinate={currentCoordinate ?? undefined}
            />
          )}
        </Animated.View>
      )}

      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', // changed to light grey
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
    zIndex: 0
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
    backgroundColor: '#eee', // changed to grey
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
    backgroundColor: '#f7f7f7', // changed to a lighter grey
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 10,
    height: height * 0.4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#bbb', // changed to grey
    borderRadius: 3,
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
    bottom: 20,
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
  },
  zoomControls: {
    position: 'absolute',
    right: 44,
    bottom: height * 0.13,
    backgroundColor: '#eee', // changed to grey
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  zoomButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee', // changed to grey
  },
  zoomDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#ccc', // changed to grey
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  filterPanel: {
    position: 'absolute',
    right: 10,
    bottom: 90,
    width: 180,
    backgroundColor: '#f7f7f7', // changed to light grey
    borderRadius: 15,
    padding: 15,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    opacity: 0,
    transform: [{ scaleY: 0 }],
  },
  filterContent: {
    flex: 1,
    justifyContent: 'center',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterItemText: {
    fontSize: 16,
    color: '#333',
  },
  temporaryMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordinateContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#ededed', // changed to grey
    borderRadius: 8,
  },
  coordinateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  coordinateTitle: {
    fontWeight: '600',
    color: '#333',
  },
  coordinateRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  coordinateLabel: {
    fontWeight: '500',
    width: 80,
    color: '#666',
  },
  coordinateValue: {
    flex: 1,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    backgroundColor: '#888', // changed to grey
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  copyButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  detailsButton: {
    flex: 1,
    marginRight: 0,
    backgroundColor: '#25d1f7',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
});

export default HomeScreen;