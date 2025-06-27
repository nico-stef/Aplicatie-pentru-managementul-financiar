import axios from 'axios';
import { API_URL } from '../variables.js';
import {  Alert  } from 'react-native';

export const login = async (username, password) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`,
            {
                username: username,
                password: password
            });
        return response.data;
    } catch (error) {
        if (error.response) { //cererea a ajuns la server, dar serverul a returnat un cod de eroare
            console.log("Login failed:", error.response.data);
            //throw new Error(error.response.data.message);
            Alert.alert('Error',error.response.data.message);
            return error
        } else { //serverul nu a raspuns
            console.log("Error:", error.message);
            return error;
        }
    }
};

export const signin = async (username, password, name, phone) => {
    try {
        const response = await axios.post(`${API_URL}/auth/register`,
            {
                username: username,
                password: password,
                name: name,
                phone: phone
            });
        return response;
    } catch (error) {
        if (error.response) {
            console.log("Sign in failed:", error.response.data);
            // throw new Error(error.response.data.message);
            Alert.alert('Error',error.response.data.message);
            return error;
        } else {
            console.log("Error:", error.message);
            // throw new Error("Eroare. Serverul nu a raspuns");
            return error;
        }
    }
};

export const logout = async (username) => {
    try {
        const response = await axios.delete(`${API_URL}/auth/logout`, {
            data: { username: username }
        });

        return response.data;
    } catch (error) {
        console.error('Eroare la logout:', error.message);
    }
};

export const getAccounts = async (accessToken) => {
    try {
        const response = await axios.get(`${API_URL}/user/getAccounts`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Eroare la cererea GET accounts:', error);
    }
};

export const deleteAccount = async (idAccount) => {
    try {
        const response = await axios.delete(`${API_URL}/user/deleteAccount/${idAccount}`);
        return response;
    } catch (error) {
        console.error('Eroare la cererea DELETE account:', error);
    }
};

export const addAccount = async (name, amount, accessToken) => {
    try {
        const response = await axios.post(`${API_URL}/user/addAccount`,
            {
                name,
                amount
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
        return response;
    } catch (error) {
        console.log('Eroare la cererea ADD account:', error);
    }
};
