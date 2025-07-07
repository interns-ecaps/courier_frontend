import { LayoutDashboard, Package, Settings, Truck, MapPin } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";



const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Shipments', icon: Package },
  { name: 'Address', icon: MapPin },
  { name: 'Settings', icon: Settings },
];


export default function SideBar() {
 
let {pathname} = useLocation()
pathname=pathname.split("/")[1]

 
  return <nav className="w-80 bg-white bg-opacity-90 backdrop-blur-md border-r border-orange-200 shadow-xl p-8 fixed h-full z-50">
    <div className="border-b border-orange-200 pb-8 mb-8">
      <div className="flex items-center gap-3 text-orange-600 text-2xl font-bold">
        <Truck className="w-8 h-8" />
        CourierPro
      </div>
    </div>

    <ul className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.name}>
          <NavLink to={`/${item.name.toLowerCase()}`} 
             
              className={`w-full active:text-amber-200 flex items-center gap-4 px-6 py-4 text-left rounded-xl transition-all duration-300 relative overflow-hidden group ${pathname === item.name.toLowerCase()
                   ? 'bg-orange-500 text-white shadow-lg'
                   : 'text-gray-600 hover:bg-orange-100 hover:text-orange-600 hover:translate-x-2'
                 }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-200 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
              <Icon className="w-5 h-5 relative z-10" />
              <span className="font-medium relative z-10">{item.name}</span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  </nav>
}