import React from 'react';
import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import { getUserData } from '../APIs/profile';

function SeeProfile() {

    const [token, setAccessToken] = useState(null);
    const [username, setUsername] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const navigation = useNavigation();

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

    //useEffect rerandeaza si daca exista in interiorul functiei useState => se rerandeaza de 3 ori functia getAccessToken
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
            }
        };

        fetchDataAsync();

    }, [token, isLoggedIn])

    return (
        <View style={styles.container}>
            {user ? (
                <>
                    <Text style={styles.label}>Username: </Text><Text style={styles.value}>{user.username}</Text>
                    <Text style={styles.label}>Name: </Text><Text style={styles.value}>{user.name}</Text>
                    <Text style={styles.label}>Phone: </Text><Text style={styles.value}>{user.phone}</Text>
                </>
            ) : (
                <Text>No user data available</Text>
            )}
        </View>

    )
}

export default SeeProfile

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
        marginVertical: 10,
        backgroundColor: '#CCE3DE',
    },
    label: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        fontSize: 20
    },
    value: {
        fontSize: 18
    }
});