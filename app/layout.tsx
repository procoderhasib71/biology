import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";

const hind = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "বায়োলজি লার্নিং প্ল্যাটফর্ম",
  description: "Interactive Biology Learning Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`${hind.className} h-full`} suppressHydrationWarning>
      <head>
        {/* Page load howar age instant theme check kore dark class add korbe, jate white flash na kore */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('bio_note_theme');
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && systemDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-200 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}