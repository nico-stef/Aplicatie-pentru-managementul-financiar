import React from 'react';
import { useEffect, useState } from "react";
import { LineChart } from "react-native-chart-kit";
import { View, ActivityIndicator, FlatList, Text, StyleSheet, ScrollView } from 'react-native';
import { Dimensions } from 'react-native';
import { getExpenseTendencies } from '../APIs/chart';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";

export default function LineChartComponent() {

  const [dataExpenses, setDataExpenses] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState([]);
  const [isDataAvailable, setIsDataAvailable] = useState(false);

  //luam datele de afisat in chart
  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = await SecureStore.getItemAsync('accessToken');
        if (!accessToken) {
          navigation.navigate('LogIn');
          return;
        }

        const user = jwtDecode(accessToken);
        const res = await getExpenseTendencies(user.userid);
        console.log(res);

        if (res === 'error') {
          navigation.navigate('LogIn');
          return;
        }

        setDataExpenses(res.result);
        setInsights(res.messages);
      } catch (error) {
        console.error("Error loading data:", error);
        navigation.navigate('LogIn');
      }
    };

    fetchData(); // apelăm funcția definită mai sus
  }, []);


  //cand avem datele de pe backend, le formatam pt a le putea afisa in chart
  useEffect(() => {
    setLoading(true);

    if (dataExpenses && dataExpenses.length > 0) {
      const newData = {
        labels: dataExpenses.map(item => {
          const date = new Date(item.month + "-01");
          return date.toLocaleDateString("en-US", { month: 'short' });
        }),
        datasets: [
          {
            data: dataExpenses.map(item => parseFloat(item.total)),
            color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
            strokeWidth: 3,
          }
        ]
      };
      setChartData(newData);
      setIsDataAvailable(true);
    } else {
      setChartData(null);
      setIsDataAvailable(false);
    }
    setLoading(false);


  }, [dataExpenses]);



  return (
    <View style={{ marginTop: 15 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 30 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          {isDataAvailable && (
            <LineChart
              data={chartData}
              width={Dimensions.get('window').width - 20}
              height={250}
              chartConfig={{
                backgroundGradientFrom: "#A2D4C0",
                backgroundGradientTo: "#5BA199",
                decimalPlaces: 2,
                color: () => `rgba(134, 65, 244, 0.2)`,
                labelColor: () => `black`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: "6",
                  strokeWidth: "0.5",
                  stroke: "black"
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          )}

          <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18, marginTop: 16 }}>
            Insights for the last months
          </Text>

          {insights && insights.length > 0 && (
            insights.map((item, index) => (
              <View key={index} style={styles.messageCard}>
                <Text style={styles.bullet}>📌</Text>
                <Text style={styles.messageText}>{item}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );

}

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
});