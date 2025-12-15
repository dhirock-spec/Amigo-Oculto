import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { Participant } from '../types';

// ============================================================================
// CONFIGURAÇÃO DO FIREBASE (IMPORTANTE: PREENCHA ISTO PARA FICAR ONLINE)
// ============================================================================
// 1. Vá para https://console.firebase.google.com/
// 2. Crie um novo projeto
// 3. Adicione um app Web
// 4. Copie as configurações e substitua abaixo
// 5. No Console do Firebase, vá em "Criação" -> "Firestore Database" -> "Criar banco de dados"
// 6. Escolha iniciar no "Modo de teste" (para começar rápido)
// ============================================================================

const firebaseConfig = {
  // Substitua as strings vazias abaixo com suas chaves do Firebase
  apiKey: "", 
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Check if config is filled
export const isFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "";

let db: any;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase conectado com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
  }
}

// Subscribe to real-time updates
export const subscribeToParticipants = (callback: (data: Participant[]) => void) => {
  if (!db) {
    console.warn("Firebase não configurado. Usando armazenamento local.");
    const stored = localStorage.getItem('north_pole_registry');
    callback(stored ? JSON.parse(stored) : []);
    
    // Listen for storage events (other tabs)
    const handleStorageChange = () => {
       const updated = localStorage.getItem('north_pole_registry');
       if (updated) callback(JSON.parse(updated));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }

  // Real-time listener from Firestore
  return onSnapshot(collection(db, "participants"), (snapshot) => {
    const participants = snapshot.docs.map(doc => doc.data() as Participant);
    callback(participants);
  }, (error) => {
    console.error("Erro ao ler do Firestore:", error);
    alert("Erro de conexão. Verifique se o Firestore está criado no modo de teste.");
  });
};

// Save or Update participant
export const saveParticipantToDb = async (participant: Participant) => {
  if (!db) {
    // Fallback to LocalStorage
    const stored = localStorage.getItem('north_pole_registry');
    const participants = stored ? JSON.parse(stored) : [];
    
    const index = participants.findIndex((p: Participant) => p.id === participant.id);
    let newParticipants;
    
    if (index >= 0) {
      newParticipants = [...participants];
      newParticipants[index] = participant;
    } else {
      newParticipants = [...participants, participant];
    }
    
    localStorage.setItem('north_pole_registry', JSON.stringify(newParticipants));
    // Dispatch event for same-tab updates to catch it in the hook above isn't reliable for same-component,
    // but the App component usually updates state optimistically or via callback re-fetch.
    // We will return true to signal success.
    return true;
  }

  try {
    // Save to Firestore "participants" collection with the ID as document key
    await setDoc(doc(db, "participants", participant.id), participant);
    return true;
  } catch (error) {
    console.error("Erro ao salvar no Firestore:", error);
    alert("Falha ao salvar online. Verifique as permissões do banco de dados.");
    return false;
  }
};