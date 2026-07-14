import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { createCourseCatalog } from "@/lib/catalog";
import type { SemesterInfo } from "@/lib/timetable/types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "신한대학교 시간표 마법사",
  description: "신한대학교 강좌를 검색해 나만의 시간표를 만들어보세요.",
};

/** 백엔드가 죽어도 헤더는 떠야 하므로 학기 표시만 생략한다. */
async function loadSemester(): Promise<SemesterInfo | null> {
  try {
    return (await createCourseCatalog().meta()).semester;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const semester = await loadSemester();

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <SiteHeader semester={semester} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
