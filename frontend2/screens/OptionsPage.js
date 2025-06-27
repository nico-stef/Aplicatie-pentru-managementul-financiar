import React from 'react'
import { useCallback } from 'react';
import { useState, useEffect, } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, FlatList, Modal, Pressable, TextInput, Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import Icon from 'react-native-vector-icons/FontAwesome5';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import { getOptions, getObjective, deleteObjective, updateOption } from '../APIs/spendingPlanner';
import Checkbox from 'expo-checkbox';

export default function OptionsPage({ route }) {

    const { objectiveId } = route?.params;
    const [isOpen, setIsOpen] = useState(true);
    const [token, setAccessToken] = useState(null);
    const [userid, setUserid] = useState(null);
    const [options, setOptions] = useState(null);
    const [objective, setObjective] = useState(null);
    const navigation = useNavigation();
    const [availableAmount, setAvailableAmount] = useState(0);

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

    //get options
    const getOptionsAsync = async () => {
        const result = await getOptions(objectiveId);
        if (result === 'error') {
            navigation.navigate('LogIn');
            return;
        }
        console.log("optiuni ", result)
        setOptions(result);
    };

    useFocusEffect(
        useCallback(() => {
            getOptionsAsync();
        }, [])
    );

    //get objective details
    useEffect(() => {
        const getObjectiveAsync = async () => {
            const result = await getObjective(objectiveId);
            if (result === 'error') {
                navigation.navigate('LogIn');
                return;
            }
            setObjective(result[0]);
        };
        getObjectiveAsync();
    }, [objectiveId]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    //cand primim options, calculam suma optiunilor deja alese
    useEffect(() => {
        if (options) {
            const sum = handleSum(options)
            setAvailableAmount(sum);
        }

        // console.log("obiectiv luat: ", availableAmount)
    }, [options]);

    const handleSum = (updatedOptions) => {
        const sum = updatedOptions.reduce((acc, curr) => {
            if (curr.chosen === 1) {
                return acc + parseFloat(curr.price);
            }
            return acc;
        }, 0);
        return sum;
    }

    const handleCheckboxToggle = (idOption) => {
        const updatedOptions = options.map(option =>
            option.idOption === idOption
                ? { ...option, chosen: option.chosen === 1 ? 0 : 1 }
                : option
        );
        setOptions(updatedOptions);

        const sum = handleSum(updatedOptions)
        setAvailableAmount(sum);
    };

    useEffect(() => {
        console.log("objective: ", objectiveId)
    }, [objectiveId]);

    const Record = ({ item, onCheckboxToggle }) => {
        const [isChecked, setChecked] = useState(item.chosen === 1);

        const handleCheckbox = async () => {
            const response = await updateOption(item.idOption, !isChecked);
            if (response.response && (response.response.status === 401 || response.response.status === 403)) {
                navigation.navigate('LogIn');
                return;
            }
             if (response.response && response.response.status === 409){
                Alert.alert("Warning",response.response.data.message);
                return;
             }
            setChecked(!isChecked);
            onCheckboxToggle(item.idOption);
        };

        return (
            <TouchableOpacity style={styles.cardRecord} onPress={() => navigation.navigate('SeeOption', { optionId: item.idOption, objectiveId })}>
                <View style={styles.infoContainer}>
                    <Text style={styles.nameText}>{item.name_option}</Text>
                    <Text style={styles.detailText}>Price: {item.price} RON</Text>
                </View>

                <View style={{ flexDirection: 'row' }}>
                    <Checkbox
                        value={isChecked}
                        onValueChange={handleCheckbox}
                        color={isChecked ? '#4630EB' : undefined}
                    />
                    <Icon name="arrow-right" size={20} style={styles.icon} />
                </View>
            </TouchableOpacity>
        );
    };

    const confirmDelete = () =>
        Alert.alert("", 'Are you sure you want to delete?', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            { text: 'YES', onPress: handleDeleteObjective },
        ]);

    const handleDeleteObjective = async () => {
        const response = await deleteObjective(objectiveId);
        if (response === 'error') {
            navigation.navigate('LogIn');
            return;
        }
        Alert.alert("", "Objective deleted successfully!");
        navigation.replace('SpendingPlanner');
    }

    const Summary = ({ item }) => {

        const formatDate = (dateToFormat) => {
            return new Date(dateToFormat).toLocaleDateString("en-GB", {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            })
        }
        return (
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Summary "{item ? item.name_objective : "-"}"</Text>

                <View style={styles.summaryRow}>


                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Category:</Text>
                        <Text style={styles.summaryValue}>{item ? item.category_name : "-"}</Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Due Date:</Text>
                        <Text style={styles.summaryValue}>{item && item.due_date ? formatDate(item.due_date) : "-"}</Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Amount allocated:</Text>
                        <Text style={styles.summaryValue}>{item ? item.amount_allocated : "-"} RON</Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Amount available:</Text>
                        <Text style={styles.summaryValue}>{item && item.amount_allocated ? item.amount_allocated - availableAmount : "-"} RON</Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Account:</Text>
                        <Text style={styles.summaryValue}>{item ? item.account_name : "-"}</Text>
                    </View>

                    {item && item.budget_name && <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Budget:</Text>
                        <Text style={styles.summaryValue}>{item && item.budget_name ? item.budget_name : "-"}</Text>
                    </View>}

                    {item && item.note && <View style={[styles.summaryItem, { width: '100%', }]}>
                        <Text style={styles.summaryLabel}>Note:</Text>
                        <Text style={styles.summaryValue}>{item && item.note ? item.note : "-"}</Text>
                    </View>}

                    <View style={[styles.summaryItem, { width: '90%', flexDirection: 'row', justifyContent: 'flex-end' }]}>
                        <TouchableOpacity onPress={confirmDelete}>
                            <Icon name="trash" size={20} style={[styles.icon, { color: 'red' }]} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

        )
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#E8F5F2', }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <View style={{ flex: 1 }}>
                <Header title="Options List" icon="list" toggleMenu={toggleMenu}></Header>

                <Summary item={objective} />

                <View style={{ flex: 1, alignItems: 'center' }}>

                    <FlatList
                        data={options}
                        renderItem={({ item }) => <Record item={item} onCheckboxToggle={handleCheckboxToggle} />}
                        keyExtractor={item => item.idOption}
                        // initialNumToRender={10}
                        contentContainerStyle={{ paddingBottom: 130 }}
                    />

                    <TouchableOpacity style={styles.addObjective} onPress={() => navigation.navigate('CreateOption', { objectiveId })}>
                        <Text style={[styles.buttonText, { fontSize: 16, fontWeight: 'bold' }]}>+ add a new option</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Menu></Menu>

            <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
        </SafeAreaView>
    )
}
const styles = StyleSheet.create({
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        margin: 10,
        elevation: 5,
    },
    summaryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    summaryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    summaryItem: {
        width: '50%',
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    addObjective: {
        minHeight: 45,
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
        fontWeight: 'normal',
        marginLeft: 20
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
        borderWidth: 0.5,
        borderColor: 'grey',
    },
    nameText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5
    }
})