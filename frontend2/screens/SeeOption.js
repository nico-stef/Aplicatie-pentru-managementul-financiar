import React from 'react'
import { useState, useEffect } from "react";
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Image, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { API_URL } from '../variables.js';
import { getOption, deleteOption } from '../APIs/spendingPlanner';
import ModalImage from '../components.js/ModalImage.js';

export default function SeeOption({ route }) {

    const { optionId, objectiveId } = route?.params;
    const [isOpen, setIsOpen] = useState(true);
    const navigation = useNavigation();
    const [nameOption, setNameOption] = useState('');
    const [amount, setAmount] = useState('');
    const [photo, setPhoto] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [option, setOption] = useState(null);
    const [isModalVisibleImage, setModalVisibleImage] = useState(false);

    //get accessToken/userid
    useEffect(() => {
        const getOptionAsync = async () => {
            const result = await getOption(optionId);
            if(result === 'error'){
                navigation.navigate('LogIn');
                return;
            }
            setOption(result[0]);
            setNameOption(result[0].name_option);
            setAmount(result[0].price);
            setPhoto(result[0].imagePath);
            setNote(result[0].note);
        };
        getOptionAsync();
    }, [optionId]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const confirmDelete = () =>
        Alert.alert("", 'Are you sure you want to delete?', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            { text: 'YES', onPress: handleDeleteOption },
        ]);

    const handleDeleteOption = async () => {
        const response = await deleteOption(optionId);
        if(response === 'error'){
            navigation.navigate('LogIn');
            return;
        }
        Alert.alert("", "Option deleted successfully!");
        navigation.replace('OptionsPage', { objectiveId });
    }

    // useEffect(() => {
    //     console.log("option get: ", `http://192.168.0.103:3000/${photo.replace(/\\/g, '/')}`)
    // }, [photo]);

    const toggleModal = () => {
        setModalVisibleImage(!isModalVisibleImage);
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior="height"
                style={{ flex: 1 }}

            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ flex: 1 }}>
                        <Header title="View Option" toggleMenu={toggleMenu}></Header>

                        <View style={{ backgroundColor: '#E8F5F2' }}>
                            {loading && <ActivityIndicator size="large" />}
                        </View>

                        <View style={styles.container}>

                            {/* ----------------name------------------- */}
                            <View style={styles.noteBox}>
                                <Text style={styles.noteLabel}>Name:</Text>
                                <Text style={styles.noteText}>
                                    {nameOption}
                                </Text>
                            </View>

                            {/* ----------------amount------------------- */}
                            <View style={styles.noteBox}>
                                <Text style={styles.noteLabel}>Price:</Text>
                                <Text style={styles.noteText}>
                                    {amount}
                                </Text>
                            </View>
                            {/* ----------------picture------------------- */}
                            {photo && <><Text style={styles.label}>Image</Text>
                            <TouchableOpacity style={styles.pickImageContainer} onPress={toggleModal}>
                                {photo ? (
                                    <>
                                        {loading && (
                                            <ActivityIndicator size="small" color="gray" style={{ position: 'absolute' }} />
                                        )}
                                        <Image
                                            source={{ uri: `${API_URL}/${photo.replace(/\\/g, '/')}` }}
                                            style={styles.image}
                                            onLoadStart={() => setLoading(true)}
                                            onLoadEnd={() => setLoading(false)}
                                        />
                                    </>
                                ) : (
                                    <Icon name="camera" color="grey" size={40} />
                                )}
                            </TouchableOpacity></>}

                            {/* ---------------note------------- */}
                            <View style={styles.noteBox}>
                                <Text style={styles.noteLabel}>Note:</Text>
                                <Text style={styles.noteText}>
                                    {note ? note : "-"}
                                </Text>
                            </View>

                            <TouchableOpacity style={{ flexDirection: 'column', alignItems: 'center', marginTop: 15, marginBottom: 25 }} onPress={confirmDelete}>
                                <Icon name="trash" size={30} style={[styles.icon, { color: 'red', marginBottom: 5 }]} />
                                <Text style={{ fontSize: 14, fontWeight: '500', }}>delete</Text>
                            </TouchableOpacity>

                            {/* ------------modal imagine----------- */}
                            <ModalImage
                                isModalVisibleImage={isModalVisibleImage}
                                setModalVisibleImage={setModalVisibleImage}
                                onClose={toggleModal}
                                uriImage={photo ? `${API_URL}/${photo.replace(/\\/g, '/')}` : ''}
                            />

                        </View>

                    </View>

                    <Menu></Menu>

                    <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    largeImage: {
        width: '95%',
        height: '80%',
        resizeMode: 'contain',
        borderRadius: 10,
    },


    noteBox: {
        backgroundColor: 'white',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 5,
        paddingHorizontal: 15,
        marginVertical: 8,
        width: '90%',
        alignSelf: 'center',
        minHeight: 50,
    },
    noteLabel: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    noteText: {
        fontSize: 16,
        fontFamily: 'serif',
    },
    pickImageContainer: {
        minHeight: 150,
        maxHeight: 250,
        height: '50%',
        width: '70%',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain'
    },
    container: {
        backgroundColor: '#E8F5F2',
        flex: 1,
        marginBottom: '10%',
        alignContent: 'center',
        justifyContent: 'center'
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
    input: {
        minHeight: 40,
        margin: 5,
        borderWidth: 1,
        padding: 10,
        fontFamily: 'serif',
        borderRadius: 10,
        width: '90%',
        alignSelf: 'center',
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
})