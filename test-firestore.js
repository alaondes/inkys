import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc, updateDoc, collection, addDoc, getDoc } from "firebase/firestore";
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
    console.log("Signed in.");
    
    // create dummy order
    console.log("Creating order...");
    const orderData = {
      customer: "Test", email: "test@test.com", phone: "123", total: 10, status: "Pendente", items: [], shippingInfo: {}, date: new Date()
    };
    const docRef = await addDoc(collection(db, "orders"), orderData);
    console.log("Created order", docRef.id);
    
    // check if we can read it
    await getDoc(docRef);
    console.log("Can read order.");
    
    // test delete
    console.log("Deleting order...");
    await deleteDoc(docRef);
    console.log("Deleted successfully.");
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
