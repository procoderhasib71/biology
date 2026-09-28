import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Apnar firebase.ts theke config values gulo ekhane boshie din
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

async function uploadTopicContent() {
  try {
    // 1. database/content.json (ba root e content.json thakle thik path ta din)
const filePath = path.join(__dirname, "database", "content3.json");    
    // File read kora
    const rawData = fs.readFileSync(filePath, "utf-8");
    const topicData = JSON.parse(rawData);

    // 2. Syllabus JSON-e 'bot-ch03-t01' chilo Shorkora ba Carbohydrate-er topic ID
    const topicId = "bot-ch03-t03";

    console.log(`Firestore-e topic [${topicId}] upload shuru hocche...`);

    // 3. 'topics' collection-er bhetor topicId hishebe save kora
    await setDoc(doc(db, "topics", topicId), topicData);

    console.log(`✅ Shofolbhabe topics/${topicId} document upload hoye geche!`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Upload error:", err);
    process.exit(1);
  }
}

uploadTopicContent();