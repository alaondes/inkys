import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// The config from src/lib/firebase.ts
import fs from "fs";
const file = fs.readFileSync("src/lib/firebase.ts", "utf-8");
const match = file.match(/const firebaseConfig = ({[\s\S]*?});/);

const firebaseConfig = {
  apiKey: "...", // Not needed for read-only firestore if rule is true
  projectId: "ai-studio-inkyscatlogo-4cbfc1a5-15ef-4f8c-8f9d-c3d7b22d0d15"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function readSettings() {
  const docRef = doc(db, "config", "settings");
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("Document data:", JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log("No such document!");
    }
  } catch(e) {
    console.error(e);
  }
  process.exit();
}

readSettings();
