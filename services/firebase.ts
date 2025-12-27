import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Participant, FoodItem, Vote, MusicRequest } from '../types';

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

// --- QUIZ / VOTOS ---
export const subscribeToVotes = (callback: (data: Vote[]) => void) => {
  if (!db) {
    const loadFromLocal = () => {
      const stored = localStorage.getItem('paar_quiz_votes');
      callback(stored ? JSON.parse(stored) : []);
    };
    loadFromLocal();
    window.addEventListener('storage', loadFromLocal);
    return () => window.removeEventListener('storage', loadFromLocal);
  }

  return onSnapshot(collection(db, "votes"), (snapshot) => {
    const votes = snapshot.docs.map(doc => doc.data() as Vote);
    callback(votes);
  });
};

export const saveVoteToDb = async (vote: Vote) => {
  if (!db) {
    const stored = localStorage.getItem('paar_quiz_votes');
    let votes = stored ? JSON.parse(stored) : [];
    const index = votes.findIndex((v: Vote) => v.id === vote.id);
    
    if (index >= 0) {
      votes[index] = vote; // Update existing
    } else {
      votes.push(vote); // Add new
    }
    
    localStorage.setItem('paar_quiz_votes', JSON.stringify(votes));
    window.dispatchEvent(new Event('storage'));
    return true;
  }
  await setDoc(doc(db, "votes", vote.id), vote);
  return true;
};

export const deleteVoteFromDb = async (voteId: string) => {
  if (!db) {
    const stored = localStorage.getItem('paar_quiz_votes');
    let votes = stored ? JSON.parse(stored) : [];
    const filteredVotes = votes.filter((v: Vote) => v.id !== voteId);
    localStorage.setItem('paar_quiz_votes', JSON.stringify(filteredVotes));
    window.dispatchEvent(new Event('storage'));
    return true;
  }
  await deleteDoc(doc(db, "votes", voteId));
  return true;
};

// --- PLAYLIST ---
export const subscribeToMusicQueue = (callback: (data: MusicRequest[]) => void) => {
  if (!db) {
    const loadFromLocal = () => {
      const stored = localStorage.getItem('paar_party_music');
      const music = stored ? JSON.parse(stored) : [];
      callback(music.sort((a: any, b: any) => a.createdAt - b.createdAt));
    };
    loadFromLocal();
    window.addEventListener('storage', loadFromLocal);
    return () => window.removeEventListener('storage', loadFromLocal);
  }

  const q = query(collection(db, "music"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const music = snapshot.docs.map(doc => doc.data() as MusicRequest);
    callback(music);
  });
};

export const saveMusicToDb = async (music: MusicRequest) => {
  if (!db) {
    const stored = localStorage.getItem('paar_party_music');
    let musicList = stored ? JSON.parse(stored) : [];
    musicList.push(music);
    localStorage.setItem('paar_party_music', JSON.stringify(musicList));
    window.dispatchEvent(new Event('storage'));
    return true;
  }
  await setDoc(doc(db, "music", music.id), music);
  return true;
};

export const removeMusicFromDb = async (id: string) => {
  if (!db) {
    const stored = localStorage.getItem('paar_party_music');
    let musicList = stored ? JSON.parse(stored) : [];
    const filtered = musicList.filter((m: MusicRequest) => m.id !== id);
    localStorage.setItem('paar_party_music', JSON.stringify(filtered));
    window.dispatchEvent(new Event('storage'));
    return true;
  }
  await deleteDoc(doc(db, "music", id));
  return true;
};