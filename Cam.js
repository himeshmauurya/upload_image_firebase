import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
  PermissionsAndroid,
  Alert,
  FlatList,
  ActivityIndicator
} from 'react-native';

import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';

const Cam = () => {
  const [filePath, setFilePath] = useState({});
  const [url1, seturl1] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [mydata,setmydata]=useState(true)
  const [alldata,setalldata]=useState(true)
  useEffect(() => {
   
    setalldata(true)
    const fetchImages = async () => {
      const storageRef = storage().ref();
      const imagesRef = storageRef.child('images'); 
      const imageList = await imagesRef.listAll();
     
      const urls = await Promise.all(
        imageList.items.map(async imageRef => {
          const url = await imageRef.getDownloadURL();
          return url;
        }),
      );
      setImageUrls(urls);
      setalldata(false)
    };

    fetchImages();
  }, [mydata]);
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else return true;
  };

  const requestExternalWritePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'External Storage Write Permission',
            message: 'App needs write permission',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        alert('Write permission err', err);
      }
      return false;
    } else return true;
  };

  const captureImage = async type => {
    let options = {
      mediaType: type,
      maxWidth: 300,
      maxHeight: 550,
      quality: 1,
      videoQuality: 'low',
      durationLimit: 30, //Video max duration in seconds
      saveToPhotos: true,
    };
    let isCameraPermitted = await requestCameraPermission();
    let isStoragePermitted = await requestExternalWritePermission();
    if (isCameraPermitted && isStoragePermitted) {
      launchCamera(options, response => {

        if (response.didCancel) {
          alert('User cancelled camera picker');
          return;
        } else if (response.errorCode == 'camera_unavailable') {
          alert('Camera not available on device');
          return;
        } else if (response.errorCode == 'permission') {
          alert('Permission not satisfied');
          return;
        } else if (response.errorCode == 'others') {
          alert(response.errorMessage);
          return;
        }
        setFilePath(response);
        seturl1(response.assets[0].uri);
      });
    }
  };

  const chooseFile = type => {
    let options = {
      mediaType: type,
      maxWidth: 300,
      maxHeight: 550,
      quality: 1,
    };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        alert('User cancelled camera picker');
        return;
      } else if (response.errorCode == 'camera_unavailable') {
        alert('Camera not available on device');
        return;
      } else if (response.errorCode == 'permission') {
        alert('Permission not satisfied');
        return;
      } else if (response.errorCode == 'others') {
        alert(response.errorMessage);
        return;
      }
      setFilePath(response);
      seturl1(response.assets[0].uri);
    });
  };

  const uploadImage = async () => {
   // console.log(url1.length,"jjjjjj")
    if(url1.length<=10){
      Alert.alert(
          'Photo upload!',
          'Please Select Image',
       );
       return;
    }
    const filename = url1.substring(url1.lastIndexOf('/') + 1);
    const uploadUri =
      Platform.OS === 'ios' ? url1.replace('file://', '') : url1;
    setUploading(true);
    const task = storage().ref(`/images/${filename}`).putFile(uploadUri);
    try {
      await task;
      setUploading(false);
      setmydata(!mydata)
      seturl1("")
    } catch (e) {
      console.error(e);
      setUploading(false);
    }
  };
  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.container}>
        {filePath && filePath.assets&&url1.length>10 ? (
          <View>
            <Image
              source={{
                uri: filePath.assets[0].uri,
              }}
              style={styles.imageStyle}
            />
         
          </View>
        ) : (
          <Image source={require('./ph1.png') } style={styles.imageStyle} />
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            activeOpacity={0.5}
            style={styles.buttonStyle}
            disabled={uploading}
            onPress={() => captureImage('photo')}>
            <Text style={styles.buttonText}>Launch Camera for Image</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            activeOpacity={0.5}
            style={styles.buttonStyle}
            disabled={uploading}
            onPress={() => chooseFile('photo')}>
            <Text style={styles.buttonText}>Choose Image</Text>
          </TouchableOpacity>
        </View>
       
        {uploading ? (
          <View style={styles.progressBarContainer}>
           
            <ActivityIndicator size="large" color="#00ff00" />
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadButton} onPress={uploadImage}>
            <Text style={styles.buttonText}>Upload Image</Text>
          </TouchableOpacity>
        )}

         <View>
        <Text style={styles.title}>List of Images</Text>
        {!alldata?
        <FlatList
          data={imageUrls}
          horizontal={true}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={styles.image} />
          )}
        />:<ActivityIndicator size="large" color="#00ff00" />}
      </View>
      
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color:'black'
  },
  textStyle: {
    padding: 10,
    color: 'black',
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  buttonStyle: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    marginVertical: 10,
    width: 250,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageStyle: {
    width: 200,
    height: 200,
    margin: 5,
  },
  progressBarContainer: {
    marginTop: 20,
  },
  uploadButton: {
    borderRadius: 5,
    width: 150,
    height: 50,
    backgroundColor: '#ffb6b9',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  image: {
    width: 200,
    height: 200,
    margin: 10,
  },
});

export default Cam;
