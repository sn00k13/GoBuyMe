import 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import DummyScreen from './screens/DummyScreen';
import CustomDrawerContent from './screens/CustomDrawerContent';
import AddressScreen from './screens/AddressScreen';
import ChatScreen from './screens/ChatScreen';
import CartDetails from './screens/CartDetails';
import FavoritesScreen from './screens/FavoritesScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import Cards from './screens/Cards';
import OffersScreen from './screens/OffersScreen';
import MealCardScreen from './screens/MealCardScreen';
import RestaurantScreen from './screens/RestaurantScreen';
import VendorListScreen from './screens/VendorListScreen'; 
import MealDetailsScreen from './screens/MealDetailsScreen';
import PaymentOptionsScreen from './screens/PaymentOptionsScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';
import MyAddressesScreen from './screens/MyAddressesScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import LandingScreen from './screens/LandingScreen';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import ResetPasswordSuccessScreen from './screens/ResetPasswordSuccessScreen';
import AppearancePersonalization from './screens/AppearancePersonalization';
import LanguageInput from './screens/LanguageInput';
import DataStorage from './screens/DataStorage';
import NotificationsOptions from './screens/NotificationsOptions';
import PushNotifications from './screens/PushNotifications';
import TermsService from './screens/TermsService';
import AboutScreen from './screens/AboutScreen';
import AccountsPasswordsSettings from './screens/AccountsPasswordsSettings';
import Permissions from './screens/Permissions';
import EmartScreen from './screens/EmartScreen';
import SelectProductScreen from './screens/SelectProductScreen';
import EMartCartDetails from './screens/EMartCartDetails';
import PaymentScreen from './screens/PaymentScreen';
import CashOnDeliveryScreen from './screens/CashOnDeliveryScreen';
import OrderConfirmation from './screens/OrderConfirmation';
import OrdersScreen from './screens/OrdersScreen';
import OrderDetailsScreen from './screens/OrderDetailsScreen';
import { CartProvider } from './screens/CartContext';
import { StoreCartProvider } from './screens/StoreCartContext';
import { MaterialIcons, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <StoreCartProvider>
    <CartProvider>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="ResetPasswordSuccess" component={ResetPasswordSuccessScreen} />
        <Stack.Screen name="HomeMain" component={HomeScreen} />
        <Stack.Screen name="Restaurant" component={RestaurantScreen} />
        <Stack.Screen name="VendorList" component={VendorListScreen} />
        <Stack.Screen name="MealCard" component={MealCardScreen} />
        <Stack.Screen name="MealDetails" component={MealDetailsScreen} />
        <Stack.Screen name="Address" component={AddressScreen} />
        <Stack.Screen name="MyAddresses" component={MyAddressesScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Dummy" component={DummyScreen} />
        <Stack.Screen name="Cart" component={CartDetails} />
        <Stack.Screen name="PaymentOptions" component={PaymentOptionsScreen} />
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="TermsService" component={TermsService} />
        <Stack.Screen name="Permissions" component={Permissions} />
        <Stack.Screen name="EmartScreen" component={EmartScreen} />        
        <Stack.Screen name="SelectProductScreen" component={SelectProductScreen} />
        <Stack.Screen name="EMartCartDetails" component={EMartCartDetails}/>
        <Stack.Screen name="PaymentScreen" component={PaymentScreen}/>
        <Stack.Screen name="CashOnDelivery" component={CashOnDeliveryScreen}/>
        <Stack.Screen name="OrderConfirmation" component={OrderConfirmation}/>
        <Stack.Screen name="Orders" component={OrdersScreen}/>
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen}/>
      </Stack.Navigator>
    </CartProvider>
    </StoreCartProvider>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#FF6B6B',
        drawerInactiveTintColor: '#555',
        drawerLabelStyle: {
          marginLeft: 5,
          fontSize: 15,
          fontWeight: '500',
        },
        drawerStyle: {
          width: 300,
        },
        drawerItemStyle: {
          borderRadius: 8,
          paddingLeft: 5,
        },
        drawerIconContainerStyle: {
          marginRight: -20,
          marginLeft: 10,
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeStack}
        options={{
          drawerIcon: ({ color }) => <MaterialIcons name="home" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="My Profile"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color }) => <MaterialIcons name="person" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="My Addresses"
        component={MyAddressesScreen}
        options={{
          drawerIcon: ({ color }) => <FontAwesome6 name="location-dot" size={20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="My Payment Cards"
        component={Cards}
        options={{
          drawerIcon: ({ color }) => <FontAwesome5 name="money-bill" size={20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Awoof Packages"
        component={OffersScreen}
        options={{
          drawerIcon: ({ color }) => <MaterialIcons name="local-offer" size={20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color }) => <FontAwesome6 name="gear" size={20} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Drawer" component={DrawerNavigator} />
        <Stack.Screen name="Dummy" component={DummyScreen} />
        <Stack.Screen name="Appearance" component={AppearancePersonalization} />
        <Stack.Screen name="Language" component={LanguageInput} />
        <Stack.Screen name="DataStorage" component={DataStorage} />
        <Stack.Screen name="NotificationsOptions" component={NotificationsOptions} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="PushNotifications" component={PushNotifications} />        
        <Stack.Screen name="AboutScreen" component={AboutScreen} />                
        <Stack.Screen name="AccountsPasswordsSettings" component={AccountsPasswordsSettings} />                
        <Stack.Screen name="OffersScreen" component={OffersScreen} />                
        <Stack.Screen name="Permissions" component={Permissions} />                
        <Stack.Screen name="TermsService" component={TermsService} />                
      </Stack.Navigator>
    </NavigationContainer>
  );
}