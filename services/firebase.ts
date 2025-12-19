import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { Participant, FoodItem } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyA3pGzzEQvnasDlDSmsOnKrIEDXJfZ2WCc",
  authDomain: "amigo-oculto-2025.firebaseapp.com",
  projectId: "amigo-oculto-2025",
  storageBucket: "amigo-oculto-2025.firebasestorage.app",
  messagingSenderId: "636023943804",
  appId: "1:636023943804:web:c622cdf647ba3870208ff9",
  measurementId: "G-MHZ728NQL4"
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "";

let db: any;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("🟢 Firebase conectado!");
  } catch (error) {
    console.error("🔴 Erro Firebase:", error);
  }
}

// --- PARTICIPANTES ---
export const subscribeToParticipants = (callback: (data: Participant[]) => void) => {
  if (!db) {
    const loadFromLocal = () => {
      const stored = localStorage.getItem('north_pole_registry');
      callback(stored ? JSON.parse(stored) : []);
    };
    loadFromLocal();
    window.addEventListener('storage', loadFromLocal);
    return () => window.removeEventListener('storage', loadFromLocal);
  }

  return onSnapshot(collection(db, "participants"), (snapshot) => {
    const participants = snapshot.docs.map(doc => doc.data() as Participant);
    callback(participants);
  });
};

export const saveParticipantToDb = async (participant: Participant) => {
  if (!db) {
    const stored = localStorage.getItem('north_pole_registry');
    const participants = stored ? JSON.parse(stored) : [];
    const index = participants.findIndex((p: Participant) => p.id === participant.id);
    let newParticipants = index >= 0 ? [...participants] : [...participants, participant];
    if (index >= 0) newParticipants[index] = participant;
    localStorage.setItem('north_pole_registry', JSON.stringify(newParticipants));
    window.dispatchEvent(new Event('storage'));
    return true;
  }
  await setDoc(doc(db, "participants", participant.id), participant);
  return true;
};

// --- COMIDAS ---
export const subscribeToFood = (callback: (data: FoodItem[]) => void) => {
  if (!db) {
    const loadFromLocal = () => {
      const stored = localStorage.getItem('paar_food_list');
      callback(stored ? JSON.parse(stored) : []);
    };
    loadFromLocal();
    window.addEventListener('storage', loadFromLocal);
    return () => window.removeEventListener('storage', loadFromLocal);
  }

  return onSnapshot(collection(db, "food"), (snapshot) => {
    const food = snapshot.docs.map(doc => doc.data() as FoodItem);
    callback(food);
  });
};

export const saveFoodToDb = async (food: FoodItem) => {
  if (!db) {
    const stored = localStorage.getItem('paar_food_list');
    const foods = stored ? JSON.parse(stored) : [];
    localStorage.setItem('paar_food_list', JSON.stringify([...foods, food]));
    window.dispatchEvent(new Event('storage'));
    return true;
  }
  await setDoc(doc(db, "food", food.id), food);
  return true;
};