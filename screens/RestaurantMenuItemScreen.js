import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCart } from './StoreCartContext';

export default function RestaurantMenuItemScreen({ route, navigation }) {
  const { menuItem, restaurantId, restaurantName } = route.params;
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    const itemToAdd = {
      ...menuItem,
      quantity,
      restaurantId,
      restaurantName,
    };
    addToCart(itemToAdd);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#FF521B" />
        </Pressable>
        <Text style={styles.headerText}>{menuItem.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* Item Image */}
        <Image
          source={
            menuItem.imageUrl
              ? { uri: menuItem.imageUrl }
              : require('../assets/placeholder.jpg')
          }
          style={styles.itemImage}
        />

        {/* Item Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.itemName}>{menuItem.name}</Text>
          <Text style={styles.itemDescription}>{menuItem.description}</Text>
          <Text style={styles.itemPrice}>₦{menuItem.price}</Text>

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantityControls}>
              <Pressable
                style={styles.quantityButton}
                onPress={() => quantity > 1 && setQuantity(quantity - 1)}
              >
                <MaterialIcons name="remove" size={24} color="#FF521B" />
              </Pressable>
              <Text style={styles.quantityText}>{quantity}</Text>
              <Pressable
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <MaterialIcons name="add" size={24} color="#FF521B" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            ₦{(menuItem.price * quantity).toFixed(2)}
          </Text>
        </View>
        <Pressable style={styles.addButton} onPress={handleAddToCart}>
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B3948',
  },
  scrollView: {
    flex: 1,
  },
  itemImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 16,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B3948',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF521B',
    marginBottom: 24,
  },
  quantityContainer: {
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#0B3948',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF521B',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    color: '#0B3948',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 4,
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B3948',
  },
  addButton: {
    backgroundColor: '#FF521B',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 