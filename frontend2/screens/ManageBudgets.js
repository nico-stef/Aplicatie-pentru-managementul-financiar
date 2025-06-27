import React from 'react';
import { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { KeyboardAvoidingView, ScrollView, Platform, TouchableWithoutFeedback, Keyboard, SafeAreaView, StatusBar, } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import { useNavigation } from '@react-navigation/native';
import { addBudget } from '../APIs/moneyManagement';
import { getUserData } from '../APIs/profile';
import { Dropdown } from 'react-native-element-dropdown';
import { MyModal } from '../components.js/myModal';
import { months } from "../variables"
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';

export default function ManageBudgets() {
    const [nameBudget, setNameBudget] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [frequency, setFrequency] = useState(null);
    const frequencyOptions = [
        { label: 'only this month', value: '1' },
        { label: 'recurrent every month', value: '2' },
    ];
    const [datePicker, setDatePicker] = useState(false);
    const [token, setAccessToken] = useState(null);
    const [username, setUsername] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const navigation = useNavigation();
    const [modalMonthCalendar, setModalMonthCalendar] = useState(false); //moddal calendar month
    const [month, setMonth] = useState(''); //selected month
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

    const handleDateChange = (event, selectedDate, setter) => {
        if (event.type === "set") {
            const currentDate = selectedDate;
            setter(currentDate);
        }
        setDatePicker(false);
    }

    const handleCreateBudget = async () => {
        if (!amount || !nameBudget || !startDate || !frequency)
            Alert.alert("Warning", "You need to complete the necessary fields!");
        else {
            console.log("luna:", month);
            const response = await addBudget(user.id, nameBudget, amount, month, frequency, note);
            if(response === 'error'){
                navigation.navigate('LogIn');
                return;
            }
            Alert.alert("Success", "Budget added successfully!");
        }
    }

    const closeModal = (setModalVisibile) => {
        return () => { //functie pe care o putem apela mai tarziu, nu imediat. fara return ar fi fost apelata imediat
            setModalVisibile(false);
        };
    };

    const handleMonth = (item) => {
        console.log("luna or smth", item)
        setMonth(item);
        setModalMonthCalendar(false);
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
                        <Header title="New Budget" icon="clipboard-list" toggleMenu={toggleMenu}></Header>
                        <View style={styles.container}>

                            {/* ----------------pick the name------------------- */}
                            <Text style={styles.label}>Name of your budget*: </Text>
                            <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setNameBudget} value={nameBudget} placeholder="type the name" />

                            {/* ----------------pick the amount------------------- */}
                            <Text style={styles.label}>Amount*: </Text>
                            <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setAmount} value={amount} placeholder="type your amount" keyboardType="numeric" />

                            {/* ------------modal pentru calendar MONTH------------- */}
                            <MyModal
                                visible={modalMonthCalendar} onClose={closeModal(setModalMonthCalendar)} title="Select the month"
                                data={months} keyExtractor={(item) => item.id} onItemPress={handleMonth} nrCol={3} desc={true}
                            />

                            {/* -------------picking the start date----------------- */}
                            <View style={styles.row}>
                                <Text style={styles.label}>Month*:</Text>
                                <TextInput style={[styles.input, { borderWidth: 0, fontSize: 16 }]} value={month ? month.name : ""} editable={false} />
                            </View>

                            <Pressable
                                style={[styles.button, styles.buttonOpen]}
                                onPress={() => setModalMonthCalendar(true)}
                            >
                                <Text style={styles.textStyle}>choose month</Text>
                            </Pressable>

                            {/* ---------------pick the freq------------- */}
                            <Text style={[styles.label, { paddingTop: 10 }]}>Frequency*: </Text>
                            <Dropdown
                                data={frequencyOptions}
                                containerStyle={styles.dropdownContainer}
                                selectedTextStyle={[styles.input, { borderWidth: 0, fontSize: 14, marginStart: 20 }]}
                                placeholderStyle={{ marginStart: 20, paddingVertical: 10}}
                                placeholder='select frquency...'
                                maxHeight={100}
                                labelField="label"
                                valueField="value"
                                value={frequency}
                                onChange={item => {
                                    setFrequency(item.value);
                                }}
                                style={{
                                    backgroundColor: '#fff', borderRadius: 8, width: '90%', alignSelf: 'center', marginTop: 3
                                }}
                            />

                            {/* ---------------pick the note------------- */}
                            <Text style={styles.label}>Note: </Text>
                            <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setNote} value={note} placeholder="write a note" />


                            <Pressable
                                style={[styles.button, styles.buttonClose, { marginTop: 40 }]}
                                onPress={() => handleCreateBudget()}
                                android_ripple={{ color: 'white' }}
                            >
                                <Text style={styles.textStyle}>create budget</Text>
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
    container: {
        backgroundColor: '#CCE3DE',
        flex: 1,
        paddingTop: '2%',
        alignContent: 'center',
        justifyContent: 'center'
    },
    dropdownContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'black',
        width: '70%',
        elevation: 5,
        alignSelf: 'center',
        paddingTop: 20
    },
    selectedValueText: {
        fontSize: 16,
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
    buttonOpen: {
        backgroundColor: '#25a18e',
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
