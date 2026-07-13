import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function readSettings() {
  const docRef = db.collection("config").doc("settings");
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    console.log("Document data:", docSnap.data());
  } else {
    console.log("No such document!");
  }
}

readSettings();
