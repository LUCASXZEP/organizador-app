import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAIX6I-1ssRG0TGNaiN4yVgFVhvn--NZeE",
  authDomain: "organizador-d190a.firebaseapp.com",
  projectId: "organizador-d190a",
  storageBucket: "organizador-d190a.appspot.com",
  messagingSenderId: "224407294338",
  appId: "1:224407294338:web:b15ec4b6f309ad03237f9b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Persistência offline falhou: múltiplas abas abertas");
  } else if (err.code === "unimplemented") {
    console.warn("Persistência offline não é suportada neste navegador");
  }
});

export { db };
