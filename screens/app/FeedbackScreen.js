import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../../firebase'; // Adjust the path as needed
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

export default function FeedbackScreen({ navigation }) {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('bug');
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const auth = getAuth();
  const db = getFirestore(app);
  const storage = getStorage(app);

  const categories = [
    { label: 'Bug Report', value: 'bug' },
    { label: 'Feature Request', value: 'feature' },
    { label: 'Complaint', value: 'complaint' },
    { label: 'Commendation', value: 'commendation' },
    { label: 'Other', value: 'other' },
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!message.trim()) {
      newErrors.message = 'Feedback message is required';
    }
    
    if (!category) {
      newErrors.category = 'Please select a category';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to select an image.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setScreenshot(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera permissions to take a photo.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setScreenshot(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
  };

  const uploadImage = async (uri) => {
    try {
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `feedback-screenshots/${Date.now()}-${auth.currentUser.uid}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const submitFeedback = async () => {
    if (!validateForm()) return;
    
    setUploading(true);
    
    try {
      let screenshotUrl = null;
      
      // Upload screenshot if exists
      if (screenshot) {
        screenshotUrl = await uploadImage(screenshot.uri);
      }
      
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to submit feedback');
      }
      
      // Save feedback to Firestore
      await addDoc(collection(db, 'feed'), {
        userId: user.uid,
        message: message.trim(),
        category,
        screenshot: screenshotUrl,
        timestamp: serverTimestamp(),
      });
      
      // Success
      Alert.alert(
        'Feedback Submitted',
        'Thank you for your feedback! We appreciate your input.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setMessage('');
              setCategory('bug');
              setScreenshot(null);
              setErrors({});
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        category === item.value && styles.selectedCategoryItem,
      ]}
      onPress={() => {
        setCategory(item.value);
        setShowCategoryModal(false);
        if (errors.category) {
          setErrors({...errors, category: null});
        }
      }}
    >
      <Text
        style={[
          styles.categoryText,
          category === item.value && styles.selectedCategoryText,
        ]}
      >
        {item.label}
      </Text>
      {category === item.value && (
        <MaterialIcons name="check" size={20} color="#FF521B" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FF521B" />
        </Pressable>
        <Text style={styles.headerTitle}>Submit Feedback</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Category</Text>
        <Pressable
          style={[styles.categorySelector, errors.category && styles.inputError]}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={styles.categorySelectorText}>
            {categories.find(c => c.value === category)?.label || 'Select a category'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
        </Pressable>
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
        
        <Text style={styles.label}>Your Feedback</Text>
        <TextInput
          style={[styles.textInput, errors.message && styles.inputError]}
          multiline
          numberOfLines={6}
          placeholder="Please describe your feedback in detail..."
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            if (errors.message) {
              setErrors({...errors, message: null});
            }
          }}
          textAlignVertical="top"
        />
        {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
        
        <Text style={styles.label}>Screenshot (Optional)</Text>
        {screenshot ? (
          <View style={styles.screenshotContainer}>
            <Image source={{ uri: screenshot.uri }} style={styles.screenshot} />
            <Pressable style={styles.removeButton} onPress={removeScreenshot}>
              <MaterialIcons name="close" size={20} color="white" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.screenshotButtons}>
            <Pressable style={styles.screenshotButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color="#FF521B" />
              <Text style={styles.screenshotButtonText}>Choose from Gallery</Text>
            </Pressable>
            
            <Pressable style={styles.screenshotButton} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={20} color="#FF521B" />
              <Text style={styles.screenshotButtonText}>Take a Photo</Text>
            </Pressable>
          </View>
        )}
        
        <Pressable 
          style={[styles.submitButton, uploading && styles.submitButtonDisabled]} 
          onPress={submitFeedback}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <Pressable onPress={() => setShowCategoryModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </Pressable>
            </View>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={item => item.value}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        marginTop: 0,
      },
      android: {
        marginTop: 40,
      },
    }),
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF521B',
  },
  headerPlaceholder: {
    width: 32,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2A324B',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  categorySelectorText: {
    fontSize: 16,
    color: '#2A324B',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: 'white',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF521B',
  },
  errorText: {
    color: '#FF521B',
    marginTop: -12,
    marginBottom: 16,
    fontSize: 14,
  },
  screenshotContainer: {
    position: 'relative',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  screenshot: {
    width: 150,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF521B',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenshotButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  screenshotButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF521B',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  screenshotButtonText: {
    marginLeft: 8,
    color: '#FF521B',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#FF521B',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 8,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A324B',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedCategoryItem: {
    backgroundColor: '#FFF0EB',
  },
  categoryText: {
    fontSize: 16,
    color: '#2A324B',
  },
  selectedCategoryText: {
    color: '#FF521B',
    fontWeight: '500',
  },
});