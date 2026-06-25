"use client";

import React, { Suspense } from "react";
import Sidebar from "./sidebar";
import CategoryTab from "./category-tab";
import { useSidebar } from "@/lib/SidebarContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen } = useSidebar();
  
  return (
    <div className="flex relative">
      <Suspense fallback={<div className="md:w-64 w-0 flex-shrink-0" />}>
        <Sidebar />
      </Suspense>
      <main 
        className={`flex-1 overflow-x-hidden transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        <CategoryTab />
        <div className="p-4 sm:p-6 pt-8 sm:pt-10">
          {children}
        </div>
      </main>
    </div>
  );
}
