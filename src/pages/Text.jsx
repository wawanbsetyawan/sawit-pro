import {
  useIonViewDidEnter,
  IonContent,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonInput, IonItem, IonLabel, IonList, IonTextarea
} from '@ionic/react';

import { useState } from 'react';
import { db } from '../utils/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

const Text = () => {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    await onSnapshot(query(collection(db, 'tasks'), orderBy('updatedAt', 'desc'), limit(1)), (snapshot) => {
      snapshot.docs.map(doc => setData(doc.data()))
    });
  };

  useIonViewDidEnter(async () => {
    fetchData()
  })

  return (
    <IonPage>
      <IonToolbar color="primary">
        <IonButtons slot="start">
          <IonBackButton defaultHref="/"></IonBackButton>
        </IonButtons>
        <IonTitle>Saved Text</IonTitle>
      </IonToolbar>
      <IonContent fullscreen>
        <IonList>
          <IonItem>
            <IonLabel color="medium" position="stacked">Distance</IonLabel>
            <IonInput value={data?.distance + ' Km'}></IonInput>
          </IonItem>

          <IonItem>
            <IonLabel color="medium" position="stacked">Estimated Time</IonLabel>
            <IonInput value={data?.eta}></IonInput>
          </IonItem>

          <IonItem>
            <IonLabel color="medium" position="stacked">Written Text</IonLabel>
            <IonTextarea rows="20" value={data?.ocr}></IonTextarea>
          </IonItem>

        </IonList>
      </IonContent>
    </IonPage>
  )
}

export default Text;