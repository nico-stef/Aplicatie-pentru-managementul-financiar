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
import { LinearGradient } from 'expo-linear-gradient';
import { getDetailsBalance } from '../APIs/moneyManagement';

export default function HomeScreen() {

    const [isOpen, setIsOpen] = useState(true);
    const [token, setAccessToken] = useState(null);
    const [userid, setUserid] = useState(null);
    const [username, setUsername] = useState(null);
    const navigation = useNavigation();
    const [balance, setBalance] = useState(null);
    const [isVisibleBalance, setIsVisibleBalance] = useState(false);
    const [secretAmount, setSecretAmount] = useState('*****');
    const [totalBalance, setTotalBalance] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const [latestRecords, setLatestRecords] = useState([]);

    const getAccessToken = async () => {
        try {
            //get access token from async storage
            const accessToken = await SecureStore.getItemAsync('accessToken');
            setAccessToken(accessToken);

            //get info that comes with the access token, in my case the object user who has name
            const user = jwtDecode(accessToken);
            setUserid(user.userid);
            setUsername(user.name);

        } catch (error) {
            console.log("Eroare la recuperarea token-ului:", error);
        }
    };

    useEffect(() => {
        console.log("Rtokne ", latestRecords)
    }, [latestRecords]);

    //get accessToken/userid
    useEffect(() => {
        const getAccessTokenAsync = async () => {
            await getAccessToken();
        };
        getAccessTokenAsync();
    }, []);

    //get balance details
    useFocusEffect(
        useCallback(() => {
            const getDetailsBalanceAsync = async () => {
                const res = await getDetailsBalance();
                if (res === 'error') {
                    navigation.navigate('LogIn');
                    return;
                }
                setTotalBalance(res.totalBalance);
                setTotalSpent(res.totalSpent);
                setLatestRecords(res.latestRecords);
            };

            if (token) {
                getDetailsBalanceAsync();
            }
        }, [token])
    );

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const SummaryAccount = ({ item }) => {

        return (
            <LinearGradient
                colors={['#CFE9DC', '#A2D4C0', '#7FBFA9']}
                style={styles.summaryCard}
            >
                <Text style={styles.title}>Total Balance:</Text>
                <View style={styles.summaryRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 25 }}>{isVisibleBalance ? totalBalance : secretAmount} </Text>
                        <TouchableOpacity onPress={() => setIsVisibleBalance(!isVisibleBalance)}>
                            <Icon name={isVisibleBalance ? "eye" : "eye-slash"} size={20}></Icon>
                        </TouchableOpacity>

                    </View>
                </View>

                <Text style={styles.title}>Amount spent this month:</Text>
                <View style={styles.summaryRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 20 }}>{totalSpent ? totalSpent : 0} RON</Text>

                    </View>
                </View>
            </LinearGradient>
        )
    };

    const formatDate = (dateToFormat) => {
        const date = new Date(dateToFormat);
        date.setHours(12);
        return date.toLocaleDateString("en-GB", {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const Record = ({ item }) => {
        return (
            <TouchableOpacity style={styles.cardRecord}>

                <View style={{ flexDirection: 'row', alignItems: 'center', width: '80%' }}>
                    {item.icon ? (<Icon name={item.icon} size={20} style={styles.icon} />) : (<Icon name="money-bill-wave" color="green" size={20} style={styles.icon} />)}
                    <View style={{ marginLeft: 20 }}>
                        <Text style={[styles.buttonText, { fontWeight: 'bold' }]}>{formatDate(item.date)}</Text>
                        {item.category && <Text style={styles.buttonText}>{item.category}</Text>}
                        {item.note && <Text style={[styles.buttonText, { fontSize: 14, width: '80%' }]}>{item.note}</Text>}
                    </View>
                </View>

                {item.type === "expense" ? (<Text style={[styles.buttonText, { fontWeight: 'bold', color: "red" }]}>-{item.amount}</Text>) :
                    (<Text style={[styles.buttonText, { fontWeight: 'bold', color: "green" }]}>+{item.amount}</Text>)}

            </TouchableOpacity>
        )
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <View style={{ flex: 1 }}>
                <Header title="Home" icon="home" toggleMenu={toggleMenu}></Header>

                <View style={{ flex: 1, paddingTop: 20, backgroundColor: '#E8F5F2', }}>

                    <View style={{ paddingHorizontal: 8 }}>
                        <Text style={styles.text}>Hello, <Text style={{ fontWeight: 'bold' }}>{username}</Text>!</Text>
                    </View>

                    <SummaryAccount item={{ name: "cont", total: "400" }}></SummaryAccount>

                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>

                        <View>
                            <TouchableOpacity style={styles.buttonOptions} onPress={() => navigation.navigate('Add expense')}>
                                <Icon name={"money-bill-wave"} size={20}></Icon>
                            </TouchableOpacity>
                            <Text style={{ textAlign: 'center' }}>+ expense</Text>
                        </View>

                        <View>
                            <TouchableOpacity style={styles.buttonOptions} onPress={() => navigation.navigate('Add income')}>
                                <Icon name={"plus-circle"} size={20}></Icon>
                            </TouchableOpacity>
                            <Text style={{ textAlign: 'center' }}>+ income</Text>
                        </View>

                        <View>
                            <TouchableOpacity style={styles.buttonOptions} onPress={() => navigation.navigate('Create budget')}>
                                <Icon name={"piggy-bank"} size={20}></Icon>
                            </TouchableOpacity>
                            <Text style={{ textAlign: 'center' }}>+ budget</Text>
                        </View>

                        <View>
                            <TouchableOpacity style={styles.buttonOptions} onPress={() => navigation.navigate('CreateAccount')}>
                                <Icon name={"credit-card"} size={20}></Icon>
                            </TouchableOpacity>
                            <Text style={{ textAlign: 'center' }}>+ account</Text>
                        </View>
                    </View>


                    <View style={{ marginTop: 15, flex: 1 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Latest Transactions</Text>
                        {!latestRecords ?
                            <View style={styles.container}>
                                <Text style={styles.message}>
                                    No transactions yet. Start logging your transactions and your latest ones will appear here!
                                </Text>
                            </View> :
                            <FlatList
                                data={latestRecords}
                                extraData={latestRecords}
                                renderItem={({ item }) => <Record item={item} />}
                                keyExtractor={item => item.idexpenses ? item.idexpenses : item.idincomes}
                                initialNumToRender={10}
                                contentContainerStyle={{ paddingBottom: 80 }}
                            />}
                    </View>

                </View>

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
    buttonText: {
        color: 'black',
        fontFamily: 'serif',
        fontSize: 16
    },
    buttonOptions: {
        padding: 25,
        borderRadius: 35,
        marginHorizontal: 8,
        backgroundColor: 'white',
        elevation: 5,
        marginBottom: 4
    },
    text: {
        fontSize: 24,
        fontWeight: '400',
        color: '#333',
    },
    username: {
        fontWeight: '600',
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        margin: 10,
        marginBottom: 15,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'black',
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
        color: 'black',
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: 'black',
    },
});