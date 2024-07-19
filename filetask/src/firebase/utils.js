import {collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, arrayUnion, Timestamp } from 'firebase/firestore';
import {ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/config';

export const getChatById = async (chatId) => {
  const chatDoc = await getDoc(doc(db, 'chats', chatId));
  return chatDoc.exists() ? { id: chatDoc.id, ...chatDoc.data() } : null;
};

export const addMessage = async (chatId, content, role) => {
  await addDoc(collection(db, 'messages'), {
    chatId,
    content,
    role,
    timestamp: Timestamp.now()
  });
};
export const createChat = async (userId, title) => {
  return await addDoc(collection(db, 'chats'), {
    userId,
    title,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    documents: []
  });
};

export const getMessagesByChat = async (chatId) => {
  const q = query(collection(db, 'messages'), where('chatId', '==', chatId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const uploadDocument = async (file, chatId) => {
  const storageRef = ref(storage, `chats/${chatId}/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    documents: arrayUnion({
      name: file.name,
      url: downloadURL,
      type: file.type
    }),
    updatedAt: Timestamp.now()
  });

  return downloadURL;
};