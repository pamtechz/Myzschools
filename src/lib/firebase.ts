import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  type Firestore,
  Timestamp,
} from "firebase/firestore"
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Singleton pattern for Firebase app
let app: FirebaseApp
let db: Firestore
let auth: Auth // Added auth singleton

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }
  return app
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp())
  }
  return db
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
  }
  return auth
}

export const googleProvider = new GoogleAuthProvider()

// Multi-tenancy constant
export const SCHOOL_ID = "SCH_001"

// Collection references with school ID prefix
export const getCollectionRef = (collectionName: string) => {
  const db = getFirestoreDb()
  return collection(db, `schools/${SCHOOL_ID}/${collectionName}`)
}

export const getDocRef = (collectionName: string, docId: string) => {
  const db = getFirestoreDb()
  return doc(db, `schools/${SCHOOL_ID}/${collectionName}`, docId)
}

// Export Firestore utilities
export { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch, Timestamp }
