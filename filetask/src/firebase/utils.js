import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase/config";
import { useToast } from "@/components/ui/use-toast";

export const getChatById = async (chatId) => {
  const chatDoc = await getDoc(doc(db, "chats", chatId));
  return chatDoc.exists() ? { id: chatDoc.id, ...chatDoc.data() } : null;
};

export const addMessage = async (chatId, content, role) => {
  await addDoc(collection(db, "messages"), {
    chatId,
    content,
    role,
    timestamp: Timestamp.now(),
  });
};

export const createChat = async (userId, title, summary, sourceId, type) => {
  return await addDoc(collection(db, "chats"), {
    userId,
    title,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    documents: [],
    summary: summary ? summary : "",
    sourceId: sourceId ? sourceId : "",
    type: type ? type : "small",
  });
};

export const getMessagesByChat = async (chatId) => {
  const q = query(collection(db, "messages"), where("chatId", "==", chatId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getChatsByUser = async (userId) => {
  const q = query(collection(db, "chats"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const checkExistingChat = async (userId, title) => {
  const q = query(
    collection(db, "chats"),
    where("userId", "==", userId),
    where("title", "==", title)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.docs.length > 0) {
    return querySnapshot.docs[0].id;
  } else {
    return null;
  }
};

export const deleteChat = async (chatId) => {
  if (!chatId) return;
  const chatRef = doc(db, "chats", chatId);
  await deleteDoc(chatRef);
};

export const uploadDocument = async (file, chatId) => {
  const storageRef = ref(storage, `chats/${chatId}/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, {
    documents: arrayUnion({
      name: file.name,
      url: downloadURL,
      type: file.type,
    }),
    updatedAt: Timestamp.now(),
  });

  return downloadURL;
};
