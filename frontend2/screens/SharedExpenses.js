import React from 'react'
import { useState, useEffect, useCallback } from "react";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, FlatList, Image, Pressable, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import { getGroups } from '../APIs/sharedExpenses';
import { API_URL } from '../variables.js';

function SharedExpenses() {
    const navigation = useNavigation();
    const [isOpen, setIsOpen] = useState(true);
    const [groups, setGroups] = useState([]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    useFocusEffect(
        useCallback(() => {
            const fetchGroups = async () => {
                try {
                    const response = await getGroups();
                    setGroups(response.data);
                } catch (error) {
                    if (response.response && (response.response.status === 401 || response.response.status === 403)) {
                        navigation.navigate('LogIn');
                        return;
                    }
                }
            };

            fetchGroups();
        }, [])
    );

    // useEffect(() => {
    //     if (groups.length > 0) {
    //         console.log("groups: ", groups[1].imagePath);
    //     }
    // }, [groups]);


    const Record = ({ item }) => {
        return (
            <TouchableOpacity
                style={styles.cardRecord}
                onPress={() => navigation.navigate('SeeGroup', { groupId: item.id, groupName: item.name, imagePath: item.imagePath })}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        source={
                            item.imagePath
                                ? { uri: `${API_URL}/${item.imagePath}` }
                                : {uri: `${API_URL}/images/default_group.png`}
                        }
                        style={styles.groupImage}
                    />

                    <View style={styles.infoContainer}>
                        <Text style={styles.nameText}>{item.name}</Text>
                        <Text>Total members:  <Text style={{ fontWeight: 'bold' }}>{item.members_count}</Text> </Text>
                    </View>
                </View>
                <View style={styles.iconContainer}>
                    <Icon name="arrow-right" size={20} color="#555" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <View style={{ flex: 1 }}>
                <Header title="Shared Expenses" icon="users" toggleMenu={toggleMenu}></Header>

                <View style={{ flex: 1, alignItems: 'center', paddingTop: 20, backgroundColor: '#E8F5F2', }}>

                    <View style={styles.headerContainer}>
                        <Text style={styles.titleText}>Groups you belong to</Text>
                    </View>

                    <FlatList
                        data={groups}
                        renderItem={({ item }) => <Record item={item} />}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 130 }}
                    />

                    <TouchableOpacity style={styles.addGroup} onPress={() => navigation.navigate('CreateGroup')}>
                        <Text style={[styles.buttonText, { fontSize: 16, fontWeight: 'bold' }]}>+ create group</Text>
                    </TouchableOpacity>

                </View>
            </View>

            <Menu></Menu>

            <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
        </SafeAreaView>
    )
}

export default SharedExpenses

const styles = StyleSheet.create({
    addGroup: {
        height: '7%',
        width: '95%',
        backgroundColor: '#d1dff7',//"25a18e",//'#d1dff7',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        borderWidth: 1,
        borderColor: 'grey',
        marginBottom: 60,
        position: 'absolute',
        bottom: 20,
    },
    buttonText: {
        color: 'black',
        fontWeight: 'bold',
        fontFamily: 'serif',
    },
    icon: {
        color: '#007BFF',
        fontWeight: 'normal'
    },
    cardRecord: {
        alignItems: 'center',
        justifyContent: 'center',
        alignContent: 'center',
        width: '95%',
        alignSelf: 'center',
        paddingVertical: 16,
        minHeight: 70,
        backgroundColor: "#fff",
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        marginTop: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        padding: 10,
        elevation: 3,
        borderWidth: 0.5,
        borderColor: 'grey',
    },
    groupImage: {
        width: 70,
        height: 70,
        borderRadius: 40,
        marginRight: 15,
        backgroundColor: '#ccc',
    },
    nameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    headerContainer: {
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    titleText: {
        fontSize: 24,
        fontWeight: '700',
    },

});