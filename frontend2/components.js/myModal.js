import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, Pressable } from 'react-native';

//Modal care contine Flatlist ce afiseaza atributul nume al obiectelor
export const MyModal = ({
    visible,
    onClose,
    title,
    data,
    keyExtractor,
    onItemPress,
    nrCol,
    desc //la calendar months vreau sa le afisez descrescator
}) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>{title}</Text>

                    <FlatList
                        data={desc ? [...data].reverse() : data}
                        numColumns={nrCol}
                        keyExtractor={keyExtractor}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() =>{ onItemPress(item)}} style={[nrCol <= 3 ? styles.threeColumnsItemList : styles.normalItemList]}>
                                <Text style={{fontFamily: 'serif'}}>{item.name ? item.name : item.category}</Text>
                            </TouchableOpacity>
                        )}
                    />

                    <Pressable style={[styles.button, styles.buttonClose]} onPress={onClose} >
                        <Text style={styles.textStyle}>Close</Text>
                    </Pressable>

                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    // ------------modal---------------
    centeredView: {
        fontFamily: 'serif',
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '94%',
        maxHeight: 500,
    },
    modalTitle: {
        fontFamily: 'serif',
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    categoryItem: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    categoryText: {
        fontFamily: 'serif',
    },
    button: {
        width: '60%',
        alignSelf: 'center',
        borderColor: 'black',
        borderWidth: 1,
        borderRadius: 20,
        padding: 10,
        elevation: 5,
    },
    buttonOpen: {
        backgroundColor: '#25a18e',
    },
    buttonClose: {
        backgroundColor: '#16619a',
        paddingBottom: 10,
        marginTop: 10
    },
    textStyle: {
        fontFamily: 'serif',
        fontSize: 16,
        textAlign: "center",
        color: "white"
    },
    selectedCategory: {
        backgroundColor: '#dbf0e3',
        borderColor: '#fff',
        borderWidth: 2,
    },
    normalItemList: {
        paddingVertical: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    threeColumnsItemList: {
        flex: 1,
        paddingVertical: 20,
        justifyContent: 'space-evenly',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: 'grey',
    }
})