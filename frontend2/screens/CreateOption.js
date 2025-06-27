import React from 'react'
import { useState, useEffect, useRef } from "react";
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Image, Modal, ActivityIndicator, Pressable, TextInput, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import Menu from '../components.js/Menu';
import SideMenuAnimated from '../components.js/SideMenuAnimated';
import Header from '../components.js/Header';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { addObjective } from '../APIs/spendingPlanner';
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../variables.js';

export default function CreateOption({ route }) {

  const { objectiveId } = route?.params;
  const [isOpen, setIsOpen] = useState(true);
  const navigation = useNavigation();
  const [nameObjective, setNameObjective] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);

  const [pictureOption, setPictureOption] = useState(false);

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      const photoData = await cameraRef.current.takePictureAsync();
      setPhoto(photoData.uri);
      setCameraOpen(false);
    }
  };

  const handleGalleryButton = async () => {

    setPictureOption(false);

    //alege poze din galerie
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  }

  const handleCameraButton = async () => {

    setPictureOption(false);

    // fa o poza pe loc
    const response = await requestPermission();
    if (!response.granted)
      Alert.alert("You need camera permission to take photos!")
    else {
      setCameraOpen(true);
    }
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const uploadPhoto = async () => {

    if (!nameObjective || !amount) {
      Alert.alert('Warning', "You haven't completed necessary fields!");
      return;
    }

    const data = new FormData();

    if (photo) {
      setLoading(true);
      let index = photo.indexOf("Camera");
      let noToAdd = 6; //pozele au forma Camera/... sau ImagePicker/..., si ca sa dau skip la asta o sa adun o variabila=length cuvant. 6 pt Camera
      if (index === -1) { //daca nu e poza facuta cu camera, atunci e cu imagepicker
        index = photo.indexOf("ImagePicker");
        noToAdd = 11;
      }
      let nameFinal = photo.substring(index + noToAdd + 1);
      data.append('photo', {
        uri: photo,
        type: 'image/jpeg',
        name: nameFinal
      });
    }

    data.append('name', nameObjective);
    data.append('price', amount);
    data.append('note', note);
    data.append('objectiveId', objectiveId);

    console.log(nameObjective, amount, note, objectiveId)
    const response = await fetch(`${API_URL}/planner/addOption`, {
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    } else {
      setLoading(false);
      Alert.alert('Success', "Option added successfully!");
      setNameObjective("");
      setAmount(0);
      setPhoto(null);
      setNote('')
      const json = await response.json();
      console.log(json.message);
    }


  }

  // useEffect(() => {
  //   console.log("obiectiv id: ", objectiveId)
  // }, [objectiveId]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior="height"
        style={{ flex: 1 }}

      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1 }}>
            <Header title="New option!" toggleMenu={toggleMenu}></Header>

            <View style={{backgroundColor: '#E8F5F2'}}>
              {loading && <ActivityIndicator size="large" />}
            </View>

            <View style={styles.container}>

              {/* ----------------pick the name------------------- */}
              <Text style={styles.label}>Name of your option*: </Text>
              <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setNameObjective} value={nameObjective} placeholder="type the name" />

              {/* ----------------pick the amount------------------- */}
              <Text style={styles.label}>Price*: </Text>
              <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setAmount} value={amount} placeholder="type your amount" keyboardType="numeric" />

              {/* ----------------pick the picture------------------- */}
              <Text style={styles.label}>Add a picture: </Text>
              <TouchableOpacity style={styles.pickImageContainer} onPress={() => setPictureOption(true)}>
                {photo ? <Image source={{ uri: photo }} style={styles.image} /> : <Icon name="camera" color="grey" size={40} />}
              </TouchableOpacity>

              {/* ---------------pick the note------------- */}
              <Text style={styles.label}>Note: </Text>
              <TextInput style={[styles.input, { backgroundColor: 'white' }]} onChangeText={setNote} value={note} placeholder="write a note" />

              <TouchableOpacity
                style={[styles.button, styles.buttonClose, { marginTop: 20 }]}
                onPress={uploadPhoto}
              >
                <Text style={styles.textStyle}>create option</Text>
              </TouchableOpacity>

              <Modal visible={cameraOpen} animationType="slide">
                <View style={styles.cameraContainer}>
                  <CameraView style={styles.camera} ref={cameraRef} />
                  <TouchableOpacity
                    style={styles.captureButton}
                    onPress={handleTakePicture}
                  >
                    <Text style={styles.captureButtonText}>take pic</Text>
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

          </View>

          <Menu></Menu>

          <SideMenuAnimated isOpen={isOpen}></SideMenuAnimated>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
    minHeight: 150,
    maxHeight: 200,
    height: '30%',
    width: '70%',
    alignSelf: 'center',
    borderColor: 'grey',
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10
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
  addObjective: {
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
  },
  container: {
    backgroundColor: '#E8F5F2',
    flex: 1,
    marginBottom: '10%',
    alignContent: 'center',
    justifyContent: 'center'
  },
  dropdownContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'black',
    width: '70%',
    elevation: 5,
    alignSelf: 'center',
    paddingTop: 20
  },
  selectedValueText: {
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '70%'
  },
  label: {
    fontFamily: 'serif',
    marginStart: 20,
    fontSize: 16,
    fontWeight: 'bold'
  },
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
    width: '90%',
    maxHeight: 500,
  },
  modalTitle: {
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    height: 40,
    margin: 5,
    borderWidth: 1,
    padding: 10,
    fontFamily: 'serif',
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
  },
  incomeButtonsView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  buttonIncome: {
    width: '40%',
    marginHorizontal: 20,
    paddingVertical: 2,
    borderRadius: 10,
    alignContent: 'center',
    justifyContent: 'center',

  },
  button: {
    width: '80%',
    alignSelf: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOpen: {
    backgroundColor: '#25a18e',
  },
  buttonClose: {
    backgroundColor: '#16619a',
    paddingBottom: 10
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
  categoryItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
})