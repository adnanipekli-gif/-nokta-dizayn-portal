// ═══════════════════════════════════════════════════════════════
// FIREBASE AYARLARI — Aşağıdaki bilgileri Firebase Console'dan alın
// Rehberdeki Adım 3'ü takip edin
// ═══════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "BURAYA_API_KEY_YAZIN",
  authDomain: "BURAYA_AUTH_DOMAIN_YAZIN",
  projectId: "BURAYA_PROJECT_ID_YAZIN",
  storageBucket: "BURAYA_STORAGE_BUCKET_YAZIN",
  messagingSenderId: "BURAYA_SENDER_ID_YAZIN",
  appId: "BURAYA_APP_ID_YAZIN"
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
