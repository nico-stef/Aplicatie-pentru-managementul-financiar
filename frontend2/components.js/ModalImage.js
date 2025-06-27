import React from 'react'
import { View, Text, TouchableOpacity, Image, Modal, StyleSheet } from 'react-native';

export default function ModalImage({
    isModalVisibleImage,
    setModalVisibleImage,
    onClose,
    uriImage
}) {

   

    return (
        <Modal
            visible={isModalVisibleImage}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={{ color: 'white', fontSize: 20 }}>X</Text>
                </TouchableOpacity>
                <Image
                    source={{ uri: uriImage }}
                    style={styles.largeImage}
                />
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    largeImage: {
        width: '95%',
        height: '80%',
        resizeMode: 'contain',
        borderRadius: 10,
    },
})