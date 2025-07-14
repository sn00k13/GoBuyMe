import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function TermsService({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#0B3948" />
        </Pressable>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Terms Content */}
      <View style={styles.section}>
        <Text style={styles.heading}>Welcome to GoBuyMe!</Text>
        <Text style={styles.text}>
          Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the GoBuyMe app.
        </Text>
        <Text style={styles.subheading}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By accessing or using our app, you agree to be bound by these Terms. If you disagree with any part, you may not access the service.
        </Text>
        <Text style={styles.subheading}>2. User Accounts</Text>
        <Text style={styles.text}>
          You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
        </Text>
        <Text style={styles.subheading}>3. Purchases</Text>
        <Text style={styles.text}>
          If you wish to purchase any product or service, you may be asked to supply certain information relevant to your purchase.
        </Text>
        <Text style={styles.subheading}>4. Content</Text>
        <Text style={styles.text}>
          Our app allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material ("Content"). You are responsible for the content you post.
        </Text>
        <Text style={styles.subheading}>5. Termination</Text>
        <Text style={styles.text}>
          We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever.
        </Text>
        <Text style={styles.subheading}>6. Changes</Text>
        <Text style={styles.text}>
          We reserve the right to modify or replace these Terms at any time. Changes will be effective upon posting.
        </Text>
        <Text style={styles.subheading}>7. Contact Us</Text>
        <Text style={styles.text}>
          If you have any questions about these Terms, please contact us at support@gobuyme.com.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0EB',
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF521B',
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B3948',
    marginBottom: 10,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF521B',
    marginTop: 16,
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
    textAlign: 'left',
  },
});