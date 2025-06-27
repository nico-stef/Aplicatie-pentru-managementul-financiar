import axios from 'axios';
import { API_URL } from '../variables.js';
import { api } from './api.js';
import {  Alert  } from 'react-native';

export const getExpensesRecords = async (account_id, userid, category_id, budget_id) => {
    try {
        const response = await api.get(`${API_URL}/records/expenses`, {
            params: {
                account_id,
                userid,
                category_id,
                budget_id
            }
        });
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea GET expense records:', error);
        return 'error';
    }
};

export const getIncomesRecords = async (account_id, userid) => {
    try {
        const response = await api.get(`${API_URL}/records/incomes`, {
            params: {
                account_id,
                userid
            }
        });
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea GET incomes records:', error);
        return 'error';
    }
};

export const updateExpense = async (record) => {
    try {
        const idexpense = record.idexpenses;

        const localDate = new Date(record.date);
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const finalDate = `${year}-${month}-${day}`;

        const response = await api.patch(`${API_URL}/records/expenses/update/${idexpense}`, {
            category: record.category,
            amount: record.amount,
            date: finalDate,
            note: record.note,
            budget_id: record.budget_id
        });
        return response;
    } catch (error) {
        if (error.response?.status === 500) {
            Alert.alert('Warning', error.response.data.message || 'Not enough funds.');
            console.log('Eroare la cererea add expense:', error.response.status);
        } else {
            return 'error';
        }
    }
};

export const deleteExpense = async (record) => {
    try {
        const idexpense = record.idexpenses;
        const response = await api.delete(`${API_URL}/records/expenses/delete/${idexpense}`);
        return response.data.message;
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            Alert.alert('Session expired', 'Please log in again.');
            navigation.reset({
                index: 0,
                routes: [{ name: 'LogIn' }],
            });
        }
        console.log('Eroare la cererea PATCH update expense:', error);
        return 'error';
    }
};

export const updateIncome = async (record) => {
    try {
        const idincome = record.idincomes;
        console.log("Data trimisa", record.date)

        const localDate = new Date(record.date);
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const finalDate = `${year}-${month}-${day}`;

        const response = await api.patch(`${API_URL}/records/incomes/update/${idincome}`, {
            amount: record.amount,
            date: finalDate,
            note: record.note
        });
        return response.data.message;
    } catch (error) {
        console.log('Eroare la cererea PATCH update income:', error);
        return 'error';
    }
};

export const deleteIncome = async (record) => {
    try {
        const idincome = record.idincomes;
        const response = await api.delete(`${API_URL}/records/incomes/delete/${idincome}`);
        return response.data.message;
    } catch (error) {
        console.log('Eroare la cererea DELETE income:', error);
        return 'error';
    }
};