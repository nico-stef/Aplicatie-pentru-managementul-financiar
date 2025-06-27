import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
 
export default function CreateOption() {
  const [hasPermission, setHasPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef(null);
 
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);
 
  const handleTakePicture = async () => {
    if (cameraRef.current) {
      const photoData = await cameraRef.current.takePictureAsync();
      setPhoto(photoData.uri);
      setCameraOpen(false);
    }
  };
 
 
  if (hasPermission === false)
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>
          Accesul la cameră a fost refuzat.
        </Text>
      </View>
    );
 
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setCameraOpen(true)}
      >
        <Text style={styles.buttonText}>Deschide Camera</Text>
      </TouchableOpacity>
 
      {photo && <Image source={{ uri: photo }} style={styles.image} />}
 
      <Modal visible={cameraOpen} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} ref={cameraRef} />
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleTakePicture}
          >
            <Text style={styles.captureButtonText}>Fă Poză</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  image: {
    width: 300,
    height: 400,
    resizeMode: "cover",
    borderRadius: 15,
    marginTop: 20,
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
});