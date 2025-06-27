import axios from 'axios';
import { API_URL } from '../variables.js';
import { api } from './api.js';
import {  Alert  } from 'react-native';

export const getUserData = async (username, accessToken) => {
    try {
        const response = await api.get(`${API_URL}/user/getUser`, {
            params: {
                username: username
            },
        });

        return response.data;
    } catch (error) {
        console.log('Eroare la cererea GET:', error);
        return 'error';
    }
};

export const updateUser = async (username, name, phone, accessToken) => {
    try {
            const response = await api.put(`${API_URL}/user/updateUser`,{
                    username,
                    name,
                    phone
                });
            
        return response.data;
    } catch (error) {
        if (error.response) { //cererea a ajuns la server, dar serverul a returnat un cod de eroare
            console.log("Login failed:", error.response.data);
            throw new Error(error.response.data.message);
        } else { //serverul nu a raspuns
            console.log("Error:", error.message);
            return 'error';
        }
    }
};

export const deleteUser = async (username, accessToken) => {
    try {
        const response = await axios.api(`${API_URL}/user/deleteUser`, {
            params: { username: username },
          });

        return response.data;
    } catch (error) {
        console.log('Eroare la cererea GET:', error);
        return 'error';
    }
};