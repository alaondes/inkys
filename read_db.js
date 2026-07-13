import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function checkDb() {
  try {
    const settingsRef = doc(db, "config", "settings");
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      console.log("Settings exist. Store name:", settingsSnap.data().storeName);
    } else {
      console.log("Settings DO NOT EXIST.");
    }
    
    const productsRef = collection(db, "products");
    const productsSnap = await getDocs(productsRef);
    console.log("Number of products:", productsSnap.docs.length);
    if (productsSnap.docs.length > 0) {
      console.log("First product name:", productsSnap.docs[0].data().name);
    }
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
checkDb();
