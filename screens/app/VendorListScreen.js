import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { collection, getDocs, orderBy, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import ColorText from '../../assets/components/colorText';
import { useTheme } from '../../utils/ThemeContext';

const { width } = Dimensions.get('window');
const itemSize = (width - 32 - 16) / 3;

export default function VendorListScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [mealSearch, setMealSearch] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stores, setStores] = useState([]);
  const [sortOption, setSortOption] = useState('orderCount');
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { theme, mode, setMode } = useTheme();

  const sortOptions = [
    { label: 'Most Ordered', value: 'orderCount' },
    { label: 'Highest Rated', value: 'rating' },
    { label: 'Minimum Order Value', value: 'minimumOrderValue' },
  ];

  const fetchRestaurants = async (sortBy = 'orderCount') => {
    try {
      setRestaurantsLoading(true);
      let restaurantsQuery;
      
      switch(sortBy) {
        case 'rating':
          restaurantsQuery = query(collection(db, 'restaurants'), orderBy('rating', 'desc'));
          break;
        case 'minimumOrderValue':
          restaurantsQuery = query(collection(db, 'restaurants'), orderBy('minimumOrderValue', 'asc'));
          break;
        case 'orderCount':
        default:
          restaurantsQuery = query(collection(db, 'restaurants'), orderBy('orderCount', 'desc'));
      }

      const restaurantsSnapshot = await getDocs(restaurantsQuery);
      const restaurantsData = restaurantsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRestaurants(restaurantsData);
      setRestaurantsLoading(false);
    } catch (err) {
      console.error('Error fetching restaurants: ', err);
      setError(err.message);
      setRestaurantsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchRestaurants(sortOption);

        // Fetch meals
        const mealsSnapshot = await getDocs(collection(db, 'meals'));
        const mealsData = mealsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          imageUrl: doc.data().imageUrl,
          restaurantId: doc.data().restaurantId,
        }));

        // Fetch stores
        const storesSnapshot = await getDocs(collection(db, 'stores'));
        const storesData = storesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMeals(mealsData);
        setStores(storesData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data: ', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time listener for restaurants
    const unsubscribe = onSnapshot(
      query(collection(db, 'restaurants'), orderBy('orderCount', 'desc')),
      (snapshot) => {
        const updatedRestaurants = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRestaurants(updatedRestaurants);
      },
      (error) => {
        console.error('Error in real-time listener: ', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSortChange = (value) => {
    setSortOption(value);
    fetchRestaurants(value);
    setModalVisible(false);
  };

  const filteredStores = stores.filter((store) => {
    const category = String(store.category || '').toLowerCase();
    const name = String(store.name || '').toLowerCase();
    const searchTerm = restaurantSearch.toLowerCase().trim();
    return name.includes(searchTerm) || category.includes(searchTerm);
  });

  const renderStoreItem = ({ item }) => (
    <Pressable
      style={[styles.restaurantCard, { backgroundColor: theme.cards }]}
      onPress={() => navigation.navigate('EmartScreen')}
    >
      <View style={styles.restaurantImageContainer}>
        <Image
        source={
          item.imageUrl
            ? { uri: item.imageUrl }
            : require('../../assets/logo-icon.png')
        }
        style={styles.restaurantImage2}
      />
      </View>
      <View style={styles.restaurantInfo}>
        <Text style={[styles.restaurantName, { color: theme.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.restaurantCuisine, { color: theme.text }]}>
          {item.category || 'General Store'}
        </Text>
        <View style={styles.restaurantMeta}>
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating || 'N/A'}</Text>
          </View>
          <Text style={styles.deliveryTime}>
            Delivery Time: {item.deliveryTime || 'Time not specified'}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const filteredMeals = meals.filter((meal) =>
    meal.name.toLowerCase().includes(mealSearch.toLowerCase())
  );

  const renderMealItem = ({ item }) => (
    <Pressable
      style={styles.mealItem}
      onPress={() => navigation.navigate('MealCard', { mealId: item.id })}
    >
      <Image
        source={
          item.imageUrl
            ? { uri: item.imageUrl }
            : require('../../assets/placeholder.jpg')
        }
        style={styles.mealImage}
      />
      <Text style={styles.mealName} numberOfLines={1}>
        {item.name}
      </Text>
    </Pressable>
  );

  // Fixed filtering and sorting logic for restaurants
  const filterAndSortRestaurants = () => {
    // First filter by search term
    const filtered = restaurants.filter((restaurant) => {
      const cuisine = String(restaurant.cuisine || '').toLowerCase();
      const name = String(restaurant.name || '').toLowerCase();
      const searchTerm = restaurantSearch.toLowerCase().trim();
      return name.includes(searchTerm) || cuisine.includes(searchTerm);
    });

    // Separate open and closed restaurants
    const openRestaurants = [];
    const closedRestaurants = [];
    
    filtered.forEach(restaurant => {
      if (restaurant.isOpen === false) {
        closedRestaurants.push(restaurant);
      } else {
        openRestaurants.push(restaurant);
      }
    });

    // Sort open restaurants by selected criteria
    const sortedOpen = openRestaurants.sort((a, b) => {
      switch(sortOption) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'minimumOrderValue':
          return (a.minimumOrderValue || 0) - (b.minimumOrderValue || 0);
        case 'orderCount':
        default:
          return (b.orderCount || 0) - (a.orderCount || 0);
      }
    });

    // Sort closed restaurants by the same criteria
    const sortedClosed = closedRestaurants.sort((a, b) => {
      switch(sortOption) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'minimumOrderValue':
          return (a.minimumOrderValue || 0) - (b.minimumOrderValue || 0);
        case 'orderCount':
        default:
          return (b.orderCount || 0) - (a.orderCount || 0);
      }
    });

    // Return open restaurants first, then closed ones
    return [...sortedOpen, ...sortedClosed];
  };

  const filteredRestaurants = filterAndSortRestaurants();

  const renderRestaurantItem = ({ item }) => (
    <Pressable
      style={[
        styles.restaurantCard,
        {
          backgroundColor: theme.cards,
          opacity: item.isOpen === false ? 0.5 : 1,
        },
      ]}
      onPress={() => {
        if (item.isOpen === false) {
          Alert.alert('This restaurant is closed at this moment');
        } else {
          navigation.navigate('RestaurantDetail', { restaurantId: item.id });
        }
      }}
    >
      <Image
        source={
          item.imageUrl
            ? { uri: item.imageUrl }
            : require('../../assets/placeholder.jpg')
        }
        style={styles.restaurantImage}
      />
      <View style={styles.restaurantInfo}>
        <Text style={[styles.restaurantName, { color: theme.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.restaurantCuisine, { color: theme.text }]}>
          {Array.isArray(item.cuisineType)
            ? item.cuisineType.join(' • ')
            : item.cuisine || 'Various cuisines'}
        </Text>
        <View style={styles.restaurantMeta}>
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating || 'N/A'}</Text>
          </View>
          <View style={styles.orderCountContainer}>
            <MaterialIcons name="shopping-bag" size={14} color="#777" />
            <Text style={styles.orderCountText}>{item.orderCount || 0} Orders</Text>
          </View>
          <Text style={styles.deliveryTime}>
            {item.deliveryTime || 'Time not specified'}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FF521B" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Error loading restaurants: {error}</Text>
        <Pressable 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            fetchRestaurants(sortOption);
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.cards,
              borderBottomColor: theme.borderBottom,
            },
          ]}
        >
          <Pressable onPress={() => navigation.navigate('HomeMain')}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ColorText color="primary" style={{ fontSize: 20 }}>
            Owerri
          </ColorText>
          <View style={{ width: 24 }}></View>
        </View>

        {/* Sort Button */}
        <View style={[styles.sortContainer, { backgroundColor: theme.cards }]}>
          <Text style={[styles.sortLabel, { color: theme.text }]}>Sort by:</Text>
          <Pressable 
            style={[styles.sortButton, { backgroundColor: theme.background }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={[styles.sortButtonText, { color: theme.text }]}>
              {sortOptions.find(opt => opt.value === sortOption)?.label}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.text} />
          </Pressable>
        </View>

        {/* Sort Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.cards }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Sort by</Text>
              {sortOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.modalOption,
                    sortOption === option.value && styles.modalOptionSelected
                  ]}
                  onPress={() => handleSortChange(option.value)}
                >
                  <Text 
                    style={[
                      styles.modalOptionText, 
                      { color: theme.text },
                      sortOption === option.value && styles.modalOptionTextSelected
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortOption === option.value && (
                    <MaterialIcons name="check" size={20} color="#FF521B" />
                  )}
                </Pressable>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Tab Headers */}
        <View
          style={[
            styles.tabContainer,
            {
              backgroundColor: theme.cards,
              borderBottomColor: theme.borderBottom,
            },
          ]}
        >
          <Pressable
            style={[
              styles.tabButton,
              activeTab === 'restaurants' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('restaurants')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'restaurants' && styles.activeTabText,
              ]}
            >
              Branches
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabButton,
              activeTab === 'meals' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('meals')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'meals' && styles.activeTabText,
              ]}
            >
              Meals
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.contentContainer}>
          {activeTab === 'restaurants' ? (
            <View>
              <View style={styles.searchContainer}>
                <MaterialIcons
                  name="search"
                  size={20}
                  color="#777"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search restaurants..."
                  value={restaurantSearch}
                  onChangeText={setRestaurantSearch}
                />
              </View>
              
              {restaurantsLoading ? (
                <View style={styles.loadingRestaurants}>
                  <ActivityIndicator size="large" color="#FF521B" />
                </View>
              ) : (
                <>
                  {/* Emart list content */}
                  <FlatList
                    data={filteredStores}
                    renderItem={renderStoreItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.restaurantList2}
                    key="store-list"
                  />
                  
                  {/* Restaurant list content */}
                  <FlatList
                    data={filteredRestaurants}
                    renderItem={renderRestaurantItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.restaurantList}
                    key="restaurant-list"
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: theme.text }]}>
                          No restaurants found
                        </Text>
                      </View>
                    }
                  />
                </>
              )}
            </View>
          ) : (
            <View>
              <View style={styles.searchContainer}>
                <MaterialIcons
                  name="search"
                  size={20}
                  color="#777"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search meals..."
                  value={mealSearch}
                  onChangeText={setMealSearch}
                />
              </View>

              {/* Meals Grid */}
              <FlatList
                data={filteredMeals}
                renderItem={renderMealItem}
                keyExtractor={(item) => item.id}
                numColumns={3}
                scrollEnabled={false}
                columnWrapperStyle={styles.mealRow}
                contentContainerStyle={styles.mealGrid}
                key="meal-grid"
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.text }]}>
                      No meals found
                    </Text>
                  </View>
                }
              />
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0EB',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF521B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        marginTop: 0,
      },
      android: {
        marginTop: 40,
      },
    }),
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  sortLabel: {
    marginRight: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sortButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionSelected: {
    backgroundColor: '#FFF0EB',
  },
  modalOptionText: {
    fontSize: 16,
  },
  modalOptionTextSelected: {
    color: '#FF521B',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF521B',
  },
  tabText: {
    fontSize: 16,
    color: '#555',
  },
  activeTabText: {
    color: '#FF521B',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 4,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 45,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  loadingRestaurants: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealGrid: {
    paddingBottom: 20,
  },
  mealRow: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mealItem: {
    width: itemSize,
    alignItems: 'center',
  },
  mealImage: {
    width: itemSize - 10,
    height: itemSize - 10,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  mealName: {
    marginTop: 4,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    width: itemSize - 10,
  },
  restaurantList: {
    paddingBottom: 20,
  },
  restaurantList2: {
    paddingBottom: 0,
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  restaurantImage: {
    width: 100,
    height: 100,
  },
  restaurantImageContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantImage2: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  restaurantInfo: {
    flex: 1,
    padding: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#042A2B',
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#333',
  },
  orderCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderCountText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#777',
  },
  deliveryTime: {
    fontSize: 14,
    color: '#FF521B',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});