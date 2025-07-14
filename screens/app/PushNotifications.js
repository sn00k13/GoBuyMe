import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';

// Example notifications data
const initialNotifications = [
  {
    id: '1',
    title: 'Order Shipped',
    message: 'Your order #12345 has been shipped!',
    icon: 'shopping-bag',
    time: '2h ago',
    type: 'order',
    read: false,
  },
  {
    id: '2',
    title: 'Promo Alert',
    message: 'Get 10% off your next purchase. Limited time!',
    icon: 'local-offer',
    time: '5h ago',
    type: 'promo',
    read: true,
  },
  {
    id: '3',
    title: 'App Update',
    message: 'A new version of GoBuyMe is available.',
    icon: 'update',
    time: '1d ago',
    type: 'update',
    read: false,
  },
];

export default function PushNotifications({ navigation }) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const renderIcon = (type, icon) => {
    if (type === 'order') return <Feather name={icon} size={24} color="#58A4B0" />;
    if (type === 'promo') return <MaterialIcons name={icon} size={24} color="#FF521B" />;
    if (type === 'update') return <MaterialIcons name={icon} size={24} color="#0B3948" />;
    return <MaterialIcons name="notifications" size={24} color="#58A4B0" />;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#0B3948" />
        </Pressable>
        <Text style={styles.title}>Push Notifications</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="notifications-off" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.notification,
                { backgroundColor: item.read ? '#F7F7F7' : '#FFF8F3' },
              ]}
              onPress={() => markAsRead(item.id)}
            >
              <View style={styles.iconContainer}>
                {renderIcon(item.type, item.icon)}
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifMsg}>{item.message}</Text>
                <Text style={styles.notifTime}>{item.time}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </Pressable>
          )}
        />
      )}
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
  notification: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#FFF8F3',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  iconContainer: {
    marginRight: 16,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0B3948',
    marginBottom: 2,
  },
  notifMsg: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 12,
    color: '#58A4B0',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF521B',
    position: 'absolute',
    top: 18,
    right: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#aaa',
  },
});