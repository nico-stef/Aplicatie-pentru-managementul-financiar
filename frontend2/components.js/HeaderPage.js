import React from 'react';
import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, SafeAreaView, StatusBar } from 'react-native';
import { Dimensions, useAnimatedValue } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome5';

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

//this is the header at the top of the page with the page name and the hamburger icon
export default function HeaderPage() {
    const [isOpen, setIsOpen] = useState(false);
    const translateX = useAnimatedValue(-screenWidth * 0.7); //initial ascuns

    const toggleMenu = () => {
        Animated.timing(translateX, { // creeaza o animatie de tip timing, adica o tranzitie fluida într-un anumit timp
            // translateX este valoarea animată care se va modifica
            toValue: isOpen ? -screenWidth * 0.7 : 0, //daca e deschis il ascundem
            duration: 400, //timpul miscarii pe axa X
            useNativeDriver: true,
        }).start();
        setIsOpen(!isOpen); // Inversăm starea
    };

    return (
        <View  style={{flex: 1}}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={toggleMenu}>
                    <Icon style={styles.icon} name="bars" color="white" size={24}></Icon>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.text}>Home Page </Text>
                    <Icon name="chart-pie" size={24} color="white" />
                </View>
                <Text></Text>
            </View>

            
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    paddingTop: 60,
                    paddingHorizontal: 20,
                    backgroundColor: 'rgba(14, 78, 20, 0.3)',
                    width: screenWidth * 0.65, // 70% din lățimea ecranului
                    height: '100%',
                    marginTop: screenHeight * 0.07,
                    transform: [{ translateX }], //permite mutarea pe axa X
                    zIndex: 10000, 
                }}
                
            >
                <Text style={{ color: 'white', fontSize: 20, marginBottom: 20 }}>Meniu</Text>

                <TouchableOpacity onPress={toggleMenu}>
                    <Text style={{ color: 'white', fontSize: 18 }}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleMenu} style={{ marginTop: 20 }}>
                    <Text style={{ color: 'white', fontSize: 18 }}>Settings</Text>
                </TouchableOpacity>

            </Animated.View>
            

        </View>

    )
}

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: '#166055',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: screenHeight * 0.07,
    },
    text: {
        color: "white",
        fontSize: 24
    }
})