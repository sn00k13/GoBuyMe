import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

export default function Permissions({ navigation }) {
  const [location, setLocation] = useState(true);
  const [camera, setCamera] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const { theme, mode, setMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={styles.title}>Permissions</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Location Permission */}
      <View style={[styles.section, { backgroundColor: theme.cards }]}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>Location</Text>
        <View style={styles.row}>
          <Feather name="map-pin" size={22} color="#58A4B0" />
          <Text style={styles.value}>Allow access to your location</Text>
          <Switch
            value={location}
            onValueChange={setLocation}
            thumbColor={location ? '#FF521B' : '#f4f3f4'}
            trackColor={{ false: '#ccc', true: '#FF521B' }}
          />
        </View>
      </View>

      {/* Camera Permission */}
      <View style={[styles.section, { backgroundColor: theme.cards }]}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>Camera</Text>
        <View style={styles.row}>
          <Feather name="camera" size={22} color="#58A4B0" />
          <Text style={styles.value}>Allow access to your camera</Text>
          <Switch
            value={camera}
            onValueChange={setCamera}
            thumbColor={camera ? '#FF521B' : '#f4f3f4'}
            trackColor={{ false: '#ccc', true: '#FF521B' }}
          />
        </View>
      </View>

      {/* Notifications Permission */}
      <View style={[styles.section, { backgroundColor: theme.cards }]}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>Notifications</Text>
        <View style={styles.row}>
          <MaterialIcons name="notifications-active" size={22} color="#58A4B0" />
          <Text style={styles.value}>Allow push notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            thumbColor={notifications ? '#FF521B' : '#f4f3f4'}
            trackColor={{ false: '#ccc', true: '#FF521B' }}
          />
        </View>
      </View>
    </View>
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
    marginBottom: 24,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B3948',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: '#58A4B0',
    marginLeft: 16,
  },
});