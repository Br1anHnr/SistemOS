import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { getActiveSemester, getAllSemesters } from "@/services/semester.service";

export const metadata: Metadata = {
  title: "SistemOS — Academic Operating System",
  description: "Sistema pessoal para gestão acadêmica e planejamento de estudos.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let activeSemester = null;
  let allSemesters: Array<{ id: string; name: string }> = [];

  try {
    activeSemester = await getActiveSemester();
    const semesters = await getAllSemesters();
    allSemesters = semesters.map((s) => ({ id: s.id, name: s.name }));
  } catch (error) {
    console.error("Error fetching semesters in root layout:", error);
  }

  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased bg-neutral-950 text-neutral-100 font-sans">
        <AppShell
          activeSemester={
            activeSemester
              ? {
                  id: activeSemester.id,
                  name: activeSemester.name,
                  academicTerm: activeSemester.academicTerm,
                  academicYear: activeSemester.academicYear,
                }
              : null
          }
          availableSemesters={allSemesters}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
