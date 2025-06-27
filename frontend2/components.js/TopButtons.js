import React from 'react';
import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';

export default function TopButtons({setValue}) {
    const [selectedTab, setSelectedTab] = useState(1);
    const navigation = useNavigation();

    const handleTabPress = (index) => {
        setSelectedTab(index);
        setValue(index);
    };

    return (
        <View style={styles.pieOption}>
            <TouchableOpacity style={[styles.pieOptionsButton, { backgroundColor: selectedTab === 1 ? "white" : "#166055" }]} onPress={() => handleTabPress(1)}>
                <Icon name="wallet" size={18} color={selectedTab === 1 ? 'black' : 'white'} style={styles.icon} />
                <Text style={{ color: selectedTab === 1 ? 'black' : 'white' }}>expenses</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.pieOptionsButton, { backgroundColor: selectedTab === 2 ? "white" : "#166055" }]} onPress={() => handleTabPress(2)}>
                <Icon name="hand-holding-usd" size={18} color={selectedTab === 2 ? 'black' : 'white'} style={styles.icon} />
                <Text style={{ color: selectedTab === 2 ? 'black' : 'white' }}>earnings</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
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
})