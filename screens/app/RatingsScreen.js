import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db, auth } from '../../firebase';

export default function RatingsScreen({ navigation, route }) {
  const { 
    orderId, 
    restaurantId, 
    restaurantName, 
    storeId, 
    storeName, 
    agentId, 
    agentName, 
    orderType 
  } = route.params;
  
  // Determine what we're rating
  const hasBusiness = !!restaurantId || !!storeId;
  const businessId = restaurantId || storeId;
  const businessName = restaurantName || storeName;
  const businessType = restaurantId ? 'restaurant' : 'store';
  const hasAgent = !!agentId;
  
  // Rating states
  const [businessRating, setBusinessRating] = useState(0);
  const [agentRating, setAgentRating] = useState(0);
  const [businessComment, setBusinessComment] = useState('');
  const [agentComment, setAgentComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitRatings = async () => {
    // Check if at least one rating is provided
    if (businessRating === 0 && agentRating === 0) {
      Alert.alert('Error', 'Please provide at least one rating');
      return;
    }

    setSubmitting(true);

    try {
      const timestamp = new Date();
      const ratings = [];
      
      // Add business rating if provided
      if (hasBusiness && businessRating > 0) {
        ratings.push({
          userId: auth.currentUser.uid,
          targetType: businessType,
          targetId: businessId,
          orderId: orderId,
          rating: businessRating,
          comment: businessComment,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
      
      // Add agent rating if provided
      if (hasAgent && agentRating > 0) {
        ratings.push({
          userId: auth.currentUser.uid,
          targetType: 'agent',
          targetId: agentId,
          orderId: orderId,
          rating: agentRating,
          comment: agentComment,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
      
      // Save all ratings
      for (const rating of ratings) {
        const ratingRef = doc(collection(db, 'ratings'));
        await setDoc(ratingRef, rating);
      }
      
      Alert.alert('Success', 'Thank you for your feedback!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error submitting ratings:', error);
      Alert.alert('Error', 'Failed to submit ratings. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentRating, setRating, size = 32, title = "") => {
    return (
      <View style={styles.starSection}>
        {title ? <Text style={styles.starTitle}>{title}</Text> : null}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <MaterialIcons
                name={star <= currentRating ? 'star' : 'star-outline'}
                size={size}
                color={star <= currentRating ? '#FFD700' : '#CCC'}
              />
            </Pressable>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {currentRating > 0 ? `${currentRating}/5 stars` : "Tap to rate"}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#FF521B" />
        </Pressable>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.orderId}>Order #: {orderId}</Text>
        
        {hasBusiness && (
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>
              {businessType === 'restaurant' ? 'Restaurant' : 'Store'} Experience
            </Text>
            <Text style={styles.name}>{businessName}</Text>
            
            {renderStars(
              businessRating, 
              setBusinessRating, 
              36, 
              businessType === 'restaurant' ? "Food Quality & Service" : "Product Quality & Service"
            )}
            
            <Text style={styles.commentLabel}>
              Comments about the {businessType} (optional)
            </Text>
            <TextInput
              style={styles.commentInput}
              placeholder={
                businessType === 'restaurant' 
                  ? "How was the food quality, packaging, and restaurant service?"
                  : "How was the product quality, packaging, and store experience?"
              }
              value={businessComment}
              onChangeText={setBusinessComment}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {hasAgent && (
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Delivery Experience</Text>
            <Text style={styles.name}>{agentName}</Text>
            
            {renderStars(agentRating, setAgentRating, 36, "Delivery Service")}
            
            <Text style={styles.commentLabel}>Comments about delivery (optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="How was the delivery timing, packaging condition, and agent behavior?"
              value={agentComment}
              onChangeText={setAgentComment}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {!hasAgent && (
          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              No delivery agent assigned to this order yet.
            </Text>
          </View>
        )}

        <Pressable
          style={[styles.submitButton, submitting && styles.disabledButton]}
          onPress={submitRatings}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Ratings'}
          </Text>
        </Pressable>
      </ScrollView>
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
    ...Platform.select({
      ios: { marginTop: 0 },
      android: { marginTop: 40 },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF521B',
  },
  orderId: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  ratingSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  name: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  starSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  starTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    color: '#666',
    fontSize: 14,
  },
  commentLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 100,
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
  },
  infoText: {
    marginLeft: 8,
    color: '#2196F3',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#FF521B',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});