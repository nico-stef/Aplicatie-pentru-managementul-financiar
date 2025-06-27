import React from 'react'
import { useState, useEffect, useCallback } from "react";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, FlatList, Modal, Pressable, TextInput, Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import Icon from 'react-native-vector-icons/FontAwesome5';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import { getObjectives } from '../APIs/spendingPlanner';

export default function SpendingPlanner() {

    const [isOpen, setIsOpen] = useState(true);
    const [token, setAccessToken] = useState(null);
    const [userid, setUserid] = useState(null);
    const [objectives, setObjectives] = useState(null);
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
            console.error("Eroare la recuperarea token-ului:", error);
        }
    };

    //get accessToken/userid
    useEffect(() => {
        const getAccessTokenAsync = async () => {
            await getAccessToken();
        };
        getAccessTokenAsync();
    }, []);

    //get objectives
    const getObjectivesAsync = async () => {
        if (token) {
            const data = await getObjectives(token);
            if(data === 'error'){
                navigation.navigate('LogIn');
                return;
            }
            setObjectives(data);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const response = getObjectivesAsync();
            if(response === 'error'){
                navigation.navigate('LogIn');
                return;
            }
        }, [token])
    );

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    // useEffect(() => {
    //     console.log("objective: ", objectives)
    // }, [objectives]);

    const Record = ({ item }) => {
        return (
            <TouchableOpacity style={styles.cardRecord} onPress={() => navigation.navigate('OptionsPage', { objectiveId: item.idObjective })}>
                <View style={styles.infoContainer}>
                    <Text style={styles.nameText}>{item.name_objective}</Text>
                    {item.due_date && <Text style={styles.detailText}>Due date: {item.due_date ? new Date(item.due_date).toLocaleDateString("en-GB", {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    }) : ""}</Text>}
                    <Text style={styles.detailText}>Amount: {item.amount_allocated} </Text>
                </View>

                <View style={styles.iconContainer}>
                    <Icon name="arrow-right" size={20} style={styles.icon} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <View style={{ flex: 1 }}>
                <Header title="Spending Planner" icon="clipboard-list" toggleMenu={toggleMenu}></Header>

                <View style={{ flex: 1, alignItems: 'center', paddingTop: 20, backgroundColor: '#E8F5F2', }}>

                    <FlatList
                        data={objectives}
                        renderItem={({ item }) => <Record item={item} />}
                        keyExtractor={item => item.idObjective}
                        // initialNumToRender={10}
                        contentContainerStyle={{ paddingBottom: 130 }}
                    />

                    <TouchableOpacity style={styles.addObjective} onPress={() => navigation.navigate('CreateObjective', { userId: userid })}>
                        <Text style={[styles.buttonText, { fontSize: 16, fontWeight: 'bold' }]}>+ create objective</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Menu></Menu>

            <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    addObjective: {
        height: '7%',
        width: '95%',
        backgroundColor: '#d1dff7',//"25a18e",//'#d1dff7',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        borderWidth: 1,
        borderColor: 'grey',
        marginBottom: 60,
        position: 'absolute',
        bottom: 20,
    },
    buttonText: {
        color: 'black',
        fontWeight: 'bold',
        fontFamily: 'serif',
    },
    icon: {
        color: '#007BFF',
        fontWeight: 'normal'
    },
    buttonTextRecord: {
        color: 'black',
        fontFamily: 'serif',
        fontSize: 16
    },
    cardRecord: {
        alignItems: 'center',
        justifyContent: 'center',
        alignContent: 'center',
        width: '95%',
        alignSelf: 'center',
        paddingVertical: 16,
        minHeight: 70,
        backgroundColor: "#fff",
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        marginTop: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        padding: 10,
        elevation: 3,
        borderWidth: 0.5,
        borderColor: 'grey',
    },
    nameText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5
    }
})