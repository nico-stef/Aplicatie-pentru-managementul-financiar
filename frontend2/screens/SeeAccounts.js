import React from 'react';
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Menu from '../components.js/Menu'
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { getAccounts, deleteAccount } from '../APIs/auth';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";

function SeeAccounts() {
    const [isOpen, setIsOpen] = useState(true);
    const [accounts, setAccounts] = useState([]);
    const [token, setAccessToken] = useState(null);
    const [userid, setUserid] = useState(null);
    const navigation = useNavigation();

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

    const getAccountsAsync = async () => {
        const result = await getAccounts(token);
        setAccounts(result);
    };

    useFocusEffect(
        useCallback(() => {
            if (token)
                getAccountsAsync();
        }, [token])
    );

    const confirmDelete = (idAcc) =>
        Alert.alert("", 'Are you sure you want to delete?', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            { text: 'YES', onPress: () => handleDeleteAccount(idAcc) },
        ]);

    const handleDeleteAccount = async (idAcc) => {
        const result = await deleteAccount(idAcc);
        if(result === 'error'){
            navigation.navigate('LogIn');
            return;
        }
        if (result.status === 200) {
            Alert.alert("", 'Account deletes successfully!');
            getAccountsAsync();
        }
    }

    const SummaryAccount = ({ item }) => {

        return (
            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.summaryCard}
            >
                <Text style={styles.title}>Account "{item ? item.name : "-"}"</Text>

                <View style={styles.summaryRow}>

                    <View style={styles.summaryItem}>
                        <Text style={styles.label}>Name:</Text>
                        <Text style={styles.value}>{item ? item.name : "-"}</Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.label}>Total:</Text>
                        <Text style={styles.value}>${item ? item.total : "-"}</Text>
                    </View>

                    <View style={[styles.summaryItem, { width: '90%', flexDirection: 'row', justifyContent: 'flex-end' }]}>
                        <TouchableOpacity onPress={() => confirmDelete(item.id_account)}>
                            <Icon name="trash" size={20} style={[styles.icon, { color: 'red' }]} />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        )
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <View style={{ flex: 1 }}>
                <Header title="Accounts" icon="credit-card" toggleMenu={toggleMenu}></Header>

                <View style={{ flex: 1, alignItems: 'center', paddingTop: 20, backgroundColor: '#E8F5F2', }}>

                    <FlatList
                        data={accounts}
                        renderItem={({ item }) => <SummaryAccount item={item} />}
                        keyExtractor={item => item.id_account}
                        contentContainerStyle={{ paddingBottom: 130 }}
                    />
                    <TouchableOpacity style={styles.addBudget} onPress={() => navigation.navigate('CreateAccount')}>
                        <Text style={[styles.buttonText, { fontSize: 16, fontWeight: 'bold' }]}>+ new account</Text>
                    </TouchableOpacity>
                </View>

            </View>

            <Menu></Menu>

            <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
        </SafeAreaView>
    )
}

export default SeeAccounts

const styles = StyleSheet.create({
    addBudget: {
        height: '7%',
        width: '95%',
        backgroundColor: '#d1dff7',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        borderWidth: 1,
        borderColor: 'grey',
        marginBottom: 70,
        marginTop: 5
    },
    buttonText: {
        color: 'black',
        fontWeight: 'bold',
        fontFamily: 'serif',
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        margin: 10,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'white',
        textAlign: 'center'
    },
    summaryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    summaryItem: {
        width: '100%',
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        color: 'white',
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});