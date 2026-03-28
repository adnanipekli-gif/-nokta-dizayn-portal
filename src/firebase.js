// ═══════════════════════════════════════════════════════════════
// FIREBASE AYARLARI — Aşağıdaki bilgileri Firebase Console'dan alın
// Rehberdeki Adım 3'ü takip edin
// ═══════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:"AIzaSyDCw4hbQiQoPOMS3SijH9ZKurvKivM_6Zk" "BURAYA_API_KEY_YAZIN",
  authDomain: "nokta-dizayn.firebaseapp.com",
  projectId:"nokta-dizayn",
  storageBucket:"nokta-dizayn.firebasestorage.app",
  messagingSenderId: "872937330347",
  appId: "1:872937330347:web:c487f9e43bacd1729ac9ee",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Veri okuma
export async function loadData(key) {
  try {
    const snap = await getDoc(doc(db, "appdata", key));
    return snap.exists() ? snap.data().value : null;
  } catch (e) {
    console.error("Veri okuma hatası:", e);
    return null;
  }
}

// Veri yazma
export async function saveData(key, value) {
  try {
    await setDoc(doc(db, "appdata", key), { value, updatedAt: Date.now() });
  } catch (e) {
    console.error("Veri yazma hatası:", e);
  }
}

// Veri silme
export async function deleteData(key) {
  try {
    await deleteDoc(doc(db, "appdata", key));
  } catch (e) {
    console.error("Veri silme hatası:", e);
  }
}

export { db };
