import React from 'react';
import { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { KeyboardAvoidingView, ScrollView, Platform, TouchableWithoutFeedback, Keyboard, SafeAreaView, StatusBar, } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getMembers, addSharedExpense } from '../APIs/sharedExpenses';
import { Dropdown } from 'react-native-element-dropdown';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import DateTimePicker from '@react-native-community/datetimepicker';
import Checkbox from 'expo-checkbox';

export default function AddSharedExpense({ route }) {
    const { groupId } = route?.params || {};
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [frequency, setFrequency] = useState(null);
    const frequencyOptions = [
        { label: 'only this month', value: '1' },
        { label: 'recurrent every month', value: '2' },
    ];
    const navigation = useNavigation();
    const [isOpen, setIsOpen] = useState(true);
    const [paidBy, setPaidBy] = useState(null);
    const [members, setMembers] = useState([
        { label: 'Ana Popescu', value: 'user_ana' },
        { label: 'Mihai Ionescu', value: 'user_mihai' },
        { label: 'Elena Georgescu', value: 'user_elena' },
        { label: 'Andrei Dumitru', value: 'user_andrei' },
    ]);
    const [splitType, setSplitType] = useState('');
    const [splitAmounts, setSplitAmounts] = useState({});
    //pentru selectarea datei
    const [showReminder, setShowReminder] = useState(false);
    const [datePicker, setDatePicker] = useState(false);
    const [date, setDate] = useState(null);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleDateChange = (event, selectedDate) => {
        if (event.type === "set") {
            const currentDate = selectedDate;
            setDate(currentDate);
        }
        setDatePicker(false);
    }

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await getMembers(groupId);
                if (response && response.data) {
                    const formattedMembers = response.data.map(member => ({
                        label: member.name,
                        value: member.idusers
                    }));
                    setMembers(formattedMembers);
                }
            } catch (error) {
                console.log('Could not get members:', error);
            }
        };

        fetchMembers();
    }, [groupId]);

    const handleSharedExpense = async () => {
        const formattedSplit = Object.entries(splitAmounts).map(([userId, amount]) => ({
            userId,
            amount: parseFloat(amount) || 0
        }));

        const formatedDate = date ? date.toISOString().split('T')[0] : null;
        if (showReminder && !formatedDate) {
            Alert.alert("", 'You need to specify the due date');
            return;
        }

        const response = await addSharedExpense(groupId, name, amount, paidBy, note, splitType, formattedSplit, formatedDate, showReminder);
        if (response.response && response.response.status === 500) {
            Alert.alert("", response.response.data.message);
            return;
        }
        if (response.response && (response.response.status === 401 || response.response.status === 403)) {
            navigation.navigate('LogIn');
            return;
        }
        Alert.alert("", "Shared expense created successfully!");
    };

    const closeModal = (setModalVisibile) => {
        return () => { //functie pe care o putem apela mai tarziu, nu imediat. fara return ar fi fost apelata imediat
            setModalVisibile(false);
        };
    };

    useEffect(() => {
        console.log("groups: ", date, showReminder);
    }, [date, showReminder]);

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
                        showsVerticalScrollIndicator={true}
                    >
                        <Header title="Your shared expense" toggleMenu={toggleMenu}></Header>
                        <View style={styles.container}>

                            {/* ----------------pick the name of the shared expense------------------- */}
                            <Text style={styles.label}>Name of your shared expense: </Text>
                            <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setName} value={name} placeholder="type the name" />

                            {/* ----------------pick the amount------------------- */}
                            <Text style={styles.label}>Amount*: </Text>
                            <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setAmount} value={amount} placeholder="type your amount" keyboardType="numeric" />

                            {/* ---------------- who paid ------------------- */}
                            <Text style={styles.label}>Who paid?*</Text>
                            <Dropdown
                                data={members} // [{ label: 'Ana', value: 'user_1' }, ...]
                                containerStyle={styles.dropdownContainer}
                                selectedTextStyle={[styles.input, { borderWidth: 0, fontSize: 14, marginStart: 20 }]}
                                placeholderStyle={{ marginStart: 20, paddingVertical: 10 }}
                                placeholder='select who paid...'
                                maxHeight={200}
                                labelField="label"
                                valueField="value"
                                value={paidBy}
                                onChange={item => setPaidBy(item.value)}
                                style={{
                                    backgroundColor: '#fff', borderRadius: 8, width: '90%', alignSelf: 'center', marginTop: 3
                                }}
                            />

                            {/* ---------------- Metoda de impartire ------------------- */}
                            <Text style={styles.label}>Split method*:</Text>
                            <Dropdown
                                data={[
                                    { label: 'Equally', value: 'equal' },
                                    { label: 'Manually', value: 'manual' }
                                ]}
                                labelField="label"
                                valueField="value"
                                value={splitType}
                                onChange={item => setSplitType(item.value)}
                                placeholder="Choose split method..."
                                containerStyle={styles.dropdownContainer}
                                selectedTextStyle={[styles.input, { borderWidth: 0, fontSize: 14, marginStart: 20 }]}
                                placeholderStyle={{ marginStart: 20, paddingVertical: 10 }}
                                style={{
                                    backgroundColor: '#fff', borderRadius: 8, width: '90%', alignSelf: 'center', marginTop: 3, marginBottom: 5
                                }}
                            />

                            {splitType === 'manual' && members.map(member => (
                                <View
                                    key={member.value}
                                    style={{
                                        flexDirection: 'row',
                                        width: '90%',
                                        alignSelf: 'center',
                                        alignItems: 'center',
                                        backgroundColor: '#fff',
                                        borderRadius: 10,
                                        padding: 5,
                                        marginVertical: 6,
                                        elevation: 3,
                                    }}
                                >
                                    <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#333' }}>
                                        {member.label}
                                    </Text>
                                    <TextInput
                                        keyboardType="numeric"
                                        placeholder="amount"
                                        value={splitAmounts[member.value] || ''}
                                        onChangeText={(value) => setSplitAmounts(prev => ({
                                            ...prev,
                                            [member.value]: value //rezulta un obiect in care perechile cheie valoare sunt iduser si valoarea
                                        }))}
                                        style={{
                                            width: 90,
                                            height: 40,
                                            backgroundColor: '#f0f0f0',
                                            borderRadius: 8,
                                            paddingHorizontal: 10,
                                            fontSize: 16,
                                            color: '#222',
                                            textAlign: 'center',
                                        }}
                                    />
                                </View>
                            ))}

                            {/* -------------picking the date----------------- */}
                            <View style={{ padding: 15, marginHorizontal: 5 }}>
                                <View style={styles.row}>
                                    <Checkbox
                                        value={showReminder}
                                        onValueChange={setShowReminder}
                                        color={showReminder ? '#4630EB' : undefined}
                                    />
                                    <Text style={styles.label}>Set a reminder</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Due Date: </Text>
                                <TextInput style={[styles.input, { borderWidth: 0, fontSize: 16 }]} value={date ? date.toLocaleDateString("en-GB", {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                }) : ""} editable={false} />
                            </View>

                            <Pressable
                                style={[styles.button, styles.buttonOpen, { marginBottom: 5 }]}
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


                            {/* ---------------pick the note------------- */}
                            <Text style={styles.label}>Note: </Text>
                            <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setNote} value={note} placeholder="write a note" />


                            <Pressable
                                style={[styles.button, styles.buttonClose, { marginTop: 30, marginBottom: 70 }]}
                                onPress={handleSharedExpense}
                                android_ripple={{ color: 'white' }}
                            >
                                <Text style={styles.textStyle}>add expense</Text>
                            </Pressable>

                        </View>


                        <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
            <Menu></Menu>
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
