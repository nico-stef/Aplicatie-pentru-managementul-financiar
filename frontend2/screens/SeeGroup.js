import React from 'react'
import { useState, useEffect } from "react";
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Image, TextInput, Modal, Alert, Pressable, FlatList, ScrollView } from 'react-native';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { API_URL } from '../variables.js';
import { addMember, getSharedExpenses, getGroupInfo, leaveGroup, deleteGroup } from '../APIs/sharedExpenses.js';
import { jwtDecode } from "jwt-decode";
import * as SecureStore from 'expo-secure-store';

export default function SeeGroup({ route }) {
    const { groupId, groupName, imagePath } = route?.params;
    const [isOpen, setIsOpen] = useState(true);
    const [modalNewMember, setmodalNewMember] = useState(false);
    const [value, setValue] = useState(true);
    const [sharedExpenses, setSharedExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [userid, setUserid] = useState(null);
    const [showInfoView, setShowInfoView] = useState(false);
    const [groupInfo, setGroupInfo] = useState(null);
    const [userIdMaxOwed, setUserIdMaxOwed] = useState(null);
    const [userIdMinOwed, setUserIdMinOwed] = useState(null);
    const navigation = useNavigation();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };


      useEffect(() => {
            console.log("groups: ", groupId, groupName, imagePath );
        }, [groupId, groupName, imagePath ]);

    useFocusEffect(
        useCallback(() => {
            const fetchSharedExpenses = async () => {
                try {
                    const accessToken = await SecureStore.getItemAsync('accessToken');
                    const user = jwtDecode(accessToken);
                    setUserid(user.userid);
                    const response = await getSharedExpenses(groupId);
                    if (response && response.data) {
                        setSharedExpenses(response.data);
                    }
                } catch (error) {
                    console.log('Could not get shared expenses:', error);
                } finally {
                    setIsLoading(true);
                }
            };

            fetchSharedExpenses();
        }, [groupId])
    );

    const handleAddMember = async () => {

        const response = await addMember(groupId, value);
        if (response.response && response.response.status === 500) {
            Alert.alert("", response.response.data.message);
            return;
        }
        if (response.response && (response.response.status === 401 || response.response.status === 403)) {
            navigation.navigate('LogIn');
            return;
        }
        Alert.alert("", "Member added successfully!")
    };

    useEffect(() => {
        const fetchGroupInfo = async (groupId) => {
            const response = await getGroupInfo(groupId);
            setGroupInfo(response.data);

            //gasim valoarea maxima datorie. pt ca pot mai multi useri sa aibe aceeasi valoare datorata
            const maxOwed = Math.max(...groupInfo.map(user => parseFloat(user.total_owed)));
            //filtram userii cu datoria asta
            const usersWithMaxOwed = groupInfo.filter(
                user => parseFloat(user.total_owed) === maxOwed
            );
            //daca e doar un user cu o datorie mare, il salvam ca sa ii punem titlu
            const userWithUniqueMaxOwed = usersWithMaxOwed.length === 1 ? usersWithMaxOwed[0] : null;

            //la fel si la minim
            //la minim nu luam in considerare 0 ca valoare minima pt ca cei cu debts 0 vor avea alt mesaj. si nu luam in considerare nici pe cei
            //care nu mai sunt in grup
            const nonZeroOwedUsers = groupInfo.filter(
                user => parseFloat(user.total_owed) > 0 && !user.left_at
            );

            const minOwed = Math.min(...nonZeroOwedUsers.map(user => parseFloat(user.total_owed)));

            const usersWithMinOwed = nonZeroOwedUsers.filter(
                user => parseFloat(user.total_owed) === minOwed
            );

            const userWithUniqueMinOwed = usersWithMinOwed.length === 1 ? usersWithMinOwed[0] : null;


            setUserIdMaxOwed(userWithUniqueMaxOwed.user_id);
            setUserIdMinOwed(userWithUniqueMinOwed.user_id);
        }
        if (showInfoView) {
            fetchGroupInfo(groupId);
        }

    }, [showInfoView, groupInfo]);

    // useEffect(() => {
    //     console.log(userIdMinOwed, userIdMaxOwed, "a");
    // }, [userIdMinOwed]);

    const Record = ({ item, navigation }) => {
        const isPaidByCurrentUser = item.userId_paid_by == userid;
        return (
            <TouchableOpacity
                style={styles.stickyNote}
                onPress={() => navigation.navigate('ExpenseDetails', { expenseId: item.id,  groupId: groupId, groupName: groupName, imagePath: item.imagePath  })}
            >
                <View style={styles.noteHeader}>
                    <Text style={styles.noteTitle}>{item.expense_name}</Text>
                    <Text style={styles.noteAmount}>{item.amount} RON</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text>Status: {item.is_paid ? 'Paid ' : 'Not paid '}</Text>
                        {item.is_paid
                            ? <Icon name="check-circle" size={18} color="green" />
                            : <Icon name="times-circle" size={18} color="red" />}
                    </View>
                </View>

                <View style={styles.noteBody}>
                    <Text style={styles.noteLine}>
                        <Text style={styles.noteLabel}>Paid by: </Text>{item.name}
                    </Text>
                    <Text style={styles.noteLine}>
                        <Text style={styles.noteLabel}>Date: {new Date(item.created_at).toLocaleDateString("en-GB", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })
                        }</Text>
                    </Text>
                    <Text style={styles.noteLine}>
                        <Text style={styles.noteLabel}>Split: </Text>{item.split_type}
                    </Text>
                    {item.note && <Text style={styles.noteLine}>
                        <Text style={styles.noteLabel}>Note: </Text>{item.note || '-'}
                    </Text>}
                </View>
            </TouchableOpacity>
        );
    };

    const confirmLeaveGroup = () => {
        Alert.alert(
            "Leave Group",
            "Are you sure you want to leave this group?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Yes, Leave",
                    onPress: () => handleLeaveGroup()
                }
            ]
        );
    };

    const confirmDeleteGroup = () => {
        Alert.alert(
            "Delete Group",
            "Are you sure you want to delete this group?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Yes, Delete",
                    onPress: () => handleDeleteGroup()
                }
            ]
        );
    };

    const handleLeaveGroup = async () => {
        if (groupId) {
            try {
                const response = await leaveGroup(groupId);
                if (response.status === 200) {
                    Alert.alert("Success", "Successful leaving group!");
                    navigation.navigate('SharedExpenses');
                }
            } catch (error) {
                console.log("Eroare:", error.message);
                Alert.alert("Warning", "Error at leaving group!");
            }
        }
    };

    const handleDeleteGroup = async () => {
        if (groupId) {
            try {
                const response = await deleteGroup(groupId);
                if (response.status === 200) {
                    Alert.alert("Success", "Successful deleting group!");
                    navigation.navigate('SharedExpenses');
                }
            } catch (error) {
                console.log("Eroare:", error.message);
                Alert.alert("Warning", "Error at deleting group!");
            }
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <View style={{ flex: 1 }}>
                <Header title="Your grup" icon="users" toggleMenu={toggleMenu}></Header>

                <View style={{ flex: 1, alignItems: 'center', paddingTop: 20, backgroundColor: '#E8F5F2', }}>

                    {isLoading && (
                        <>
                            <Image
                                source={
                                    imagePath
                                        ? { uri: `${API_URL}/${imagePath}` }
                                        : { uri: `${API_URL}/images/default_group.png` }
                                }
                                style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 5 }}
                            />

                            <View style={styles.headerContainer}>
                                <Text style={styles.titleText}>{groupName}</Text>
                            </View>
                        </>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10, width: '90%' }}>
                        <TouchableOpacity onPress={() => setmodalNewMember(true)} style={[styles.button, { flexBasis: '30%' }]}>
                            <Text style={styles.buttonText}>add new member</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('AddSharedExpense', { groupId })} style={[styles.button, { flexBasis: '30%' }]}>
                            <Text style={styles.buttonText}>create expense</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowInfoView(!showInfoView)} style={[styles.button, { justifyContent: 'center', alignItems: 'center', flexBasis: '15%', backgroundColor: showInfoView ? '#0dcaf0' : '#bee9f9' }]}>
                            <Icon name="info-circle" size={24} color="#555" />
                        </TouchableOpacity>
                    </View>


                    {showInfoView ? (
                        <View style={{ flex: 1, width: '100%', paddingHorizontal: 25 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center', color: '#333' }}>
                                Group Members
                            </Text>
                            <FlatList
                                data={groupInfo}
                                keyExtractor={(item) => item.user_id.toString()}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 70 }}
                                renderItem={({ item }) => (
                                    <View
                                        style={{
                                            padding: 16,
                                            marginBottom: 12,
                                            borderRadius: 12,
                                            backgroundColor: '#ffffff',
                                            elevation: 3,
                                        }}
                                    >
                                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{item.name}</Text>
                                        {item.left_at && (
                                            <Text style={{ fontSize: 16, color: '#999', fontStyle: 'italic' }}>
                                                User has left the group
                                            </Text>
                                        )}
                                        {item.user_id == userIdMaxOwed && item.user_id != userIdMinOwed && (
                                            <View
                                                style={{
                                                    alignSelf: 'flex-start',
                                                    backgroundColor: '#ffe5e0',
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 4,
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <Text style={{ color: '#d32f2f', fontSize: 12, fontWeight: '600' }}>
                                                    💸 Highest Debt
                                                </Text>
                                            </View>
                                        )}

                                        {item.user_id == userIdMinOwed && item.user_id != userIdMaxOwed && (
                                            <View
                                                style={{
                                                    alignSelf: 'flex-start',
                                                    backgroundColor: '#e0f7e9',
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 4,
                                                    borderRadius: 8,
                                                    marginBottom: 6,
                                                }}
                                            >
                                                <Text style={{ color: '#2e7d32', fontSize: 12, fontWeight: '600' }}>
                                                    🟢 Lowest Debt
                                                </Text>
                                            </View>
                                        )}

                                        {item.total_owed == 0 && (
                                            <View
                                                style={{
                                                    alignSelf: 'flex-start',
                                                    backgroundColor: '#e0f7e9',
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 4,
                                                    borderRadius: 8,
                                                    marginBottom: 6,
                                                }}
                                            >
                                                <Text style={{ color: '#388e3c', fontSize: 12, fontWeight: '600' }}>
                                                    ✅ No Debt
                                                </Text>
                                            </View>
                                        )}

                                        <Text style={{ color: '#4CAF50' }}>Paid: {parseFloat(item.total_paid).toFixed(2)} RON</Text>
                                        <Text style={{ color: '#F44336' }}>Owes: {parseFloat(item.total_owed).toFixed(2)} RON</Text>
                                        <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                                            Phone number: {item.phone}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                                            Joined:{' '}
                                            {new Date(item.joined_at).toLocaleDateString("en-GB", {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </Text>
                                    </View>
                                )}
                                ListFooterComponent={
                                    groupInfo && (
                                        <>
                                            <TouchableOpacity
                                                onPress={confirmLeaveGroup}
                                                style={{
                                                    marginTop: 10,
                                                    backgroundColor: '#ff5252',
                                                    paddingVertical: 8,
                                                    borderRadius: 8,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Leave Group</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={confirmDeleteGroup}
                                                style={{
                                                    marginTop: 10,
                                                    backgroundColor: '#e53935',
                                                    paddingVertical: 8,
                                                    borderRadius: 8,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete Group</Text>
                                            </TouchableOpacity>
                                        </>
                                    )
                                }
                            />
                        </View>
                    ) : (
                        <FlatList
                            data={sharedExpenses}
                            numColumns={2}
                            renderItem={({ item }) => <Record item={item} navigation={navigation}/>}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ paddingBottom: 130, marginTop: 5 }}
                            columnWrapperStyle={{ justifyContent: 'space-between', gap: 16 }}
                            ListEmptyComponent={
                                <View style={{ flex: 1, alignItems: 'center', marginTop: 80 }}>
                                    <Text style={{ fontSize: 16, color: '#888', textAlign: 'center', paddingHorizontal: 20 }}>
                                        No shared expenses found. Start by adding a new one!
                                    </Text>
                                </View>
                            }

                        />
                    )}



                </View>

                {/* --------modal pentru add new member------------- */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalNewMember}
                    onRequestClose={() => {
                        setmodalNewMember(!modalNewMember);
                    }}>
                    <View style={styles.centeredView}>
                        <View style={styles.modal}>
                            <Text style={styles.modalTitle}>Add new member</Text>

                            <View style={styles.rowModal}>
                                <Text style={styles.label}>Name:</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Search username or email..."
                                    value={value}
                                    onChangeText={setValue}
                                    autoCapitalize="none"
                                    returnKeyType="search"
                                />
                            </View>

                            <View style={styles.buttons}>
                                <TouchableOpacity style={[styles.button, styles.update]} onPress={handleAddMember}>
                                    <Text style={styles.buttonText}>Add</Text>
                                </TouchableOpacity>
                            </View>

                            <Pressable
                                style={[styles.buttonClose]}
                                onPress={() => setmodalNewMember(!modalNewMember)}>
                                <Text style={styles.textStyle}>close</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

            </View>

            <Menu></Menu>

            <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    addGroup: {
        height: '7%',
        width: '95%',
        backgroundColor: '#d1dff7',//"25a18e",//'#d1dff7',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        borderWidth: 1,
        borderColor: 'grey',
        marginBottom: 60,
        position: 'absolute',
        bottom: 20,
    },
    buttonText: {
        color: 'black',
        fontWeight: 'bold',
        fontFamily: 'serif',
        textAlign: 'center',
        fontSize: 14
    },
    icon: {
        color: '#007BFF',
        fontWeight: 'normal'
    },
    titleText: {
        fontSize: 24,
        fontWeight: '700',
    },

    centeredView: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'center',
    },
    label: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    modal: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    buttons: {
        // flexDirection: 'row',
        // justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 20,

    },
    update: {
        backgroundColor: '#4CAF50',
    },
    delete: {
        backgroundColor: '#f44336',
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        backgroundColor: '#FF9E80',
        // flexBasis: '30%' //30% din dimensiunea parinte
    },
    buttonClose: {
        alignItems: 'center',
    },
    stickyNote: {
        backgroundColor: '#F0F4F8',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        flex: 1,
        flexBasis: '47%',
        elevation: 4,
    },

    noteHeader: {
        borderBottomWidth: 1,
        borderBottomColor: '#D1D5DB',
        marginBottom: 8,
        paddingBottom: 4,
    },

    noteTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },

    noteAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#047857',
        marginTop: 2,
    },

    noteLine: {
        fontSize: 13,
        color: '#3F3F46',
        marginBottom: 2,
    },

    noteLabel: {
        fontWeight: '600',
        color: '#27272A',
    },
});