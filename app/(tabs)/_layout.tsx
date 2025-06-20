import { Tabs } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { 
  Animated, 
  Easing, 
  View, 
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
  PanResponder
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width - 40;
const TAB_WIDTH = TAB_BAR_WIDTH / 4;
const SWIPE_THRESHOLD = 50;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState('map');
  const [indicatorPos] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showFeedBadge, setShowFeedBadge] = useState(false);
  const [showBookmarkHighlight, setShowBookmarkHighlight] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const isDark = colorScheme === 'dark';

  // Enhanced tabs configuration
  const tabs = [
    {
      name: "map",
      label: "Explore",
      icon: (focused: boolean) => (
        <Ionicons 
          name={focused ? "map" : "map-outline"} 
          size={26} 
          color={isDark ? (focused ? '#6E45E2' : '#aaa') : (focused ? '#6E45E2' : '#555')}
        />
      ),
      hasUpdates: false
    },
    {
      name: "Feed",
      label: "Discover",
      icon: (focused: boolean) => (
        <Ionicons 
          name={focused ? "compass" : "compass-outline"} 
          size={26} 
          color={isDark ? (focused ? '#6E45E2' : '#aaa') : (focused ? '#6E45E2' : '#555')}
        />
      ),
      badge: showFeedBadge ? 1 : undefined,
      pulse: showFeedBadge
    },
    {
      name: "bookmark",
      label: "Saved",
      icon: (focused: boolean) => (
        <Ionicons 
          name={focused ? "bookmark" : "bookmark-outline"} 
          size={26} 
          color={isDark ? (focused ? '#6E45E2' : '#aaa') : (focused ? '#6E45E2' : '#555')}
        />
      ),
      newIndicator: showBookmarkHighlight
    },
    {
      name: "myspot",
      label: "Me",
      icon: (focused: boolean) => (
        <Animated.View style={[
          focused ? styles.profileActive : styles.profileInactive,
          { transform: [{ scale: focused ? scaleAnim : 1 }] }
        ]}>
          <Ionicons 
            name="person" 
            size={22} 
            color={focused ? 'white' : (isDark ? '#aaa' : '#555')} 
          />
        </Animated.View>
      )
    }
  ];

  // Pulse animation for important tabs
  useEffect(() => {
    const tab = tabs.find(t => t.pulse);
    if (tab) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease)
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease)
          })
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, []);

  // Swipe gesture recognizer
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe left
          const currentIndex = tabs.findIndex(tab => tab.name === activeTab);
          if (currentIndex < tabs.length - 1) {
            handleTabChange(tabs[currentIndex + 1].name);
          }
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe right
          const currentIndex = tabs.findIndex(tab => tab.name === activeTab);
          if (currentIndex > 0) {
            handleTabChange(tabs[currentIndex - 1].name);
          }
        }
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      }
    })
  ).current;

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Indicator animation
    const tabIndex = tabs.findIndex(tab => tab.name === tabName);
    Animated.spring(indicatorPos, {
      toValue: tabIndex * TAB_WIDTH,
      useNativeDriver: true,
      stiffness: 180,
      damping: 20
    }).start();
    
    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.elastic(1)),
        useNativeDriver: true
      })
    ]).start();
  };

  // Check for new spots for Feed badge
  useEffect(() => {
    const checkFeedBadge = async () => {
      try {
        const lastSeen = await AsyncStorage.getItem('lastSeenFeed');
        // Fetch latest spot createdAt from backend or local cache (pseudo-code)
        // Replace with actual fetch if needed
        const latestCreatedAt = await AsyncStorage.getItem('latestSpotCreatedAt');
        if (latestCreatedAt && (!lastSeen || new Date(latestCreatedAt) > new Date(lastSeen))) {
          setShowFeedBadge(true);
        } else {
          setShowFeedBadge(false);
        }
      } catch {}
    };
    checkFeedBadge();
  }, [activeTab]);

  // When user visits Feed tab, clear badge
  useEffect(() => {
    if (activeTab === 'Feed') {
      AsyncStorage.setItem('lastSeenFeed', new Date().toISOString());
      setShowFeedBadge(false);
    }
  }, [activeTab]);

  // Listen for new bookmarks for bookmark highlight
  useEffect(() => {
    const checkBookmarkHighlight = async () => {
      try {
        const lastSeen = await AsyncStorage.getItem('lastSeenBookmark');
        const newBookmark = await AsyncStorage.getItem('newBookmarkAdded');
        setShowBookmarkHighlight(!!newBookmark && (!lastSeen || new Date(newBookmark) > new Date(lastSeen)));
      } catch {}
    };
    checkBookmarkHighlight();
  }, [activeTab]);

  // When user visits bookmark tab, clear highlight
  useEffect(() => {
    if (activeTab === 'bookmark') {
      AsyncStorage.setItem('lastSeenBookmark', new Date().toISOString());
      AsyncStorage.removeItem('newBookmarkAdded');
      setShowBookmarkHighlight(false);
    }
  }, [activeTab]);

  const renderTabBar = ({ state, navigation }: any) => {
    return (
      <View style={styles.tabBarContainer}>
        <BlurView 
          intensity={30} 
          tint={isDark ? 'dark' : 'light'} 
          style={[
            styles.blurContainer,
            { backgroundColor: isDark ? 'rgba(30,30,30,0.7)' : 'rgba(255,255,255,0.7)' }
          ]}
        >
          <Animated.View
            style={[
              styles.activeIndicator,
              { 
                transform: [{ translateX: indicatorPos }],
                width: TAB_WIDTH - 20 
              }
            ]}
          >
            <LinearGradient
              colors={isDark ? ['#6E45E2', '#88D3CE'] : ['#6E45E2', '#88D3CE']}
              start={[0, 0]}
              end={[1, 0]}
              style={{ flex: 1, height: '100%', borderRadius: 3 }}
            />
          </Animated.View>
          
          {state.routes.map((route: any, index: number) => {
            const tab = tabs[index];
            const isFocused = state.index === index;
            
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => {
                  handleTabChange(route.name);
                  navigation.navigate(route.name);
                }}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                <Animated.View style={{
                  transform: [
                    { 
                      scale: tab.pulse && !isFocused ? 
                        pulseAnim.interpolate({
                          inputRange: [1, 1.2],
                          outputRange: [1, 1.1]
                        }) : 
                        isFocused ? scaleAnim : 1 
                    }
                  ]
                }}>
                  {tab.icon(isFocused)}
                </Animated.View>
                <Text style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : {},
                  { color: isDark ? (isFocused ? '#6E45E2' : '#aaa') : (isFocused ? '#6E45E2' : '#555') }
                ]}>
                  {tab.label}
                </Text>
                {tab.badge && (
                  <View style={[
                    styles.badge,
                    { backgroundColor: isDark ? '#FF3B30' : '#FF3B30' }
                  ]}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
                {tab.newIndicator && !isFocused && (
                  <View style={styles.newIndicator}/>
                )}
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Tabs
        tabBar={renderTabBar}
        screenOptions={{
          headerShown: false,
          lazy: true, // Enable lazy loading
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.label,
            }}
            listeners={{
              focus: () => {
                if (tab.hasUpdates) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }
            }}
          />
        ))}
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  blurContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeIndicator: {
    position: 'absolute',
    height: 0,
    bottom: 10,
    left: 20,
    borderRadius: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: '25%',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInactive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newIndicator: {
    position: 'absolute',
    top: 8,
    right: '28%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6E45E2',
  },
});