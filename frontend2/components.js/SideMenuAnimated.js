import React from 'react';
import { useEffect } from "react";
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, Animated, SafeAreaView, StatusBar } from 'react-native';
import { Dimensions, useAnimatedValue } from "react-native";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

//this is the side menu that appears from left side
export default function SideMenuAnimated({isOpen}) {
    const translateX = useAnimatedValue(!isOpen ? 0 : -screenWidth * 0.7); //initial ascuns
    const navigation = useNavigation();

    useEffect(() =>{
        Animated.timing(translateX, { // creeaza o animatie de tip timing, adica o tranzitie fluida într-un anumit timp
                                      // translateX este valoarea animată care se va modifica
            toValue: isOpen ? -screenWidth * 0.7 : 0, //daca e deschis il ascundem
            duration: 400, //timpul miscarii pe axa X
            useNativeDriver: true,
        }).start();
    }, [isOpen])

    return (
        <Animated.View
            style={{
                position: 'absolute',
                paddingBottom: 40,
                backgroundColor: 'white', //'rgba(14, 78, 20, 0.82)',
                borderColor: 'black',
                borderRightWidth: 2,
                width: screenWidth * 0.7, // 70% din lățimea ecranului
                height: '85%',
                marginTop: screenHeight * 0.07,
                transform: [{ translateX }], //permite mutarea pe axa X
            }}

        >
            <View style={{ paddingTop: 100, backgroundColor: '#EAF4F4', borderRadius: 10, alignItems: 'center', marginBottom: 30 }}>
                <Text style={{ color: 'black', fontSize: 26, fontFamily: 'serif' }}>Menu</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
                <TouchableOpacity >
                    <Text style={{ color: 'black', fontSize: 20, fontFamily: 'serif' }} onPress={() => navigation.navigate("Home")}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate("Charts")}>
                    <Text style={{ color: 'black', fontSize: 20, fontFamily: 'serif' }}>Charts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate("BudgetPage")}>
                    <Text style={{ color: 'black', fontSize: 20, fontFamily: 'serif' }}>Budget</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate("FinancialRecords")}>
                    <Text style={{ color: 'black', fontSize: 20, fontFamily: 'serif' }}>Transactions</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate("SpendingPlanner")}>
                    <Text style={{ color: 'black', fontSize: 20, fontFamily: 'serif' }}>Spending Planner</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate("SharedExpenses")}>
                    <Text style={{ color: 'black', fontSize: 20, fontFamily: 'serif' }}>Shared Expenses</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate("UploadTransactions")}>
                    <Text style={{ color: 'black', fontSize: 20, fontFamily: 'serif' }}>Import Transactions</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate("AdvicePage")}>
                    <Text style={{ color: 'black', fontSize: 20, fontFamily: 'serif' }}>Generate savings plan</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate("Profile")}>
                    <Text style={{ color: 'black', fontSize: 20, fontFamily: 'serif' }}>Profile</Text>
                </TouchableOpacity>
            </View>

        </Animated.View>
    )
}
