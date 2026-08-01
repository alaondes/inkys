import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc, collection, addDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { readFileSync } from "fs";

const config = JSON.parse(readFileSync("./firebase-applet-config.json"));

const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    console.log("Signing in...");
    await signInWithEmailAndPassword(auth, "admin@inkys.com.br", "123456");
    console.log("Signed in. Creating order...");
    const docRef = await addDoc(collection(db, "orders"), {
      customer: "Test", email: "test@test.com", phone: "123", total: 10, status: "Pendente", items: [], shippingInfo: {}, date: new Date()
    });
    console.log("Created order", docRef.id);
    console.log("Deleting order...");
    await deleteDoc(docRef);
    console.log("Deleted successfully.");
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
