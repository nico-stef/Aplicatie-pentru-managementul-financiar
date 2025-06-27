import axios from 'axios';
import { API_URL } from '../variables.js';
import { api } from './api.js';
import {  Alert  } from 'react-native';

export const addObjective = async (name, amount, date, accountId, budgetId, note, userId, categoryId) => {
    try {
        const dateFormated = date ? date.toISOString().split('T')[0] : null;
        const response = await api.post(`${API_URL}/planner/addObjective`,
            {
                name,
                amount,
                due_date: dateFormated,
                accountId,
                budgetId,
                note,
                userId,
                categoryId
            });
        return response.status;
    } catch (error) {
        console.log('Eroare la cererea ADD objective:', error);
        return 'error';
    }
};

export const getObjectives = async (accessToken) => {
    try {
        const response = await api.get(`${API_URL}/planner/getObjectives`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea GET objectives:', error);
        return 'error';
    }
};

export const getOptions = async (objectiveId) => {
    try {
        const response = await api.get(`${API_URL}/planner/getOptions`, {
            params: {
                objectiveId
            }
        });
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea GET options:', error);
        return 'error';
    }
};

export const getOption = async (optionId) => {
    try {
        const response = await api.get(`${API_URL}/planner/getOption`, {
            params: {
                optionId
            }
        });
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea GET option:', error);
        return 'error';
    }
};

export const getObjective = async (objectiveId) => {
    try {
        const response = await api.get(`${API_URL}/planner/getObjective`, {
            params: {
                objectiveId
            }
        });
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea GET option:', error);
        return 'error';
    }
};

export const deleteObjective = async (objectiveId) => {
    try {
        const response = await api.delete(`${API_URL}/planner/deleteObjective/${objectiveId}`);
        console.log("delete id objective", objectiveId)
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea DELETE objective:', error);
        return 'error';
    }
};

export const deleteOption = async (optionId) => {
    try {
        const response = await api.delete(`${API_URL}/planner/deleteOption/${optionId}`);
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea DELETE option:', error);
        return 'error';
    }
};

export const updateOption = async (optionId, chosen) => {
    try {
        const response = await api.patch(`${API_URL}/planner/updateOption/${optionId}`,
            {
                chosen
            }
        );
        return response.data;
    } catch (error) {
        console.log('Eroare la cererea DELETE option:', error);
        return error;
    }
};