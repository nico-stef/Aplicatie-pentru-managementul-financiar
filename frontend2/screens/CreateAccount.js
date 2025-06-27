import React from 'react';
import { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { KeyboardAvoidingView, ScrollView, Platform, TouchableWithoutFeedback, Keyboard, SafeAreaView, StatusBar } from 'react-native';
import Menu from '../components.js/Menu'
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import { addAccount } from '../APIs/auth';

function CreateAccount() {
    const [isOpen, setIsOpen] = useState(true);
    const [token, setAccessToken] = useState(null);
    const [userid, setUserid] = useState(null);
    const [name, setName] = useState(null);
    const [amount, setAmount] = useState(null);

    const getAccessToken = async () => {
        try {
            //get access token from async storage
            const accessToken = await SecureStore.getItemAsync('accessToken');
            setAccessToken(accessToken);

            //get info that comes with the access token, in my case the object user who has name
            const user = jwtDecode(accessToken);
            setUserid(user.userid);

            const currentTime = Date.now() / 1000; //timpul curent în secunde
            if (user.exp < currentTime || !accessToken) {
                !accessToken ? console.log('Nu există access token!') : console.log('Token-ul a expirat!');
                await SecureStore.deleteItemAsync('accessToken');
                navigation.navigate('LogIn');
                return;
            }

        } catch (error) {
            console.log("Eroare la recuperarea token-ului:", error);
        }
    };

    //get accessToken/userid
    useEffect(() => {
        const getAccessTokenAsync = async () => {
            await getAccessToken();
        };
        getAccessTokenAsync();
    }, []);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleCreateAccount = async () => {
        if (!amount || !name)
            Alert.alert("Warning", "You need to complete all fields!");
        else {
            await addAccount(name, amount, token);
            Alert.alert("Success", "Account added successfully!");
        }
    }


    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior="height"
                style={{ flex: 1 }}

            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Header title="New Account!" icon="credit-card" toggleMenu={toggleMenu}></Header>
                        <View style={styles.container}>

                            {/* ----------------pick the name------------------- */}
                            <Text style={styles.label}>Name of your account: </Text>
                            <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setName} value={name} placeholder="type the name" />

                            {/* ----------------pick the amount------------------- */}
                            <Text style={styles.label}>Amount available on the account: </Text>
                            <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setAmount} value={amount} placeholder="type the amount" keyboardType="numeric" />

                            <Pressable
                                style={[styles.button, styles.buttonClose, { marginTop: 40 }]}
                                onPress={() => handleCreateAccount()}
                                android_ripple={{ color: 'white' }}
                            >
                                <Text style={styles.textStyle}>create account</Text>
                            </Pressable>

                        </View>
                        <Menu></Menu>

                        <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default CreateAccount

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#CCE3DE',
        flex: 1,
        paddingTop: '2%',
        alignContent: 'center',
        justifyContent: 'center'
    },
    input: {
        height: 40,
        margin: 5,
        borderWidth: 1,
        padding: 10,
        fontFamily: 'serif',
        borderRadius: 10,
        width: '90%',
        alignSelf: 'center',
    },
    label: {
        fontFamily: 'serif',
        marginStart: 20,
        fontSize: 16,
        fontWeight: 'bold'
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
    },
    buttonClose: {
        backgroundColor: '#16619a',
        paddingBottom: 10
    },
    textStyle: {
        fontFamily: 'serif',
        fontSize: 16,
        textAlign: "center",
        color: "white"
    },
});