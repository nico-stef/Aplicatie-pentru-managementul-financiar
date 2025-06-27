import React from 'react';
import { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, Modal, Pressable, Alert, SafeAreaView } from 'react-native';
import { KeyboardAvoidingView, ScrollView, Platform, TouchableWithoutFeedback, Keyboard, StatusBar } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import { useNavigation } from '@react-navigation/native';
import { getAccounts, addIncome } from '../APIs/moneyManagement';
import { getUserData } from '../APIs/profile';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';

export default function AddIncome() {
    const [amount, setAmount] = useState('');
    const [account, setAccount] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date());
    const [datePicker, setDatePicker] = useState(false);
    const [modalVisible2, setModalVisible2] = useState(false); //account
    const [accounts, setAccounts] = useState('');
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const data = await getAccounts(user.id);
                if(data === 'error'){
                    navigation.navigate('LogIn');
                    return;
                }
                setAccounts(data);
            } catch (err) {
                setError("There was an error fetching categories.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (modalVisible2) {
            fetchAccounts();
        }
    }, [modalVisible2, user]);

    const handleAccount = (account) => {
        setAccount(account);
    }

    const handleDateChange = (event, selectedDate) => {
        if (event.type === "set") {
            const currentDate = selectedDate;
            setDate(currentDate);
            console.log("datda", currentDate)
        }
        setDatePicker(false);
    }

    const handleAddIncome = async () => {

        if (!amount || !account || !date)
            Alert.alert("Warning", "You need to complete the necessary fields!");
        else {
            const response = await addIncome(user.id, amount, date, account.idaccounts, note);
            if(response === 'error'){
                navigation.navigate('LogIn');
                return;
            }
            Alert.alert("Success", "Income added successfully!");
        }
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
             <StatusBar backgroundColor="white" barStyle="dark-content" />
        <KeyboardAvoidingView
            behavior={Platform.OS === "height"}
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <Header title="New Income" icon="plus-circle" toggleMenu={toggleMenu}></Header>
                    <View style={styles.container}>
                        {/* ----------------pick the amount------------------- */}
                        <Text style={styles.label}>Amount*: </Text>
                        <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setAmount} value={amount} placeholder="type your amount" keyboardType="numeric" />

                        {/* -------------picking the date----------------- */}
                        <View style={styles.row}>
                            <Text style={styles.label}>Date*: </Text>
                            <TextInput style={[styles.input, { borderWidth: 0, fontSize: 16 }]} value={date ? date.toLocaleDateString() : ""} editable={false} />
                        </View>
                        <Pressable
                            style={[styles.button, styles.buttonOpen]}
                            onPress={() => setDatePicker(true)}
                        >
                            <Text style={styles.textStyle}>change date</Text>
                        </Pressable>
                        {
                            datePicker && (
                                <DateTimePicker
                                    mode={'date'}
                                    is24Hour={true}
                                    value={date || new Date()}
                                    onChange={handleDateChange}
                                >
                                </DateTimePicker>
                            )
                        }

                        {/* ---------------pick the account------------- */}
                        <View style={styles.row}>
                            <Text style={styles.label}>Account*: </Text>
                            <TextInput style={[styles.input, { borderWidth: 0, fontSize: 16 }]} value={account.name} editable={false} />
                        </View>
                        <Pressable
                            style={[styles.button, styles.buttonOpen]}
                            onPress={() => setModalVisible2(true)}>
                            <Text style={styles.textStyle}>choose account</Text>
                        </Pressable>

                        {/* ---------------pick the note------------- */}
                        <Text style={styles.label}>Note: </Text>
                        <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setNote} value={note} placeholder="write a note" />


                        {/* ----------------modal account-------------- */}
                        <Modal
                            animationType="slide"
                            transparent={true}
                            visible={modalVisible2}
                            onRequestClose={() => setModalVisible2(false)}
                        >
                            <View style={styles.centeredView}>
                                <View style={styles.modalView}>
                                    <Text style={styles.modalTitle}>Select account</Text>

                                    {loading ? (
                                        <Text>Loading...</Text>
                                    ) : (
                                        <FlatList
                                            data={accounts}
                                            keyExtractor={(item) => item.idaccounts}
                                            numColumns={2}
                                            renderItem={({ item }) => (
                                                <Pressable style={[
                                                    styles.categoryItem,
                                                    account && account.idaccounts === item.idaccounts
                                                        ? styles.selectedCategory
                                                        : null,
                                                ]}
                                                    onPress={() => handleAccount(item)} >
                                                    <Text style={styles.categoryText}>{item.name}</Text>
                                                </Pressable>
                                            )}
                                        />
                                    )}

                                    <Pressable
                                        style={[styles.button, styles.buttonClose]}
                                        onPress={() => setModalVisible2(false)}
                                    >
                                        <Text style={styles.textStyle}>Close</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </Modal>

                        <Pressable
                            style={[styles.button, styles.buttonClose, { marginTop: 40 }]}
                            onPress={() => handleAddIncome()}
                            android_ripple={{ color: 'white' }}
                        >
                            <Text style={styles.textStyle}>add income</Text>
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

const styles = StyleSheet.create({
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
    container: {
        backgroundColor: '#CCE3DE',
        flex: 1,
        paddingTop: '2%',
        alignContent: 'center',
        justifyContent: 'center'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '70%'
    },
    label: {
        fontFamily: 'serif',
        marginStart: 20,
        fontSize: 16,
        fontWeight: 'bold'
    },
    centeredView: {
        fontFamily: 'serif',
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxHeight: 500,
    },
    modalTitle: {
        fontFamily: 'serif',
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
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
    incomeButtonsView: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    buttonIncome: {
        width: '40%',
        marginHorizontal: 20,
        paddingVertical: 2,
        borderRadius: 10,
        alignContent: 'center',
        justifyContent: 'center',

    },
    buttonOpen: {
        backgroundColor: '#25a18e',
    },
    textStyle: {
        fontFamily: 'serif',
        fontSize: 16,
        textAlign: "center",
        color: "white"
    },
    selectedCategory: {
        backgroundColor: '#dbf0e3',
        borderColor: '#fff',
        borderWidth: 2,
    },
    categoryItem: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
});
