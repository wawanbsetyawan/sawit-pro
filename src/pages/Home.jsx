import { IonContent, IonPage, IonTitle, IonToolbar, IonIcon, IonLoading, IonButton } from '@ionic/react';
import './Home.css';
import { cameraOutline } from 'ionicons/icons';

import React, { useState, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import Tesseract from 'tesseract.js';

import { db } from '../utils/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const Home = () => {
  const [showLoading, setShowLoading] = useState(false);
  const [text, setText] = useState('');
  const [loc, setLoc] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setETA] = useState(null);

  const plazaIndonesia = {
    lat: -6.1938597,
    lng: 106.8197775
  }

  // a. take picture of printed text
  const takePicture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 65,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      await recognizeText(image.dataUrl)

    } catch (error) {
      setShowLoading(false)
      alert(error)
      console.log(error);
    }
  };

  // b. convert words on picture to text
  const recognizeText = async (base64Data) => {
    setShowLoading(true)
    const result = await Tesseract.recognize(base64Data, 'eng');
    setText(result.data.text)
    saveToFirestore(result.data.text)
  };

  // c. capture location where picture taken
  const getCurrentPosition = async () => {
    const position = await Geolocation.getCurrentPosition();
    const current = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    }
    setLoc(current)
    calculateDistance(position.coords.latitude, position.coords.longitude, plazaIndonesia.lat, plazaIndonesia.lng, 'K')
  };

  // d. calculate distance to Plaza Indonesia
  const calculateDistance = (lat1, lng1, lat2, lng2, unit) => {
    if ((lat1 === lat2) && (lng1 === lng2)) {
      return 0;
    } else {
      const radlat1 = Math.PI * lat1 / 180;
      const radlat2 = Math.PI * lat2 / 180;
      const theta = lng1 - lng2;
      const radtheta = Math.PI * theta / 180;
      let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180 / Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit === "K") { dist = dist * 1.609344 }
      if (unit === "N") { dist = dist * 0.8684 }
      setDistance(dist.toFixed(2));
      estimateTravelTime(dist.toFixed(2))
    }
  }

  // d. calculate estimation times
  const estimateTravelTime = (distance) => {
    const speed = 40; // Average speed in km/hour
    const time = distance / speed; // Time in hours
    const minutes = Math.round(time * 60); // Time in minutes
    setETA(`${minutes} minutes`);
    return `${minutes} minutes`;
  };

  // e. save text, distance & eta data to Firebase
  const saveToFirestore = async (ocr) => {
    try {
      await addDoc(collection(db, 'tasks'), {
        ocr,
        distance,
        eta,
        updatedAt: Timestamp.now()
      })
      setShowLoading(false)
    } catch (err) {
      setShowLoading(false)
      alert(err)
    }
  }

  useEffect(() => {
    getCurrentPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <IonPage>
      <IonToolbar color="primary">
        <IonTitle>Take Picture!</IonTitle>
      </IonToolbar>
      <IonContent fullscreen>
        <div className="container">
          {!showLoading && loc && <IonIcon icon={cameraOutline} size="large" onClick={takePicture} />}
          <IonLoading
            cssClass="my-custom-class"
            isOpen={showLoading}
            onDidDismiss={() => setShowLoading(false)}
            message={'Reading text from image..'}
          />

          {!showLoading && text && <IonButton style={{ marginTop: '12px' }} expand="block" routerLink="/text">See written text</IonButton>}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
