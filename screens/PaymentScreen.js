import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Paystack } from 'react-native-paystack-webview';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { useStoreCart } from './StoreCartContext';

export default function PaymentScreen({ navigation, route }) {
    const { cartItems = [], totalAmount = 0, userData, storeId } = route.params;
    const [processing, setProcessing] = useState(false);
    const auth = getAuth();
    const { clearCart } = useStoreCart();
    const paystackWebViewRef = useRef();

    // Redirect to cart if no items
    React.useEffect(() => {
        if (!cartItems || cartItems.length === 0) {
            Alert.alert(
                'Empty Cart',
                'Your cart is empty. Please add items before proceeding to payment.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('EMartCartDetails')
                    }
                ]
            );
            return;
        }

        if (!userData?.name || !userData?.phone) {
            Alert.alert(
                'Missing Information',
                'Please complete your profile with name and phone number before proceeding.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Profile')
                    }
                ]
            );
            return;
        }
    }, [cartItems, userData]);

    const generateReference = () => {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000000);
        return `ref-${timestamp}-${random}`;
    };

    const handlePaymentSuccess = async (response) => {
        try {
            setProcessing(true);

            // Create order document
            const orderRef = doc(db, 'orders', response.transactionRef.reference);
            await setDoc(orderRef, {
                userId: auth.currentUser.uid,
                items: cartItems,
                totalAmount,
                status: 'paid',
                paymentReference: response.transactionRef.reference,
                paymentMethod: 'card',
                customerName: userData.name,
                customerPhone: userData.phone,
                customerEmail: userData.email,
                customerAddress: userData.address,
                createdAt: serverTimestamp(),
                storeId
            });

            // Clear cart after successful payment
            clearCart(storeId);

            // Navigate to success screen
            navigation.replace('OrderConfirmation', {
                orderId: response.transactionRef.reference,
                totalAmount
            });
        } catch (error) {
            console.error('Error processing payment:', error);
            Alert.alert('Error', 'There was an error processing your payment. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (processing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF521B" />
                <Text style={styles.loadingText}>Processing your payment...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#FF521B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    {cartItems.map((item, index) => (
                        <View key={index} style={styles.orderItem}>
                            <Text style={styles.itemName}>{item.name} x {item.quantity}</Text>
                            <Text style={styles.itemPrice}>
                                ₦{(parseFloat(item.price) * parseInt(item.quantity)).toLocaleString()}
                            </Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount:</Text>
                        <Text style={styles.totalAmount}>₦{totalAmount.toLocaleString()}</Text>
                    </View>
                </View>

                <Paystack
                    paystackKey="pk_test_1700cc30d4e1158c6da9ca80f549205b762b9eed"
                    amount={totalAmount}
                    billingEmail={userData.email}
                    activityIndicatorColor="#FF521B"
                    onCancel={(e) => {
                        Alert.alert('Payment Cancelled', 'You have cancelled the payment.');
                    }}
                    onSuccess={handlePaymentSuccess}
                    autoStart={false}
                    ref={paystackWebViewRef}
                    billingName={userData.name}
                    billingMobile={userData.phone}
                    currency="NGN"
                />

                <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => paystackWebViewRef.current?.startTransaction()}
                >
                    <Text style={styles.payButtonText}>Pay Now</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF0EB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF0EB',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#FF521B',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        marginTop: 40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF521B',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF521B',
        marginBottom: 16,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    itemName: {
        fontSize: 16,
        color: '#2A324B',
        flex: 1,
    },
    itemPrice: {
        fontSize: 16,
        color: '#2A324B',
        fontWeight: '500',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2A324B',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF521B',
    },
    payButton: {
        backgroundColor: '#FF521B',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    payButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
}); 