import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';

// this is the menu displayed at the bottom of the page
export default function Menu() {
    const navigation = useNavigation();
    
    return (
        <View style={styles.bottomMenu}>
            <TouchableOpacity style={styles.buttonMenu} onPress={() => navigation.navigate("Home")}>
                <Icon name="home" size={20} color="white" style={styles.icon} />
                <Text style={styles.buttonText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonMenu} onPress={() => navigation.navigate("Charts")}>
                <Icon name="chart-pie" size={20} color="white" style={styles.icon} />
                <Text style={styles.buttonText}>Charts</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonMenu} onPress={() => navigation.navigate("Profile")}>
                <Icon name="user" size={20} color="white" style={styles.icon} />
                <Text style={styles.buttonText}>Profile</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    bottomMenu: {
        zIndex: 10,
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#166055",
        paddingVertical: 10,
        position: "absolute", // fixeaza meniul
        bottom: 0,
    },
    buttonMenu: {
        flex: 1,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 16,
    },
    
})
