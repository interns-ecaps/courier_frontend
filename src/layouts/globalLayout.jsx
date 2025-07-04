import Navbar from "../components/common/Navbar";
import SideBar from "../components/common/SideBar";

export default function GlobalLayout({ children }) {
    return <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex">
        {/* Sidebar */}
        <SideBar />

        {/* Main Content */}
        <main className="flex-1 ml-80 p-8">
            {/* Header */}
            <Navbar />
            {children}
        </main>
    </div>
}