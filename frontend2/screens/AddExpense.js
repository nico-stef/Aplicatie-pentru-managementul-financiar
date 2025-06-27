import React from 'react';
import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { KeyboardAvoidingView, ScrollView, Platform, TouchableWithoutFeedback, Keyboard, SafeAreaView, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import { useNavigation } from '@react-navigation/native';
import { getCategories, getAccounts, addExpense, getBudgets } from '../APIs/moneyManagement';
import { getUserData } from '../APIs/profile';
import { Dropdown } from 'react-native-element-dropdown';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import { MyModal } from '../components.js/myModal';

export default function AddExpense() {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [account, setAccount] = useState('');
    const [selectedTags, setSelectedTags] = useState([]); //tags that are selected
    const [budget, setBudget] = useState('');
    const [note, setNote] = useState('');
    const [budgetOptions, setBudgetOptions] = useState([]);
    const [date, setDate] = useState(new Date());
    const [datePicker, setDatePicker] = useState(false);
    const [modalVisible1, setModalVisible1] = useState(false); //category
    const [modalVisible2, setModalVisible2] = useState(false); //account
    const [modalVisible3, setModalVisible3] = useState(false); //tags
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState('');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(true);
    const [token, setAccessToken] = useState(null);
    const [username, setUsername] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const navigation = useNavigation();
    const [isOpen, setIsOpen] = useState(true);
    const [modalCategory, setModalCategory] = useState(false);

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
                if (user === 'error') {
                    navigation.navigate('LogIn');
                    return;
                }
                setUser(user);
            }
        };

        fetchDataAsync();

    }, [token, isLoggedIn])

    useEffect(() => {
        const getCategoriesAsync = async () => {

            const data = await getCategories();
            if (data === 'error') {
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

    useEffect(() => {
        const getBudgetsAsync = async () => {
            const response = await getBudgets(user.id);
            if (response === 'error') {
                navigation.navigate('LogIn');
                return;
            }
            setBudgetOptions(response);
        };

        if (user?.id) {
            getBudgetsAsync();
        }
    }, [user?.id]);


    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const data = await getAccounts(user.id);
                if (data === 'error') {
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
    }, [modalVisible2, user, modalVisible3, tags]);

    const handleCategory = (category) => {
        setCategory(category);
        setModalCategory(false);
    }

    const handleAccount = (account) => {
        setAccount(account);
    }

    const handleDateChange = (event, selectedDate) => {
        if (event.type === "set") {
            const currentDate = selectedDate;
            setDate(currentDate);
        }
        setDatePicker(false);
    }

    const handleAddExpense = async () => {
        const tagIds = selectedTags.map(item => item.idtags);
        if (!amount || !category || !account || !date)
            Alert.alert("Warning", "You need to complete the necessary fields!");
        else {
            const response = await addExpense(user.id, tagIds, amount, date, category.idcategories, account.idaccounts, note, budget.idBudget);
            if (response === 'error') {
                navigation.navigate('LogIn');
                return;
            }
            if (response.status === 200) {

                Alert.alert("Success", "Expense added successfully!");
                setAmount('');
                setAccount('');
                setCategory('');
                setBudget('');
                setNote('');
            }
        }
    }

    const closeModal = (setModalVisibile) => {
        return () => { //functia fara return ar fi fost apelata imediat
            setModalVisibile(false);
        };
    };

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
                        <Header title="New Expense" icon="money-bill-wave" toggleMenu={toggleMenu}></Header>
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

                            {/* ---------------pick the budget------------- */}
                            <Text style={[styles.label, { paddingTop: 10 }]}>Budget: </Text>
                            <Dropdown
                                data={budgetOptions}
                                containerStyle={styles.dropdownContainer}
                                selectedTextStyle={[styles.input, { borderWidth: 0, fontSize: 16, marginStart: 20 }]}
                                placeholderStyle={{ marginStart: 20, paddingVertical: 10 }}
                                placeholder='select budget...'
                                maxHeight={200}
                                labelField="label"
                                valueField="value"
                                value={budget.label}
                                onChange={item => {
                                    setBudget(item);
                                }}
                            />

                            {/* ---------------pick the note------------- */}
                            <Text style={styles.label}>Note: </Text>
                            <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setNote} value={note} placeholder="write a note" />

                            {/* ------------modal pentru category------------- */}
                            <MyModal
                                visible={modalCategory} onClose={closeModal(setModalCategory)} title="Select the category"
                                data={categories} keyExtractor={(item) => item.idcategories} onItemPress={handleCategory} nrCol={3} desc={true}
                            />


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
                                style={[styles.button, styles.buttonClose, { marginTop: 20 }]}
                                onPress={() => handleAddExpense()}
                                android_ripple={{ color: 'white' }}
                            >
                                <Text style={styles.textStyle}>add expense</Text>
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
        paddingTop: 20
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
    dropdownContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'black',
        width: '70%',
        maxHeight: 200,
        elevation: 5,
        alignSelf: 'center',
        paddingTop: 20
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
    categoryItem: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    categoryText: {
        fontFamily: 'serif',
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
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
    buttonClose: {
        backgroundColor: '#16619a',
        paddingBottom: 10
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
});
