import { IonContent, IonPage, IonTitle, IonToolbar, IonButton, IonLoading, useIonViewDidEnter } from '@ionic/react';
import './Tab2.css';

import React, { useState, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import Tesseract from 'tesseract.js';

import { db } from '../utils/firebase';
import { collection, updateDoc, Timestamp } from 'firebase/firestore';

const Tab2 = () => {
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
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      const base64Data = image.dataUrl;

      return base64Data;
    } catch (error) {
      console.log(error);
    }
  };

  // b. convert words on picture to text
  const recognizeText = async (base64Data) => {
    const result = await Tesseract.recognize(base64Data, 'eng');
    setText(result.data.text)
    return result.data.text;
  };

  // c. capture location where picture taken
  const getCurrentPosition = async () => {
    const position = await Geolocation.getCurrentPosition();
    const location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    }
    setLoc(location)
  };

  // d. calculate distance to Plaza Indonesia
  /* const calculateDistance = (coords1, coords2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(coords2.latitude - coords1.latitude); // deg2rad below
    const dLon = deg2rad(coords2.longitude - coords1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(coords1.latitude)) *
      Math.cos(deg2rad(coords2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    setDistance(distance.toFixed(2));
    return distance.toFixed(2);
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  }; */

  const calculateDistance = () => {
    const unit = 'K', lat1 = loc.lat, lng1 = loc.lng, lat2 = plazaIndonesia.lat, lng2 = plazaIndonesia.lng;
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
      return dist.toFixed(2);
    }
  }

  // d. calculate estimation times
  const estimateTravelTime = (distance) => {
    const speed = 60; // Average speed in km/hour
    const time = distance / speed; // Time in hours
    const minutes = Math.round(time * 60); // Time in minutes
    setETA(`${minutes} minutes`);
    return `${minutes} minutes`;
  };

  // e. save text, distance & eta data to Firebase
  const saveToFirestore = async (e) => {
    e.preventDefault()
    try {
      await updateDoc(collection(db, 'tasks'), {
        text,
        distance,
        eta,
        updatedAt: Timestamp.now()
      })
    } catch (err) {
      alert(err)
    }
  }

  useEffect(() => {
    getCurrentPosition();
    takePicture().then((photo) => {
      setShowLoading(true)
      recognizeText(photo).then(() => {
        calculateDistance().then(() => {
          saveToFirestore()
          setShowLoading(false)
        }).catch(e => {
          setShowLoading(false)
          alert('error calc distance: ' + e)
        })
      }).catch(e => {
        setShowLoading(false)
        alert('error text read: ' + e)
      })
    }).catch(e => {
      setShowLoading(false)
      alert('error take photo: ' + e)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* useIonViewDidEnter(async () => {
    await getCurrentPosition();
    if (loc) {
      takePicture().then((photo) => {
        setShowLoading(true)
        recognizeText(photo).then(() => {
          calculateDistance().then(() => {
            saveToFirestore()
            setShowLoading(false)
          }).catch(e => {
            setShowLoading(false)
            alert('error calc distance: ' + e)
          })
        }).catch(e => {
          setShowLoading(false)
          alert('error text read: ' + e)
        })
      }).catch(e => {
        setShowLoading(false)
        alert('error take photo: ' + e)
      })
    }
  }) */

  return (
    <IonPage>
      <IonToolbar>
        <IonTitle>Take Picture!</IonTitle>
      </IonToolbar>
      <IonContent fullscreen className='ion-padding'>
        {loc && <p>location: {loc.lat}, {loc.lng}</p>}
        {plazaIndonesia && <p>destination: {plazaIndonesia.lat}, {plazaIndonesia.lng}</p>}
        <IonButton onClick={calculateDistance} >Calc</IonButton>
        {distance && <p>Distance: {distance} KM</p>}
        {distance && <p>ETA: {eta}</p>}
        <IonLoading
          cssClass="my-custom-class"
          isOpen={showLoading}
          onDidDismiss={() => setShowLoading(false)}
          message={'Processing text from image..'}
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
