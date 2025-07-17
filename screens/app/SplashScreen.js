import { View, Text, StyleSheet, ImageBackground, SafeAreaView } from 'react-native';

export default function SplashScreen({ navigation }) {
  setTimeout(() => {
    navigation.replace('Landing');
  }, 5000);

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../assets/platter.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark overlay */}
        <View style={styles.overlay} />
        
        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>GoBuyMe</Text>
          <Text style={styles.subtitle}>..battle that hunger! ..avoid the stress!</Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Adjust opacity (0.3 = 30% dark tint)
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF521B',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 22,
    color: '#E9F7CA',
    marginTop: 10,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});