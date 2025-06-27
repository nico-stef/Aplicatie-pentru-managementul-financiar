import React from 'react';
import { useEffect, useState } from "react";
import { LineChart } from "react-native-chart-kit";
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { Dimensions } from 'react-native';
import { getBudgetComparissonData } from '../APIs/chart';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";

function LineChartComponentBudgets() {

    const [expenses, setExpenses] = useState([]);
    const [amountBudgets, setAmountBudgets] = useState([]);
    const [months, setMonths] = useState([]);
    const [dataChart1, setDataChart1] = useState([]);
    const [dataChart2, setDataChart2] = useState([]);
    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState([]);

    useEffect(() => {
        const getBudgetComparissonDataAsync = async () => {
            const accessToken = await SecureStore.getItemAsync('accessToken');
            if (!accessToken) {
                navigation.navigate('LogIn');
                return;
            }

            const user = jwtDecode(accessToken);
            const res = await getBudgetComparissonData(user.userid);
            if (res === 'error') {
                navigation.navigate('LogIn');
                return;
            }
            setExpenses(res.expensesMonthly);
            setAmountBudgets(res.adjustedBudgets);
            setInsights(res.messages);
        };
        getBudgetComparissonDataAsync();
    }, []);

    useEffect(() => {
        // de pe backend pimim:
        // expenses: [
        //     { month: '2025-04', totalSpent: '234.00' },
        //     { month: '2025-05', totalSpent: '650.00' }
        // ],
        // budgets: [
        //     { month: '2025-05', total_budget: 850 },
        //     { month: '2025-04', total_budget: 300 }
        // ]

        // Set unic cu toate lunile
        const allMonthsSet = new Set([
            ...expenses.map(e => e.month),
            ...amountBudgets.map(b => b.month)
        ]);

        //convertim set in array si il sortam cronologic => va fi axa X a graficului
        const allMonths = Array.from(allMonthsSet).sort();

        if (allMonths.length === 0) {
            setLoading(false);
            return;
        }

        //generam versiuni scurte ale lunilor ex Feb
        const monthsResult = allMonths.map(item => {
            const date = new Date(item + "-01"); //din backend primim 2025-04 si construiesc o data
            return date.toLocaleDateString("en-US", { month: 'short' });
        });

        //lunile de pe axa x din grafic
        setMonths(monthsResult);

        //se creeaza un Map de forma { luna: totalSpent }
        const spentMap = Object.fromEntries(
            expenses.map(e => [e.month, parseFloat(e.totalSpent)])
        );

        //se creeaza un Map de forma { luna: totalBuget }.
        const budgetMap = Object.fromEntries(
            amountBudgets.map(b => [b.month, b.total_budget])
        );

        //se pun date in ordine in array pt fiecare luna, daca in luna respectiva nu exista inregistrari se trece 0
        const spentData = allMonths.map(month => spentMap[month] || 0);
        const budgetData = allMonths.map(month => budgetMap[month] || 0);
        setDataChart1(spentData);
        setDataChart2(budgetData);
        setLoading(false);
    }, [amountBudgets, expenses]);

    const noData = months.length === 0 || dataChart1.length === 0 || dataChart2.length === 0;

    return (
        <View style={{ marginTop: 15 }}>
            {loading ? (
                <ActivityIndicator size="large" />
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
                    {noData ? (
                        <Text style={styles.empty}>No data available to display</Text>
                    ) : (
                        <>
                            <LineChart
                                data={{
                                    labels: months,
                                    datasets: [
                                        { data: dataChart1, color: () => 'red' },
                                        { data: dataChart2, color: () => 'blue' }
                                    ],
                                    legend: ["actually spent", "budget planned"]
                                }}
                                width={Dimensions.get('window').width - 20}
                                height={220}
                                yAxisInterval={1}
                                chartConfig={{
                                    backgroundGradientFrom: "#A2D4C0",
                                    backgroundGradientTo: "#5BA199",
                                    decimalPlaces: 2,
                                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                    labelColor: () => `black`,
                                    style: { borderRadius: 16 },
                                    propsForDots: {
                                        r: "6",
                                        strokeWidth: "2",
                                        stroke: "#ffa726"
                                    }
                                }}
                                bezier
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />

                            <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18, marginTop: 16 }}>
                                Insights for the last months
                            </Text>

                            {insights.map((item, index) => (
                                <View key={index.toString()} style={styles.messageCard}>
                                    <Text style={styles.bullet}>📌</Text>
                                    <Text style={styles.messageText}>{item}</Text>
                                </View>
                            ))}
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

export default LineChartComponentBudgets

const styles = StyleSheet.create({
    messageCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#ffffff',
        padding: 12,
        marginVertical: 6,
        marginHorizontal: 2,
        borderRadius: 10,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#5BA199',
    },

    bullet: {
        fontSize: 18,
        marginRight: 8,
        marginTop: 2
    },

    messageText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        lineHeight: 22
    },

    empty: {
        textAlign: 'center',
        fontSize: 16,
        color: '#999',
        marginVertical: 20
    }
})