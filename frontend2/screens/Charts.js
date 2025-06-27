import React from 'react';
import { useEffect, useState } from "react";
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, Modal, Pressable, Alert, FlatList, Image, StatusBar, Animated } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import Menu from '../components.js/Menu';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { PieChart } from "react-native-gifted-charts";
import { getAccounts } from '../APIs/moneyManagement';
import { MyModal } from '../components.js/myModal';
import { Calendar } from "react-native-calendars";
import { startOfWeek } from "date-fns";
import { months, years } from "../variables"
import { getExpensesPerCateogory } from '../APIs/chart';
import WalletImage from '../images/wallet.jpg'
import { useNavigation } from '@react-navigation/native';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import LineChartComponent from '../components.js/LineChartComponent';
import LineChartComponentBudgets from '../components.js/LineChartComponentBudgets';

export default function Charts() {

    const [account, setAccount] = useState({ "name": "total" }); //selected account
    const [period, setPeriod] = useState("today"); //selected period
    const [date, setDate] = useState(new Date);
    const [accounts, setAccounts] = useState(''); //list of the accounts
    const [modalAccountVisible, setModalAccountVisible] = useState(false); //moddal account
    const [modalPeriodVisible, setModalPeriodVisible] = useState(false); //moddal period
    const [modalWeekCalendar, setModalWeekCalendar] = useState(false); //moddal calendar week
    const [modalDayCalendar, setModalDayCalendar] = useState(false); //moddal calendar day
    const [modalMonthCalendar, setModalMonthCalendar] = useState(false); //moddal calendar month
    const [month, setMonth] = useState(''); //selected month
    const [modalYearCalendar, setModalYearCalendar] = useState(false); //moddal calendar year
    const [year, setYear] = useState(''); //selected year
    const [selectedTab, setSelectedTab] = useState(1); //data sorted by category or tags
    const [selectedWeek, setSelectedWeek] = useState({}); //week
    const [selectedDay, setSelectedDay] = useState(''); //day
    const freq = [{ id: 1, name: "day" }, { id: 2, name: "week" }, { id: 3, name: "month" }, { id: 4, name: "year" }]; //tipuri de frecventa pt modal
    const [totalSpent, setTotalSpent] = useState(0);
    var [pieChartData, setPieChartData] = useState([])

    const [token, setAccessToken] = useState(null);
    const [userid, setUserid] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const navigation = useNavigation();


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

    //la fiecare useState set..() componenta care le contine se va reranda pt update.
    useEffect(() => {
        const getAccessTokenAsync = async () => {
            await getAccessToken();
        };
        getAccessTokenAsync();
    }, [])


    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const data = await getAccounts(userid);
                if(data === 'error'){
                    navigation.navigate('LogIn');
                    return;
                }
                data.push({ "name": "total" })
                setAccounts(data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchAccounts();

    }, [userid]);

    useEffect(() => {

    }, [pieChartData]);

    useEffect(() => {

        const fetchExpensesData = async (period, account_id, date, start_week, end_week, month, year, user_id) => {
            try {
                const data = await getExpensesPerCateogory(period, date, account_id, start_week, end_week, month, year, user_id);
                if(data === 'error'){
                    navigation.navigate('LogIn');
                    return;
                }

                let sum = 0;
                data.forEach((el) => sum += parseFloat(el.total)); //calculam totalul cheltuit
                setTotalSpent(sum);

                pieChartData = data.map(item => ({
                    tooltipText: `${item.category}`,
                    value: parseFloat(item.total),
                    category: item.category,
                    total: item.total,
                    percent: ((parseFloat(item.total) / sum) * 100).toFixed(2)
                }));

                setPieChartData(pieChartData.sort((a, b) => parseFloat(b.total) - parseFloat(a.total))) //sortam desc
            } catch (error) {
                console.error('Eroare la cererea GET expenses chart:', error);
            }
        };

        if (period === "today") {
            const acc = account.name === 'total' ? 'total' : account.idaccounts;
            fetchExpensesData(period, acc, date.toLocaleDateString(), '', '', '', '', userid)
        }

        if (period.name === "day" && selectedDay) {
            const acc = account.name === 'total' ? 'total' : account.idaccounts;
            fetchExpensesData(period.name, acc, selectedDay, '', '', '', '', userid);
        }

        if (period.name === "week" && selectedWeek) {
            const acc = account.name === 'total' ? 'total' : account.idaccounts;
            fetchExpensesData(period.name, acc, '', Object.keys(selectedWeek)[0], Object.keys(selectedWeek)[6], '', '', userid);
        }

        if (period.name === "month" && month) {
            const acc = account.name === 'total' ? 'total' : account.idaccounts;
            fetchExpensesData(period.name, acc, '', '', '', month.month, month.year, userid);
        }

        if (period.name === "year" && year) {
            const acc = account.name === 'total' ? 'total' : account.idaccounts;
            fetchExpensesData(period.name, acc, '', '', '', '', year.name, userid);
        }

    }, [account, selectedDay, selectedWeek, month, year, userid]);


    const closeModal = (setModalVisibile) => {
        return () => { //functie pe care o putem apela mai tarziu, nu imediat. fara return ar fi fost apelata imediat
            setModalVisibile(false);
        };
    };

    const handleAccount = (item) => {
        setAccount(item);
        setModalAccountVisible(false);
    }

    const handlePeriod = (item) => {
        setPeriod(item);
        setModalPeriodVisible(false);
    }

    const handleDay = (item) => {
        const parts = item.split("-"); // avem initial formatul 2025-05-13 si vreau 05/13/2025
        const formattedDate = `${parts[1]}/${parts[2]}/${parts[0]}`;
        setSelectedDay(formattedDate);
    }

    const handleMonth = (item) => {
        setMonth(item);
        setModalMonthCalendar(false);
    }

    const handleYear = (item) => {
        setYear(item);
        setModalYearCalendar(false);
    }

    const handleTabPress = (index) => {
        setSelectedTab(index);
    };

    const getWeekDates = (day) => { //day are forma 2025-03-07

        const selectedDay = new Date(day); //convertim in obiect date si are forma 2025-03-13T00:00:00.000Z
        const start = startOfWeek(selectedDay, { weekStartsOn: 1 }); //prima zi a saptamanii in care e selectedDay
        //o sa fie duminica dar e ok pt ca la loop adaugam +1
        let weekDays = {};

        for (let i = 0; i < 7; i++) {
            start.setDate(start.getDate() + 1); //getDate returneaza numarul zilei ex 7
            //start are forma 2025-03-23T22:00:00.000Z
            const date = start.toISOString().split("T")[0];

            weekDays[date] = { //perechi cheie-valoare
                selected: true,
                marked: true,
                selectedColor: "green",
            };
        }

        return weekDays;
    };

    const openModal = () => {
        if (period.name === 'day')
            setModalDayCalendar(true);
        if (period.name === 'week')
            setModalWeekCalendar(true);
        if (period.name === 'month')
            setModalMonthCalendar(true);
        if (period.name === 'year')
            setModalYearCalendar(true);
    }

    const handleCalendarButtonTitle = () => {
        if (period.name === 'day')
            return selectedDay;
        if (period.name === 'week' && Object.keys(selectedWeek).length == 0)
            return '';
        if (period.name === 'week')
            return Object.keys(selectedWeek)[0].slice(5) + "/" + Object.keys(selectedWeek)[6].slice(5);
        if (period.name === 'month')
            return month.name;
        if (period.name === 'year')
            return year.name;
        return date.toLocaleDateString();
    }

    //cod meniu lateral
    const [isOpen, setIsOpen] = useState(true);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <SafeAreaView style={{ flex: 1 }} >
            <StatusBar backgroundColor="white" barStyle="dark-content" />

            {/* header meniu */}
            <Header title="Charts" icon="chart-pie" toggleMenu={toggleMenu}></Header>

            <View style={styles.container}>

                {/* --------modal pentru accounts------------- */}
                <MyModal
                    visible={modalAccountVisible} onClose={closeModal(setModalAccountVisible)} title="Select the account"
                    data={accounts} keyExtractor={(item) => item.idaccounts} onItemPress={handleAccount} nrCol={2}
                />

                {/* ------------modal pentru perioada------------- */}
                <MyModal
                    visible={modalPeriodVisible} onClose={closeModal(setModalPeriodVisible)} title="Select the period"
                    data={freq} keyExtractor={(item) => item.id} onItemPress={handlePeriod}
                />

                {/* ---------------modal pentru calendar WEEK-------------- */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalWeekCalendar}>
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <Calendar
                                onDayPress={(day) => { setSelectedWeek(getWeekDates(day.dateString)) }}//atributul dateString contine formatul "2025-03-21"
                                markedDates={selectedWeek}
                            />
                            <Pressable
                                style={[styles.button, styles.buttonClose]}
                                onPress={() => setModalWeekCalendar(!modalWeekCalendar)}>
                                <Text style={styles.textStyle}>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                {/* ---------------modal pentru calendar DAY-------------- */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalDayCalendar}>
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <Calendar
                                onDayPress={(day) => { handleDay(day.dateString); setModalDayCalendar(!modalDayCalendar); }}
                                markedDates={{
                                    [selectedDay]: { selected: true, disableTouchEvent: true, selectedDotColor: 'green' }
                                }}
                            />
                            <Pressable
                                style={[styles.button, styles.buttonClose]}
                                onPress={() => setModalDayCalendar(!modalDayCalendar)}>
                                <Text style={styles.textStyle}>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                {/* ------------modal pentru calendar MONTH------------- */}
                <MyModal
                    visible={modalMonthCalendar} onClose={closeModal(setModalMonthCalendar)} title="Select the month"
                    data={months} keyExtractor={(item) => item.id} onItemPress={handleMonth} nrCol={3} desc={true}
                />

                {/* ------------modal pentru calendar YEAR------------- */}
                <MyModal
                    visible={modalYearCalendar} onClose={closeModal(setModalYearCalendar)} title="Select the year"
                    data={years} keyExtractor={(item) => item.id} onItemPress={handleYear} nrCol={3} desc={true}
                />

                <View style={styles.pieOption}>
                    <TouchableOpacity style={[styles.pieOptionsButton, { backgroundColor: selectedTab === 1 ? "white" : "#166055" }]} onPress={() => handleTabPress(1)}>
                        <Icon name="chart-line" size={18} color={selectedTab === 1 ? 'black' : 'white'} style={styles.icon} />
                        <Text style={{ color: selectedTab === 1 ? 'black' : 'white', textAlign: 'center' }}>expense tendencies</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.pieOptionsButton, { backgroundColor: selectedTab === 2 ? "white" : "#166055" }]} onPress={() => handleTabPress(2)}>
                        <Icon name="chart-pie" size={18} color={selectedTab === 2 ? 'black' : 'white'} style={styles.icon} />
                        <Text style={{ color: selectedTab === 2 ? 'black' : 'white', textAlign: 'center' }}>expenses by categories</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.pieOptionsButton, { backgroundColor: selectedTab === 3 ? "white" : "#166055" }]} onPress={() => handleTabPress(3)}>
                        <Icon name="chart-bar" size={18} color={selectedTab === 3 ? 'black' : 'white'} style={styles.icon} />
                        <Text style={{ color: selectedTab === 3 ? 'black' : 'white', textAlign: 'center' }}>budget comparisson</Text>
                    </TouchableOpacity>
                </View>

                {selectedTab === 2 ? (<>
                <View style={styles.box} >

                    <View style={styles.optionsChart}>
                        <TouchableOpacity style={styles.optionsButton} onPress={() => setModalAccountVisible(true)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="credit-card" size={20} color="white" style={styles.icon} />
                                <Icon name="chevron-down" size={12} color="white" marginStart={4} />
                            </View>
                            <Text style={styles.buttonText}>{account.name ? account.name : account}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionsButton} onPress={() => setModalPeriodVisible(true)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="clock" size={20} color="white" style={styles.icon} />
                                <Icon name="chevron-down" size={12} color="white" marginStart={4} />
                            </View>
                            <Text style={styles.buttonText}>{period.name ? period.name : period}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionsButton} onPress={() => {
                            period === 'today' && Alert.alert('Please select a period type!'); //first you must select the period type
                            openModal();
                        }
                        }>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="calendar-alt" size={20} color="white" style={styles.icon} />
                                <Icon name="chevron-down" size={12} color="white" marginStart={4} />
                            </View>
                            <Text style={styles.buttonText}>{handleCalendarButtonTitle()}</Text>
                        </TouchableOpacity>
                    </View>

                    {pieChartData.length > 0 ? (
                        <View style={{ alignItems: "center" }}>
                            <PieChart
                                data={pieChartData}
                                strokeColor='black'
                                strokeWidth={0.5}
                                focusOnPress={true}
                                showTooltip={true}
                            />
                        </View>
                    ) : (
                        <View style={{ alignItems: "center", maxHeight: 150 }}>
                            <Image source={WalletImage} style={{ width: 200, height: 200, marginBlockStart: 50 }} />
                            <Text style={{ marginTop: 10, fontSize: 16, color: "gray" }}>No expense recorded</Text>
                        </View>
                    )}

                    
                        <View style={{ maxHeight: 200 }}>
                            {totalSpent > 0 &&
                                <Text style={{ fontWeight: 'bold', fontSize: 16, flexDirection: 'row', textAlign: "center", paddingBottom: 10 }}>Total spent: {totalSpent.toFixed(2)} RON</Text>
                            }

                            <FlatList
                                data={pieChartData}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <View style={styles.boxInfo}>
                                        <Text style={[styles.boxInfoText, {fontWeight: 'bold'}]}>{item.category}</Text>
                                        <Text style={styles.boxInfoText}>{item.total} RON</Text>
                                        <Text style={styles.boxInfoText}>{item.percent}%</Text>
                                    </View>
                                )}
                                contentContainerStyle={{ padding: 20 }}
                            />

                        </View>
                </View></>) : (selectedTab === 3 ?  (<LineChartComponentBudgets/>) : (<LineChartComponent/>)) }

                <Menu></Menu>
            </View>

            {/* animatie meniu lateral */}
            <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    boxInfo: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    boxInfoText: {
        width: '38%',
        fontFamily: 'serif',
        fontSize: 14,
        textAlign: "center"
    },
    boxInfoTextCategory: {
        width: '50%',
        fontWeight: 'bold'
    },
    centeredView: {
        fontFamily: 'serif',
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    dropdownContainer: {
        marginTop: 20,
        width: '90%',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#CCE3DE',
    },
    optionsChart: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#21907F",
        paddingVertical: 10,
        borderRadius: 10,
    },
    pieOption: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#166055",
        paddingVertical: 5,
        marginBottom: 5,
    },
    pieOptionsButton: {
        flex: 1,
        alignItems: "center",
        borderRadius: 20,
        marginHorizontal: 5,
        paddingVertical: 2,
    },
    optionsButton: {
        flex: 1,
        alignItems: "center"
    },
    box: {
        width: '90%',
        marginTop: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    label: {
        fontFamily: 'serif',
        marginStart: 20,
        fontSize: 16,
        fontWeight: 'bold'
    },
    buttonText: {
        color: 'white',
        fontFamily: 'serif'
    },

    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
    },
    buttonOpen: {
        backgroundColor: '#F194FF',
    },
    buttonClose: {
        backgroundColor: '#16619a',
        paddingBottom: 10,
        marginTop: 10
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
})