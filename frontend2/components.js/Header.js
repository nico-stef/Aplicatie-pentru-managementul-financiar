import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Dimensions } from "react-native";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

//this is the header at the top of the page with the page name and the hamburger icon
export default function Header({title, icon, toggleMenu}) {
    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity onPress={toggleMenu}>
                <Icon name="bars" color="white" size={24}></Icon>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.text}>{title} </Text>
                <Icon name={icon} size={22} color="white" />
            </View>
            <Text></Text>
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
    },
})