import Navbar from "../components/common/Navbar";
import SideBar from "../components/common/SideBar";

export default function GlobalLayout({ children }) {
    return <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex">
        {/* Sidebar */}
        <SideBar className="w-80" />

        {/* Main Content */}
        <main className="flex-1 w-full p-8 ml-80">
            {/* Header */}
            <Navbar />
            {children}
        </main>
    </div>
}