import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// আপনার src/lib/firebase.ts ফাইলের firebaseConfig অবজেক্টটি এখানে হুবহু পেস্ট করুন
const firebaseConfig = {
  apiKey: "AIzaSyBaJo4nsgVZaLNhQOOVx4EMfKx_A1-jQok",
  authDomain: "gen-lang-client-0823072007.firebaseapp.com",
  projectId: "gen-lang-client-0823072007",
  storageBucket: "gen-lang-client-0823072007.firebasestorage.app",
  messagingSenderId: "354464526506",
  appId: "1:354464526506:web:9b999be9ede689847f20d3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function upload() {
  try {
    const filePath = path.join(__dirname, "database", "chapter.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const syllabusData = JSON.parse(rawData);

    console.log("Firestore-e syllabus upload shuru hocche...");
    await setDoc(doc(db, "navigation", "syllabus"), syllabusData);
    console.log("✅ সফলভাবে navigation/syllabus আপলোড সম্পন্ন হয়েছে!");
    process.exit(0);
  } catch (err) {
    console.error("❌ আপলোড এরর:", err);
    process.exit(1);
  }
}

upload();