"use client";
import React, { useState, useEffect } from 'react';
import { Noto_Sans_Bengali, Hind_Siliguri } from 'next/font/google';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const notoSansBengali = Noto_Sans_Bengali({ 
  subsets: ['bengali'], 
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali'],
  weight: ['500', '600', '700'],
  display: 'swap',
});

// ==========================================
// Chemistry Formula Formatter (C5H10O5 -> C₅H₁₀O₅)
// ==========================================

function formatChemicalFormula(text: string) {
  if (!text) return text;

  // শুধুমাত্র রাসায়নিক উপাদানের বড় হাতের প্রতীক (C, H, O, N, P, S ইত্যাদি) এর ঠিক পরের সংখ্যা সাবস্ক্রিপ্ট হবে
  // (3-C), (4-C) বা সাধারণ বাংলা/ইংরেজি সংখ্যার কোনো পরিবর্তন হবে না
  const parts = text.split(/\b([A-Z][a-z]?)([0-9]+)\b/g);
  if (parts.length === 1) return text;

  const result: (string | React.ReactNode)[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 3 === 1) {
      result.push(parts[i]); // উপাদান প্রতীক (C, H, O...)
    } else if (i % 3 === 2) {
      result.push(
        <sub key={i} className="text-[0.75em] bottom-[-0.15em] font-bold">
          {parts[i]}
        </sub>
      ); // শুধুমাত্র সংকেতের সংখ্যাটি সাবস্ক্রিপ্ট হবে
    } else if (parts[i]) {
      result.push(parts[i]);
    }
  }
  return <>{result}</>;
}
// ==========================================
// Scalable Interfaces
// ==========================================

export type BlockType = 
  | 'info-list' 
  | 'comparison-table' 
  | 'key-value-box' 
  | 'grid-list' 
  | 'text-block' 
  | 'image-block'
  | 'audio-block'
  | 'video-block'
  | '3d-viewer'
  | 'flashcard-block'
  | 'mcq-block'
  | 'mnemonic-block';

export interface FlashcardItem {
  question: string;
  answer: string;
  hint?: string;
}

export interface McqQuestionItem {
  id: number | string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  tag?: string;
}

export interface MnemonicData {
  title?: string;
  text: string;
  breakdown?: string;
}

export interface Block {
  type: BlockType;
  title?: string;
  badge?: string;
  items?: string[];
  
  tableData?: {
    leftTitle: string;
    rightTitle: string;
    headers?: [string, string];
    leftRows: { name: string; value: string }[];
    rightRows: { name: string; value: string }[];
  };
  keyValueRows?: {
    key: string;
    values: string[];
    isAlert?: boolean;
  }[];
  content?: string;
  cards?: FlashcardItem[];
  questions?: McqQuestionItem[];
  caption?: string | null;

  mnemonic?: MnemonicData | string;

  imageUrl?: string | null;
  imageCaption?: string | null;
  audioUrl?: string | null;
  audioCaption?: string | null;
  videoUrl?: string | null;
  videoCaption?: string | null;
  model3dUrl?: string | null;
  model3dCaption?: string | null;
}

export interface TopicData {
  chapterTitle: string;
  topicName: string;
  references?: string[] | null;
  audiobookUrl?: string | null;
  audiobookTitle?: string | null;
  videoUrl?: string | null;
  videoTitle?: string | null;
  blocks: Block[];
}

export interface TopicItem {
  id: string;
  name: string;
}

export interface Chapter {
  title: string;
  topics: TopicItem[];
}

export interface Subject {
  name: string;
  chapters: Chapter[];
}

// ==========================================
// Mnemonic Box Component (Sub-Box)
// ==========================================

const MnemonicBox: React.FC<{ mnemonic?: MnemonicData | string }> = ({ mnemonic }) => {
  if (!mnemonic) return null;

  const isString = typeof mnemonic === 'string';
  const text = isString ? mnemonic : mnemonic.text;
  const title = !isString && mnemonic.title ? mnemonic.title : "মনে রাখার শর্টকাট (Mnemonic)";
  const breakdown = !isString ? mnemonic.breakdown : undefined;

  return (
    <div className="mt-3.5 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-purple-950/40 dark:to-indigo-950/30 border border-purple-200/90 dark:border-purple-800/60 shadow-2xs">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-purple-600 text-white text-xs font-bold shadow-xs">
          💡
        </span>
        <h3 className={`font-bold text-xs sm:text-sm text-purple-950 dark:text-purple-300 tracking-wide ${hindSiliguri.className}`}>
          {title}
        </h3>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/70 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
          Mnemonic
        </span>
      </div>
      
      <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 leading-relaxed bg-white/70 dark:bg-slate-900/60 p-2 sm:p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/50">
        ✨ {text}
      </p>

      {breakdown && (
        <p className="mt-1.5 text-xs text-purple-800/90 dark:text-purple-300/80 leading-normal pl-1">
          📌 <span className="font-medium">{breakdown}</span>
        </p>
      )}
    </div>
  );
};

// ==========================================
// Standalone Mnemonic Block Template
// ==========================================

const MnemonicBlockTemplate: React.FC<{ block: Block }> = ({ block }) => {
  if (!block.content && !block.mnemonic) return null;

  const isMnemonicObj = typeof block.mnemonic === 'object' && block.mnemonic !== null;
  const mnemonicObj = isMnemonicObj ? (block.mnemonic as MnemonicData) : null;
  const text = block.content || mnemonicObj?.text || (typeof block.mnemonic === 'string' ? block.mnemonic : '');
  const breakdown = mnemonicObj?.breakdown;

  return (
    <section className="bg-gradient-to-r from-purple-50/80 via-fuchsia-50/60 to-indigo-50/80 dark:from-purple-950/40 dark:via-fuchsia-950/30 dark:to-indigo-950/40 rounded-xl p-3.5 sm:p-4 border border-purple-200/90 dark:border-purple-800/60 shadow-2xs space-y-2.5 w-full">
      <div className="flex justify-between items-center border-b border-purple-200/60 dark:border-purple-800/50 pb-2">
        <h2 className={`font-bold text-purple-950 dark:text-purple-300 flex items-center gap-1.5 ${hindSiliguri.className} text-[1.15em]`}>
          <span className="text-purple-700 dark:text-purple-400 text-base">💡</span> {block.title || "মনে রাখার টেকনিক (Mnemonic)"}
        </h2>
        {block.badge ? (
          <span className="text-[0.75em] bg-purple-200/70 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold">
            {block.badge}
          </span>
        ) : (
          <span className="text-[0.75em] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full font-bold">
            শর্টকাট
          </span>
        )}
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-purple-100 dark:border-purple-900/50 space-y-1.5">
        <p className="text-sm font-semibold text-purple-950 dark:text-purple-200 leading-relaxed">
          ✨ {text}
        </p>

        {breakdown && (
          <p className="text-xs text-purple-800 dark:text-purple-300/90 border-t border-purple-100/80 dark:border-purple-900/40 pt-1.5 mt-1 leading-relaxed">
            📌 <span className="font-medium">{breakdown}</span>
          </p>
        )}
      </div>
      <MediaEmbedder block={block} />
    </section>
  );
};

// ==========================================
// Media Embedder (Full Width Modern Look)
// ==========================================

// ==========================================
// Media Embedder (Imagen colapsable con diseño limpio)
// ==========================================
const MediaEmbedder: React.FC<{ block: Block }> = ({ block }) => {
  const [show3D, setShow3D] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);

  const hasImage = Boolean(block.imageUrl);
  const hasAudio = Boolean(block.audioUrl);
  const hasVideo = Boolean(block.videoUrl);
  const has3D = Boolean(block.model3dUrl);

  if (!hasImage && !hasAudio && !hasVideo && !has3D) return null;

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) {
      const id = url.split('/').pop()?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  return (
    <div className="w-full my-2.5 space-y-2">
      {/* Collapsible Image (Heading-er thik niche thakbe) */}
      {hasImage && (
        <div className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 overflow-hidden shadow-2xs transition-all">
          <button
            type="button"
            onClick={() => setIsImageOpen(!isImageOpen)}
            className="w-full py-2 px-3 flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors cursor-pointer select-none text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-teal-600 dark:text-teal-400 text-xs">🖼️</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {block.imageCaption || block.caption || "চিত্র দেখুন (Figure)"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isImageOpen ? "লুকান" : "দেখুন"}
              </span>
              <span className={`text-[10px] text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isImageOpen ? "rotate-180" : ""}`}>
                ▼
              </span>
            </div>
          </button>

          {isImageOpen && (
            <figure className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950/60">
              <div className="w-full flex items-center justify-center p-1 sm:p-2">
                <img 
                  src={block.imageUrl!} 
                  alt={block.imageCaption || block.caption || "Figure"} 
                  className="w-full h-auto max-h-[520px] object-contain rounded-lg"
                  loading="lazy"
                />
              </div>
              {(block.imageCaption || block.caption) && (
                <figcaption className="py-1.5 px-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
                  📷 {block.imageCaption || block.caption}
                </figcaption>
              )}
            </figure>
          )}
        </div>
      )}

      {/* Audio Embed */}
      {hasAudio && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 flex flex-col gap-1 w-full">
          <div className="flex items-center gap-1.5 text-emerald-950 dark:text-emerald-300 font-bold text-xs sm:text-sm">
            <span>🎧</span>
            <span>{block.audioCaption || block.caption || "অডিও লেকচার"}</span>
          </div>
          <audio controls controlsList="nodownload" className="w-full h-8 accent-emerald-700 outline-none" preload="metadata">
            <source src={block.audioUrl!} />
          </audio>
        </div>
      )}

      {/* Video Embed */}
      {hasVideo && (
        <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video w-full">
          {block.videoUrl!.includes('youtube') || block.videoUrl!.includes('youtu.be') ? (
            <iframe 
              src={getVideoEmbedUrl(block.videoUrl!)} 
              title={block.videoCaption || block.caption || "Video Lecture"}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video controls controlsList="nodownload" className="w-full h-full object-contain">
              <source src={block.videoUrl!} />
            </video>
          )}
        </div>
      )}

      {/* 3D Embed */}
      {has3D && (
        <div className="w-full h-64 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden relative flex flex-col items-center justify-center">
          {show3D ? (
            <iframe 
              title={block.model3dCaption || block.caption || "3D View"} 
              src={block.model3dUrl!} 
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; xr-spatial-tracking"
            />
          ) : (
            <div className="text-center p-3">
              <button 
                onClick={() => setShow3D(true)}
                className="mb-1 px-3 py-1 bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                ৩ডি মডেল লোড করুন
              </button>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">{block.model3dCaption || "ইন্টারেক্টিভ ৩ডি ভিউয়ার"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// Key-Value Box
// ==========================================

const KeyValueBoxTemplate: React.FC<{ block: Block }> = ({ block }) => (
  <section className="bg-white dark:bg-slate-900 rounded-xl py-3 px-2.5 sm:px-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 w-full">
    {block.title && (
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
        <h2 className={`font-bold text-emerald-900 dark:text-emerald-400 flex items-center gap-1.5 ${hindSiliguri.className} text-[1.15em]`}>
          <span className="text-emerald-700 dark:text-emerald-500 text-sm">❖</span> {block.title}
        </h2>
        {block.badge && (
          <span className="text-[0.75em] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 font-bold shrink-0">
            {block.badge}
          </span>
        )}
      </div>
    )}
    
    <div className="space-y-3 leading-relaxed w-full">
      {block.keyValueRows?.map((row, idx) => (
        <div 
          key={idx} 
          className={`rounded-lg border overflow-hidden transition-all w-full shadow-2xs ${
            row.isAlert 
              ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 border-l-[4px] border-l-amber-500" 
              : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 border-l-[4px] border-l-teal-600 dark:border-l-teal-500"
          }`}
        >
          <div className={`px-3 py-1.5 flex items-center justify-between border-b ${
            row.isAlert
              ? "bg-amber-100/70 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-900 text-amber-950 dark:text-amber-300"
              : "bg-teal-50/80 dark:bg-teal-950/50 border-teal-100 dark:border-teal-900 text-teal-950 dark:text-teal-300"
          }`}>
            <span className={`font-bold text-[0.85em] tracking-wide flex items-center gap-1.5 ${hindSiliguri.className}`}>
              <span className={`text-[0.8em] ${row.isAlert ? "text-amber-700 dark:text-amber-400" : "text-teal-700 dark:text-teal-400"}`}>✦</span>
              {row.key}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 space-y-1.5 w-full">
            {row.values.map((v, i) => {
              const colonIndex = v.indexOf(":");
              const isSubHeading = 
                colonIndex > 0 && 
                colonIndex <= 30 && 
                !/[\d০-৯]/.test(v[colonIndex - 1] || '') &&
                !/[\d০-৯]/.test(v[colonIndex + 1] || '');

              return (
                <div key={i} className="flex items-start gap-1.5 leading-relaxed w-full break-words">
                  <span className={`mt-1 select-none font-bold shrink-0 text-[0.75em] ${
                    row.isAlert ? "text-amber-600 dark:text-amber-400" : "text-teal-600 dark:text-teal-400"
                  }`}>
                    •
                  </span>

                  <div className="flex-1 min-w-0">
                    {isSubHeading ? (
                      <p className="text-slate-800 dark:text-slate-200 break-words">
                        <strong className={row.isAlert ? "text-amber-950 dark:text-amber-300 font-bold" : "text-teal-900 dark:text-teal-300 font-bold"}>
                          {v.slice(0, colonIndex).trim()}
                        </strong>
                        <span className="font-medium text-slate-800 dark:text-slate-300">
                          : {formatChemicalFormula(v.slice(colonIndex + 1).trim())}
                        </span>
                      </p>
                    ) : (
                      <p className={`break-words ${row.isAlert ? "text-amber-950 dark:text-amber-300 font-medium" : "text-slate-800 dark:text-slate-200"}`}>
                        {formatChemicalFormula(v)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
    
    <MnemonicBox mnemonic={block.mnemonic} />
    <MediaEmbedder block={block} />
  </section>
);

// ==========================================
// Info List
// ==========================================

const InfoListTemplate: React.FC<{ block: Block }> = ({ block }) => (
  <section className="bg-white dark:bg-slate-900 rounded-xl py-3 px-2.5 sm:px-4 border border-slate-200 dark:border-slate-800 shadow-2xs w-full">
    {block.title && (
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
        <h2 className={`font-bold text-emerald-900 dark:text-emerald-400 flex items-center gap-1.5 ${hindSiliguri.className} text-[1.15em]`}>
          <span className="text-emerald-700 dark:text-emerald-500 text-sm">❖</span> {block.title}
        </h2>
        {block.badge && (
          <span className="text-[0.75em] bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">
            {block.badge}
          </span>
        )}
      </div>
    )}
    <ul className="space-y-1.5 text-slate-800 dark:text-slate-200 leading-relaxed">
      {block.items?.map((item, idx) => (
        <li key={idx} className="flex items-start gap-1.5 break-words">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold mt-1 select-none text-[0.8em] shrink-0">✦</span>
          <span className="flex-1 min-w-0 text-slate-800 dark:text-slate-200">{formatChemicalFormula(item)}</span>
        </li>
      ))}
    </ul>
    
    <MnemonicBox mnemonic={block.mnemonic} />
    <MediaEmbedder block={block} />
  </section>
);

// ==========================================
// Comparison Table (with Chemical Subscripts)
// ==========================================

const ComparisonTableTemplate: React.FC<{ block: Block }> = ({ block }) => {
  const { tableData } = block;
  if (!tableData) return null;

  return (
    <section className="space-y-2 w-full">
      {block.title && (
        <div className="flex justify-between items-center px-1">
          <h2 className={`font-bold text-emerald-900 dark:text-emerald-400 flex items-center gap-1.5 ${hindSiliguri.className} text-[1.15em]`}>
            <span className="text-emerald-700 dark:text-emerald-500 text-sm">❖</span> {block.title}
          </h2>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[380px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-bold text-[0.95em]">
                <th className="py-2 px-2.5 w-1/3 text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">বিষয়</th>
                <th className="py-2 px-2.5 w-1/3 text-emerald-950 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 border-r border-slate-200 dark:border-slate-800">{tableData.leftTitle}</th>
                <th className="py-2 px-2.5 w-1/3 text-sky-950 dark:text-sky-300 bg-sky-50/70 dark:bg-sky-950/40">{tableData.rightTitle}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 leading-relaxed">
              {tableData.leftRows.map((row, idx) => {
                const rightRow = tableData.rightRows[idx];
                return (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-2.5 font-semibold text-slate-900 dark:text-slate-200 bg-slate-50/40 dark:bg-slate-800/20 border-r border-slate-200 dark:border-slate-800">{row.name}</td>
                    <td className="py-2 px-2.5 text-emerald-900 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800">
                      {formatChemicalFormula(row.value)}
                    </td>
                    <td className="py-2 px-2.5 text-sky-900 dark:text-sky-300">
                      {rightRow ? formatChemicalFormula(rightRow.value) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <MnemonicBox mnemonic={block.mnemonic} />
      <MediaEmbedder block={block} />
    </section>
  );
};

// ==========================================
// Grid List
// ==========================================

const GridListTemplate: React.FC<{ block: Block }> = ({ block }) => (
  <section className="bg-white dark:bg-slate-900 rounded-xl py-3 px-2.5 sm:px-4 border border-slate-200 dark:border-slate-800 shadow-2xs w-full">
    {block.title && (
      <h2 className={`font-bold text-emerald-900 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2 flex items-center gap-1.5 ${hindSiliguri.className} text-[1.15em]`}>
        <span className="text-emerald-700 dark:text-emerald-500 text-sm">❖</span> {block.title}
      </h2>
    )}
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {block.items?.map((item, idx) => (
        <li key={idx} className="flex items-center gap-1.5 bg-slate-50/80 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 font-medium break-words leading-relaxed">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[0.85em] select-none shrink-0">✔</span>
          <span className="min-w-0 flex-1">{formatChemicalFormula(item)}</span>
        </li>
      ))}
    </ul>
    
    <MnemonicBox mnemonic={block.mnemonic} />
    <MediaEmbedder block={block} />
  </section>
);

// ==========================================
// Minimalist Professional Assessment Box
// ==========================================

const UnifiedAssessmentBox: React.FC<{
  flashcards: FlashcardItem[];
  mcqs: McqQuestionItem[];
}> = ({ flashcards, mcqs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'flashcards' | 'mcq'>('flashcards');

  // Flashcard State
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false); // ক্লু লুকানো/দেখানোর স্টেট
  const [cardAnimKey, setCardAnimKey] = useState(0);

  // MCQ State
  const [mcqIndex, setMcqIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<McqQuestionItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string | number]: number }>({});
  const [showExplanation, setShowExplanation] = useState<{ [qId: string | number]: boolean }>({});
  const [mcqAnimKey, setMcqAnimKey] = useState(0);

  useEffect(() => {
    if (mcqs && mcqs.length > 0) {
      const randomized = [...mcqs].sort(() => 0.5 - Math.random());
      setShuffledQuestions(randomized);
      setSelectedAnswers({});
      setShowExplanation({});
      setMcqIndex(0);
    }
  }, [mcqs]);

  useEffect(() => {
    if (flashcards.length === 0 && mcqs.length > 0) {
      setActiveTab('mcq');
    } else {
      setActiveTab('flashcards');
    }
    setCardIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  }, [flashcards.length, mcqs.length]);

  const handleNextCard = () => {
    if (cardIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setShowHint(false);
      setCardIndex((prev) => prev + 1);
      setCardAnimKey((prev) => prev + 1);
    }
  };

  const handlePrevCard = () => {
    if (cardIndex > 0) {
      setIsFlipped(false);
      setShowHint(false);
      setCardIndex((prev) => prev - 1);
      setCardAnimKey((prev) => prev + 1);
    }
  };

  const handleSelect = (qId: string | number, optIdx: number) => {
    if (selectedAnswers[qId] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const toggleExp = (qId: string | number) => {
    setShowExplanation((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleNextMcq = () => {
    if (mcqIndex < shuffledQuestions.length - 1) {
      setMcqIndex((prev) => prev + 1);
      setMcqAnimKey((prev) => prev + 1);
    }
  };

  const handlePrevMcq = () => {
    if (mcqIndex > 0) {
      setMcqIndex((prev) => prev - 1);
      setMcqAnimKey((prev) => prev + 1);
    }
  };

  const handleResetMcq = () => {
    if (mcqs && mcqs.length > 0) {
      setShuffledQuestions([...mcqs].sort(() => 0.5 - Math.random()));
    }
    setSelectedAnswers({});
    setShowExplanation({});
    setMcqIndex(0);
    setMcqAnimKey((prev) => prev + 1);
  };

  const totalQuestions = shuffledQuestions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = shuffledQuestions.filter((q) => selectedAnswers[q.id] === q.correctIndex).length;

  if (flashcards.length === 0 && mcqs.length === 0) return null;

  const currentCard = flashcards[cardIndex];
  const currentMcq = shuffledQuestions[mcqIndex];

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden w-full transition-all mt-6">
      
      {/* Clean Minimalist Header (English title, matching note boxes) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3.5 px-4 sm:px-5 flex items-center justify-between border-l-[4px] border-l-teal-600 dark:border-l-teal-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors cursor-pointer text-left select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-teal-700 dark:text-teal-400 font-bold text-sm">✦</span>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight font-sans">
              Self-Assessment & Practice
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {flashcards.length > 0 && `${flashcards.length}টি রিকল কার্ড`}
              {flashcards.length > 0 && mcqs.length > 0 && " • "}
              {mcqs.length > 0 && `${mcqs.length}টি প্র্যাকটিস MCQ`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 hidden sm:inline">
            {isOpen ? "লুকান" : "অনুশীলন শুরু করুন"}
          </span>
          <span className={`text-xs text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Expanded Clean Workspace */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
          
          {/* Segmented Tabs */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {flashcards.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('flashcards'); setIsFlipped(false); setShowHint(false); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'flashcards'
                      ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  রিকল কার্ড ({flashcards.length})
                </button>
              )}

              {mcqs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('mcq')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'mcq'
                      ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  এমসিকিউ টেস্ট ({mcqs.length})
                </button>
              )}
            </div>

            {activeTab === 'mcq' && mcqs.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                {answeredCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800">
                    স্কোর: {correctCount}/{totalQuestions}
                  </span>
                )}
                <button
                  onClick={handleResetMcq}
                  className="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 transition cursor-pointer flex items-center gap-1"
                  title="নতুন করে সাজান"
                >
                  <span>🔄</span>
                  <span>শাফেল</span>
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: RECALL FLASHCARD */}
          {activeTab === 'flashcards' && currentCard && (
            <div key={cardAnimKey} className="space-y-3.5 max-w-xl mx-auto py-1 animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-0.5">
                <span className="font-semibold">কার্ড {cardIndex + 1} / {flashcards.length}</span>
                <span className="text-[11px] text-teal-700 dark:text-teal-400">ক্লিক করে উত্তর দেখুন</span>
              </div>

              {/* Minimal Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-600 dark:bg-teal-500 h-full transition-all duration-300"
                  style={{ width: `${((cardIndex + 1) / flashcards.length) * 100}%` }}
                />
              </div>

              {/* 3D Flip Card */}
              <div 
                className="w-full min-h-[200px] cursor-pointer select-none"
                style={{ perspective: '1000px' }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div 
                  className="relative w-full min-h-[200px] transition-transform duration-500"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* Front Side: Question */}
                  <div 
                    className="absolute inset-0 w-full h-full rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-2xs hover:border-teal-500/60 transition-colors"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        প্রশ্ন
                      </span>
                      <span className="text-[11px] text-slate-400">
                        উত্তর জানতে ট্যাপ করুন 👆
                      </span>
                    </div>

                    <div className="my-auto py-3 text-center px-1">
                      <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                        {formatChemicalFormula(currentCard.question)}
                      </p>
                    </div>

                    {/* Bottom: Hint & Flip trigger */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <div>
                        {currentCard.hint ? (
                          showHint ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px] animate-in fade-in duration-150">
                              💡 ক্লু: {currentCard.hint}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowHint(true);
                              }}
                              className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800"
                            >
                              💡 ক্লু দেখতে ক্লিক করুন
                            </button>
                          )
                        ) : null}
                      </div>
                      <span className="text-[10px] ml-auto">উল্টান ↺</span>
                    </div>
                  </div>

                  {/* Back Side: Answer */}
                  <div 
                    className="absolute inset-0 w-full h-full rounded-xl p-5 border border-teal-600/70 bg-teal-900 text-white flex flex-col justify-between shadow-md"
                    style={{ 
                      backfaceVisibility: 'hidden', 
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-800 text-teal-100 uppercase tracking-wider">
                        উত্তর
                      </span>
                      <span className="text-[11px] text-teal-200">
                        প্রশ্ন দেখতে ট্যাপ করুন ↺
                      </span>
                    </div>

                    <div className="my-auto py-3 text-center px-1">
                      <p className="text-base sm:text-lg font-bold text-teal-50 leading-relaxed">
                        {formatChemicalFormula(currentCard.answer)}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-teal-800/80 flex items-center justify-between text-xs text-teal-200">
                      <span className="text-[11px]">রিকল সম্পন্ন</span>
                      <span className="text-[10px] ml-auto">আবার উল্টান ↺</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prev / Next Controls */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handlePrevCard}
                  disabled={cardIndex === 0}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  পূর্ববর্তী
                </button>

                <span className="text-xs text-slate-500 font-medium">
                  {cardIndex + 1} / {flashcards.length}
                </span>

                <button
                  type="button"
                  onClick={handleNextCard}
                  disabled={cardIndex === flashcards.length - 1}
                  className="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  পরবর্তী
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CLEAN PROFESSIONAL MCQ TEST */}
          {activeTab === 'mcq' && currentMcq && (
            <div key={mcqAnimKey} className="space-y-3.5 max-w-xl mx-auto py-1 animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-0.5">
                <span className="font-semibold">প্রশ্ন {mcqIndex + 1} / {totalQuestions}</span>
                <span>উত্তর দেওয়া হয়েছে: {answeredCount}/{totalQuestions}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-600 dark:bg-teal-500 h-full transition-all duration-300"
                  style={{ width: `${((mcqIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>

              {/* Clean MCQ Box */}
              <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3.5">
                
                <div className="flex items-start justify-between gap-2.5">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug break-words flex-1">
                    <span className="text-teal-700 dark:text-teal-400 mr-1.5">{mcqIndex + 1}.</span> 
                    {formatChemicalFormula(currentMcq.question)}
                  </h3>

                  {currentMcq.tag && (
                    <span className="shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap self-start">
                      {currentMcq.tag}
                    </span>
                  )}
                </div>

                {/* Minimalist Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-1">
                  {currentMcq.options.map((opt, oIdx) => {
                    const selected = selectedAnswers[currentMcq.id];
                    const isAnswered = selected !== undefined;
                    const letter = String.fromCharCode(65 + oIdx);

                    let cardClass = "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-teal-500 hover:bg-slate-100/60 dark:hover:bg-slate-800";
                    let badgeClass = "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600";

                    if (isAnswered) {
                      if (oIdx === currentMcq.correctIndex) {
                        cardClass = "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-600 text-emerald-950 dark:text-emerald-200 font-semibold";
                        badgeClass = "bg-emerald-600 text-white border-emerald-600";
                      } else if (selected === oIdx) {
                        cardClass = "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-950 dark:text-rose-200 font-semibold";
                        badgeClass = "bg-rose-600 text-white border-rose-600";
                      } else {
                        cardClass = "bg-slate-50/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-400 opacity-50";
                        badgeClass = "bg-transparent text-slate-400 border-slate-200 dark:border-slate-700";
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={isAnswered}
                        onClick={() => handleSelect(currentMcq.id, oIdx)}
                        className={`p-2.5 rounded-lg border text-left font-medium transition-all flex items-center justify-between gap-2.5 cursor-pointer text-xs sm:text-sm ${cardClass}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${badgeClass}`}>
                            {letter}
                          </span>
                          <span className="break-words leading-relaxed">{formatChemicalFormula(opt)}</span>
                        </div>

                        {isAnswered && oIdx === currentMcq.correctIndex && (
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">✓</span>
                        )}
                        {isAnswered && selected === oIdx && oIdx !== currentMcq.correctIndex && (
                          <span className="text-rose-600 dark:text-rose-400 font-bold text-xs shrink-0">✕</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Section */}
                {selectedAnswers[currentMcq.id] !== undefined && currentMcq.explanation && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-end mb-1.5">
                      <button
                        onClick={() => toggleExp(currentMcq.id)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-teal-700 dark:hover:text-teal-400 underline cursor-pointer"
                      >
                        {showExplanation[currentMcq.id] ? "ব্যাখ্যা লুকান ▲" : "ব্যাখ্যা দেখুন ▼"}
                      </button>
                    </div>

                    {showExplanation[currentMcq.id] && (
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 leading-relaxed text-xs animate-in fade-in duration-150">
                        💡 <strong>ব্যাখ্যা:</strong> {formatChemicalFormula(currentMcq.explanation)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Prev / Next Minimal Controls */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handlePrevMcq}
                  disabled={mcqIndex === 0}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  পূর্ববর্তী
                </button>

                <span className="text-xs text-slate-500 font-medium">
                  {mcqIndex + 1} / {totalQuestions}
                </span>

                <button
                  type="button"
                  onClick={handleNextMcq}
                  disabled={mcqIndex === totalQuestions - 1}
                  className="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  পরবর্তী
                </button>
              </div>

            </div>
          )}

        </div>
      )}
    </section>
  );
};

// ==========================================
// Dynamic Router (Notes, Tables, Lists etc.)
// ==========================================

const DynamicBlockRenderer: React.FC<{ blocks: Block[] }> = ({ blocks }) => (
  <div className="space-y-3 sm:space-y-4 w-full">
    {blocks.map((block, index) => {
      switch (block.type) {
        case 'info-list':
          return <InfoListTemplate key={index} block={block} />;
        case 'comparison-table':
          return <ComparisonTableTemplate key={index} block={block} />;
        case 'key-value-box':
          return <KeyValueBoxTemplate key={index} block={block} />;
        case 'grid-list':
          return <GridListTemplate key={index} block={block} />;
        case 'mnemonic-block':
          return <MnemonicBlockTemplate key={index} block={block} />;
        case 'text-block':
          return (
            <div key={index} className="bg-white dark:bg-slate-900 py-3 px-2.5 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 leading-relaxed shadow-2xs font-normal w-full break-words">
              {formatChemicalFormula(block.content || "")}
              <MnemonicBox mnemonic={block.mnemonic} />
              <MediaEmbedder block={block} />
            </div>
          );
        // Flashcard and MCQ are extracted to UnifiedAssessmentBox
        default:
          return null;
      }
    })}
  </div>
);

// ==========================================
// Main Scalable Page
// ==========================================

export default function DynamicStudyPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeTopicId, setActiveTopicId] = useState<string>("");
  const [topicData, setTopicData] = useState<TopicData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [navLoading, setNavLoading] = useState<boolean>(true);

  // Collapsible Media State
  const [activeMedia, setActiveMedia] = useState<'audio' | 'video' | null>(null);

  // Theme State Handling
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('bio_note_theme');
    let shouldBeDark = false;

    if (savedTheme) {
      shouldBeDark = savedTheme === 'dark';
    } else {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem('bio_note_theme', nextDark ? 'dark' : 'light');
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const [openedSubjectName, setOpenedSubjectName] = useState<string | null>(null);
  const [openedChapterKey, setOpenedChapterKey] = useState<string | null>(null);
  
  const [fontSizeLevel, setFontSizeLevel] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');

  const fontSizeClassMap = {
    sm: 'text-[13px] sm:text-[14px]',
    base: 'text-[15px] sm:text-[16px]',
    lg: 'text-[17px] sm:text-[18px]',
    xl: 'text-[19px] sm:text-[20px]',
  };

  const handleZoomIn = () => {
    if (fontSizeLevel === 'sm') setFontSizeLevel('base');
    else if (fontSizeLevel === 'base') setFontSizeLevel('lg');
    else if (fontSizeLevel === 'lg') setFontSizeLevel('xl');
  };

  const handleZoomOut = () => {
    if (fontSizeLevel === 'xl') setFontSizeLevel('lg');
    else if (fontSizeLevel === 'lg') setFontSizeLevel('base');
    else if (fontSizeLevel === 'base') setFontSizeLevel('sm');
  };

  const handleResetZoom = () => {
    setFontSizeLevel('base');
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchNavigation() {
      setNavLoading(true);
      try {
        const navDoc = await getDoc(doc(db, "navigation", "syllabus"));
        if (navDoc.exists()) {
          const navData = navDoc.data();
          const subjectList: Subject[] = navData.subjects || [];
          setSubjects(subjectList);

          let firstTopicFound = "";
          for (const sub of subjectList) {
            if (sub.chapters && sub.chapters.length > 0) {
              for (const ch of sub.chapters) {
                if (ch.topics && ch.topics.length > 0) {
                  firstTopicFound = ch.topics[0].id;
                  break;
                }
              }
            }
            if (firstTopicFound) break;
          }

          if (firstTopicFound) {
            setActiveTopicId(firstTopicFound);
          }
        }
      } catch (err) {
        console.error("Navigation load error:", err);
      } finally {
        setNavLoading(false);
      }
    }

    fetchNavigation();
  }, []);

  useEffect(() => {
    if (!activeTopicId) return;

    async function fetchTopicData() {
      setLoading(true);
      try {
        const docRef = doc(db, "topics", activeTopicId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as TopicData;
          setTopicData(data);
          setActiveMedia(null);
        } else {
          setTopicData(null);
        }
      } catch (err) {
        console.error("Topic load error:", err);
        setTopicData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchTopicData();
  }, [activeTopicId]);

  const handleToggleSubject = (subName: string) => {
    setOpenedSubjectName((prev) => (prev === subName ? null : subName));
  };

  const handleToggleChapter = (key: string) => {
    setOpenedChapterKey((prev) => (prev === key ? null : key));
  };

  const handleTopicClick = (id: string) => {
    setActiveTopicId(id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) {
      const id = url.split('/').pop()?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  // Collect all flashcards & MCQs from blocks array
  const allFlashcards: FlashcardItem[] = [];
  const allMcqs: McqQuestionItem[] = [];

  topicData?.blocks?.forEach((block) => {
    if (block.type === 'flashcard-block' && block.cards) {
      allFlashcards.push(...block.cards);
    }
    if (block.type === 'mcq-block' && block.questions) {
      allMcqs.push(...block.questions);
    }
  });

  return (
    <div className={`${isDarkMode ? 'dark' : ''} flex flex-col h-screen w-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden ${notoSansBengali.className} antialiased transition-colors duration-200`}>
      
      {/* Top Navbar */}
      <header className="h-12 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-2.5 sm:px-4 shrink-0 z-30 transition-colors">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="py-1 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            title={isSidebarOpen ? "সূচিপত্র লুকান" : "সূচিপত্র দেখান"}
          >
            <span className="text-sm">☰</span>
            <span className="font-semibold text-xs">সূচিপত্র</span>
          </button>
          
          {topicData && (
            <span className={`text-xs font-bold text-emerald-900 dark:text-emerald-400 truncate lg:hidden ${hindSiliguri.className}`}>
              {topicData.chapterTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer"
            title={isDarkMode ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
          >
            {mounted && isDarkMode ? (
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Font Size Controller */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={handleZoomOut}
              disabled={fontSizeLevel === 'sm'}
              className="px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
              title="ফন্ট ছোট করুন"
            >
              A-
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 rounded transition"
              title="ডিফল্ট ফন্ট সাইজ"
            >
              {fontSizeLevel === 'sm' && '75%'}
              {fontSizeLevel === 'base' && '100%'}
              {fontSizeLevel === 'lg' && '125%'}
              {fontSizeLevel === 'xl' && '150%'}
            </button>
            <button
              onClick={handleZoomIn}
              disabled={fontSizeLevel === 'xl'}
              className="px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
              title="ফন্ট বড় করুন"
            >
              A+
            </button>
          </div>

          {topicData && (
            <div className="hidden lg:flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-xs pl-2.5 border-l border-slate-200 dark:border-slate-800">
              <span className="truncate">{topicData.chapterTitle}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex flex-1 w-full overflow-hidden relative">
        
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
          />
        )}

        {/* 3-Tier Collapsible Sidebar */}
        <aside 
          className={`fixed lg:static top-12 bottom-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 lg:z-10 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none flex flex-col h-[calc(100dvh-3rem)] lg:h-[calc(100vh-3rem)]
            ${isSidebarOpen 
              ? 'w-72 sm:w-80 opacity-100 translate-x-0' 
              : 'w-0 opacity-0 -translate-x-full lg:translate-x-0 border-r-0 pointer-events-none'
            }`}
        >
          <div className="p-3 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
            <h2 className={`text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 ${hindSiliguri.className}`}>
              <span className="text-emerald-700 dark:text-emerald-400">📖</span> সূচিপত্র তালিকা
            </h2>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold p-1 rounded-md cursor-pointer"
              title="সাইডবার বন্ধ করুন"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-2 touch-auto">
            {navLoading ? (
              <div className="text-xs font-medium text-slate-500 py-4 text-center">লোড হচ্ছে...</div>
            ) : subjects.length === 0 ? (
              <div className="text-xs font-medium text-slate-500 py-4 text-center">কোনো তথ্য নেই</div>
            ) : (
              subjects.map((sub, sIdx) => {
                const isSubjectOpen = openedSubjectName === sub.name;

                return (
                  <div key={sIdx} className="border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40 shadow-2xs">
                    <button
                      onClick={() => handleToggleSubject(sub.name)}
                      className={`flex items-center justify-between w-full px-3 py-2.5 text-xs sm:text-sm font-bold text-left transition-all cursor-pointer ${
                        isSubjectOpen
                          ? "bg-emerald-800 dark:bg-emerald-900 text-white shadow-xs"
                          : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      } ${hindSiliguri.className}`}
                    >
                      <span className="tracking-wide uppercase flex items-center gap-1.5 truncate">
                        <span>🔬</span> {sub.name}
                      </span>
                      <span className="text-[10px] ml-1 shrink-0">
                        {isSubjectOpen ? '▲' : '▼'}
                      </span>
                    </button>

                    {isSubjectOpen && (
                      <div className="p-1.5 space-y-1 bg-slate-50/40 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800">
                        {sub.chapters && sub.chapters.length > 0 ? (
                          sub.chapters.map((ch, cIdx) => {
                            const chapterKey = `${sub.name}-${ch.title}`;
                            const isChapterOpen = openedChapterKey === chapterKey;

                            return (
                              <div key={cIdx} className="rounded-lg overflow-hidden border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <button 
                                  onClick={() => handleToggleChapter(chapterKey)}
                                  className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs font-semibold text-left transition-all cursor-pointer ${
                                    isChapterOpen 
                                      ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-300 font-bold" 
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                  }`}
                                >
                                  <span className="line-clamp-1">{ch.title}</span>
                                  <span className="text-[9px] ml-1 text-slate-400 shrink-0">
                                    {isChapterOpen ? '▲' : '▼'}
                                  </span>
                                </button>

                                {isChapterOpen && (
                                  <div className="flex flex-col gap-0.5 p-1 pl-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
                                    {ch.topics && ch.topics.length > 0 ? (
                                      ch.topics.map((tp) => (
                                        <button
                                          key={tp.id}
                                          onClick={() => handleTopicClick(tp.id)}
                                          className={`text-left px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                                            activeTopicId === tp.id 
                                              ? "bg-emerald-700 text-white font-bold shadow-2xs" 
                                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                                          }`}
                                        >
                                          {tp.name}
                                        </button>
                                      ))
                                    ) : (
                                      <span className="text-[11px] text-slate-400 p-1">কোনো টপিক নেই</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-[11px] text-slate-400 p-2 text-center">কোনো অধ্যায় নেই</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            
            <div className="h-14 w-full shrink-0"></div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 min-w-0 h-[calc(100dvh-3rem)] lg:h-[calc(100vh-3rem)] py-4 px-2 sm:px-5 overflow-y-auto overscroll-contain scroll-smooth transition-all duration-300 ${fontSizeClassMap[fontSizeLevel]}`}>
          <div className="max-w-5xl mx-auto pb-20 w-full">

            {loading ? (
              <div className="flex justify-center items-center h-56">
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-emerald-700 border-t-transparent"></div>
              </div>
            ) : topicData ? (
              <article className="space-y-3.5 sm:space-y-4 w-full">
                
                {/* Header with Title and Media Action Buttons */}
                <header className="border-b border-slate-200 dark:border-slate-800 pb-3 w-full space-y-2.5">
                  <div className="flex items-center justify-between gap-2 w-full">
                    
                    {/* Topic Title */}
                    <h1 className={`font-extrabold text-slate-950 dark:text-slate-100 tracking-tight leading-snug break-words text-base sm:text-xl md:text-2xl flex-1 min-w-0 ${hindSiliguri.className}`}>
                      {topicData.topicName}
                    </h1>

                    {/* Audio & Video Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {topicData.audiobookUrl && (
                        <button
                          onClick={() => setActiveMedia(prev => prev === 'audio' ? null : 'audio')}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                            activeMedia === 'audio'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          }`}
                          title="অডিও লেকচার"
                        >
                          <span>🎧</span>
                          <span className="hidden xs:inline sm:inline">{activeMedia === 'audio' ? 'লুকান' : 'অডিও বুক'}</span>
                          <span className="xs:hidden sm:hidden">{activeMedia === 'audio' ? 'লুকান' : 'অডিও'}</span>
                        </button>
                      )}

                      {topicData.videoUrl && (
                        <button
                          onClick={() => setActiveMedia(prev => prev === 'video' ? null : 'video')}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                            activeMedia === 'video'
                              ? 'bg-rose-700 text-white shadow-xs'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                          }`}
                          title="ভিডিও ক্লাস"
                        >
                          <span>🎬</span>
                          <span className="hidden xs:inline sm:inline">{activeMedia === 'video' ? 'লুকান' : 'ভিডিও ক্লাস'}</span>
                          <span className="xs:hidden sm:hidden">{activeMedia === 'video' ? 'লুকান' : 'ভিডিও'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {topicData.references && topicData.references.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-[0.75em] text-slate-600 dark:text-slate-400 font-medium">
                      {topicData.references.map((ref, i) => (
                        <span key={i} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                          {ref}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Collapsible Audio Player */}
                  {activeMedia === 'audio' && topicData.audiobookUrl && (
                    <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white p-3 sm:p-4 rounded-xl shadow-md border border-emerald-600/40 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-xs shrink-0">
                            🎧
                          </span>
                          <span className={`text-xs sm:text-sm font-bold truncate ${hindSiliguri.className}`}>
                            {topicData.audiobookTitle || `${topicData.topicName} — সম্পূর্ণ অডিও শুনুন`}
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveMedia(null)}
                          className="text-xs text-emerald-200 hover:text-white font-bold ml-2 shrink-0 cursor-pointer"
                        >
                          ✕ বন্ধ করুন
                        </button>
                      </div>

                      <div className="bg-white/10 dark:bg-black/30 p-2 rounded-lg backdrop-blur-xs">
                        <audio
                          controls
                          className="w-full h-8 outline-none"
                          preload="metadata"
                          controlsList="nodownload noplaybackrate"
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          <source src={topicData.audiobookUrl} />
                        </audio>
                      </div>
                    </div>
                  )}

                  {/* Collapsible Video Player */}
                  {activeMedia === 'video' && topicData.videoUrl && (
                    <div className="bg-slate-900 p-2 sm:p-3 rounded-xl shadow-md border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between mb-2 px-1 text-slate-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-rose-600/80 flex items-center justify-center text-xs text-white shrink-0">
                            🎬
                          </span>
                          <span className={`text-xs sm:text-sm font-bold truncate ${hindSiliguri.className}`}>
                            {topicData.videoTitle || `${topicData.topicName} — ভিডিও ক্লাস`}
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveMedia(null)}
                          className="text-xs text-slate-400 hover:text-white font-bold ml-2 shrink-0 cursor-pointer"
                        >
                          ✕ বন্ধ করুন
                        </button>
                      </div>

                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                        {topicData.videoUrl.includes('youtube') || topicData.videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={getVideoEmbedUrl(topicData.videoUrl)}
                            title={topicData.videoTitle || "Topic Video"}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            controls
                            className="w-full h-full object-contain"
                            controlsList="nodownload"
                            onContextMenu={(e) => e.preventDefault()}
                          >
                            <source src={topicData.videoUrl} />
                          </video>
                        )}
                      </div>
                    </div>
                  )}
                </header>

                {/* Dynamic Block Renderer */}
                <DynamicBlockRenderer blocks={topicData.blocks || []} />

                {/* Unified Assessment Box */}
                <UnifiedAssessmentBox 
                  flashcards={allFlashcards} 
                  mcqs={allMcqs} 
                />

              </article>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <h2 className={`font-bold text-slate-800 dark:text-slate-200 mb-1 text-[1.1em] ${hindSiliguri.className}`}>কোনো কন্টেন্ট পাওয়া যায়নি</h2>
                <p className="text-xs text-slate-400 font-mono">
                  topics/{activeTopicId || "undefined"}
                </p>
              </div>
            )}

          </div>
        </main>

      </div>
    </div>
  );
}