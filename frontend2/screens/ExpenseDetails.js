import React from 'react'
import { useState, useEffect, useRef } from "react";
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, FlatList, Image, Modal, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import { getDetailsExpense, getImagesExpense, deleteSharedExpense } from '../APIs/sharedExpenses';
import { API_URL } from '../variables.js';
import { useRoute } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import Checkbox from 'expo-checkbox';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

function ExpenseDetails() {
    const navigation = useNavigation();
    const [isOpen, setIsOpen] = useState(true);
    const route = useRoute();
    const { expenseId, groupId, groupName, imagePath } = route?.params || {};
    const [detailsExpense, setDetailsExpense] = useState(null);
    const [imagesExpense, setImagesExpense] = useState(null);
    const [documentsExpense, setDocumentsExpense] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [cameraOpen, setCameraOpen] = useState(false);
    const cameraRef = useRef(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [userid, setUserid] = useState(null);
    const [checkedUser, setCheckedUser] = useState(false);
    const [documents, setDocuments] = useState([]);

    //getuserid
    const getAccessToken = async () => {
        try {
            const accessToken = await SecureStore.getItemAsync('accessToken');

            const user = jwtDecode(accessToken);
            setUserid(user.userid);

        } catch (error) {
            console.log("Eroare la recuperarea token-ului:", error);
        }
    };

    const updateIsPaid = async (expense_id, is_paid) => {
        try {
            const token = await SecureStore.getItemAsync('accessToken');
            const response = await axios.patch(`${API_URL}/updatePaid/${expense_id}`, {
                is_paid: is_paid ? 1 : 0,
            },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

            console.log('is_paid updated:', response.data);
        } catch (error) {
            console.error('Eroare la actualizarea is_paid:', error.response?.data || error.message);
        }
    };

    useEffect(() => {
        const getAccessTokenAsync = async () => {
            await getAccessToken();
        };
        getAccessTokenAsync();
    }, [])



    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    //functie de incarcat documente
    const pickDocumentHandler = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                multiple: true
            });

            if (!result.canceled) {
                setDocuments(prev => [...prev, ...result.assets]);
            }
        } catch (err) {
            console.error("Error picking document", err);
        }
    };


    const uploadDocumentsHandler = async () => {
        const formData = new FormData();
        formData.append('expenseId', expenseId);

        documents.forEach((doc) => {
            const decodedUri = decodeURIComponent(doc.uri);
            formData.append('photos', {
                uri: decodedUri,
                name: doc.name,
                type: doc.mimeType,
            });
        });

        try {
            const token = await SecureStore.getItemAsync('accessToken');
            const response = await fetch(`${API_URL}/uploadAttachments`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': 'Bearer ' + token,
                },
            });

            if (!response.ok) {
                Alert.alert("Error", `Upload failed with status ${response.status}`);
            } else {
                fetchImagesExpenses();
                setDocuments([]);
                Alert.alert("Success", "Documents uploaded successfully!");
            }
        } catch (err) {
            Alert.alert("Error", "An error occurred while uploading documents.");
            console.log(err);
        }
    };


    const downloadDocument = async (fileUrl) => {
        try {
            let name = fileUrl.split('/').pop()?.replace(/\.\.+/g, '.') || 'document.pdf';//inclocuieste aparitia a mai multe puncte cu 1 singur punct
            const localFilePath = FileSystem.documentDirectory + name;

            const result = await FileSystem.downloadAsync(fileUrl, localFilePath);
            console.log(result)

            await saveFile(result.uri, name, result.headers["Content-Type"]);
        } catch (e) {
            alert('Eroare la descarcarea fisierului.');
        }
    };

    const saveFile = async (uri, filename, mimetype) => { //calea locala, numele, tipul
        if (Platform.OS === 'android') {
            //permisiune de acces la un director
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

            if (permissions.granted) {
                try {
                    //converteste continutul fisierului local in string base64
                    //base64 transforma date binare(fisierele) in sir de caractere text
                    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

                    //se creeaza fisierul in directorul ales
                    const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
                        permissions.directoryUri,
                        filename,
                        mimetype
                    );

                    await FileSystem.writeAsStringAsync(destUri, base64, { encoding: FileSystem.EncodingType.Base64 });

                    alert('File saved succesffuly.');
                } catch (e) {
                    alert('Nu s-a putut salva fișierul.');
                }
            } else {
                alert('You denied permission');
            }
        } else {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                alert('Partajarea nu este disponibilă.');
            }
        }
    };



    //functii pentru imagini
    const [pictureOption, setPictureOption] = useState(false);

    const handleTakePicture = async () => {
        if (cameraRef.current) {
            const photoData = await cameraRef.current.takePictureAsync();
            setPhotos(prev => [...prev, photoData.uri]);
            setCameraOpen(false);
        }
    };

    const handleGalleryButton = async () => {
        setPictureOption(false);

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            const selectedPhotos = result.assets.map(asset => asset.uri);
            setPhotos(prev => [...prev, ...selectedPhotos]);
        }
    }


    const handleCameraButton = async () => {

        setPictureOption(false);

        // fa o poza pe loc
        const response = await requestPermission();
        if (!response.granted)
            Alert.alert("You need give your permission for the camera to take photos!")
        else {
            setCameraOpen(true);
        }
    }

    const uploadPhotosHandler = async () => {

        const formData = new FormData();
        formData.append('expenseId', expenseId);

        photos.forEach((uri) => {
            const decodedUri = decodeURIComponent(uri);
            const fileName = decodedUri.split('/').pop();
            //denumirea e ceva gen:["file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540nikos6%252Ffrontend2/ImagePicker/24452e1b-1677-471e-99d7-7454af55ea8f.jpeg", 
            //si splituiesc la fiecare / si iau ultimul
            const mimeType = 'image/jpeg';

            formData.append('photos', {
                uri,       // lasăm URI-ul original (encoded) aici
                name: fileName,
                type: mimeType,
            });
        });

        try {
            const token = await SecureStore.getItemAsync('accessToken');
            const response = await fetch(`${API_URL}/uploadAttachments`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': 'Bearer ' + token,
                },
            });

            if (!response.ok) {
                Alert.alert("Error", `Upload failed with status ${response.status}`);
            } else {
                fetchImagesExpenses();
                setPhotos([]);
                Alert.alert("Success", "Photos uploaded successfully!");
            }
        } catch (err) {
            Alert.alert("Error", "An error occurred while uploading photos.");
            console.log(err);
        }
    };


    useEffect(() => {
        console.log('Poze curente:', imagesExpense);
    }, [imagesExpense]);

    const fetchImagesExpenses = async () => {
        try {
            const response = await getImagesExpense(expenseId);

            if (response.response && (response.response.status === 401 || response.response.status === 403)) {
                navigation.navigate('LogIn');
                return;
            }
            if (response.response && response.response.status === 409) {
                Alert.alert("Warning", response.response.data.message);
                return;
            }
            const filteredImages = response.data.filter(item => item.file_type === "image/jpeg");
            setImagesExpense(filteredImages);
            const filteredDocumets = response.data.filter(item => item.file_type !== "image/jpeg");
            setDocumentsExpense(filteredDocumets);

        } catch (error) {
            console.log('Could not get details expense:', error);
        }
    };

    useEffect(() => {
        const fetchSharedExpenses = async () => {
            try {
                const response = await getDetailsExpense(expenseId);

                if (response.response && (response.response.status === 401 || response.response.status === 403)) {
                    navigation.navigate('LogIn');
                    return;
                }
                if (response.response && response.response.status === 409) {
                    Alert.alert("Warning", response.response.data.message);
                    return;
                }
                setDetailsExpense(response.data);

            } catch (error) {
                console.log('Could not get details expense:', error);
            }
        };

        fetchSharedExpenses();
        fetchImagesExpenses();
    }, [expenseId]);

    const handleDeleteExpense = async () => {
        try {
            const response = await deleteSharedExpense(expenseId);

            if (response.response && (response.response.status === 401 || response.response.status === 403)) {
                navigation.navigate('LogIn');
                return;
            }
            if (response.response && response.response.status === 409) {
                Alert.alert("Warning", response.response.data.message);
                return;
            }
            Alert.alert("", "Expense deleted succesfully");
            navigation.navigate('SeeGroup', { groupId: groupId, groupName: groupName, imagePath: imagePath });
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        console.log("groups: ", groupId);

    }, [groupId]);

    useEffect(() => {
        if (detailsExpense && detailsExpense.split) {
            const currentUser = detailsExpense.split.find(item => item.user_id == userid);
            if (currentUser) {
                setCheckedUser(currentUser.is_paid == 1);
            }
        }
    }, [detailsExpense, userid]);

    if (!detailsExpense) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text>Loading expense details...</Text>
            </SafeAreaView>
        );
    }

    // 🟢 Acum e sigur
    const { expense, split } = detailsExpense;

    const toggleChecked = () => {
        const newValue = !checkedUser;
        setCheckedUser(newValue);
        updateIsPaid(expenseId, newValue);
    };



    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar backgroundColor="white" barStyle="dark-content" />
            <View style={{ flex: 1 }}>
                <Header title="Your grup" icon="users" toggleMenu={toggleMenu} />
                <FlatList
                    data={split}
                    keyExtractor={(item) => item.user_id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.splitItem}>
                            <Text style={styles.userName}>{item.user_name}</Text>
                            <Text style={styles.owedAmount}>
                                Owes: {parseFloat(item.owed_amount).toFixed(2)} RON
                            </Text>
                            {item.is_paid ? (
                                <Icon name="check-circle" size={20} color="green" />
                            ) : (
                                <Icon name="times-circle" size={20} color="red" />
                            )}
                            {item.user_id === userid && (
                                <Checkbox
                                    value={checkedUser}
                                    onValueChange={toggleChecked}
                                />
                            )}
                        </View>
                    )}
                    ListHeaderComponent={
                        <>
                            <View style={styles.expenseCard}>
                                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteExpense}>
                                    <Icon name="trash" size={24} color="#E53935" />
                                </TouchableOpacity>

                                <Text style={styles.expenseTitle}>{expense.expense_name}</Text>
                                <Text style={styles.amount}>
                                    Total: {parseFloat(expense.amount).toFixed(2)} RON
                                </Text>
                                <Text style={styles.paidBy}>
                                    Paid by: <Text style={styles.bold}>{expense.paid_by_name}</Text>
                                </Text>
                                <Text style={styles.splitType}>Split type: {expense.split_type}</Text>
                                {expense.note ? <Text style={styles.note}>Note: {expense.note}</Text> : null}
                                {expense.reminder_date ? <Text style={styles.splitType}>Date limit: {" "}
                                    {new Date(expense.reminder_date).toLocaleDateString("en-GB", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </Text> : null}
                                <Text style={styles.date}>
                                    Date created:{" "}
                                    {new Date(expense.created_at).toLocaleDateString("en-GB", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </Text>
                            </View>

                            <Text style={styles.sectionTitle}>Split Details</Text>
                        </>
                    }
                    ListFooterComponent={
                        <>
                            {imagesExpense && imagesExpense.length > 0 && (
                                <View style={{ marginTop: 20 }}>
                                    <Text style={styles.sectionTitle}>Uploaded Images</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        {imagesExpense.map((photo, index) => (
                                            <TouchableOpacity
                                                key={photo.id}
                                                onPress={() => {
                                                    setSelectedPhoto(photo);
                                                    setModalVisible(true);
                                                }}
                                            >
                                                <Image
                                                    source={{ uri: `${API_URL}/${photo.file_url.replace(/\\/g, '/')}` }}
                                                    style={styles.imageThumb}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {documentsExpense && documentsExpense.length > 0 && (
                                <View style={{ marginTop: 30, paddingHorizontal: 10 }}>
                                    <Text style={styles.sectionTitle}>Uploaded Documents</Text>
                                    {documentsExpense.map((doc) => (
                                        <TouchableOpacity
                                            key={doc.id}
                                            style={{
                                                paddingVertical: 10,
                                                borderBottomWidth: 1,
                                                borderColor: '#ccc',
                                            }}
                                            onPress={() => downloadDocument(`${API_URL}/${doc.file_url.replace(/\\/g, '/')}`)}
                                        >
                                            <Text style={{ fontSize: 16, color: '#007AFF' }}>{doc.name}</Text>
                                            <Text style={{ fontSize: 12, color: '#555' }}>{doc.file_type}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* incarcarea de poza */}
                            <TouchableOpacity
                                style={styles.pickImageContainer}
                                onPress={() => setPictureOption(true)}
                            >
                                {photos.length > 0 ? (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        {photos.map((uri, index) => (
                                            <Image key={index} source={{ uri }} style={styles.imageThumb} />
                                        ))}
                                    </View>
                                ) : (
                                    <Icon name="camera" color="grey" size={40} />
                                )}

                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose]}
                                onPress={uploadPhotosHandler}
                            >
                                <Text style={styles.textStyle}>add pictures</Text>
                            </TouchableOpacity>

                            {/* incarcarea de document */}
                            <TouchableOpacity
                                style={styles.pickImageContainer}
                                onPress={pickDocumentHandler}
                            >
                                {documents.length > 0 ? (
                                    <View style={{ marginVertical: 10 }}>
                                        <Text style={styles.sectionTitle}>Selected Documents:</Text>
                                        {documents.map((doc, index) => (
                                            <Text key={index} style={{ color: '#555' }}>{doc.name}</Text>
                                        ))}
                                    </View>
                                ) : (
                                    <Icon name="file-alt" color="grey" size={40} />
                                )}
                            </TouchableOpacity>


                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose, { marginTop: 10 }]}
                                onPress={uploadDocumentsHandler}
                            >
                                <Text style={styles.textStyle}>upload documents</Text>
                            </TouchableOpacity>

                        </>
                    }
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                />

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 20,
                    }}>
                        <TouchableOpacity
                            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={{ fontSize: 30, color: 'white' }}>×</Text>
                        </TouchableOpacity>

                        {selectedPhoto && (
                            <>
                                <Image
                                    source={{ uri: `${API_URL}/${selectedPhoto.file_url.replace(/\\/g, '/')}` }}
                                    style={{ width: '100%', height: '70%', borderRadius: 10, marginBottom: 20 }}
                                    resizeMode="contain"
                                />
                                <Text style={{ color: 'white', fontSize: 16, marginBottom: 8 }}>
                                    Uploaded by: {selectedPhoto.name}
                                </Text>
                                <Text style={{ color: 'white', fontSize: 16 }}>
                                    Uploaded at: {new Date(selectedPhoto.uploaded_at).toLocaleDateString("en-GB", {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </Text>
                            </>
                        )}
                    </View>
                </Modal>

                <Modal visible={cameraOpen} animationType="slide">
                    <View style={styles.cameraContainer}>
                        <CameraView style={styles.camera} ref={cameraRef} />
                        <TouchableOpacity
                            style={styles.captureButton}
                            onPress={handleTakePicture}
                        >
                            <Text style={styles.captureButtonText}>take picture</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>

                <Modal visible={pictureOption} animationType="slide" transparent={true}>
                    <View style={styles.modalContainer}>

                        <View style={styles.modalCameraOptions}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Select the source</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-around', flex: 1, width: '100%', borderRadius: 50, }}>

                                <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center' }} onPress={handleGalleryButton}>
                                    <Icon name="images" color="black" size={40} />
                                    <Text>gallery</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center' }} onPress={handleCameraButton}>
                                    <Icon name="camera-retro" color="black" size={40} />
                                    <Text>live photo</Text>
                                </TouchableOpacity>

                            </View>
                            <TouchableOpacity onPress={() => setPictureOption(false)}>
                                <Text>close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>

            <Menu />
            <SideMenuAnimated isOpen={isOpen} />
        </SafeAreaView>
    );
}


export default ExpenseDetails

const styles = StyleSheet.create({
    imageThumb: {
        width: 80,
        height: 80,
        margin: 5,
        borderRadius: 8,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#F9FAFB",
    },
    expenseCard: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        elevation: 3,
    },
    deleteButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        padding: 4,
    },

    expenseTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#333",
    },
    amount: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 8,
        color: "#2E7D32",
    },
    paidBy: {
        fontSize: 16,
        marginBottom: 4,
        color: "#555",
    },
    bold: {
        fontWeight: "bold",
    },
    splitType: {
        fontSize: 16,
        marginBottom: 4,
        color: "#555",
    },
    note: {
        fontSize: 16,
        fontStyle: "italic",
        marginBottom: 4,
        color: "#777",
    },
    date: {
        fontSize: 14,
        color: "#999",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 12,
        color: "#444",
    },
    splitItem: {
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: "center",
        justifyContent: "space-between",
        elevation: 2,
    },
    userName: {
        fontSize: 16,
        color: "#222",
    },
    owedAmount: {
        fontSize: 16,
        color: "#D32F2F",
        marginRight: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalCameraOptions: {
        width: '80%',
        height: '25%',
        padding: 10,
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 50,
        elevation: 5
    },
    pickImageContainer: {
        width: '100%',
        borderColor: 'grey',
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
        padding: 10,
        borderRadius: 10,
    },

    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain'
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: "#000",
    },
    camera: {
        flex: 1,
    },
    captureButton: {
        position: "absolute",
        bottom: 40,
        alignSelf: "center",
        backgroundColor: "#fff",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 30,
    },
    captureButtonText: {
        fontSize: 16,
        color: "#000",
        fontWeight: "bold",
    },
    //button add pictures
    button: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 3,
        backgroundColor: '#4CAF50', // verde plăcut
        alignItems: 'center',
    },

    buttonClose: {
        backgroundColor: '#4CAF50',
    },

    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});