import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogInScreen, SignInScreen, ProfileScreen, HomeScreen, SeeProfile, EditProfile, OptionsPage, SeeOption, SeeAccounts, CreateAccount, UploadTransactions } from './screens';
import { AddExpense, AddIncome, ManageBudgets, Charts, FinancialRecords, BudgetPage, SpendingPlanner, CreateObjective, CreateOption, AdvicesPage } from './screens';
import { SharedExpenses, CreateGroup, SeeGroup, AddSharedExpense, ExpenseDetails} from './screens';
import HeaderPage from './components.js/HeaderPage'

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="SharedExpenses" component={SharedExpenses} options={{ headerShown: false }} />
        <Stack.Screen name="AddSharedExpense" component={AddSharedExpense} options={{ headerShown: false }} />
        <Stack.Screen name="ExpenseDetails" component={ExpenseDetails} options={{ headerShown: false }} />
        <Stack.Screen name="CreateGroup" component={CreateGroup} options={{ headerShown: false }} />
        <Stack.Screen name="SeeGroup" component={SeeGroup} options={{ headerShown: false }} />
        <Stack.Screen name="LogIn" component={LogInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdvicePage" component={AdvicesPage} options={{ headerShown: false }} />
        <Stack.Screen name="BudgetPage" component={BudgetPage} options={{ headerShown: false }} />
        <Stack.Screen name="UploadTransactions" component={UploadTransactions} options={{ headerShown: false }} />

        <Stack.Screen name="Add expense" component={AddExpense} options={{ headerShown: false }} />
        <Stack.Screen name="Add income" component={AddIncome} options={{ headerShown: false }} />
        <Stack.Screen name="Charts" component={Charts} options={{ headerShown: false }} />
        <Stack.Screen name="SpendingPlanner" component={SpendingPlanner} options={{ headerShown: false }} />
        <Stack.Screen name="OptionsPage" component={OptionsPage} options={{ headerShown: false }} />
        <Stack.Screen name="SeeOption" component={SeeOption} options={{ headerShown: false }} />
        <Stack.Screen name="CreateOption" component={CreateOption} options={{ headerShown: false }} />

        <Stack.Screen name="Edit Profile" component={EditProfile} options={{ headerShown: false }} />
        <Stack.Screen name="SeeAccounts" component={SeeAccounts} options={{ headerShown: false }} />
        <Stack.Screen name="CreateAccount" component={CreateAccount} options={{ headerShown: false }} />

        <Stack.Screen name="CreateObjective" component={CreateObjective} options={{ headerShown: false }} />

        
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FinancialRecords" component={FinancialRecords} options={{ headerShown: false }} />
        <Stack.Screen name="HeaderPage" component={HeaderPage} options={{ headerShown: false }} />

        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />

        <Stack.Screen name="User Data" component={SeeProfile} />




        <Stack.Screen name="Create budget" component={ManageBudgets} options={{ headerShown: false }} />

      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App