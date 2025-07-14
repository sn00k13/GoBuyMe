import 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from './screens/app/HomeScreen';
import ProfileScreen from './screens/user/ProfileScreen';
import SettingsScreen from './screens/user/SettingsScreen';
import CustomDrawerContent from './screens/app/CustomDrawerContent';
import AddressScreen from './screens/user/AddressScreen';
import ChatScreen from './screens/user/ChatScreen';
import CartDetails from './screens/app/CartDetails';
import FavoritesScreen from './screens/user/FavoritesScreen';
import OrderHistoryScreen from './screens/user/OrderHistoryScreen';
import OffersScreen from './screens/user/OffersScreen';
import MealCardScreen from './screens/MealCardScreen';
import VendorListScreen from './screens/app/VendorListScreen';
import PaymentOptionsScreen from './screens/app/PaymentOptionsScreen';
import ConfirmationScreen from './screens/store/ConfirmationScreen';
import RestaurantConfirmation from './screens/restaurant/RestaurantConfirmation';
import MyAddressesScreen from './screens/user/MyAddressesScreen';
import NotificationsScreen from './screens/user/NotificationsScreen';
import LandingScreen from './screens/app/LandingScreen';
import SplashScreen from './screens/app/SplashScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ResetPasswordScreen from './screens/auth/ResetPasswordScreen';
import ResetPasswordSuccessScreen from './screens/auth/ResetPasswordSuccessScreen';
import AppearancePersonalization from './screens/user/AppearancePersonalization';
import LanguageInput from './screens/app/LanguageInput';
import DataStorage from './screens/app/DataStorage';
import NotificationsOptions from './screens/app/NotificationsOptions';
import PushNotifications from './screens/app/PushNotifications';
import TermsService from './screens/app/TermsService';
import AboutScreen from './screens/app/AboutScreen';
import Permissions from './screens/user/Permissions';
import EmartScreen from './screens/store/EmartScreen';
import SelectProductScreen from './screens/store/SelectProductScreen';
import EMartCartDetails from './screens/store/EMartCartDetails';
import PaymentScreen from './screens/store/PaymentScreen';
import RestaurantPaymentScreen from './screens/restaurant/RestaurantPaymentScreen';
import CashOnDeliveryScreen from './screens/CashOnDeliveryScreen';
import OrderConfirmation from './screens/store/OrderConfirmation';
import OrdersScreen from './screens/user/OrdersScreen';
import OrderDetailsScreen from './screens/app/OrderDetailsScreen';
import RestaurantDetailScreen from './screens/restaurant/RestaurantDetailScreen';
import RestaurantMenuItemScreen from './screens/restaurant/RestaurantMenuItemScreen';
import { CartProvider } from './screens/app/CartContext';
import { StoreCartProvider } from './screens/app/StoreCartContext';
import { MaterialIcons, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { ThemeProvider } from './utils/ThemeContext';
import { useTheme } from './utils/ThemeContext';

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
					<Stack.Screen
						name="ResetPasswordSuccess"
						component={ResetPasswordSuccessScreen}
					/>
					<Stack.Screen name="HomeMain" component={HomeScreen} />
					<Stack.Screen name="VendorList" component={VendorListScreen} />
					<Stack.Screen name="MealCard" component={MealCardScreen} />
					<Stack.Screen name="Address" component={AddressScreen} />
					<Stack.Screen name="MyAddresses" component={MyAddressesScreen} />
					<Stack.Screen name="Profile" component={ProfileScreen} />
					<Stack.Screen name="Chat" component={ChatScreen} />
					<Stack.Screen name="Cart" component={CartDetails} />
					<Stack.Screen
						name="PaymentOptions"
						component={PaymentOptionsScreen}
					/>
					<Stack.Screen name="Confirmation" component={ConfirmationScreen} />
					<Stack.Screen
						name="RestaurantConfirmation"
						component={RestaurantConfirmation}
					/>
					<Stack.Screen name="Favorites" component={FavoritesScreen} />
					<Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
					<Stack.Screen name="Settings" component={SettingsScreen} />
					<Stack.Screen name="TermsService" component={TermsService} />
					<Stack.Screen name="Permissions" component={Permissions} />
					<Stack.Screen name="EmartScreen" component={EmartScreen} />
					<Stack.Screen
						name="SelectProductScreen"
						component={SelectProductScreen}
					/>
					<Stack.Screen name="EMartCartDetails" component={EMartCartDetails} />
					<Stack.Screen name="PaymentScreen" component={PaymentScreen} />
					<Stack.Screen
						name="RestaurantPaymentScreen"
						component={RestaurantPaymentScreen}
					/>
					<Stack.Screen
						name="CashOnDelivery"
						component={CashOnDeliveryScreen}
					/>
					<Stack.Screen
						name="OrderConfirmation"
						component={OrderConfirmation}
					/>
					<Stack.Screen name="Orders" component={OrdersScreen} />
					<Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
					<Stack.Screen
						name="RestaurantDetail"
						component={RestaurantDetailScreen}
					/>
					<Stack.Screen
						name="RestaurantMenuItem"
						component={RestaurantMenuItemScreen}
					/>
				</Stack.Navigator>
			</CartProvider>
		</StoreCartProvider>
	);
}

function DrawerNavigator() {
  const { theme, mode, setMode } = useTheme();
	return (
		<Drawer.Navigator
			drawerContent={(props) => <CustomDrawerContent {...props} />}
			screenOptions={{
				headerShown: false,
				drawerActiveTintColor: theme.primary,
				drawerInactiveTintColor: theme.text,
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
					drawerIcon: ({ color }) => (
						<MaterialIcons name="home" size={22} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="My Profile"
				component={ProfileScreen}
				options={{
					drawerIcon: ({ color }) => (
						<MaterialIcons name="person" size={22} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="My Addresses"
				component={MyAddressesScreen}
				options={{
					drawerIcon: ({ color }) => (
						<FontAwesome6 name="location-dot" size={20} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="My Notification"
				component={NotificationsScreen}
				options={{
					drawerIcon: ({ color }) => (
						<FontAwesome6 name="location-dot" size={20} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="Awoof Packages"
				component={OffersScreen}
				options={{
					drawerIcon: ({ color }) => (
						<MaterialIcons name="local-offer" size={20} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="Settings"
				component={SettingsScreen}
				options={{
					drawerIcon: ({ color }) => (
						<FontAwesome6 name="gear" size={20} color={color} />
					),
				}}
			/>
		</Drawer.Navigator>
	);
}

export default function App() {
	return (
		<ThemeProvider>
			<NavigationContainer>
				<Stack.Navigator
					screenOptions={{
						headerShown: false,
					}}
				>
					<Stack.Screen name="Drawer" component={DrawerNavigator} />
					<Stack.Screen
						name="Appearance"
						component={AppearancePersonalization}
					/>
					<Stack.Screen name="Language" component={LanguageInput} />
					<Stack.Screen name="DataStorage" component={DataStorage} />
					<Stack.Screen
						name="NotificationsOptions"
						component={NotificationsOptions}
					/>
					<Stack.Screen name="Chat" component={ChatScreen} />
					<Stack.Screen
						name="PushNotifications"
						component={PushNotifications}
					/>
					<Stack.Screen name="AboutScreen" component={AboutScreen} />
					<Stack.Screen name="OffersScreen" component={OffersScreen} />
					<Stack.Screen name="Permissions" component={Permissions} />
					<Stack.Screen name="TermsService" component={TermsService} />
					<Stack.Screen name="Notifications" component={NotificationsScreen} />
				</Stack.Navigator>
			</NavigationContainer>
		</ThemeProvider>
	);
}
