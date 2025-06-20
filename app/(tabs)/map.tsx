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
  Linking,
  TextInput,
  Keyboard,
  Switch
} from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import SpotDetail from '@/src/components/SpotDetail';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  featured?: boolean;
}

const { width, height } = Dimensions.get('window');

function getMarkerIcon(type: HiddenSpot['type']): keyof typeof MaterialIcons.glyphMap {
  switch (type) {
    case 'lake': return 'waves';
    case 'cafe': return 'local-cafe';
    case 'art': return 'palette';
    case 'nature': return 'park';
    default: return 'place';
  }
}

type RootStackParamList = {
  savespot: { coordinate: { latitude: number; longitude: number } };
};

const HomeScreen = () => {
  const mapRef = useRef<MapView>(null);
  const [hiddenSpots, setHiddenSpots] = useState<HiddenSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<HiddenSpot | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);
  const sheetHeight = expanded ? height * 0.9 : height * 0.4;
  const [currentZoom, setCurrentZoom] = useState(0.05);
  const [showFilter, setShowFilter] = useState(false);
  const [filterTypes, setFilterTypes] = useState({
    lake: true,
    cafe: true,
    art: true,
    nature: true
  });
  const [fabVisible, setFabVisible] = useState(true);
  const [ignoreMapPress, setIgnoreMapPress] = useState(false);
  const [currentCoordinate, setCurrentCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const filterPressTimer = useRef<NodeJS.Timeout | number | null>(null);
  const filterAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  const filterTranslateY = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const [searchFilters, setSearchFilters] = useState({
    rating: 0,
    types: ['lake', 'cafe', 'art', 'nature'],
    minRatings: 0,
    hasGallery: false,
    featured: false,
    newestFirst: false,
  });
  const [showSearchFilters, setShowSearchFilters] = useState(false);

  const insets = useSafeAreaInsets();

  const getDistance = (loc1: {latitude: number, longitude: number}, loc2: {latitude: number, longitude: number}) => {
    const R = 6371;
    const dLat = deg2rad(loc2.latitude - loc1.latitude);
    const dLon = deg2rad(loc2.longitude - loc1.longitude);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(loc1.latitude)) * Math.cos(deg2rad(loc2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  const deg2rad = (deg: number) => deg * (Math.PI/180);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    let results = hiddenSpots
      .filter(spot =>
        searchFilters.types.includes(spot.type) &&
        (query.trim() === '' ||
          spot.title.toLowerCase().includes(query.toLowerCase()) ||
          spot.description.toLowerCase().includes(query.toLowerCase()))
      )
      .filter(spot => searchFilters.rating > 0 ? spot.rating >= searchFilters.rating : true)
      .filter(spot => searchFilters.minRatings > 0 ? (spot.ratingCount || 0) >= searchFilters.minRatings : true)
      .filter(spot => searchFilters.hasGallery ? (spot.gallery && spot.gallery.length > 0) : true)
      .filter(spot => searchFilters.featured ? spot.featured === true : true)
      .sort((a, b) => {
        if (searchFilters.newestFirst) {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
        return 0;
      });
    setFilteredSpots(results);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredSpots([]);
    setIsSearchFocused(false);
    Keyboard.dismiss();
  };

  const addToRecentSearches = (query: string) => {
    if (query.trim() === '') return;
    
    setRecentSearches(prev => {
      const newSearches = [query, ...prev.filter(item => item !== query)].slice(0, 5);
      return newSearches;
    });
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setShowRecentSearches(true);
    Animated.timing(searchAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setIsSearchFocused(false);
      setShowRecentSearches(false);
    }, 200);
  };

  const searchRecentQuery = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
    searchInputRef.current?.focus();
  };

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
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 2);
      },
      onPanResponderGrant: () => {
        panY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > sheetHeight * 0.25 || gestureState.vy > 0.5) {
          closeDetail();
        } else {
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
    setExpanded(false);
    clearSearch();

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
    setCurrentCoordinate(coordinate);

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
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  useEffect(() => {
    return () => {
      if (filterPressTimer.current) {
        clearTimeout(filterPressTimer.current);
      }
    };
  }, []);

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

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const SearchFilterPanel = ({ 
    filters, 
    onApplyFilters,
    onClose 
  }: {
    filters: typeof searchFilters,
    onApplyFilters: (newFilters: typeof searchFilters) => void,
    onClose: () => void
  }) => {
    const [localFilters, setLocalFilters] = useState(filters);
    return (
      <View style={styles.searchFilterPanel}>
        <View style={styles.filterPanelHeader}>
          <Text style={styles.filterPanelTitle}>Search Filters</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
          <View style={styles.ratingFilterContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={`rating-${star}`}
                onPress={() => setLocalFilters(prev => ({
                  ...prev,
                  rating: prev.rating === star ? 0 : star
                }))}
              >
                <Ionicons
                  name={localFilters.rating >= star ? 'star' : 'star-outline'}
                  size={28}
                  color={localFilters.rating >= star ? '#FFD700' : '#ccc'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Spot Type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 }}>
            {['lake', 'cafe', 'art', 'nature'].map(type => (
              <TouchableOpacity
                key={type}
                style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 }}
                onPress={() =>
                  setLocalFilters(prev => ({
                    ...prev,
                    types: prev.types?.includes(type)
                      ? prev.types.filter((t: string) => t !== type)
                      : [...(prev.types || []), type],
                  }))
                }
              >
                <Ionicons
                  name={localFilters.types?.includes(type) ? 'checkbox' : 'square-outline'}
                  size={22}
                  color="#6E45E2"
                />
                <Text style={{ marginLeft: 6, color: '#333', fontSize: 16 }}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.filterSection}>
          <View style={styles.sortOption}>
            <Text style={styles.sortOptionText}>Has Gallery</Text>
            <Switch
              value={localFilters.hasGallery}
              onValueChange={val => setLocalFilters(prev => ({ ...prev, hasGallery: val }))}
              trackColor={{ false: "#ddd", true: "#6E45E2" }}
              thumbColor="#fff"
            />
          </View>
        </View>
        <View style={styles.filterSection}>
          <View style={styles.sortOption}>
            <Text style={styles.sortOptionText}>Featured</Text>
            <Switch
              value={localFilters.featured}
              onValueChange={val => setLocalFilters(prev => ({ ...prev, featured: val }))}
              trackColor={{ false: "#ddd", true: "#6E45E2" }}
              thumbColor="#fff"
            />
          </View>
        </View>
        <View style={styles.filterSection}>
          <View style={styles.sortOption}>
            <Text style={styles.sortOptionText}>Newest First</Text>
            <Switch
              value={localFilters.newestFirst}
              onValueChange={(value) => setLocalFilters(prev => ({
                ...prev,
                newestFirst: value
              }))}
              trackColor={{ false: "#ddd", true: "#6E45E2" }}
              thumbColor="#fff"
            />
          </View>
        </View>
        <TouchableOpacity 
          style={styles.applyFilterButton}
          onPress={() => {
            onApplyFilters(localFilters);
            onClose();
          }}
        >
          <Text style={styles.applyFilterButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const filterActive = searchFilters.rating > 0 || searchFilters.types.length < 4 || searchFilters.minRatings > 0 || searchFilters.hasGallery || searchFilters.featured || searchFilters.newestFirst;

  const [filteredSpots, setFilteredSpots] = useState<HiddenSpot[]>([]);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchFilters, searchQuery, hiddenSpots]);

  return (
    <View style={styles.container}>
      {/* Transparent box behind nav bar */}
      <View style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 70 + insets.bottom,
        backgroundColor: 'rgba(255,255,255,0.7)',
        zIndex: 1,
      }} pointerEvents="none" />
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
          fetchSpots(region);
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
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Find hidden spots..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={clearSearch} style={styles.searchClear}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => setShowSearchFilters(true)}
            style={styles.filterButton}
          >
            <Ionicons 
              name="options" 
              size={20} 
              color={filterActive ? '#6E45E2' : '#999'}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {(isSearchFocused || searchQuery !== '') && (
        <Animated.View 
          style={[
            styles.searchResultsContainer,
            {
              opacity: searchAnim,
              transform: [{
                translateY: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0]
                })
              }]
            }
          ]}
        >
          <ScrollView 
            style={styles.searchResultsScroll}
            keyboardShouldPersistTaps="handled"
          >
            {searchQuery === '' && showRecentSearches && recentSearches.length > 0 && (
              <>
                <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={`recent-${index}`}
                    style={styles.searchResultItem}
                    onPress={() => searchRecentQuery(search)}
                  >
                    <View style={styles.searchResultIcon}>
                      <Ionicons name="time-outline" size={20} color="#6E45E2" />
                    </View>
                    <Text style={styles.searchResultTitle}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {searchQuery !== '' && filteredSpots.length > 0 ? (
              filteredSpots.map(spot => (
                <TouchableOpacity
                  key={spot.id}
                  style={styles.searchResultItem}
                  onPress={() => {
                    focusOnSpot(spot);
                    addToRecentSearches(spot.title);
                    clearSearch();
                  }}
                >
                  <View style={styles.searchResultIcon}>
                    <MaterialIcons 
                      name={getMarkerIcon(spot.type)} 
                      size={20} 
                      color="#6E45E2" 
                    />
                  </View>
                  <View style={styles.searchResultText}>
                    <Text style={styles.searchResultTitle}>{spot.title}</Text>
                    <Text 
                      style={styles.searchResultDescription}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {spot.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : searchQuery !== '' ? (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={40} color="#ccc" />
                <Text style={styles.noResultsText}>No spots found</Text>
                <Text style={styles.noResultsSubText}>Try different keywords</Text>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      )}

      <View style={[styles.zoomControls, { bottom: height * 0.31 }]}>
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
        <View style={[styles.fabContainer, { bottom: 100 }]} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.filterPanel,
              {
                opacity: filterOpacity,
                transform: [{ scaleY: filterHeight }],
                pointerEvents: showFilter ? 'auto' : 'none',
                bottom: 180,
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
                    setIgnoreMapPress(true);
                    toggleType(type as keyof typeof filterTypes);
                    
                    if (filterPressTimer.current) {
                      clearTimeout(filterPressTimer.current);
                    }
                    
                    filterPressTimer.current = setTimeout(() => {
                      setIgnoreMapPress(false);
                    }, 300);
                  }}
                  activeOpacity={0.7}
                  onPressIn={() => setIgnoreMapPress(true)}
                  onPressOut={() => {
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
            style={[styles.fab, { bottom: 100 }]}
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
              marginBottom: 70+insets.bottom,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.sheetHandleContainer}>
            <View style={styles.sheetHandle} />
          </View>

          {selectedSpot && (
            <SpotDetail
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

      {showSearchFilters && (
        <SearchFilterPanel
          filters={searchFilters}
          onApplyFilters={(newFilters) => {
            setSearchFilters(newFilters);
            handleSearch(searchQuery);
          }}
          onClose={() => setShowSearchFilters(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 10
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
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#333',
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
    paddingRight: 30,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 5,
    
    height: Platform.OS === 'ios' ? 30 : 40,
  },
  searchClear: {
    marginLeft: 10,
    padding: 4,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 120,
    left: 20,
    right: 20,
    marginTop: 40,
    maxHeight: height * 0.5,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
  },
  searchResultsScroll: {
    maxHeight: height * 0.5,
  },
  recentSearchesTitle: {
    padding: 15,
    paddingBottom: 5,
    fontSize: 14,
    color: '#666',
    fontWeight: '600'
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  searchResultDescription: {
    fontSize: 14,
    color: '#666',
  },
  noResults: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
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
    backgroundColor: '#f7f7f7',
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
    backgroundColor: '#bbb',
    borderRadius: 3,
  },
  zoomControls: {
    position: 'absolute',
    right: 44,
    bottom: height * 0.13,
    backgroundColor: '#eee',
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
    backgroundColor: '#eee',
  },
  zoomDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#ccc',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
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
  filterPanel: {
    position: 'absolute',
    right: 10,
    bottom: 20,
    width: 180,
    backgroundColor: '#f7f7f7',
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
  searchFilterPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 120,
    marginTop:40,
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
  filterPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 10,
  },
  ratingFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  distanceFilterContainer: {
    paddingHorizontal: 10,
  },
  distanceText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  distanceSlider: {
    width: '100%',
    height: 40,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  sortOptionText: {
    fontSize: 16,
    color: '#333',
  },
  applyFilterButton: {
    backgroundColor: '#6E45E2',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  applyFilterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  filterButton: {
    marginLeft: 10,
    padding: 4,
  },
});

export default HomeScreen;