import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Image, Alert } from 'react-native';
import { auth } from '../firebase';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { MaterialIcons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [uploading, setUploading] = useState(false);

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setUserData(docSnap.data());
        setName(docSnap.data().name || '');
        setPhone(docSnap.data().phone || '');
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name,
        phone
      });
      setIsEditing(false);
      setUserData({ ...userData, name, phone });
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace('Login');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'We need access to your photo library to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      console.log('Selected image:', result.assets[0].uri);
      uploadImage(result.assets[0].uri);
    } else {
      console.log('Image picker canceled');
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    const storage = getStorage();
    const storageRef = ref(storage, `profileImages/${auth.currentUser.uid}.jpg`);

    try {
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload image to Firebase Storage
      await uploadBytes(storageRef, blob);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update Firestore with the new image URL
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        profileImage: downloadURL,
      });

      // Update local state
      setUserData({ ...userData, profileImage: downloadURL });
      Alert.alert('Success', 'Profile image updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <Pressable 
        style={styles.backButton}
        onPress={() => navigation.toggleDrawer()}
      >
        <MaterialIcons name="arrow-back" size={24} color="#FF521B" />
      </Pressable>

      <View style={styles.profileHeader}>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <View style={styles.profileInfo}>
        {isEditing ? (
          <>
            <Text style={styles.label}>Edit Name:</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your Name"
            />

            <Text style={styles.label}>Edit Phone:</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              keyboardType="phone-pad"
            />

            <Pressable 
              style={styles.button1}
              onPress={handleSave}
            >
              <Text style={styles.buttonText1}>Save Changes</Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Editable Profile Image */}
            <Pressable onPress={handleImagePicker}>
              <View style={styles.line1}>
                <View style={styles.line2}>
                  <Image
                    source={
                      userData?.profileImage
                        ? { uri: userData.profileImage } // Use profileImage from Firestore
                        : require('../assets/default-profile.png') // Fallback image
                    }
                    style={styles.profileImage}
                  />
                </View>
              </View>
            </Pressable>
            <Text style={styles.label}>Tap the image to change</Text>
            <Text style={styles.value}>{userData?.name || 'Not set'}</Text>
            <Text style={styles.value2}>{auth.currentUser?.email}</Text>
            <Text style={styles.value2}>{userData?.phone || 'Not set'}</Text>
          </>
        )}
      </View>
      <Pressable 
              style={[styles.button, { marginTop: 20 }]}
              onPress={() => setIsEditing(true)}
            >
              <View style={styles.profileOptions}>
              <FontAwesome5 name="user-edit" size={24} color="#0b3948" />
              <Text style={styles.buttonText}>Edit Profile</Text>
              </View>
              
            </Pressable>
      <Pressable style={styles.button} onPress={() => navigation.navigate('Home', { screen: 'ResetPassword' })}>
      <View style={styles.profileOptions}>
      <Entypo name="lock" size={24} color="#0b3948" />
      <Text style={styles.buttonText}>Reset Password</Text>
      </View>
      
      </Pressable>
      <Pressable 
        style={styles.button}
        onPress={() => navigation.navigate('Home', { screen: 'MyAddresses' })}
      >
        <View style={styles.profileOptions}>
        <FontAwesome6 name="location-dot" size={20} color="#0b3948" />
        <Text style={styles.buttonText}>Edit My Addresses</Text>
        </View>
        
      </Pressable>
      <Pressable 
        style={styles.button}
        onPress={() => navigation.navigate('Home', { screen: 'Notifications' })}
      >
        <View style={styles.profileOptions}>
        <Entypo name="chat" size={24} color="#0B3948" />
        <Text style={styles.buttonText}>My Notifications</Text>
        </View>
        
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFF0EB',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF521B',
  },
  profileHeader: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF521B',
  },
  profileInfo: {
    marginBottom: 20,
    alignItems: 'center',
    borderBottomColor: '#E0E0E0',
    borderBottomWidth: 1,
    paddingBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    margin: 'auto',
  },
  label: {
    fontSize: 16,
    color: '#888',
    marginBottom: 5,
    marginTop: 15,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0b3948',
  },
  value2: {
    fontSize: 18,
    fontStyle: 'italic',
    marginBottom: 5,
    color: '#0b3948',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    alignItems: 'flex-start',
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 10,
    paddingBottom: 10,
  },
  button1: {
    alignItems: 'flex-start',
    marginTop: 10,
    backgroundColor: 'green',
  },
  buttonText: {
    color: '#0B3948',
    fontSize: 16,
  },
  buttonText1: {
    color: '#fff',
    fontSize: 16,
    padding: 10,
  },
  link: {
    color: '#FF521B',
    textAlign: 'center',
  },
  line1: {
    padding: 'auto',
    margin: 'auto',
    borderColor: '#E0E0E0',
    borderWidth: 2,
    height: 210,
    width: 210,
    borderRadius: 105,
    marginBottom: 20,
  },
  line2: {
    margin: 'auto',
    padding: 'auto',
    borderColor: '#E0E0E0',
    borderWidth: 2,
    height: 180,
    width: 180,
    borderRadius: 90,
  },
  profileOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});