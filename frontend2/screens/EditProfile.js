import React from 'react';
import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import { getUserData, updateUser } from '../APIs/profile';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';

function EditProfile() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [token, setAccessToken] = useState(null);
    const [username, setUsername] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const navigation = useNavigation();
    const [isOpen, setIsOpen] = useState(true);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const getAccessToken = async () => {
        try {
            //get access token from async storage
            const accessToken = await SecureStore.getItemAsync('accessToken');
            setAccessToken(accessToken);

            //get info that comes with the access token, in my case the object user who has name
            const user = jwtDecode(accessToken);
            setUsername(user.name);

            if (!accessToken) {
                console.log('Nu există access token!');
                setIsLoggedIn(false);
                navigation.navigate('LogIn');
                return;
            }

            const currentTime = Date.now() / 1000; //timpul curent în secunde
            if (user.exp < currentTime) {
                console.log('Token-ul a expirat!');
                setIsLoggedIn(false);
                navigation.navigate('LogIn');
                return;
            }

        } catch (error) {
            console.log("Eroare la recuperarea token-ului:", error);
        }
    };

    //la fiecare useState set..() componenta care le contine se va modifica => ex: daca comp. contine si accessTokens si username se reradeaza de 2 ori
    useEffect(() => {
        const getAccessTokenAsync = async () => {
            await getAccessToken();
        };

        getAccessTokenAsync();

    }, [])

    useEffect(() => {
        //daca access token e expirat nu se mai executa acest useEffect
        if (!isLoggedIn) return;

        const fetchDataAsync = async () => {

            if (username && token) {
                const user = await getUserData(username, token);
                if(user === 'error'){
                    navigation.navigate('LogIn');
                    return;
                }
                setUser(user);
                setName(user.name);
                setPhone(user.phone);
            }
        };

        fetchDataAsync();

    }, [token, isLoggedIn])

    const handleUpdate = async (username, name, phone, token) => {
        try {
            const response = await updateUser(username, name, phone, token);
            if(response === 'error'){
                navigation.navigate('LogIn');
                return;
            }
            Alert.alert('Success', 'User data updated sucessfully!');
        } catch (error) {
            console.error("Eroare la user update:", error);
        }
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
                behavior="height"
                style={{ flex: 1 }}
            >
                <StatusBar backgroundColor="white" barStyle="dark-content" />
                <View style={{ flex: 1, backgroundColor: 'white', }}>
                    <Header title="Edit Profile" icon="user" toggleMenu={toggleMenu}></Header>

                    {/* <Text style={styles.title}>Hello, {username}</Text> */}

                    <View style={styles.container}>

                        <Text style={styles.label}>NAME: </Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={setName}
                            value={name}
                        />
                        <Text style={styles.label}>PHONE NUMBER: </Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={setPhone}
                            value={phone}
                            keyboardType="phone-pad"

                        />
                        <TouchableOpacity style={styles.button} onPress={() => handleUpdate(username, name, phone, token)}>
                            <Text style={styles.text}>Save changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Menu></Menu>

                <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#E8F5F2',
        padding: 20,
        // transform: [{ translateY: -20 }]
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: 'white',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        fontFamily: 'Arial',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#fff',
        width: '80%', // 80% din lățimea containerului
        height: 50,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 16,
        borderBottomWidth: 1.2,
        borderBottomColor: '#ccc',
        marginHorizontal: 'auto',
        backgroundColor: 'transparent'
    },
    button: {
        width: '80%',
        alignSelf: 'center',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 20,
        elevation: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16619a',
    },
    text: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default EditProfile
