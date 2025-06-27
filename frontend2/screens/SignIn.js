import * as React from 'react';
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { signin } from '../APIs/auth';
import { Alert } from 'react-native';
import { useEffect, } from "react";

export default function SignInScreen() {

    const navigation = useNavigation();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    // reguli validare parola
    const [isLongEnough, setIsLongEnough] = useState(false);
    const [hasUpperCase, setHasUpperCase] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);
    const [hasSpecialChar, setHasSpecialChar] = useState(false);

    useEffect(() => {
        setIsLongEnough(password.length >= 8);
        setHasUpperCase(/[A-Z]/.test(password));
        setHasNumber(/[0-9]/.test(password));
        setHasSpecialChar(/[!@#$%^&*(),.?":{}|<>]/.test(password));
    }, [password]);


    const handleSignIn = async () => {
        try {
            if (!username || !password || !name || !phone) {
                Alert.alert('Warning', 'All fields must be filled!');
                return;
            }
            const isLongEnough = password.length >= 8;
            const hasUpperCase = /[A-Z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

            const isValidPassword = isLongEnough && hasUpperCase && hasNumber && hasSpecialChar;

            if (!isValidPassword) {
                Alert.alert('Warning', 'Password does not meet the security requirements.');
                return;
            }
            const response = await signin(username, password, name, phone);
            if (response && (response.status === 200 || response.status === 201)) {
                Alert.alert('Success', 'Account created succesfully!');
                navigation.navigate('LogIn');
            }
        } catch (err) {
            console.error("Sign in error:", err.message);
        }
    }

    return (
        <View style={styles.container}>

            <Text style={styles.title}>Sign Up</Text>

            <View style={styles.inputContainer}>
                <Icon name="user-circle" size={20} color="#333" style={styles.icon} />
                <TextInput placeholder="username" style={styles.input} onChangeText={setUsername} value={username} />
            </View>

            <View style={styles.inputContainer}>
                <Icon name="user" size={20} color="#333" style={styles.icon} />
                <TextInput placeholder="name" style={styles.input} onChangeText={setName} value={name} />
            </View>

            <View style={styles.inputContainer}>
                <Icon name="phone" size={20} color="#333" style={styles.icon} />
                <TextInput placeholder="phone" keyboardType="numeric" style={styles.input} onChangeText={setPhone} value={phone} />
            </View>

            <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#333" style={styles.icon} />
                <TextInput placeholder="password" onChangeText={setPassword} value={password} secureTextEntry style={styles.input} />
            </View>

            {/* checklist pentru validarea parolei  */}
            <View style={styles.checklist}>
                <Text>
                    <Icon name={isLongEnough ? "check" : "times"} size={14} color={isLongEnough ? "green" : "red"} />
                    {" "} minimum 8 characters
                </Text>
                <Text >
                    <Icon name={hasUpperCase ? "check" : "times"} size={14} color={hasUpperCase ? "green" : "red"} />
                    {" "} minimum 1 capital letter
                </Text>
                <Text >
                    <Icon name={hasNumber ? "check" : "times"} size={14} color={hasNumber ? "green" : "red"} />
                    {" "} minimum 1 number
                </Text>
                <Text>
                    <Icon name={hasSpecialChar ? "check" : "times"} size={14} color={hasSpecialChar ? "green" : "red"} />
                    {" "} minimum 1 special character
                </Text>
            </View>


            <TouchableOpacity style={styles.loginButton} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('LogIn')}>
                <Text style={styles.signInText}> Already have an account? LogIn </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        marginBottom: 40,
        fontSize: 30,
        fontFamily: 'serif',
        fontWeight: 'bold'
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#CCE3DE',
    },
    image: {
        width: '55%',
        height: 200,
    },
    checklist: {
        marginLeft: '-15%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        padding: 10,
        marginBottom: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    input: {
        width: '100%',
        marginLeft: 15,
        fontSize: 15,
    },
    loginButton: {
        width: '90%',
        padding: 15,
        backgroundColor: '#25a18e',
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 20,
    },
    googleButton: {
        width: '90%',
        padding: 15,
        backgroundColor: '#db4437',
        borderRadius: 20,
        alignItems: 'center',
        flexDirection: 'row',//icon si text sa fie pe acelasi rand
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    icon: {
        marginLeft: 10,
        marginRight: 10,
    },
    signInText: {
        marginTop: 20,
        color: '#007bff'
    }
});