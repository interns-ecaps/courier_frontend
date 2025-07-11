import { useState } from "react";
import Navbar from "../components/common/Navbar";
import SideBar from "../components/common/SideBar";

export default function GlobalLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex flex-col md:flex-row w-full">
            {/* Mobile Sidebar Toggle */}
            <button
                className="md:hidden absolute top-9 left-6 z-[40] bg-orange-500 text-white p-2 rounded-full shadow-lg focus:outline-none"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label="Toggle sidebar"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            {/* Sidebar */}
            <div
                className={`z-50 transition-transform duration-300  md:translate-x-0 md:w-80 w-64 fixed md:static top-0 left-0 h-full md:h-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-[150%]'} md:block bg-white bg-opacity-90 backdrop-blur-md border-r border-orange-200 shadow-xl `}
             
            >
                <SideBar />
            </div>
            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#00000025] bg-opacity-30 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0 w-full md:p-8 p-2 transition-all duration-300">
                {/* Header */}
                <Navbar />
                <div className="flex-1 min-h-0 h-full flex flex-col w-full">{children}</div>
            </main>
        </div>
    );
}