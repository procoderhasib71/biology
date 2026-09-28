// src/data/uploadData.js

export const initialTopics = {
  carbohydrate: {
    chapterTitle: "অধ্যায় ৩: কোষ রসায়ন",
    topicName: "কার্বোহাইড্রেট (Carbohydrate)",
    blocks: [
      { type: "heading", content: "১. কার্বোহাইড্রেটের সংজ্ঞা ও গঠন" },
      { type: "text", content: "কার্বন (C), হাইড্রোজেন (H) এবং অক্সিজেন (O) এর সমন্বয়ে গঠিত যৌগকে কার্বোহাইড্রেট বা শর্করা বলে। এদের সাধারণ সংকেত হলো Cn(H2O)n।" },
      { 
        type: "figure", 
        imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80", 
        caption: "চিত্র: কার্বোহাইড্রেটের আণবিক গঠন" 
      },
      { type: "heading", content: "২. কার্বোহাইড্রেটের প্রধান কাজ" },
      { type: "text", content: "• জীবদেহে শক্তির প্রধান উৎস হিসেবে কাজ করে (যেমন- গ্লুকোজ)।\n• উদ্ভিদের কোষপ্রাচীর গঠনে সেলুলোজ ব্যবহৃত হয়।\n• উদ্ভিদে স্টার্চ এবং প্রাণীতে গ্লাইকোজেন হিসেবে খাদ্য সঞ্চিত থাকে।" },
      { type: "3d-viewer", caption: "গ্লুকোজ অণুর রিং স্ট্রাকচার (Interactive 3D Model)" }
    ]
  },
  protein: {
    chapterTitle: "অধ্যায় ৩: কোষ রসায়ন",
    topicName: "প্রোটিন (Protein)",
    blocks: [
      { type: "heading", content: "১. প্রোটিনের পরিচিতি" },
      { type: "text", content: "অসংখ্য অ্যামিনো এসিড পেপটাইড বন্ড দ্বারা যুক্ত হয়ে যে বৃহৎ অণু গঠন করে, তাকে প্রোটিন বলে। মানবদেহের গঠনে প্রোটিনের ভূমিকা অপরিসীম।" },
      { 
        type: "figure", 
        imageUrl: "https://images.unsplash.com/photo-1579165466741-7f35e4755660?auto=format&fit=crop&w=800&q=80", 
        caption: "চিত্র: প্রোটিন ফোল্ডিং ও অ্যামিনো এসিড চেইন" 
      },
      { type: "heading", content: "২. প্রোটিনের কাজ" },
      { type: "text", content: "• দেহ গঠন ও বৃদ্ধিসাধন করা।\n• এনজাইম ও হরমোন হিসেবে বিপাকীয় ক্রিয়া নিয়ন্ত্রণ করা।" },
      { type: "3d-viewer", caption: "হিমোগ্লোবিন প্রোটিনের থ্রিডি গঠন" }
    ]
  }
};