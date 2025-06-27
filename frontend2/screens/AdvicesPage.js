import React from 'react';
import { API_URL } from '../variables.js';
import { useState, useEffect } from "react";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView, StatusBar, TextInput } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import AnimatedLoader from "react-native-animated-loader";

export default function AdvicesPage() {
    const [paragraphs, setParagraphs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const [targetAmount, setTargetAmount] = useState('');
    const [targetMonths, setTargetMonths] = useState('');
    const [visible, setVisible] = useState(false); //pentru loader

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleGeneratePlan = async () => {
        if (!targetAmount || !targetMonths) {
            Alert.alert("Missing fields", "Please enter both amount and duration.");
            return;
        }

        try {
            setVisible(true); // 👈 pornește loaderul

            const accessToken = await SecureStore.getItemAsync('accessToken');
            const response = await fetch(`${API_URL}/getAdvices?amount=${targetAmount}&months=${targetMonths}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });


            const text = await response.text();
            await AsyncStorage.setItem('advices', text);

            const decodedText = text.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
            const tempText = decodedText.replace(/\\n\\n/g, '||PARA||');
            const cleanedText = tempText.replace(/\\n/g, ' ').trim();
            const paragraphs = cleanedText.split('||PARA||').map(p => p.trim());
            const paragraphsWithList = paragraphs.map(p => p.replace(/\s*\*/g, '\n*').trim());
            setParagraphs(paragraphsWithList);
            setLoading(true);

        } catch (error) {
            console.error('Error generating plan:', error);
            Alert.alert("Error", "Could not generate your plan. Please try again.");
        } finally {
            setVisible(false);
        }
    };




    useEffect(() => {
        console.log("data primita ", paragraphs)
    }, [paragraphs]);

    // if (loading) {
    //     return (
    //         <View style={styles.loadingContainer}>
    //             <ActivityIndicator size="large" color="#4e9bde" />
    //         </View>
    //     );
    // }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <View style={{ flex: 1, marginBottom: 30 }}>
                <Header title="Personalised Advices" toggleMenu={toggleMenu}></Header>

                <ScrollView contentContainerStyle={styles.container}>
                    {paragraphs && paragraphs.map((para, index) => (
                        <Text key={index} style={styles.paragraph}>
                            {para}
                        </Text>
                    ))}

                    <AnimatedLoader
                        visible={visible}
                        overlayColor="rgba(255,255,255,0.75)"
                        animationStyle={styles.lottie}
                        speed={1}>
                        <Text>Creating plan...</Text>
                    </AnimatedLoader>

                    {!loading && (<View style={{ paddingHorizontal: 20, marginTop: 10, flex: 1, justifyContent: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>
                            How much would you like to save?
                        </Text>
                        <TextInput
                            keyboardType="numeric"
                            placeholder="example: 2000"
                            value={targetAmount}
                            onChangeText={setTargetAmount}
                            style={styles.inputContainer}
                        />

                        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>
                            In how many months?
                        </Text>
                        <TextInput
                            keyboardType="numeric"
                            placeholder="example: 5"
                            value={targetMonths}
                            onChangeText={setTargetMonths}
                            style={styles.inputContainer}
                        />

                        <TouchableOpacity
                            style={{
                                backgroundColor: '#007AFF',
                                padding: 12,
                                borderRadius: 8,
                                alignItems: 'center'
                            }}
                            onPress={handleGeneratePlan}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Generate Savings Plan</Text>
                        </TouchableOpacity>
                    </View>)}

                </ScrollView>

            </View>

            <Menu></Menu>

            <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
     lottie: {
    width: 100,
    height: 100,
  },
    inputContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 15
    },
    container: {
        padding: 20,
        backgroundColor: '#f9f9f9',
        flexGrow: 1,
    },
    paragraph: {
        marginBottom: 20,
        fontSize: 18,
        lineHeight: 28,
        color: '#333',
        fontWeight: '400',
        fontFamily: 'System',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
});
