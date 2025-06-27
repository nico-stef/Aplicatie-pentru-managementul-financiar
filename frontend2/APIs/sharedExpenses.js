import axios from 'axios';
import { API_URL } from '../variables.js';
import { api } from './api.js';
import {  Alert  } from 'react-native';

export const getGroups = async () => {
    try {
        const response = await api.get(`${API_URL}/getGroups`);
        return response;
    } catch (error) {
        console.log('Eroare la cererea GET group:', error);
        return error;
    }
};

export const getMembers = async (groupId) => {
    try {
        const response = await api.get(`${API_URL}/getMembers/${groupId}`);
        return response;
    } catch (error) {
        console.log('Eroare la cererea GET members:', error);
        return error;
    }
};

export const getSharedExpenses = async (groupId) => {
    try {
        const response = await api.get(`${API_URL}/getSharedExpenses/${groupId}`);
        return response;
    } catch (error) {
        console.log('Eroare la cererea GET shared expenses:', error);
        if (response.response && (response.response.status === 401 || response.response.status === 403)) {
            navigation.navigate('LogIn');
            return;
        }
        return error;
    }
};

export const getGroupInfo = async (groupId) => {
    try {
        const response = await api.get(`${API_URL}/getGroupInfo/${groupId}`);
        return response;
    } catch (error) {
        console.log('Eroare la cererea GET group info:', error);
        return error;
    }
};

export const getDetailsExpense = async (idExpense) => {
    try {
        const response = await api.get(`${API_URL}/getDetailsExpense/${idExpense}`);
        return response;
    } catch (error) {
        console.log('Eroare la cererea GET details expense:', error);
        return error;
    }
};


export const getImagesExpense = async (idExpense) => {
    try {
        const response = await api.get(`${API_URL}/getImagesExpense/${idExpense}`);
        return response;
    } catch (error) {
        console.log('Eroare la cererea GET images expense:', error);
        return error;
    }
};

export const deleteSharedExpense = async (idExpense) => {
    try {
        const response = await api.delete(`${API_URL}/deleteSharedExpense/${idExpense}`);
        return response;
    } catch (error) {
        console.log('Eroare la cererea DELETE expense shared:', error);
        return error;
    }
};

export const addMember = async (groupId, name) => {
    try {
        const response = await api.post(`${API_URL}/addMember`,
            {
                groupId,
                name
            }
        );
        return response;
    } catch (error) {
        return error;
    }
};

export const leaveGroup = async (groupId) => {
    try {
        const response = await api.post(`${API_URL}/leaveGroup/${groupId}`);
        return response;
    } catch (error) {
        return error;
    }
};

export const addSharedExpense = async (groupId, name, amount, paidBy, note, splitType, split, reminder_date, has_reminder) => {
    try {
        const response = await api.post(`${API_URL}/addSharedExpense`,
            {
                groupId,
                name,
                amount,
                paidBy,
                note,
                splitType,
                split,
                reminder_date,
                has_reminder
            }
        );
        return response;
    } catch (error) {
        console.log(error.response.data.message);
        return error;
    }
};

export const deleteGroup = async (groupId) => {
    try {
        const response = await api.delete(`${API_URL}/deleteGroup/${groupId}`);
        return response;
    } catch (error) {
        console.log('Eroare la cererea delete group:', error);
        return error;
    }
};