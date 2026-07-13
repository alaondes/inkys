import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "ai-studio-inkyscatlogo-4cbfc1a5-15ef-4f8c-8f9d-c3d7b22d0d15"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function readSettings() {
  const docRef = doc(db, "config", "settings");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    console.log("Document data:", docSnap.data());
  } else {
    console.log("No such document!");
  }
}

readSettings();
