# GoBuyMe App — Features & User Flows Table

## High-Level App Overview
GoBuyMe is a mobile app for ordering from local restaurants and grocery stores with real-time tracking. It’s built with React Native and Firebase, optimized for both iOS and Android.

## Key Features
- Location-based restaurant/grocery discovery
- Unified cart for food & groceries
- Real-time order tracking
- Firebase authentication (Email/Google/Phone)
- Secure payments (Stripe integration)
- Order history with reorder
- Push notifications
- User profile & settings
- In-app chat with support
- Offers, favorites, and personalized appearance
- Legal, terms, and privacy screens

## Features & User Flows Table

| Feature Area           | Screen(s) / Component(s)                                   | User Flow / Description                                                                                       |
|------------------------|-----------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| **Authentication**     | LoginScreen, RegisterScreen, ResetPasswordScreen, ResetPasswordSuccessScreen | Sign up, sign in, reset password, success confirmation                                                       |
| **Landing & Onboarding** | LandingScreen, SplashScreen, AboutScreen                | Welcome, intro, app branding, links to Terms, Privacy, About                                                 |
| **Home**               | HomeScreen, CustomDrawerContent, NotificationsScreen      | Main dashboard, navigation to all core features, notifications, quick actions                                |
| **Vendor/Store Discovery** | VendorListScreen, EmartScreen, RestaurantDetailScreen, RestaurantMenuItemScreen | Browse/search for restaurants & stores, view details, see menu/products, select items                        |
| **Cart Management**    | CartDetails, StoreCartContext, Unified Cart logic         | Add/remove items, view cart, edit quantities, switch between food/grocery                                    |
| **Checkout & Payment** | ConfirmationScreen, OrderConfirmation, PaymentScreen, PaymentOptionsScreen, CashOnDeliveryScreen | Address selection, payment method, order summary, confirmation, cash/card/bank options, order placement      |
| **Order Tracking**     | OrdersScreen, OrderDetailsScreen, Real-time updates       | View current and past orders, track status, reorder, see order details                                       |
| **Favorites**          | FavoritesScreen                                           | Add/remove/view favorite vendors/restaurants                                                                 |
| **User Profile**       | ProfileScreen, OptionsScreen                              | View/edit profile, change info, profile image, access settings                                               |
| **Addresses**          | AddressScreen, MyAddressesScreen                          | Add, edit, delete, set default address, select for delivery                                                  |
| **Offers & Promotions**| OffersScreen                                              | View current offers, apply to orders                                                                         |
| **Notifications**      | NotificationsScreen, NotificationsOptions                 | Manage push/app notifications, view updates                                                                  |
| **Settings & Personalization** | SettingsScreen, AppearancePersonalization, LanguageInput | Change theme, language, notification settings, legal info                                                    |
| **Support / Help**     | ChatScreen                                                | In-app chat with support, clear chat history, live status                                                    |
| **Legal & Info**       | TermsService, AboutScreen, Permissions                    | View Terms of Service, Privacy Policy, About the app, permissions                                            |
| **Navigation**         | CustomDrawerContent, React Navigation (Stack/Tab/Drawer)  | Drawer menu, deep links, stack flows, tab switching                                                          |

---

## Example User Flows

### 1. Placing a Food Order
- Launch app → Login/Register → Home → Browse restaurants → Select restaurant → View menu → Add to cart → Cart → Checkout → Select address → Choose payment → Place order → Track order status

### 2. Ordering Groceries
- Home → Browse stores (EmartScreen) → Select store → Browse products → Add to cart → Cart → Checkout → Payment → Confirmation

### 3. Managing Profile & Addresses
- Home/Drawer → Profile → Edit info/photo  
- Home/Drawer → My Addresses → Add/Edit/Delete address

### 4. Favorites & Reordering
- Home → Favorites → Select vendor → Order again  
- Orders → Select past order → Reorder

### 5. Chatting with Support
- Home/Drawer → Chat → Send/receive messages, clear chat

### 6. Settings & Personalization
- Home/Drawer → Settings → Change theme, language, notification preferences

### 7. Viewing Offers & Legal
- Home/Drawer → Offers  
- Home/Drawer → Terms, Privacy, About
