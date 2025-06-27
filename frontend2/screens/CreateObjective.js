import React from 'react'
import { useState, useEffect, useRef } from "react";
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, FlatList, Modal, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import { MyModal } from '../components.js/myModal';
import { getAccounts, getBudgets } from '../APIs/moneyManagement';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { addObjective } from '../APIs/spendingPlanner';
import { months } from "../variables"
import { getCategories } from '../APIs/moneyManagement';

export default function CreateObjective({ route }) {

    const { userId } = route.params;
    const [isOpen, setIsOpen] = useState(true);
    const navigation = useNavigation();
    const [nameObjective, setNameObjective] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [datePicker, setDatePicker] = useState(false);
    const [month, setMonth] = useState(''); //selected month
    const [date, setDate] = useState(new Date());
    const [modalAccountVisible, setModalAccountVisible] = useState(false); //account 
    const [modalBudgetVisible, setModalBudgetVisible] = useState(false); //budget
    const [accounts, setAccounts] = useState('');
    const [account, setAccount] = useState('');
    const [budgetOptions, setBudgetOptions] = useState([]);
    const [budget, setBudget] = useState('');
    const [categories, setCategories] = useState('');
    const [category, setCategory] = useState('');
    const [modalCategory, setModalCategory] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const closeModal = (setModalVisibile) => {
        return () => { //functia fara return ar fi fost apelata imediat
            setModalVisibile(false);
        };
    };

    const handleAccount = (account) => {
        setAccount(account);
        setModalAccountVisible(false);
    }

    const handleBudget = (bud) => {
        setBudget(bud);
        setModalBudgetVisible(false);
    }

    const handleDateChange = (event, selectedDate) => {
        if (event.type === "set") {
            const currentDate = selectedDate;
            setDate(currentDate);
        }
        setDatePicker(false);
    }

    useEffect(() => {
        const getBudgetsAsync = async () => {
            const response = await getBudgets(userId);
            if(response === 'error'){
                navigation.navigate('LogIn');
                return;
            }
            setBudgetOptions(response);
        };

        if (userId) {
            getBudgetsAsync();
        }
    }, [userId]);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const data = await getAccounts(userId);
                if(data === 'error'){
                    navigation.navigate('LogIn');
                    return;
                }
                setAccounts(data);
            } catch (err) {
                setError("There was an error fetching categories.");
                console.error(err);
            }
        };

        if (modalAccountVisible) {
            fetchAccounts();
        }
    }, [modalAccountVisible]);

    const handleAddObjective = async () => {
        try {
            if (!nameObjective || !amount || !account || !category)
                Alert.alert('Warning', "You haven't completed necessary fields!");
            const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
            const response = await addObjective(nameObjective, amount, localDate, account.idaccounts, budget.idBudget, note, userId, category.idcategories);
            if(response === 'error'){
                navigation.navigate('LogIn');
                return;
            }
            if (response === 200) {
                Alert.alert('Success', "Objective successfully created!");
                setNameObjective("");
                setAmount(0);
                setAccount('');
                setBudget('');
                setDate('');
                setNote('')
            }
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        const getCategoriesAsync = async () => {

            const data = await getCategories();
            if(data === 'error'){
                navigation.navigate('LogIn');
                return;
            }
            const newArray = data.map(item => ({
                name: item.category, //category va avea name ca sa putem itera prin el cu componenta MyModal
                icon: item.icon,
                idcategories: item.idcategories
              }));
            setCategories(newArray);

        };
        if (modalCategory) {
            getCategoriesAsync();
        }
    }, [modalCategory]);

    const handleCategory = (category) => {
        setCategory(category);
        setModalCategory(false)
    }

    useEffect(() => {
        console.log("id userrr: ", date)
    }, [date]);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior="height"
                style={{ flex: 1 }}

            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ flex: 1 }}>
                        {/* <Header title="Spending Planner" icon="clipboard-list" toggleMenu={toggleMenu}></Header> */}

                        <View style={styles.container}>

                            {/* ----------------pick the name------------------- */}
                            <Text style={styles.label}>Name of your objective*: </Text>
                            <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setNameObjective} value={nameObjective} placeholder="type the name" />

                            {/* ----------------pick the amount------------------- */}
                            <Text style={styles.label}>Amount allocated*: </Text>
                            <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setAmount} value={amount} placeholder="type your amount" keyboardType="numeric" />

                            {/* -------------picking the date----------------- */}
                            <View style={styles.row}>
                                <Text style={styles.label}>Due Date: </Text>
                                <TextInput style={[styles.input, { borderWidth: 0, fontSize: 16 }]} value={date ? date.toLocaleDateString("en-GB", {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                }) : ""} editable={false} />
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
                                onPress={() => setModalAccountVisible(true)}>
                                <Text style={styles.textStyle}>choose account</Text>
                            </Pressable>

                            {/* ---------------pick the category------------- */}
                            <View style={styles.row}>
                                <Text style={styles.label}>Category*: </Text>
                                <TextInput style={[styles.input, { borderWidth: 0, fontSize: 16 }]} value={category.name} editable={false} />
                            </View>
                            <Pressable
                                style={[styles.button, styles.buttonOpen]}
                                onPress={() => setModalCategory(true)}>
                                <Text style={styles.textStyle}>choose category</Text>
                            </Pressable>

                            {/* ---------------pick the budget------------- */}
                            <View style={styles.row}>
                                <Text style={styles.label}>Budget: </Text>
                                <TextInput style={[styles.input, { borderWidth: 0, fontSize: 16 }]} value={budget.label} editable={false} />
                            </View>
                            <Pressable
                                style={[styles.button, styles.buttonOpen]}
                                onPress={() => setModalBudgetVisible(true)}>
                                <Text style={styles.textStyle}>choose budget</Text>
                            </Pressable>

                            {/* ---------------pick the note------------- */}
                            <Text style={styles.label}>Note: </Text>
                            <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setNote} value={note} placeholder="write a note" />

                            <Pressable
                                style={[styles.button, styles.buttonClose, { marginTop: 20 }]}
                                onPress={() => handleAddObjective()}
                            >
                                <Text style={styles.textStyle}>create objective</Text>
                            </Pressable>

                            {/* --------modal pentru budget------------- */}
                            <MyModal
                                visible={modalBudgetVisible} onClose={closeModal(setModalBudgetVisible)} title="Select the budget"
                                data={budgetOptions} keyExtractor={(item) => item.idBudget} onItemPress={handleBudget} nrCol={2}
                            />

                            {/* --------modal pentru accounts------------- */}
                            <MyModal
                                visible={modalAccountVisible} onClose={closeModal(setModalAccountVisible)} title="Select the account"
                                data={accounts} keyExtractor={(item) => item.idaccounts} onItemPress={handleAccount} nrCol={2}
                            />

                            {/* ------------modal pentru category------------- */}
                            <MyModal
                                visible={modalCategory} onClose={closeModal(setModalCategory)} title="Select the month"
                                data={categories} keyExtractor={(item) => item.idcategories} onItemPress={handleCategory} nrCol={3} desc={true}
                            />

                        </View>

                    </View>

                    <Menu></Menu>

                    <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
                </ScrollView>
            </KeyboardAvoidingView>
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
    container: {
        backgroundColor: '#E8F5F2',
        flex: 1,
        marginBottom: '10%',
        alignContent: 'center',
        justifyContent: 'center',
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
        fontSize: 15,
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
    button: {
        width: '80%',
        alignSelf: 'center',
        borderRadius: 12,
        paddingVertical: 8,
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
})