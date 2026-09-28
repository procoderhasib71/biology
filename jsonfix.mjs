import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// database/content.json ফাইলটির পাথ
const filePath = path.resolve(__dirname, "database", "content.json");

function fixMultipleJsonObjects() {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ফাইলটি পাওয়া যায়নি: ${filePath}`);
    process.exit(1);
  }

  let text = fs.readFileSync(filePath, "utf-8").trim();

  // ১. কমেন্ট রিমুভ করা
  text = text.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  // ২. ইতিমধ্যে ভ্যালিড হলে সুন্দর করে সাজিয়ে সেভ
  try {
    const validJson = JSON.parse(text);
    fs.writeFileSync(filePath, JSON.stringify(validJson, null, 2), "utf-8");
    console.log("✅ JSON ফাইলটি ইতিমধ্যে পুরোপুরি ভ্যালিড!");
    return;
  } catch (e) {
    console.log("⚠️ একাধিক অবজেক্ট বা ব্র্যাকেট এরর পাওয়া গেছে। ফিক্স করা হচ্ছে...");
  }

  // ৩. টেক্সটটির শুরুতে [ এবং শেষে ] যুক্ত করা (Array আকারে সাজানো)
  let wrappedText = text;
  if (!wrappedText.startsWith("[")) {
    wrappedText = "[" + wrappedText;
  }
  if (!wrappedText.endsWith("]")) {
    wrappedText = wrappedText + "]";
  }

  // ৪. অবজেক্টগুলোর মাঝখানের মিসিং কমা ঠিক করা
  wrappedText = wrappedText.replace(/}\s*(\r?\n)?\s*{/g, "},{");

  // ৫. অতিরিক্ত কমা রিমুভ করা
  wrappedText = wrappedText.replace(/,\s*]/g, "]");

  try {
    const fixedData = JSON.parse(wrappedText);
    fs.writeFileSync(filePath, JSON.stringify(fixedData, null, 2), "utf-8");
    console.log("🎉 সফলভাবে JSON ফাইল ফিক্স করে ভ্যালিড অ্যারে করা হয়েছে!");
  } catch (finalErr) {
    console.error("❌ ফিক্স করতে সমস্যা হয়েছে:", finalErr.message);
  }
}

fixMultipleJsonObjects();