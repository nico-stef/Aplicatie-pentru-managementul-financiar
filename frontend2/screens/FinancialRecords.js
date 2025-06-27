import React, { useId } from 'react';
import { useState, useEffect, useRef } from "react";
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, FlatList, Modal, Pressable, TextInput, Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import Icon from 'react-native-vector-icons/FontAwesome5';
import Menu from '../components.js/Menu';
import TopButtons from '../components.js/TopButtons';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import { MyModal } from '../components.js/myModal';
import { getExpensesRecords, getIncomesRecords, updateExpense, deleteExpense, updateIncome, deleteIncome } from '../APIs/financialRecords';
import { getAccounts, getCategories } from '../APIs/moneyManagement';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getBudgets } from '../APIs/moneyManagement';

export default function FinancialRecords() {
    const [isOpen, setIsOpen] = useState(true);
    const [expenseRecords, setExpenseRecords] = useState([]);
    const [incomeRecords, setIncomeRecords] = useState([]);
    const [token, setAccessToken] = useState(null);
    const [userid, setUserid] = useState(null);
    const [accounts, setAccounts] = useState([]); //list of the accounts
    const [account, setAccount] = useState({ "idaccounts": "total", "name": "total" }); //selected account
    const [categoryFilter, setCategoryFilter] = useState({ "category": "all" });
    const [budgetFilter, setBudgetFilter] = useState({ "name": "all" });
    const [modalAccountVisible, setModalAccountVisible] = useState(false); //moddal account
    const navigation = useNavigation();
    const [expenseOrIncome, setExpenseOrIncome] = useState(1);
    const [flatlistData, setFlatlistData] = useState([]);
    const [modalRecordVisible, setModalRecordVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState({});
    const [datePicker, setDatePicker] = useState(false);
    const [date, setDate] = useState(new Date()); //valoarea initiala a date picker-ului
    const [modalVisible1, setModalVisible1] = useState(false); //category
    const [categories, setCategories] = useState([]); //lista de categorii cand face update
    const [categoriesFilter, setCategoriesFilter] = useState([]); //lista de categorii cand sa filtreze
    const [category, setCategory] = useState(''); //pentru modalul cu categorii sa stim categoria actuala ca sa fie colorata
    const [modalCategory, setModalCategory] = useState(false);
    const [modalBudgetVisible, setModalBudgetVisible] = useState(false); //modal bugete filtrare
    const [budgetOptions, setBudgetOptions] = useState([]); //bugetele la filtrare (contin si all)
    const [modalBudgetUpdateVisible, setModalBudgetUpdateVisible] = useState(false); //modal bugete update
    const [budgetOptionsUpdate, setBudgetOptionsUpdate] = useState([]); //bugetele din lista pt update

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
                SecureStore.deleteItemAsync('accessToken');
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

    //get accounts
    useEffect(() => {
        getAccounts(userid)
            .then((data) => {
                if (data === 'error') {
                    navigation.navigate('LogIn');
                    return;
                }
                data.push({ "idaccounts": "total", "name": "total" });
                setAccounts(data)
            })
            .catch((err) => console.error(err));
    }, [userid]);

    //get budgets
    useEffect(() => {
        const getBudgetsAsync = async () => {
            const response = await getBudgets(userid);
            if (response === 'error') {
                navigation.navigate('LogIn');
                return;
            }
            setBudgetOptionsUpdate(response);
            setBudgetOptions([...response, { idbudgets: "all", name: "all" }]);
        };

        if (userid) {
            getBudgetsAsync();
        }
    }, [userid]);

    //get records(expenses and incomes) based off the account or useird if we want all acounts
    useEffect(() => {
        getExpensesRecords(account.idaccounts, userid, categoryFilter.idcategories, budgetFilter.idBudget)
            .then((data) => {
                if (data === 'error') {
                    navigation.navigate('LogIn');
                    return;
                }
                setExpenseRecords(data);
            })
            .catch((err) => console.error(err));

        getIncomesRecords(account.idaccounts, userid)
            .then((data) => {
                if (data === 'error') {
                    navigation.navigate('LogIn');
                    return;
                }
                setIncomeRecords(data);
            })
            .catch((err) => console.error(err));
    }, [accounts, account, categoryFilter, budgetFilter]);

    //get categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories();
                if (data === 'error') {
                    navigation.navigate('LogIn');
                    return;
                }
                setCategories(data); //categoriile pt update-ul unei cheltuieli
                setCategoriesFilter([...data, { idcategories: "all", category: "all" }]); //categoriile pt filtrare ca sa contina si optiunea de all categories
            } catch (err) {
                setError("There was an error fetching categories.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();

    }, [modalVisible1, modalCategory]);

    //choose what data to display - expenses or incomes
    useEffect(() => {
        if (expenseOrIncome === 1)
            setFlatlistData(expenseRecords);
        else if (expenseOrIncome === 2)
            setFlatlistData(incomeRecords);

    }, [expenseOrIncome, expenseRecords, incomeRecords, account]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleAccount = (item) => {
        setAccount(item);
        setModalAccountVisible(false);
    }

    const closeModal = (setModalVisibile) => {
        return () => { //functie pe care o putem apela mai tarziu, nu imediat. fara return ar fi fost apelata imediat
            setModalVisibile(false);
        };
    };

    const handleRecordClick = (item) => {
        setSelectedRecord(item);
    }

    const formatDate = (dateToFormat) => {
        const date = new Date(dateToFormat);
        date.setHours(12);
        return date.toLocaleDateString("en-GB", {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const handleDateChange = (event, selectedDate) => {
        if (event.type === "set") {
            setDatePicker(false);
            console.log("data selectat", selectedDate)

            setSelectedRecord(prev => ({
                ...prev,
                date: selectedDate,
            }));

        } else {
            setDatePicker(false);
        }
    };

    const handleCategory = (item) => {
        const categ = item.category;
        setCategory(item)

        setSelectedRecord(prev => ({
            ...prev,
            category: categ,
        }));
    }

    const handleBudgetUpdate = (selectedBudget) => { //updatarea bugetului unei cheltuieli
        setSelectedRecord(prev => ({
            ...prev,
            budget_id: selectedBudget.idBudget,
            budget_name: selectedBudget.name
        }));
        setModalBudgetUpdateVisible(false);
    };

    const handlePressDate = () => {
        setDatePicker(true);
    }
    const handleBudget = (bud) => {
        setBudgetFilter(bud);
        setModalBudgetVisible(false);
    }

    const handleCategoryFilter = (category) => {
        setCategoryFilter(category);
        setModalCategory(false)
    }

    // useEffect(() => {
    //     console.log("id userrr: ", expenseRecords)
    // }, [expenseRecords]);


    const Record = ({ item }) => {
        return (
            <TouchableOpacity style={styles.cardRecord} onPress={() => { setModalRecordVisible(true); handleRecordClick(item) }}>

                <View style={{ flexDirection: 'row', alignItems: 'center', width: '80%' }}>
                    {item.icon ? (<Icon name={item.icon} size={20} style={styles.icon} />) : (<Icon name="money-bill-wave" color="green" size={20} style={styles.icon} />)}
                    <View style={{ marginLeft: 20 }}>
                        <Text style={[styles.buttonText, { fontWeight: 'bold' }]}>{formatDate(item.date)}</Text>
                        {item.category && <Text style={styles.buttonText}>Category: {item.category}</Text>}
                        {item.budget_name && <Text style={styles.buttonText}>Budget: {item.budget_name}</Text>}
                        {item.note && <Text style={[styles.buttonText, { fontSize: 14, width: '80%' }]}>{item.note}</Text>}
                    </View>
                </View>

                {expenseOrIncome === 1 ? (<Text style={[styles.buttonText, { fontWeight: 'bold', color: "red" }]}>-{item.amount}</Text>) :
                    (<Text style={[styles.buttonText, { fontWeight: 'bold', color: "green" }]}>+{item.amount}</Text>)}

            </TouchableOpacity>
        )
    };

    //update record
    const handleUpdateRecord = async () => {
        if (expenseOrIncome === 1) {
            const response = await updateExpense(selectedRecord);
            if (response === 'error') {
                navigation.navigate('LogIn');
                return;
            }
            setExpenseRecords(prev => prev.map(expense => expense.idexpenses === selectedRecord.idexpenses ? selectedRecord : expense));
        }
        else if (expenseOrIncome === 2) {
            const response = await updateIncome(selectedRecord);
            if (response === 'error') {
                navigation.navigate('LogIn');
                return;
            }
            setIncomeRecords(prev => prev.map(income => income.idincomes === selectedRecord.idincomes ? selectedRecord : income));
        }
        setModalRecordVisible(!modalRecordVisible);
        Alert.alert('Success', "Record updated succesfully!");
    }

    //delete record
    const handleDeleteRecord = async () => {
        if (expenseOrIncome === 1) {
            const response = await deleteExpense(selectedRecord);
            if (response === 'error') {
                navigation.navigate('LogIn');
                return;
            }
            setExpenseRecords(prev => prev.filter(expense => expense.idexpenses !== selectedRecord.idexpenses));
        }
        else if (expenseOrIncome === 2) {
            const response = await deleteIncome(selectedRecord);
            if (response === 'error') {
                navigation.navigate('LogIn');
                return;
            }
            setIncomeRecords(prev => prev.filter(income => income.idincomes !== selectedRecord.idincomes));
        }
        setModalRecordVisible(!modalRecordVisible);
        Alert.alert('Success', "Record deleted succesfully!");
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <View style={{ flex: 1 }}>
                <Header title="Transactions" icon="scroll" toggleMenu={toggleMenu}></Header>
                <TopButtons setValue={setExpenseOrIncome}></TopButtons>

                {/* --------modal pentru accounts------------- */}
                <MyModal
                    visible={modalAccountVisible} onClose={closeModal(setModalAccountVisible)} title="Select the account"
                    data={accounts} keyExtractor={(item) => item.idaccounts} onItemPress={handleAccount} nrCol={2}
                />

                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                        <TouchableOpacity style={styles.accountButton} onPress={() => setModalAccountVisible(true)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="credit-card" size={20} color="black" />
                                <Icon name="chevron-down" size={12} color="black" marginStart={4} />
                            </View>
                            <Text style={[styles.buttonText, { fontSize: 14 }]}>{account.name}</Text>
                        </TouchableOpacity>

                        {expenseOrIncome === 1 && <>
                            <TouchableOpacity style={styles.accountButton} onPress={() => setModalCategory(true)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon name="list" size={20} color="black" />
                                    <Icon name="chevron-down" size={12} color="black" marginStart={4} />
                                </View>
                                <Text style={[styles.buttonText, { fontSize: 14 }]}>{categoryFilter.category}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.accountButton} onPress={() => setModalBudgetVisible(true)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon name="wallet" size={20} color="black" />
                                    <Icon name="chevron-down" size={12} color="black" marginStart={4} />
                                </View>
                                <Text style={[styles.buttonText, { fontSize: 14 }]}>{budgetFilter.name}</Text>
                            </TouchableOpacity>
                        </>
                        }
                    </View>

                    {/* --------modal pentru budget la filtrare------------- */}
                    <MyModal
                        visible={modalBudgetVisible} onClose={closeModal(setModalBudgetVisible)} title="Select the budget"
                        data={budgetOptions} keyExtractor={(item) => item.idBudget} onItemPress={handleBudget} nrCol={2}
                    />

                    {/* --------modal pentru budget la update------------- */}
                    <MyModal
                        visible={modalBudgetUpdateVisible} onClose={closeModal(setModalBudgetUpdateVisible)} title="Select the budget"
                        data={budgetOptionsUpdate} keyExtractor={(item) => item.idBudget} onItemPress={handleBudgetUpdate} nrCol={2}
                    />


                    {/* ------------modal pentru category------------- */}
                    <MyModal
                        visible={modalCategory} onClose={closeModal(setModalCategory)} title="Select the category"
                        data={categoriesFilter} keyExtractor={(item) => item.idcategories} onItemPress={handleCategoryFilter} nrCol={3} desc={true}
                    />

                    {!flatlistData ?
                        <View style={styles.container}>
                            <Text style={styles.message}>
                                No transactions yet. Start logging your transactions and they will appear here!
                            </Text>
                        </View> :
                        <FlatList
                            data={flatlistData}
                            extraData={flatlistData}
                            renderItem={({ item }) => <Record item={item} />}
                            keyExtractor={item => item.idexpenses ? item.idexpenses : item.idincomes}
                            // initialNumToRender={10}
                            contentContainerStyle={{ paddingBottom: 80 }}
                        />}

                </View>


                {/* --------modal pentru record------------- */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalRecordVisible}
                    onRequestClose={() => {
                        setModalRecordVisible(!modalRecordVisible);
                    }}>
                    <View style={styles.centeredView}>
                        <View style={styles.modal}>
                            <Text style={styles.modalTitle}>{expenseOrIncome === 1 ? "Expense Record" : "Income Record"}</Text>

                            {selectedRecord.category &&
                                <View>
                                    <View style={styles.row}>
                                        <Text style={styles.label}>Category:</Text>
                                        <TouchableOpacity onPress={() => setModalVisible1(true)}>
                                            <TextInput //category
                                                value={selectedRecord?.category}
                                                onChangeText={(text) =>
                                                    setSelectedRecord(prev => ({
                                                        ...prev,
                                                        category: text
                                                    }))
                                                }
                                                editable={false}
                                                style={styles.textInput}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.row}>
                                        <Text style={styles.label}>Budget:</Text>
                                        <TouchableOpacity onPress={() => setModalBudgetUpdateVisible(true)}>
                                            <TextInput //budget
                                                placeholder='choose a budget'
                                                value={selectedRecord.budget_name ? selectedRecord?.budget_name : ""}
                                                onChangeText={(text) =>
                                                    setSelectedRecord(prev => ({
                                                        ...prev,
                                                        budget_id: item.budget_id,
                                                        budget_name: item.budget_name,
                                                    }))
                                                }
                                                editable={false}
                                                style={styles.textInput}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            }

                            <View style={styles.row}>
                                <Text style={styles.label}>Date:</Text>
                                <TouchableOpacity onPress={handlePressDate}>
                                    <TextInput //date
                                        editable={false}
                                        value={formatDate(selectedRecord?.date)}
                                        style={styles.textInput}
                                    />
                                </TouchableOpacity>
                            </View>
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

                            <View style={styles.row}>
                                <Text style={styles.label}>Amount:</Text>
                                <TouchableOpacity>
                                    <TextInput //date
                                        editable
                                        keyboardType="decimal-pad"
                                        value={selectedRecord?.amount}
                                        onChangeText={(text) => {

                                            let filtered = text;
                                            const firstDotIndex = filtered.indexOf('.');
                                            if (firstDotIndex !== -1) {
                                                // inainte si dupa primul punct
                                                const beforeDot = filtered.slice(0, firstDotIndex);
                                                const afterDotRaw = filtered.slice(firstDotIndex + 1); // scoate alte puncte
                                                const afterDot = afterDotRaw.slice(0, 2); // doar 2 zecimale

                                                filtered = `${beforeDot}.${afterDot}`;
                                            }

                                            console.log("filtered", filtered);

                                            setSelectedRecord(prev => ({
                                                ...prev,
                                                amount: filtered
                                            }))
                                        }}
                                        style={styles.textInput}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Note:</Text>
                                <TextInput //note
                                    editable
                                    multiline={true}
                                    numberOfLines={5}
                                    scrollEnabled={true}
                                    value={selectedRecord?.note}
                                    onChangeText={(text) =>
                                        setSelectedRecord(prev => ({
                                            ...prev,
                                            note: text
                                        }))
                                    }
                                    placeholder="Write a note..."
                                    style={styles.textInput}
                                />
                            </View>

                            <View style={styles.buttons}>
                                <TouchableOpacity style={[styles.button, styles.update]} onPress={handleUpdateRecord}>
                                    <Text style={styles.buttonText}>Update</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.button, styles.delete]} onPress={handleDeleteRecord}>
                                    <Text style={styles.buttonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>

                            <Pressable
                                style={[styles.buttonClose]}
                                onPress={() => setModalRecordVisible(!modalRecordVisible)}>
                                <Text style={styles.textStyle}>close</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                {/* ----------modal category------------------- */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible1}
                    onRequestClose={() => setModalVisible1(false)}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <Text style={styles.modalTitle}>Select a Category</Text>


                            <FlatList
                                data={categories}
                                keyExtractor={(item) => item.idcategories}
                                numColumns={2}
                                renderItem={({ item }) => (
                                    <Pressable style={[
                                        styles.categoryItem,
                                        category && category.idcategories === item.idcategories
                                            ? styles.selectedCategory
                                            : null,
                                    ]}
                                        onPress={() => handleCategory(item)} >
                                        <Icon name={item.icon} size={20} color="black" style={styles.icon} />
                                        <Text style={styles.categoryText}>{item.category}</Text>
                                    </Pressable>
                                )}
                            />


                            <Pressable
                                style={[styles.button, styles.buttonCloseCategories]}
                                onPress={() => setModalVisible1(false)}
                            >
                                <Text style={{ color: 'white' }}>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

            </View>

            <Menu></Menu>

            <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
        </SafeAreaView>

    )
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        marginTop: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        color: '#555',
        lineHeight: 22,
    },
    centeredView: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
    },
    textInput: {
        fontSize: 14,
        width: '100%',
        marginHorizontal: 5,
        textAlignVertical: 'top',
        maxHeight: 100,
        color: '#007AFF',
    },
    label: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 20
    },
    update: {
        backgroundColor: '#4CAF50',
    },
    delete: {
        backgroundColor: '#f44336',
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
    },
    buttonClose: {
        alignItems: 'center',

    },
    accountButton: {
        marginTop: 10,
        alignItems: "center"
    },
    buttonText: {
        color: 'black',
        fontFamily: 'serif',
        fontSize: 15
    },
    cardRecord: {
        backgroundColor: "#fff",
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        marginTop: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        padding: 10,
        elevation: 1,
    },
    icon: {
        color: "black"
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
    selectedCategory: {
        backgroundColor: '#dbf0e3',
        borderColor: '#fff',
        borderWidth: 2,
    },
    buttonCloseCategories: {
        backgroundColor: '#16619a',
        justifyContent: 'center',
        alignItems: 'center',
    }
})