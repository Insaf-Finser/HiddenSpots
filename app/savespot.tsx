import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  Text, 
  Alert, 
  Platform, 
  TouchableOpacity, 
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import { Image } from 'expo-image';
import { useRoute, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FormData {
  title: string;
  description: string;
  latitude: string;
  longitude: string;
  type: string;
  rating: number;
}

interface SpotType {
  label: string;
  value: string;
}

const spotTypes: SpotType[] = [
  { label: '🌊 Lake', value: 'lake' },
  { label: '☕ Café', value: 'cafe' },
  { label: '🎨 Art', value: 'art' },
  { label: '🌿 Garden', value: 'garden' },
];

type SpotCreationScreenRouteParams = {
  coordinate?: {
    latitude: number;
    longitude: number;
  };
};

export default function SpotCreationScreen() {
  const route = useRoute<RouteProp<Record<string, SpotCreationScreenRouteParams>, string>>();
  const coordinate = route.params?.coordinate;

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    type: 'lake',
    rating: 3,
  });
  const [image, setImage] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // If coordinate is passed, set it as initial value
  React.useEffect(() => {
    if (coordinate) {
      setFormData((prev) => ({
        ...prev,
        latitude: coordinate.latitude.toString(),
        longitude: coordinate.longitude.toString(),
      }));
    }
  }, [coordinate]);

  const pickImage = async () => {
    Haptics.selectionAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets?.[0]) {
      setImage(result.assets[0]);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  const getLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required.');
      return;
    }
    
    setUploading(true);
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setFormData({
        ...formData,
        latitude: location.coords.latitude.toString(),
        longitude: location.coords.longitude.toString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Could not get location');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (name: keyof FormData, value: any) => {
    setFormData({
      ...formData,
      [name]: name === 'rating' ? Number(value) : value,
    });
  };

  const validateForm = () => {
    if (!formData.title || !formData.description) {
      Alert.alert('Missing Info', 'Please add a title and description');
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      Alert.alert('Location Required', 'Please set a location');
      return false;
    }
    if (!image) {
      Alert.alert('Image Needed', 'Please add a photo of your spot');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setUploading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('latitude', formData.latitude);
      form.append('longitude', formData.longitude);
      form.append('type', formData.type);
      form.append('rating', formData.rating.toString());

      if (image) {
        form.append('image', {
          uri: image.uri,
          name: 'spot_' + Date.now() + '.jpg',
          type: 'image/jpg',
        } as any);
      }

      const response = await axios.post('http://192.168.1.240:5000/api/spots', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Save the new spot's id to AsyncStorage under "mySpot"
      const newSpotId = response.data._id || response.data.id;
      if (newSpotId) {
        const existing = await AsyncStorage.getItem('mySpot');
        let ids: string[] = [];
        if (existing) {
          ids = JSON.parse(existing);
        }
        if (!ids.includes(newSpotId)) {
          ids.push(newSpotId);
          await AsyncStorage.setItem('mySpot', JSON.stringify(ids));
        }
      }

      Alert.alert('Success', 'Your hidden spot was shared!');
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to create spot error:' + error);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      latitude: '',
      longitude: '',
      type: 'lake',
      rating: 3,
    });
    setImage(null);
    fadeAnim.setValue(0);
  };

  return (
    <LinearGradient
      colors={['#f5f7fa', '#e4e8f0']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share Your Hidden Spot</Text>
            <Text style={styles.headerSubtitle}>Help others discover amazing places</Text>
          </View>

          {/* Image Upload */}
          <TouchableOpacity 
            style={styles.imageUploadContainer}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {image ? (
              <Animated.View style={{ opacity: fadeAnim }}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                />
                <View style={styles.imageOverlay}>
                  <MaterialIcons name="edit" size={24} color="white" />
                  <Text style={styles.imageOverlayText}>Change Photo</Text>
                </View>
              </Animated.View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="add-a-photo" size={32} color="#6E45E2" />
                <Text style={styles.imagePlaceholderText}>Tap to add a photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Title */}
            <View style={[
              styles.inputContainer,
              activeField === 'title' && styles.inputContainerFocused
            ]}>
              <MaterialIcons name="title" size={20} color="#6E45E2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Spot name"
                placeholderTextColor="#999"
                value={formData.title}
                onChangeText={(text) => handleChange('title', text)}
                onFocus={() => setActiveField('title')}
                onBlur={() => setActiveField(null)}
              />
            </View>

            {/* Description */}
            <View style={[
              styles.inputContainer,
              styles.textAreaContainer,
              activeField === 'description' && styles.inputContainerFocused
            ]}>
              <MaterialIcons name="description" size={20} color="#6E45E2" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about this place..."
                placeholderTextColor="#999"
                value={formData.description}
                onChangeText={(text) => handleChange('description', text)}
                multiline
                numberOfLines={4}
                onFocus={() => setActiveField('description')}
                onBlur={() => setActiveField(null)}
              />
            </View>

            {/* Location */}
            <View style={styles.locationContainer}>
              <View style={[
                styles.inputContainer,
                styles.halfWidth,
                activeField === 'latitude' && styles.inputContainerFocused
              ]}>
                <MaterialIcons name="pin-drop" size={20} color="#6E45E2" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Latitude"
                  placeholderTextColor="#999"
                  value={formData.latitude}
                  onChangeText={(text) => handleChange('latitude', text)}
                  keyboardType="numeric"
                  onFocus={() => setActiveField('latitude')}
                  onBlur={() => setActiveField(null)}
                />
              </View>

              <View style={[
                styles.inputContainer,
                styles.halfWidth,
                activeField === 'longitude' && styles.inputContainerFocused
              ]}>
                <MaterialIcons name="pin-drop" size={20} color="#6E45E2" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Longitude"
                  placeholderTextColor="#999"
                  value={formData.longitude}
                  onChangeText={(text) => handleChange('longitude', text)}
                  keyboardType="numeric"
                  onFocus={() => setActiveField('longitude')}
                  onBlur={() => setActiveField(null)}
                />
              </View>

              <TouchableOpacity 
                style={styles.gpsButton}
                onPress={getLocation}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <MaterialIcons name="gps-fixed" size={24} color="white" />
                )}
              </TouchableOpacity>
            </View>

            {/* Spot Type */}
            <View style={styles.pickerContainer}>
              <MaterialIcons name="category" size={20} color="#6E45E2" style={styles.inputIcon} />
              <Picker
                selectedValue={formData.type}
                onValueChange={(value) => handleChange('type', value)}
                style={styles.picker}
                dropdownIconColor="#6E45E2"
              >
                {spotTypes.map((t) => (
                  <Picker.Item key={t.value} label={t.label} value={t.value} />
                ))}
              </Picker>
            </View>

            {/* Rating */}
            <View style={styles.ratingContainer}>
              <View style={styles.ratingHeader}>
                <FontAwesome name="star" size={20} color="#FFD700" />
                <Text style={styles.ratingText}>
                  Rating: {formData.rating.toFixed(1)}
                </Text>
              </View>
              <Slider
                value={formData.rating}
                onValueChange={(value) => handleChange('rating', value)}
                minimumValue={1}
                maximumValue={5}
                step={0.1}
                minimumTrackTintColor="#6E45E2"
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor="#6E45E2"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              uploading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={uploading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6E45E2', '#88D3CE']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
                {uploading ? (
                <ActivityIndicator color="white" />
                ) : (
                <>
                  <MaterialIcons name="add-location" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Share Hidden Spot</Text>
                </>
                )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  imageUploadContainer: {
    marginHorizontal: 24,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imagePlaceholderText: {
    marginTop: 12,
    color: '#6E45E2',
    fontWeight: '600',
  },
  formContainer: {
    padding: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: '#6E45E2',
    shadowColor: '#6E45E2',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfWidth: {
    width: '48%',
  },
  gpsButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#6E45E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#6E45E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  picker: {
    flex: 1,
    height: 50,
    color: '#333',
  },
  ratingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  submitButton: {
    marginHorizontal: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6E45E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  gradient: {
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});