import React, { useEffect } from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configuration pour afficher les notifications même si l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function ProfilScreen() {
  
  // Demander la permission au chargement ou via un bouton
  const requestPermissions = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Erreur', 'Les notifications ne sont pas autorisées !');
        return false;
      }
      Alert.alert('Succès', 'Notifications autorisées ✅');
      return true;
    } else {
      Alert.alert('Erreur', 'Utilisez un appareil physique pour les notifications.');
      return false;
    }
  };

  // Envoyer une notification de test immédiate
  const scheduleTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔥 MATCH EN DIRECT !",
        body: "G2 Esports vs Team Vitality vient de commencer !",
        data: { matchId: 123 },
        sound: true,
      },
      trigger: null, // Immédiat
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROFIL</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={64} color={Colors.text.tertiary} />
          </View>
          <Text style={styles.userName}>Utilisateur Esport</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CENTRE DE NOTIFICATIONS</Text>
            
            <Pressable 
              style={({ pressed }) => [styles.button, styles.buttonSecondary, pressed && { opacity: 0.8 }]}
              onPress={requestPermissions}
            >
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={Colors.text.primary} />
              <Text style={styles.buttonText}>Autoriser les alertes</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.button, styles.buttonPrimary, pressed && { opacity: 0.8 }]}
              onPress={scheduleTestNotification}
            >
              <MaterialCommunityIcons name="bell-ring-outline" size={20} color="white" />
              <Text style={styles.buttonText}>Tester une alerte match</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PARAMÈTRES</Text>
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>Plus d'options à venir...</Text>
            </View>
          </View>
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: 2,
  },
  content: {
    paddingTop: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 32,
  },
  section: {
    width: '100%',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 16,
    paddingLeft: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  buttonPrimary: {
    backgroundColor: Colors.accent.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  buttonText: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  placeholderCard: {
    padding: 20,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  placeholderText: {
    color: Colors.text.tertiary,
    fontSize: 14,
  },
  bottomPadding: {
    height: 120,
  },
});
