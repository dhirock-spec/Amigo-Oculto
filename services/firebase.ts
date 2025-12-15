import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { Participant } from '../types';

// ============================================================================
// CONFIGURAÇÃO DO FIREBASE (OBRIGATÓRIO PARA SINCRONIZAÇÃO ONLINE)
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyA3pGzzEQvnasDlDSmsOnKrIEDXJfZ2WCc",
  authDomain: "amigo-oculto-2025.firebaseapp.com",
  projectId: "amigo-oculto-2025",
  storageBucket: "amigo-oculto-2025.firebasestorage.app",
  messagingSenderId: "636023943804",
  appId: "1:636023943804:web:c622cdf647ba3870208ff9",
  measurementId: "G-MHZ728NQL4"
};

// Verifica se as chaves foram preenchidas (ignora se estiverem vazias)
export const isFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "";

let db: any;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("🟢 Firebase conectado com sucesso!");
  } catch (error) {
    console.error("🔴 Erro ao inicializar Firebase:", error);
  }
} else {
  console.log("⚪ Firebase não configurado. O app funcionará apenas neste dispositivo.");
}

// Inscrever-se para atualizações em tempo real (Ouvir o banco de dados)
export const subscribeToParticipants = (callback: (data: Participant[]) => void) => {
  if (!db) {
    // Modo Offline: Lê do LocalStorage
    const loadFromLocal = () => {
      const stored = localStorage.getItem('north_pole_registry');
      callback(stored ? JSON.parse(stored) : []);
    };
    
    loadFromLocal();
    
    // Escuta mudanças feitas em outras abas do mesmo navegador
    window.addEventListener('storage', loadFromLocal);
    return () => window.removeEventListener('storage', loadFromLocal);
  }

  // Modo Online: Escuta o Firestore em tempo real
  // onSnapshot é o segredo: ele roda o callback sempre que ALGUÉM muda o banco
  return onSnapshot(collection(db, "participants"), (snapshot) => {
    const participants = snapshot.docs.map(doc => doc.data() as Participant);
    // Ordena alfabeticamente opcionalmente, se desejar
    // participants.sort((a, b) => a.name.localeCompare(b.name));
    callback(participants);
  }, (error) => {
    console.error("Erro na conexão com Firestore:", error);
    // Fallback silencioso para não quebrar a tela
  });
};

// Salvar ou Atualizar participante
export const saveParticipantToDb = async (participant: Participant) => {
  if (!db) {
    // Modo Offline: Salva no LocalStorage
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
    // Dispara evento para atualizar outras abas
    window.dispatchEvent(new Event('storage'));
    return true;
  }

  try {
    // Modo Online: Salva no Firestore
    // setDoc com merge:true é mais seguro, mas aqui sobrescrevemos pelo ID, o que é ok
    await setDoc(doc(db, "participants", participant.id), participant);
    return true;
  } catch (error) {
    console.error("Erro ao salvar no Firestore:", error);
    alert("Erro ao salvar online. Verifique se as regras de segurança do Firestore permitem gravação.");
    return false;
  }
};