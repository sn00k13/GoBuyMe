import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function OrdersScreen({ navigation }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const auth = getAuth();

    const fetchOrders = async () => {
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(
                ordersRef,
                where('userId', '==', auth.currentUser.uid),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const ordersData = [];
            querySnapshot.forEach((doc) => {
                ordersData.push({ id: doc.id, ...doc.data() });
            });
            setOrders(ordersData);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return '#FF9800';
            case 'processing':
                return '#2196F3';
            case 'delivered':
                return '#4CAF50';
            case 'cancelled':
                return '#F44336';
            default:
                return '#757575';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return 'pending';
            case 'processing':
                return 'local-shipping';
            case 'delivered':
                return 'check-circle';
            case 'cancelled':
                return 'cancel';
            default:
                return 'help';
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderOrder = ({ item }) => (
        <Pressable
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        >
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <MaterialIcons 
                        name={getStatusIcon(item.status)} 
                        size={16} 
                        color="white" 
                        style={styles.statusIcon}
                    />
                    <Text style={styles.statusText}>
                        {(item.status || 'pending').charAt(0).toUpperCase() + (item.status || 'pending').slice(1)}
                    </Text>
                </View>
            </View>

            <View style={styles.orderInfo}>
                <Text style={styles.dateText}>
                    {formatDate(item.createdAt)}
                </Text>
                <Text style={styles.amountText}>
                    ₦{item.totalAmount?.toLocaleString()}
                </Text>
            </View>

            <View style={styles.itemsList}>
                {item.items.map((orderItem, index) => (
                    <Text key={index} style={styles.itemText} numberOfLines={1}>
                        {orderItem.quantity}x {orderItem.name}
                    </Text>
                ))}
            </View>

            <View style={styles.paymentInfo}>
                <Text style={styles.paymentMethod}>
                    {item.paymentMethod === 'cash_on_delivery' 
                        ? 'Cash on Delivery'
                        : ((item.paymentMethod || 'card').charAt(0).toUpperCase() + (item.paymentMethod || 'card').slice(1))}
                </Text>
                <Text style={[styles.paymentStatus, { color: getStatusColor(item.paymentStatus) }]}>
                    {(item.paymentStatus || 'pending').charAt(0).toUpperCase() + (item.paymentStatus || 'pending').slice(1)}
                </Text>
            </View>
        </Pressable>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF521B" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
            <Pressable onPress={() => navigation.navigate('HomeMain')}>
          <MaterialIcons name="arrow-back" size={24} color="#FF521B" />
        </Pressable>
                <Text style={styles.headerText}>My Orders</Text>
                <View></View>
            </View>

            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="shopping-bag" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No orders yet</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF0EB',
    },
    header: {
        backgroundColor: 'white',
        padding: 16,
        marginTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF521B',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF0EB',
    },
    listContainer: {
        padding: 16,
    },
    orderCard: {
        backgroundColor: 'white',
        borderRadius: 4,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0B3948',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusIcon: {
        marginRight: 4,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    orderInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
    },
    amountText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF521B',
    },
    itemsList: {
        marginBottom: 12,
    },
    itemText: {
        fontSize: 14,
        color: '#0B3948',
        marginBottom: 4,
    },
    paymentInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    paymentMethod: {
        fontSize: 14,
        color: '#666',
    },
    paymentStatus: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
});