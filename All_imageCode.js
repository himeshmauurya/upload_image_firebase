import React, {useState, useEffect} from 'react';
// Import required components
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
import * as Progress from 'react-native-progress';

var count = 0;
const Cam = () => {
  const [filePath, setFilePath] = useState({});
  const [transferred, setTransferred] = useState(0);
  const [data, setData] = useState([]);
  const [url1, seturl1] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [mydata,setmydata]=useState(true)
  const [alldata,setalldata]=useState(true)
  useEffect(() => {
    // Fetch a list of all images from Firebase Storage
    setalldata(true)
    const fetchImages = async () => {
      const storageRef = storage().ref();
      const imagesRef = storageRef.child('images'); // Change 'images' to your actual storage path
      const imageList = await imagesRef.listAll();
      //console.log(imageList)
      const urls = await Promise.all(
        imageList.items.map(async imageRef => {
         // console.log(imageRef)
          const url = await imageRef.getDownloadURL();
         // console.log(url)
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
        // If CAMERA Permission is granted
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
        // If WRITE_EXTERNAL_STORAGE Permission is granted
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
    //console.log('sdsd', filePath);
    if (isCameraPermitted && isStoragePermitted) {
      launchCamera(options, response => {
       // console.log('Response 1= ', response);

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
        // console.log('base64 -> ', response.assets[0].base64);
        // console.log('uri ->1 ', response.assets[0].uri);
        // console.log('width -> ', response.assets[0].width);
        // console.log('height -> ', response.assets[0].height);
        // console.log('fileSize -> ', response.assets[0].fileSize);
        // console.log('type -> ', response.assets[0].type);
        // console.log('fileName -> ', response.assets[0].fileName);
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
      // console.log('Response =2 ', response);
      // console.log('sdsd', filePath);
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
      //console.log('base64 -> ', response.assets[0].base64);
      // console.log('uri -> ', response.assets[0].uri);
      // console.log('width -> ', response.assets[0].width);
      // console.log('height -> ', response.assets[0].height);
      // console.log('fileSize -> ', response.assets[0].fileSize);
      // console.log('type -> ', response.assets[0].type);
      // console.log('fileName -> ', response.assets[0].fileName);
      setFilePath(response);
      seturl1(response.assets[0].uri);
    });
  };

  const uploadImage = async () => {
    // const { uri } = image;
    console.log(url1.length,"jjjjjj")
    if(url1.length<=10){
      Alert.alert(
          'Photo upload!',
          'Please Select Image',
       );
       return;
    }
    const filename = url1.substring(url1.lastIndexOf('/') + 1);
    // console.log("ppp",filename)
    const uploadUri =
      Platform.OS === 'ios' ? url1.replace('file://', '') : url1;
    //console.log('ppp', uploadUri);
    setUploading(true);
    setTransferred(0);
    const task = storage().ref(`/images/${filename}`).putFile(uploadUri);
    //set progress state
    task.on('state_changed', snapshot => {
      // console.log("snapshot.bytesTransferred",snapshot.bytesTransferred)
      // console.log("snapshot.bytesTransferred1",snapshot.totalBytes)
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes);
    // console.log("pro",progress)
      setTransferred(progress);//progress ki jagah 1 krne pe chal raha
    });
    try {
      await task;
      //setTransferred(1)
      setUploading(false);
      setmydata(!mydata)
      // Alert.alert(
      //   'Photo uploaded!',
      //   'Your photo has been uploaded to Firebase Cloud Storage!',
      // );
    } catch (e) {
      console.error(e);
      setUploading(false);
    }





    // setUploading(false);
    // Alert.alert(
    //   'Photo uploaded!',
    //   'Your photo has been uploaded to Firebase Cloud Storage!',
    // );
    // setImage(null);
  };

  const listItem = () => {
    setTransferred(0);
    storage()
      .ref()
      .child('images/')
      .listAll()
      .then(res => {
        res.items.forEach(item => {
          setData(arr => [...arr, item.name]);
        });
      })
      .catch(err => {
        alert(err.message);
      });
  };
  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.container}>
        {filePath && filePath.assets ? (
          <View>
            <Image
              source={{
                uri: filePath.assets[0].uri,
              }}
              style={styles.imageStyle}
            />
            {/* <Text style={styles.textStyle}>{filePath.assets[0].uri}</Text> */}
          </View>
        ) : (
          <Image source={require('./upload.png') } style={styles.imageBox} />
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            activeOpacity={0.5}
            style={styles.buttonStyle}
            disabled={uploading}
            onPress={() => captureImage('photo')}>
            <Text style={styles.buttonText}>Launch Camera for Image</Text>
          </TouchableOpacity>
          {/* <Progress.Bar progress={0.3} width={200} /> */}
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
            {/* <Progress.Bar progress={transferred} width={300} /> */}
            <ActivityIndicator size="large" color="#00ff00" />
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadButton} onPress={uploadImage}>
            <Text style={styles.buttonText}>Upload Image</Text>
          </TouchableOpacity>
        )}

        {/* <TouchableOpacity
          activeOpacity={0.5}
          disabled={uploading}
          style={styles.buttonStyle}
          onPress={listItem}>
          <Text style={styles.buttonText}>List Items</Text>
        </TouchableOpacity> */}

        {/* {data.map(val => (
          <Text key={count++} style={styles.textStyle}>
            {val}
          </Text>
        ))} */}
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
