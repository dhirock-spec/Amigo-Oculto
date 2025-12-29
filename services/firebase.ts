import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, updateDoc, increment, getDoc } from 'firebase/firestore';
import { Participant, FoodItem, Vote, SecretMessage, Poll, PollOption, PollVote } from '../types';

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

// --- QUIZ / VOTOS PALPITES ---
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
    if (index >= 0) votes[index] = vote;
    else votes.push(vote);
    localStorage.setItem('paar_quiz_votes', JSON.stringify(votes));
    window.dispatchEvent(new Event('storage'));
    return true;
  }
  await setDoc(doc(db, "votes", vote.id), vote);
  return true;
};

// --- MENSAGENS SECRETAS ---
export const subscribeToMessages = (callback: (data: SecretMessage[]) => void) => {
  if (!db) {
    const loadFromLocal = () => {
      const stored = localStorage.getItem('paar_secret_messages');
      const messages = stored ? JSON.parse(stored) : [];
      callback(messages.sort((a: any, b: any) => b.createdAt - a.createdAt));
    };
    loadFromLocal();
    window.addEventListener('storage', loadFromLocal);
    return () => window.removeEventListener('storage', loadFromLocal);
  }

  const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => doc.data() as SecretMessage);
    callback(messages);
  });
};

export const saveMessageToDb = async (message: SecretMessage) => {
  if (!db) {
    const stored = localStorage.getItem('paar_secret_messages');
    const messages = stored ? JSON.parse(stored) : [];
    localStorage.setItem('paar_secret_messages', JSON.stringify([message, ...messages]));
    window.dispatchEvent(new Event('storage'));
    return true;
  }
  await setDoc(doc(db, "messages", message.id), message);
  return true;
};

export const deleteMessageFromDb = async (id: string) => {
  if (!db) {
    const stored = localStorage.getItem('paar_secret_messages');
    let messages = stored ? JSON.parse(stored) : [];
    messages = messages.filter((m: any) => m.id !== id);
    localStorage.setItem('paar_secret_messages', JSON.stringify(messages));
    window.dispatchEvent(new Event('storage'));
    return true;
  }
  await deleteDoc(doc(db, "messages", id));
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

// --- ENQUETES (POLLS) ---
export const subscribeToPolls = (callback: (data: Poll[]) => void) => {
  if (!db) {
    const loadFromLocal = () => {
      const stored = localStorage.getItem('paar_polls');
      callback(stored ? JSON.parse(stored) : [
        { id: 'animado', title: 'O mais animado do grupo', description: 'Quem não para de falar no grupo?' },
        { id: 'sumido', title: 'O mais sumido/low profile', description: 'Quem só aparece para confirmar presença?' },
        { id: 'atrasado', title: 'O rei/rainha do atraso', description: 'Quem sempre chega "daqui a 5 minutos"?' },
        { id: 'brocado', title: 'Brocado do ano', description: 'Quem é o maior comedor/comilona da galera?' }
      ]);
    };
    loadFromLocal();
    window.addEventListener('storage', loadFromLocal);
    return () => window.removeEventListener('storage', loadFromLocal);
  }

  return onSnapshot(collection(db, "polls"), (snapshot) => {
    const polls = snapshot.docs.map(doc => doc.data() as Poll);
    callback(polls);
  });
};

export const savePollToDb = async (poll: Poll) => {
  if (!db) {
    const stored = localStorage.getItem('paar_polls');
    const polls = stored ? JSON.parse(stored) : [];
    localStorage.setItem('paar_polls', JSON.stringify([...polls, poll]));
    window.dispatchEvent(new Event('storage'));
    return true;
  }
  await setDoc(doc(db, "polls", poll.id), poll);
  return true;
};

export const subscribeToPollOptions = (callback: (data: PollOption[]) => void) => {
  if (!db) {
    const loadFromLocal = () => {
      const stored = localStorage.getItem('paar_poll_options');
      callback(stored ? JSON.parse(stored) : []);
    };
    loadFromLocal();
    window.addEventListener('storage', loadFromLocal);
    return () => window.removeEventListener('storage', loadFromLocal);
  }

  return onSnapshot(collection(db, "pollOptions"), (snapshot) => {
    const options = snapshot.docs.map(doc => doc.data() as PollOption);
    callback(options);
  });
};

export const savePollOptionToDb = async (option: PollOption) => {
  if (!db) {
    const stored = localStorage.getItem('paar_poll_options');
    const options = stored ? JSON.parse(stored) : [];
    localStorage.setItem('paar_poll_options', JSON.stringify([...options, option]));
    window.dispatchEvent(new Event('storage'));
    return true;
  }
  await setDoc(doc(db, "pollOptions", option.id), option);
  return true;
};

// --- POLL VOTES ---
export const subscribeToPollVotes = (callback: (data: PollVote[]) => void) => {
  if (!db) {
    const loadFromLocal = () => {
      const stored = localStorage.getItem('paar_poll_votes_registry');
      callback(stored ? JSON.parse(stored) : []);
    };
    loadFromLocal();
    window.addEventListener('storage', loadFromLocal);
    return () => window.removeEventListener('storage', loadFromLocal);
  }

  return onSnapshot(collection(db, "pollVotes"), (snapshot) => {
    const pollVotes = snapshot.docs.map(doc => doc.data() as PollVote);
    callback(pollVotes);
  });
};

export const savePollVoteToDb = async (pollVote: PollVote, previousOptionId?: string) => {
  if (!db) {
    const stored = localStorage.getItem('paar_poll_votes_registry');
    let votes = stored ? JSON.parse(stored) : [];
    
    // Check if it's an update
    const existingIndex = votes.findIndex((v: PollVote) => v.participantId === pollVote.participantId && v.pollId === pollVote.pollId);
    
    if (existingIndex >= 0) {
      // Update existing vote
      const oldOptionId = votes[existingIndex].optionId;
      votes[existingIndex] = pollVote;
      
      const optionsStored = localStorage.getItem('paar_poll_options');
      let options = optionsStored ? JSON.parse(optionsStored) : [];
      
      // Decrement old
      const oldIdx = options.findIndex((o: PollOption) => o.id === oldOptionId);
      if (oldIdx >= 0) options[oldIdx].votes = Math.max(0, (options[oldIdx].votes || 0) - 1);
      
      // Increment new
      const newIdx = options.findIndex((o: PollOption) => o.id === pollVote.optionId);
      if (newIdx >= 0) options[newIdx].votes = (options[newIdx].votes || 0) + 1;
      
      localStorage.setItem('paar_poll_options', JSON.stringify(options));
    } else {
      // New vote
      votes.push(pollVote);
      const optionsStored = localStorage.getItem('paar_poll_options');
      let options = optionsStored ? JSON.parse(optionsStored) : [];
      const idx = options.findIndex((o: PollOption) => o.id === pollVote.optionId);
      if (idx >= 0) options[idx].votes = (options[idx].votes || 0) + 1;
      localStorage.setItem('paar_poll_options', JSON.stringify(options));
    }

    localStorage.setItem('paar_poll_votes_registry', JSON.stringify(votes));
    window.dispatchEvent(new Event('storage'));
    return true;
  }
  
  // Firebase Logic
  if (previousOptionId) {
    // It's a change of vote
    await updateDoc(doc(db, "pollOptions", previousOptionId), {
      votes: increment(-1)
    });
  }
  
  // Save or Update the Vote Document (use a predictable ID: participantId_pollId)
  const voteDocId = `${pollVote.participantId}_${pollVote.pollId}`;
  await setDoc(doc(db, "pollVotes", voteDocId), { ...pollVote, id: voteDocId });
  
  // Increment new option
  await updateDoc(doc(db, "pollOptions", pollVote.optionId), {
    votes: increment(1)
  });
  
  return true;
};