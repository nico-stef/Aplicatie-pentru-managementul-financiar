import React from 'react'
import { useState, useEffect, useRef } from "react";
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, FlatList, Modal, Pressable, TextInput, Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import Icon from 'react-native-vector-icons/FontAwesome5';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import * as Progress from 'react-native-progress';
import { getBudgetsAll, stopBudget, deleteBudget, updateBudget } from '../APIs/moneyManagement';
import { MyModal } from '../components.js/myModal';
import { months } from "../variables"

export default function BudgetPage() {
    const [isOpen, setIsOpen] = useState(true);
    const [token, setAccessToken] = useState(null);
    const [userid, setUserid] = useState(null);
    const [budgets, setBudgets] = useState([]);
    const navigation = useNavigation();
    const date = new Date(); //data curenta
    const [progress, setProgress] = useState(0);
    const [budgetThisMonth, setBudgetThisMonth] = useState(0);
    const [budgetSpent, setBudgetSpent] = useState(0);
    const [modalMonthCalendar, setModalMonthCalendar] = useState(false); //moddal calendar month
    const [month, setMonth] = useState(''); //selected month
    const [budget, setBudget] = useState(''); //selected budget
    const [modalBudgetVisible, setModalBudgetVisible] = useState(false);

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
            setUserid(user.userid);

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

    //get budgets data
    useEffect(() => {
        const currentMonth = month ? month.month : date.getMonth() + 1; // 0=ianuarie => adaugam 1
        const currentYear = month ? month.year : date.getFullYear();

        getBudgetsAll(userid, currentMonth, currentYear)
            .then((data) => {
                if (data === 'error') {
                    navigation.navigate('LogIn');
                    return;
                }
                setBudgets(data)
            })
            .catch((err) => console.error(err));
    }, [userid, month]);

    useEffect(() => {
        const totalBuget = budgets.reduce((acc, b) => acc + parseFloat(b.amount || 0), 0);
        const totalCheltuit = budgets.reduce((acc, b) => acc + parseFloat(b.total || 0), 0);

        const progres = totalCheltuit > 0 ? totalCheltuit / totalBuget : 0;
        setBudgetThisMonth(totalBuget);
        setBudgetSpent(totalCheltuit);
        setProgress(progres);
    }, [budgets]);


    const closeModal = (setModalVisibile) => {
        return () => { //functie care fara return ar fi fost apelata imediat
            setModalVisibile(false);
        };
    };

    const handleMonth = (item) => {
        setMonth(item);
        setModalMonthCalendar(false);
    }

    const handleStopBudget = async () => {
        const response = await stopBudget(budget.idbudgets);
        if (response.status === 200) {
            Alert.alert("", "budget stopped succesfully");
        }
        setModalBudgetVisible(false);
        //obiectul cu acelasi idbudgets ca cel din budget este actualizat, se schimbă frequency in 1, iar toate celelalte raman la fe
        const newBudgets = budgets.map(b => b.idbudgets === budget.idbudgets ? { ...b, frequency: "1" } : b);
        setBudgets(newBudgets);
    }

    const handleDeleteBudget = async () => {
        const response = await deleteBudget(budget.idbudgets);
        if (response === 'error') {
            navigation.navigate('LogIn');
            return;
        }
        Alert.alert("", "Budget deleted successfully!");
        navigation.replace('BudgetPage');
    }

    const handleDeleteBudgetConfirmation = () =>
        Alert.alert("",'Are you sure you want to delete?', [
            {
                text: 'Cancel',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel',
            },
            { text: 'Delete', onPress: handleDeleteBudget },
        ]);

    const handleUpdateBudget = async () => {
        const response = await updateBudget(budget.name, budget.amount, budget.idbudgets);
        if (response === 'error') {
            navigation.navigate('LogIn');
            return;
        }
        Alert.alert("", "Budget updated successfully!");
        navigation.replace('BudgetPage');
    }

    // useEffect(() => {
    //     console.log("bugetele: ", budget)
    // }, [budget]);

    const Record = ({ item }) => {
        return (
            <TouchableOpacity style={styles.cardRecordBig} onPress={() => { setBudget(item); setModalBudgetVisible(true) }}>
                <View style={styles.cardRecord}>

                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '50%' }}>
                        <Text style={[styles.buttonTextRecord, { fontWeight: 'bold', marginLeft: 20 }]}>{item.name}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.buttonTextRecord]}>{item.total ? (item.total.endsWith('.00') ? parseFloat(item.total).toFixed(0) : item.total) : `0`}/{item.amount.endsWith('.00') ? parseFloat(item.amount).toFixed(0) : item.amount}</Text>
                        <Icon name="edit" size={10} color="black" paddingHorizontal={5} />
                    </View>
                </View>
                <Progress.Bar progress={parseFloat(item.total) / parseFloat(item.amount)} width={null} style={{ width: '90%', alignSelf: 'center' }} color='#69C0FF' />
            </TouchableOpacity>

        )
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <View style={{ flex: 1, backgroundColor: '#E8F5F2' }}>
                <Header title="Budget" icon="piggy-bank" toggleMenu={toggleMenu}></Header>

                <View style={{ flex: 1, alignItems: 'center' }}>

                    {/* ------------modal pentru calendar MONTH------------- */}
                    <MyModal
                        visible={modalMonthCalendar} onClose={closeModal(setModalMonthCalendar)} title="Select the month"
                        data={months} keyExtractor={(item) => item.id} onItemPress={handleMonth} nrCol={3} desc={true}
                    />

                    <View style={styles.budgetCard}>
                        <Text style={[styles.buttonText, { fontSize: 18, marginLeft: 6, marginTop: 10 }]}>Spent budget in {month ? month.name : date.toLocaleString('en-US', { month: 'long' })} {/*{date.toLocaleString('en-US', { month: 'long' })}*/}: </Text>

                        <View style={{ alignItems: 'center' }}>
                            <Text style={[styles.buttonText, { fontSize: 20 }]}>{budgetSpent} out of {budgetThisMonth} RON </Text>
                        </View>

                        <Progress.Bar progress={progress} width={null} />

                        <TouchableOpacity style={styles.viewPreviousBudgets} onPress={() => setModalMonthCalendar(true)}>
                            <Text style={[styles.buttonText, { fontSize: 14, fontWeight: 'normal' }]}>{month.name ? month.name : `month`}</Text>
                            <Icon name="chevron-down" size={10} color="black" marginStart={4} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.addBudget} onPress={() => navigation.navigate('Create budget')}>
                        <Text style={[styles.buttonText, { fontSize: 16, fontWeight: 'bold' }]}>+ new budget</Text>
                    </TouchableOpacity>

                    {budgets.length > 0 && <FlatList
                        data={budgets}
                        renderItem={({ item }) => <Record item={item} />}
                        keyExtractor={item => item.idbudgets}
                        initialNumToRender={10}
                        contentContainerStyle={{ paddingBottom: 80 }}
                    />}


                    {/* --------modal pentru buget------------- */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={modalBudgetVisible}
                        onRequestClose={() => {
                            modalBudgetVisible(!modalBudgetVisible);
                        }}>
                        <View style={styles.centeredView}>
                            <View style={styles.modal}>
                                <Text style={styles.modalTitle}>Selected Budget</Text>

                                <View style={styles.rowModal}>
                                    <Text style={styles.label}>Name:</Text>
                                    <TextInput
                                        editable
                                        multiline={true}
                                        numberOfLines={5}
                                        scrollEnabled={true}
                                        value={budget?.name}
                                        onChangeText={(text) =>
                                            setBudget(prev => ({
                                                ...prev,
                                                name: text
                                            }))
                                        }
                                        style={styles.textInput}
                                    />
                                    <Icon name="edit" size={16} color="black" paddingHorizontal={10} />
                                </View>

                                <View style={styles.rowModal}>
                                    <Text style={styles.label}>Amount allocated:</Text>
                                    <TouchableOpacity>
                                        <TextInput
                                            editable
                                            keyboardType="decimal-pad"
                                            value={budget.amount}
                                            onChangeText={(text) =>
                                                setBudget(prev => ({
                                                    ...prev,
                                                    amount: text
                                                }))
                                            }
                                            style={styles.textInput}
                                        />
                                    </TouchableOpacity>
                                    <Icon name="edit" size={16} color="black" paddingHorizontal={10} />
                                </View>

                                <View style={styles.rowModal}>
                                    <Text style={styles.label}>Frequency: </Text>
                                    <Text>{budget.frequency === '1' ? `this month only` : `recurrent`}</Text>
                                </View>


                                <View style={styles.buttons}>
                                    <TouchableOpacity onPress={handleUpdateBudget} style={[styles.button, styles.update]}>
                                        <Text style={styles.buttonText}>Update</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={handleDeleteBudgetConfirmation} style={[styles.button, styles.delete]}>
                                        <Text style={styles.buttonText}>Delete</Text>
                                    </TouchableOpacity>

                                    {!budget.end_date && budget.frequency === "2" && <TouchableOpacity onPress={handleStopBudget} style={[styles.button, styles.delete, { backgroundColor: '#b22222' }]}>
                                        <Text style={styles.buttonText}>Stop</Text>
                                    </TouchableOpacity>}
                                </View>

                                <Pressable
                                    style={[styles.buttonClose]}
                                    onPress={() => setModalBudgetVisible(!modalBudgetVisible)}>
                                    <Text style={styles.textStyle}>close</Text>
                                </Pressable>
                            </View>
                        </View>
                    </Modal>

                </View>


            </View>

            <Menu></Menu>

            <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    textInput: {
        flex: 1,
        minHeight: 60,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'center',
    },
    rowModal: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
    },
    centeredView: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontWeight: 'bold',
        fontSize: 16,
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
    budgetCard: {
        height: '20%',
        width: '95%',
        // backgroundColor: '#f4faff',
        marginTop: 25,
        marginBottom: 10,
        borderRadius: 10,
        flexDirection: 'column',   // Pune elementele pe verticală
        justifyContent: 'space-between',
        borderRadius: 10,
        padding: 10,
        elevation: 5,
        backgroundColor: 'white',
    },
    viewPreviousBudgets: {
        flexDirection: 'row',
        borderColor: '#21907F',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        paddingVertical: 4
    },
    addBudget: {
        height: '7%',
        width: '95%',
        backgroundColor: '#d1dff7',//"25a18e",//'#d1dff7',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        borderWidth: 1,
        borderColor: 'grey',
        marginBottom: 20
    },
    buttonText: {
        color: 'black',
        fontWeight: 'bold',
        fontFamily: 'serif',
    },
    //record
    cardRecord: {
        alignItems: 'center',
        justifyContent: 'center',
        alignContent: 'center',
        width: '98%',
        alignSelf: 'center',
        minHeight: 60,
        backgroundColor: "#fff",
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        // backgroundColor: 'pink'
    },
    cardRecordBig: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: 'grey',
        marginTop: 10,
        padding: 10,
    },
    icon: {
        color: 'black',
        fontWeight: 'normal'
    },
    buttonTextRecord: {
        color: 'black',
        fontFamily: 'serif',
        fontSize: 16
    },
})