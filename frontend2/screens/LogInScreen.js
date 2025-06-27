import * as React from 'react';
import axios from 'axios';
import 'expo-dev-client'
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useState, useEffect } from "react";
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import LoginImage from '../images/login3.png'
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { login } from '../APIs/auth';
import { androidClientId, API_URL } from '../variables';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export default function LogInScreen() {

    const navigation = useNavigation();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [googleToken, setGoogleToken] = useState("");
    const [loading, setLoading] = useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: androidClientId
    });

    useEffect(() => {
        if (response?.type === 'success' && response.authentication) {
            const { idToken } = response.authentication;
            setGoogleToken(idToken);
        } else if (response?.type === 'error') {
            console.log("Error in Google login:", response.error);
        }
    }, [response]);

    //cand avem un access token de la Google, il trimitem pe backend
    useEffect(() => {
        const googleLogin = async () => {
            if (googleToken) {
                const tokenGoogle = await sendTokenToBackend(googleToken);
                handleLoginGoogle(tokenGoogle);
            }
        }

        googleLogin();
    }, [googleToken]);


    const sendTokenToBackend = async (token) => {
        try {
            const response = await axios.post(`${API_URL}/auth/loginGoogle`,
                {
                    token: token
                });
            return response.data;
        } catch (error) {
            console.error(error);
        }
    };

    const handleLoginGoogle = async (tokenGoogle) => {
        try {
            const response = await SecureStore.setItemAsync('accessToken', tokenGoogle.accessToken);
            navigation.replace('Home');
            console.log(response)
        } catch (err) {
            Alert.alert('Error', 'user nu exista');
        }
    };

    //functie de pe expo documentatie
    const registerForPushNotificationsAsync = async () => {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        // verificam daca e un dispozitiv fizic
        if (!Device.isDevice) {
            Alert.alert('Error', 'Must use physical device for Push Notifications');
            return null;
        }

        // Cere permisiuni pentru notificări
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert('Warning', 'Failed to get push token for push notifications!');
            return null;
        }

        try {
            //se extrage  ID-ul unic al proiectului Expo
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

            if (!projectId) {
                throw new Error('Project ID not found');
            }

            tokenNotifs = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log('Expo Push Token:', tokenNotifs);
        } catch (error) {
            console.error('Error getting push token:', error);
            return null;
        }

        return token;
    };



    const sendPushTokenToBackend = async (token, accessToken) => {
        try {
            const response = await fetch(`${API_URL}/auth/addPushToken`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ expoPushToken: token }),
            });
            if (!response.ok)
                console.log("error at push notif token")
            const data = await response.json();
            console.log('Push token saved:', data.message);
        } catch (error) {
            console.error('Error saving push token:', error);
        }
    };

    const handleLogin = async () => {
        try {
            if(!username || !password){
                Alert.alert("Warning", "Complete all fields before login!");
                return;
            }
            const response = await login(username, password);

            await SecureStore.setItemAsync('accessToken', response.accessToken);

            await SecureStore.setItemAsync('refreshToken', response.refreshToken);

            const pushToken = await registerForPushNotificationsAsync();
            if (pushToken) {
                await sendPushTokenToBackend(pushToken, response.accessToken);
            }

            navigation.navigate('Home');
        } catch (err) {
            console.log(err)
            if (err.message == "Incorrect password")
                Alert.alert('Error', 'Incorrect password');
            else if (err.message == "User does not exist")
                Alert.alert('Error', 'User does not exist');
            return;
        }
    };

    return (
        <View style={styles.container}>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <>
                    <Image source={LoginImage} style={styles.image} />

                    <Text style={styles.title}>Login</Text>

                    <View style={styles.inputContainer}>
                        <Icon name="user-circle" size={20} color="#333" style={styles.icon} />
                        <TextInput placeholder="username" style={styles.input} onChangeText={setUsername} value={username} />
                    </View>

                    <View style={styles.inputContainer}>
                        <Icon name="lock" size={20} color="#333" style={styles.icon} />
                        <TextInput placeholder="password" secureTextEntry style={styles.input} onChangeText={setPassword} value={password} />
                    </View>

                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.googleButton} onPress={() => { setLoading(true); promptAsync() }}>
                        <Icon name="google" size={20} color="#fff" style={styles.icon} />
                        <Text style={styles.buttonText}>Login with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                        <Text style={styles.signInText}> Don't have an account? Sign In </Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        marginBottom: 20,
        fontSize: 30,
        fontFamily: 'serif',
        fontWeight: 'bold'
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#CCE3DE',
    },
    image: {
        width: '70%',
        height: 250,
        marginTop: -50,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        padding: 10,
        marginBottom: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    input: {
        width: '100%',
        marginLeft: 15,
        fontSize: 15,
    },
    loginButton: {
        width: '90%',
        padding: 15,
        backgroundColor: '#25a18e',
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 20,
    },
    googleButton: {
        width: '90%',
        padding: 15,
        backgroundColor: '#db4437',
        borderRadius: 20,
        alignItems: 'center',
        flexDirection: 'row',//icon si text sa fie pe acelasi rand
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    icon: {
        marginLeft: 10,
        marginRight: 10,
    },
    signInText: {
        marginTop: 20,
        color: '#007bff'
    }
});