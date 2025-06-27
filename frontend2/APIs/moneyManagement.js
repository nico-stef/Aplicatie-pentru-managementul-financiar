import axios from 'axios';
import { API_URL } from '../variables.js';
import { api } from './api.js';
import {  Alert  } from 'react-native';

export const getCategories = async () => {
    try {
        const response = await api.get(`${API_URL}/getCategories`);
        // console.log(response.data)
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea GET categories:', error);
        return 'error';
    }
};

export const getAccounts = async (userId) => {
    try {
        const response = await api.get(`${API_URL}/getAccounts/${userId}`);
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea GET accounts:', error);
        return 'error';
    }
};

export const addExpense = async (userId, tags, amount, date, categoryId, AccountId, note, budget_id) => {
    try {
        const response = await api.post(`${API_URL}/addExpense`,
            {
                id_user: userId,
                amount,
                date,
                note,
                category_id: categoryId,
                account_id: AccountId,
                tags,
                budget_id
            });
        console.log(response)
        return response;
    } catch (error) {
        if (error.response?.status === 400) {
            Alert.alert('Warning', error.response.data || 'Not enough funds.');
            console.log('Eroare la cererea add expense:', error);
            return;
        }
        return 'error';
    }
};

export const addIncome = async (userId, amount, date, accountId, note) => {
    try {
        const response = await api.post(`${API_URL}/addIncome`,
            {
                id_user: userId,
                amount,
                date,
                note,
                account_id: accountId,
            });
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea ADD income:', error);
        return 'error';
    }
};

export const addBudget = async (id_user, name, amount, date, freq, note) => {
    try {
        const response = await api.post(`${API_URL}/addBudget`,
            {
                id_user, name, amount, date, freq, note
            });
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea ADD budget:', error);
        return 'error';
    }
};

export const getBudgets = async (userId) => {
    try {
        const response = await api.get(`${API_URL}/getBudgetsOptions/${userId}`);
        // const budgetNames = response.data.map(item => item.name)
        const options = response.data.map(item => ({
            label: item.name,    // Valoarea va fi folosită atât pentru 'label' cât și pentru 'value'
            value: item.name,    // Poți schimba acest lucru dacă vrei un alt tip de 'value'
            name: item.name,
            idBudget: item.idbudgets
        }));
        return options; //un array cu obiecte bugete
    } catch (error) {
        console.log('Eroare la cererea GET tags:', error);
        return 'error';
    }
};

export const getBudgetsAll = async (userId, currentMonth, currentYear) => {
    try {
        const response = await api.get(`/getBudgets/${userId}?month=${currentMonth}&year=${currentYear}`);

        return response.data;
    } catch (error) {
        console.log('Eroare la cererea GET budgets:', error);
        return 'error';
    }
};

export const deleteBudget= async (budgetId) => {
    try {
        const response = await api.delete(`${API_URL}/deleteBudget/${budgetId}`);
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea DELETE budget:', error);
        return 'error';
    }
};

export const updateBudget= async (name, amount, budgetId) => {
    try {
        const response = await api.patch(`${API_URL}/updateBudget/${budgetId}`,
            {
                name,
                amount
            }
        );
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea UPDATE budget:', error);
        return 'error';
    }
};

export const getDetailsBalance = async () => {
    try {
      const response = await api.get('/getDetailsBalance');
      return response.data;
    } catch (error) {
      console.log('Eroare la getDetailsBalance:', error);
      return 'error';
    }
  };

export const stopBudget = async (budgetId) => {
    try {
        const response = await api.put(`${API_URL}/stopBudget/${budgetId}`);
        return response;
    } catch (error) {
        console.log('Eroare la cererea PUT stop budget:', error);
        return 'error';
    }
};