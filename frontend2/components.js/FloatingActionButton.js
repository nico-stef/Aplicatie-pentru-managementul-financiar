import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { FloatingAction } from "react-native-floating-action";

export default function FloatingActionButton() {
    const navigation = useNavigation();
    const actions = [
        {
            text: "add income",
            name: "bt_income",
            icon: <Icon name="money" size={24} color="green" />,
            color: "#CCE3DE",
            position: 1,
            textBackground: "#CCE3DE",
            textStyle: {
                fontSize: 18,
                fontFamily: 'serif',
            },
            textContainerStyle: {
                borderWidth: 1,
                borderColor: 'black',
                borderRadius: 8,
            },
            buttonSize: 45,

        },
        {
            text: "add expense",
            name: "bt_expense",
            icon: <Icon name="shopping-cart" size={24} color="#c2553e" />,
            color: "#CCE3DE",
            position: 2,
            textBackground: "#CCE3DE",
            textStyle: {
                fontSize: 18,
                fontFamily: 'serif',
            },
            textContainerStyle: {
                borderWidth: 1,
                borderColor: 'black',
                borderRadius: 8,
            },
            buttonSize: 45,
        },
        {
            text: "add budget",
            name: "bt_budget",
            icon: <Icon name="bank" size={24} color="gray" />,
            color: "#CCE3DE",
            position: 3,
            textBackground: "#CCE3DE",
            textStyle: {
                fontSize: 18,
                fontFamily: 'serif',
            },
            textContainerStyle: {
                borderWidth: 1,
                borderColor: 'black',
                borderRadius: 8,

            },
            buttonSize: 45,
        },
    ];


    return (
        <FloatingAction
            color="#21907F"
            distanceToEdge={{ vertical: 80, horizontal: 20 }}
            actions={actions}
            onPressItem={(name) => {
                if(name == "bt_expense")
                    navigation.navigate("Add expense")
                if(name == "bt_income")
                    navigation.navigate("Add income")
                if(name == "bt_budget")
                    navigation.navigate("Create budget")
            }}
        />
    );
}