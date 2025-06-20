import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_URL = 'http://192.168.1.240:5000/api/spots';

// Add Story type
type Story = {
  _id?: string;
  title: string;
  content: string;
  author?: string;
  images?: string[];
  timestamp?: string;
};

// Update Spot type
type Spot = {
  _id: string;
  title: string;
  description: string;
  image?: string;
  gallery?: string[];
  type?: string;
  rating?: number;
  ratingCount?: number;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
  stories?: Story[];
};

const spotTypes = [
  { label: 'Nature', value: 'nature' },
  { label: 'Urban', value: 'urban' },
  { label: 'Food', value: 'food' },
  { label: 'Art', value: 'art' },
  { label: 'History', value: 'history' },
  { label: 'Other', value: 'other' },
];

const MySpotScreen = () => {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const getMySpotIds = async (): Promise<string[]> => {
    try {
      const ids = await AsyncStorage.getItem('mySpot');
      return ids ? JSON.parse(ids) : [];
    } catch (error) {
      return [];
    }
  };

  const fetchSpotById = async (id: string): Promise<Spot | null> => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  };

  const loadMySpots = async () => {
    setLoading(true);
    try {
      const ids = await getMySpotIds();
      if (!ids || ids.length === 0) {
        setSpots([]);
        return;
      }
      const spotPromises = ids.map(fetchSpotById);
      const spotsData = await Promise.all(spotPromises);
      const validSpots = spotsData.filter(spot => spot !== null) as Spot[];
      setSpots(validSpots);
    } catch (error) {
      setSpots([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMySpots();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadMySpots();
    }, [])
  );

  const startEdit = (spot: Spot) => {
    setEditingSpot({...spot});
    setModalVisible(true);
  };

  const handleChange = (field: keyof Spot, value: string) => {
    if (!editingSpot) return;
    setEditingSpot({...editingSpot, [field]: value});
  };

  const handleImageChange = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'We need access to your photos to change the image.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets[0].uri) {
      setEditingSpot({
        ...editingSpot!,
        image: pickerResult.assets[0].uri
      });
    }
  };

  const handleAddGalleryImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'We need access to your photos to add images.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!pickerResult.canceled && pickerResult.assets) {
      const newImages = pickerResult.assets.map(asset => asset.uri);
      setEditingSpot({
        ...editingSpot!,
        gallery: [...(editingSpot?.gallery || []), ...newImages]
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    if (!editingSpot?.gallery) return;
    const newGallery = [...editingSpot.gallery];
    newGallery.splice(index, 1);
    setEditingSpot({
      ...editingSpot,
      gallery: newGallery
    });
  };

  const startEditStory = (story: Story) => {
    setEditingStory({ ...story });
    setStoryModalVisible(true);
  };

  const addNewStory = () => {
    setEditingStory({
      title: '',
      content: '',
      author: '',
      images: [],
      _id: undefined
    });
    setStoryModalVisible(true);
  };

  const handleStoryChange = (field: keyof Story, value: string | string[]) => {
    if (!editingStory) return;
    setEditingStory({ ...editingStory, [field]: value });
  };

  const handleStoryImageAdd = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'We need access to your photos to add images.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!pickerResult.canceled && pickerResult.assets) {
      const newImages = pickerResult.assets.map(asset => asset.uri);
      setEditingStory({
        ...editingStory!,
        images: [...(editingStory?.images || []), ...newImages],
      });
    }
  };

  const removeStoryImage = (index: number) => {
    if (!editingStory?.images) return;
    const newImages = [...editingStory.images];
    newImages.splice(index, 1);
    setEditingStory({
      ...editingStory,
      images: newImages,
    });
  };

  const saveStory = async () => {
    if (!editingStory || !editingSpot) return;

    try {
      const formData = new FormData();
      formData.append('title', editingStory.title);
      formData.append('content', editingStory.content);
      formData.append('author', editingStory.author || 'Anonymous');

      // Handle image uploads
      if (editingStory.images) {
        editingStory.images.forEach((uri, index) => {
          if (uri.startsWith('file://')) {
            formData.append('images', {
              uri,
              name: `image_${index}.jpg`,
              type: 'image/jpeg',
            } as any);
          }
        });
      }

      let response;
      if (editingStory._id) {
        // Update existing story
        response = await axios.put(
          `${API_URL}/${editingSpot._id}/stories/${editingStory._id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        // Create new story
        response = await axios.post(
          `${API_URL}/${editingSpot._id}/stories`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
      }

      const updatedSpot = response.data;
      setEditingSpot(updatedSpot);
      setSpots(spots.map(spot => 
        spot._id === editingSpot._id ? updatedSpot : spot
      ));

      setStoryModalVisible(false);
      Alert.alert('Success', `Story ${editingStory._id ? 'updated' : 'created'} successfully!`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', `Failed to ${editingStory._id ? 'update' : 'create'} story. Please try again.`);
    }
  };

  const saveEdit = async () => {
    if (!editingSpot) return;

    try {
      const formData = new FormData();
      formData.append('title', editingSpot.title);
      formData.append('description', editingSpot.description);
      formData.append('type', editingSpot.type || 'other');

      // Handle main image
      if (editingSpot.image) {
        if (editingSpot.image.startsWith('file://')) {
          formData.append('image', {
            uri: editingSpot.image,
            type: 'image/jpeg',
            name: 'spot-image.jpg',
          } as any);
        } else {
          formData.append('image', editingSpot.image);
        }
      }

      // Handle gallery images
      if (editingSpot.gallery) {
        editingSpot.gallery.forEach((uri, index) => {
          if (uri.startsWith('file://')) {
            formData.append('gallery', {
              uri,
              type: 'image/jpeg',
              name: `gallery-image-${index}.jpg`,
            } as any);
          }
        });
        editingSpot.gallery
          .filter(uri => !uri.startsWith('file://'))
          .forEach(uri => formData.append('gallery', uri));
      }

      await axios.put(`${API_URL}/${editingSpot._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh the spot data
      const updatedSpot = await fetchSpotById(editingSpot._id);
      if (updatedSpot) {
        setSpots(spots.map(spot =>
          spot._id === editingSpot._id ? updatedSpot : spot
        ));
        setEditingSpot(updatedSpot);
      }

      setModalVisible(false);
      Alert.alert('Success', 'Spot updated successfully!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update spot. Please try again.');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMySpots();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
        <Ionicons name="location-outline" size={64} color="#D3D3D3" />
        <Text style={styles.emptyText}>No spots added yet</Text>
        <Text style={styles.emptySubtext}>Add your hidden spots to see them here</Text>
        <TouchableOpacity
          style={[styles.addButton, { marginBottom: insets.bottom + 16 }]}
          onPress={() => navigation.navigate('savespot' as never)}
        >
          <Text style={styles.addButtonText}>＋ Add Spot</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Transparent box behind nav bar */}
      <View style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 80 + insets.bottom,
        backgroundColor: 'rgba(255,255,255,0.7)',
        zIndex: 1,
      }} pointerEvents="none" />
      <FlatList
        data={spots}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.cardImage, styles.noImage]}>
                <Ionicons name="image-outline" size={48} color="#D3D3D3" />
              </View>
            )}

            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <TouchableOpacity
                  onPress={() => startEdit(item)}
                  style={styles.editButton}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.metaContainer}>
                {item.type && (
                  <View style={styles.tagContainer}>
                    <Text style={styles.tagText}>{item.type}</Text>
                  </View>
                )}
                {item.rating !== undefined && (
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>
                      {item.rating.toFixed(1)} ({item.ratingCount || 0})
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardDescription} numberOfLines={2}>
                {item.description}
              </Text>

              {item.latitude && item.longitude && (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: item.latitude,
                      longitude: item.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: item.latitude,
                        longitude: item.longitude,
                      }}
                    />
                  </MapView>
                </View>
              )}

              {item.gallery && item.gallery.length > 0 && (
                <View style={styles.galleryPreview}>
                  <Text style={styles.galleryText}>
                    Gallery: {item.gallery.length} photos
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {item.gallery.slice(0, 3).map((img, index) => (
                      <Image
                        key={index}
                        source={{ uri: img }}
                        style={styles.galleryThumbnail}
                      />
                    ))}
                    {item.gallery.length > 3 && (
                      <View style={styles.moreImages}>
                        <Text style={styles.moreImagesText}>
                          +{item.gallery.length - 3}
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.dateText}>
                Added: {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={[styles.listContainer, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>My Spots</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('savespot' as never)}
            >
              <Text style={styles.addButtonText}>＋</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Spot</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6E45E2" />
                </TouchableOpacity>
              </View>

              {editingSpot?.image ? (
                <TouchableOpacity onPress={handleImageChange}>
                  <Image
                    source={{ uri: editingSpot.image }}
                    style={styles.modalImage}
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={32} color="white" />
                    <Text style={styles.imageOverlayText}>Change Image</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handleImageChange}
                >
                  <Ionicons name="camera" size={32} color="#6E45E2" />
                  <Text style={styles.addImageButtonText}>Add Main Image</Text>
                </TouchableOpacity>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={editingSpot?.title || ''}
                  onChangeText={(text) => handleChange('title', text)}
                  placeholder="Spot Name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.descriptionInput]}
                  value={editingSpot?.description || ''}
                  onChangeText={(text) => handleChange('description', text)}
                  placeholder="Description"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Type</Text>
                <View style={styles.pickerContainer}>
                  <RNPickerSelect
                    onValueChange={(value: string) => handleChange('type', value)}
                    items={spotTypes as { label: string; value: string }[]}
                    value={editingSpot?.type || 'other'}
                    style={pickerSelectStyles as import('react-native-picker-select').PickerStyle}
                    placeholder={{}}
                  />
                </View>
              </View>

              <View style={styles.gallerySection}>
                <View style={styles.galleryHeader}>
                  <Text style={styles.inputLabel}>Gallery</Text>
                  <TouchableOpacity
                    style={styles.addGalleryButton}
                    onPress={handleAddGalleryImage}
                  >
                    <Ionicons name="add" size={20} color="#6E45E2" />
                  </TouchableOpacity>
                </View>

                {editingSpot?.gallery && editingSpot.gallery.length > 0 ? (
                  <View style={styles.galleryContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {editingSpot.gallery.map((img, index) => (
                        <View key={index} style={styles.galleryItem}>
                          <Image
                            source={{ uri: img }}
                            style={styles.galleryImage}
                          />
                          <TouchableOpacity
                            style={styles.removeGalleryButton}
                            onPress={() => removeGalleryImage(index)}
                          >
                            <Ionicons name="close" size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <Text style={styles.noGalleryText}>No gallery images added</Text>
                )}
              </View>

              {/* Stories Section */}
              {editingSpot?.stories && editingSpot.stories.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Stories</Text>
                  {editingSpot.stories.map((story, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.storyCard}
                      onPress={() => startEditStory(story)}
                    >
                      <Text style={styles.storyTitle}>{story.title}</Text>
                      <Text numberOfLines={2} style={styles.storyContent}>
                        {story.content}
                      </Text>
                      {story.images && story.images.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {story.images.slice(0, 3).map((img, imgIndex) => (
                            <Image
                              key={imgIndex}
                              source={{ uri: img }}
                              style={styles.storyImageThumbnail}
                            />
                          ))}
                        </ScrollView>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.addStoryButton}
                onPress={addNewStory}
              >
                <Text style={styles.addStoryButtonText}>＋ Add Story</Text>
              </TouchableOpacity>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={saveEdit}
                >
                  <Text style={styles.actionButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Story Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={storyModalVisible}
        onRequestClose={() => setStoryModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingStory?.title ? 'Edit Story' : 'Add Story'}
                </Text>
                <TouchableOpacity
                  onPress={() => setStoryModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6E45E2" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={editingStory?.title || ''}
                  onChangeText={(text) => handleStoryChange('title', text)}
                  placeholder="Story Title"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Content</Text>
                <TextInput
                  style={[styles.input, styles.descriptionInput]}
                  value={editingStory?.content || ''}
                  onChangeText={(text) => handleStoryChange('content', text)}
                  placeholder="Tell your story..."
                  multiline
                  numberOfLines={6}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Author (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={editingStory?.author || ''}
                  onChangeText={(text) => handleStoryChange('author', text)}
                  placeholder="Your name"
                />
              </View>

              <View style={styles.gallerySection}>
                <View style={styles.galleryHeader}>
                  <Text style={styles.inputLabel}>Images</Text>
                  <TouchableOpacity
                    style={styles.addGalleryButton}
                    onPress={handleStoryImageAdd}
                  >
                    <Ionicons name="add" size={20} color="#6E45E2" />
                  </TouchableOpacity>
                </View>

                {editingStory?.images && editingStory.images.length > 0 ? (
                  <View style={styles.galleryContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {editingStory.images.map((img, index) => (
                        <View key={index} style={styles.galleryItem}>
                          <Image
                            source={{ uri: img }}
                            style={styles.galleryImage}
                          />
                          <TouchableOpacity
                            style={styles.removeGalleryButton}
                            onPress={() => removeStoryImage(index)}
                          >
                            <Ionicons name="close" size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <Text style={styles.noGalleryText}>No images added</Text>
                )}
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setStoryModalVisible(false)}
                >
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={saveStory}
                >
                  <Text style={styles.actionButtonText}>Save Story</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
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
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 300,
    fontFamily: 'Inter-Regular',
  },
  listContainer: {
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 20,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    fontFamily: 'Inter-Bold',
  },
  addButton: {
    backgroundColor: '#6E45E2',
    borderRadius: 20,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    padding: 8,
    elevation: 3,
    shadowColor: '#6E45E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 20,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    marginTop: -4,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-SemiBold',
  },
  editButton: {
    backgroundColor: '#6E45E2',
    padding: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
    elevation: 2,
  },
  cardDescription: {
    color: '#636e72',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagContainer: {
    backgroundColor: '#E6E6FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 10,
  },
  tagText: {
    color: '#6E45E2',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    fontFamily: 'Inter-SemiBold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    color: '#555',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  mapContainer: {
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  galleryPreview: {
    marginTop: 12,
  },
  galleryText: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  galleryThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  moreImages: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E6E6FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: '#6E45E2',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  dateText: {
    fontSize: 12,
    color: '#b2bec3',
    marginTop: 12,
    fontFamily: 'Inter-Regular',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalContent: {
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 8,
  },
  modalImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: 'white',
    marginTop: 8,
    fontFamily: 'Inter-Regular',
  },
  addImageButton: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderStyle: 'dashed',
  },
  addImageButtonText: {
    marginTop: 8,
    color: '#6E45E2',
    fontFamily: 'Inter-Regular',
  },
  inputGroup: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#D3D3D3',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Inter-Regular',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gallerySection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addGalleryButton: {
    padding: 8,
  },
  galleryContainer: {
    marginTop: 8,
  },
  galleryItem: {
    position: 'relative',
    marginRight: 8,
  },
  galleryImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeGalleryButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noGalleryText: {
    color: '#b2bec3',
    fontStyle: 'italic',
    marginTop: 8,
    fontFamily: 'Inter-Regular',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#6E45E2',
    marginLeft: 8,
    elevation: 3,
    shadowColor: '#6E45E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  // New styles for Stories
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2d3436',
  },
  storyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2d3436',
  },
  storyContent: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 8,
  },
  storyImageThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 8,
  },
  addStoryButton: {
    backgroundColor: '#6E45E2',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  addStoryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MySpotScreen;