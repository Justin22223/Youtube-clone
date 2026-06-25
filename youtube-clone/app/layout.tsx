"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import CategoryTab from "@/components/category-tab";
import MainLayout from "@/components/main-layout";
import { AuthProvider } from "@/lib/AuthContext";
import { SidebarProvider } from "@/lib/SidebarContext";

import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              <Header />
              <MainLayout>
                {children}
              </MainLayout>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}