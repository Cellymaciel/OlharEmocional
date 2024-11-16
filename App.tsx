import axios from 'axios';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, View, Image } from 'react-native';
import { Video } from 'expo-av';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

type Emotion = 'happy' | 'sad' | 'angry' | 'neutral' | 'surprise' | 'fear' | 'disgust';

const emotionVideos: Record<Emotion, any> = {
  happy: require('./assets/videos/Alegria_audio.mp4'),
  sad: require('./assets/videos/Medo_audio.mp4'),
  neutral: require('./assets/videos/Neutro.mp4'),
  surprise: require('./assets/videos/Surpresa_audio.mp4'),
  angry: require('./assets/videos/Raiva_audio.mp4'),
  fear: require('./assets/videos/Medo_audio.mp4'),
  disgust: require('./assets/videos/Raiva_audio.mp4')
};

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [emotion, setEmotion] = useState<Emotion>('neutral');
  const cameraRef = useRef<CameraView | null>(null);
  const [facing, setFacing] = useState<CameraType>('front');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);


  const captureAndProcessImage = async () => {
    if (cameraRef.current && !isProcessing) {
      console.log('Starting image capture...');
      setIsProcessing(true); 
      try {
        const options = { quality: 0.2, base64: true, skipProcessing: true };
        const data = await cameraRef.current.takePictureAsync(options);

        if (data?.uri) {
          console.log('Image captured:', data.uri);

          const resizedImage = await manipulateAsync(
            data.uri,
            [{ rotate: 270 }], 
            { base64: true, format: SaveFormat.JPEG }
          );


          if (resizedImage.base64) {
            const response = await axios.post('http://192.168.5.9:5000/recognize', {
              image: resizedImage.base64,
            });

            if (response.data.emotion) {
              console.log('Emotion received from server:', response.data.emotion);

              setEmotion(response.data.emotion);
            }
          }
        }
      } catch (error) {
        console.error('Error recognizing emotion:', error);
      } finally {
        console.log('Waiting 5 seconds before the next capture...');

      setIsProcessing(false)  
      }
    }
  };
  useEffect(() => {
    if (permission?.granted) {
      console.log('Camera permission granted.');

      captureAndProcessImage(); 

      intervalRef.current = setInterval(() => {
        if (!isProcessing) {
          console.log('Capturing image at interval...');

          captureAndProcessImage();
        }
      }, 12000); 

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [permission]);
 
  
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const emotionVideo = emotionVideos[emotion];

  return (
    <View style={styles.container}>
      <Video
        source={emotionVideo}
        style={styles.video}
        resizeMode="cover"
        shouldPlay
        isLooping
      />
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
     
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -1,
    opacity: 0,
  },
  video: {
    width: '100%',
    height: '100%',
    flex: 1,
    transform: [{ rotate: '180deg' }],
  },
  capturedImage: {
    width: 300,
    height: 300,
    marginTop: 20,
    borderWidth: 1,
  },
});
