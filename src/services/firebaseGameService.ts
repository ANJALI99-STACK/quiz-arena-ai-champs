
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  setDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { Question, PlayerScore } from '../context/QuizContext';

export const createGameRoom = async (
  hostId: string, 
  settings: {
    category: string;
    difficulty: string;
    questionCount: number;
  }
) => {
  try {
    const roomRef = await addDoc(collection(firestore, 'gameRooms'), {
      hostId,
      settings,
      status: 'waiting',
      createdAt: new Date(),
      players: []
    });

    return roomRef.id;
  } catch (error) {
    console.error('Error creating game room:', error);
    throw error;
  }
};

export const joinGameRoom = async (roomId: string, player: {
  userId: string;
  name: string;
  photoURL: string;
}) => {
  try {
    const roomRef = doc(firestore, 'gameRooms', roomId);
    
    await updateDoc(roomRef, {
      players: firebase.firestore.FieldValue.arrayUnion(player)
    });

    return true;
  } catch (error) {
    console.error('Error joining game room:', error);
    throw error;
  }
};

export const saveGameResults = async (
  roomId: string, 
  results: {
    players: PlayerScore[];
    questions: Question[];
  }
) => {
  try {
    const resultsRef = doc(firestore, 'gameResults', roomId);
    
    await setDoc(resultsRef, {
      ...results,
      timestamp: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error saving game results:', error);
    throw error;
  }
};
