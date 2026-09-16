import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apify Lead Extractor Agent | Automated Contact Discovery",
  description: "Autonomous lead extraction agent powered by Apify. Search any professional keyword and instantly extract Name, Phone Number, Email, Designation, and Experience.",
  keywords: ["Apify", "Lead Extraction", "Scraper", "Next.js", "Vercel", "Contact Finder"],
  authors: [{ name: "Apify Agent" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#090d16] text-slate-100 min-h-screen">
        <div className="relative min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
          {/* Subtle ambient light glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
          
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
            <p>Apify Lead Extractor Agent • Designed for deployment on Vercel Serverless Platform</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
