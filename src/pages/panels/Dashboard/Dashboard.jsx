import React, { useState, useEffect } from 'react';
import {

  Package,

  Truck,
  LogOut,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Edit2,
  Plus
} from 'lucide-react';
import SideBar from '../../../components/common/SideBar';
import Navbar from '../../../components/common/Navbar';



const CourierDashboard = () => {
  const [activeNav, setActiveNav] = useState('Dashboard');


  // Manage which shipment is selected for viewing or editing or creating






  const statsData = [
    {
      title: 'Total Shipments',
      value: '2,847',
      subtitle: '+12% from last month',
      progress: 75,
      icon: Package
    },
    {
      title: 'Active Deliveries',
      value: '186',
      subtitle: 'Currently in transit',
      progress: 60,
      icon: Truck
    },
    {
      title: 'Avg. Delivery Time',
      value: '2.4',
      unit: 'days',
      subtitle: '-0.3 days improvement',
      progress: 85,
      icon: Clock
    },
    {
      title: 'Success Rate',
      value: '98.2%',
      subtitle: 'Successful deliveries',
      progress: 98,
      icon: CheckCircle
    }
  ];

  const monthlyData = [
    { month: 'Jan', value: 420, height: 45 },
    { month: 'Feb', value: 580, height: 60 },
    { month: 'Mar', value: 340, height: 35 },
    { month: 'Apr', value: 720, height: 75 },
    { month: 'May', value: 850, height: 85 },
    { month: 'Jun', value: 640, height: 65 },
    { month: 'Jul', value: 920, height: 90 },
    { month: 'Aug', value: 980, height: 95 },
    { month: 'Sep', value: 790, height: 80 },
    { month: 'Oct', value: 680, height: 70 },
    { month: 'Nov', value: 880, height: 88 },
    { month: 'Dec', value: 1050, height: 100 }
  ];





  // Handlers for view and edit buttons in Shipments page




  // Handler for updating shipment after edit


  // Handler to receive a new shipment from create form and add to list


  // Shipments Listing Table JSX


  return (
    <>

      {/* Conditional Rendering for Shipments Page or Dashboard or Settings */}
      {activeNav === 'Dashboard' && (
        <>
          {/* Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {/* Stats Cards */}
            {statsData.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="bg-white bg-opacity-90 backdrop-blur-md rounded-3xl p-8 border border-orange-200 hover:border-orange-300 hover:shadow-xl transition-all duration-400 hover:-translate-y-3 relative overflow-hidden group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <Icon className="w-6 h-6 text-orange-600" />
                      <h3 className="text-gray-800 text-lg font-semibold">{stat.title}</h3>
                    </div>

                    <div className="mb-2">
                      <span className="text-4xl font-bold text-gray-800">
                        {stat.value}
                      </span>
                      {stat.unit && (
                        <span className="text-gray-600 text-lg ml-2">
                          {stat.unit}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-4">
                      {stat.subtitle}
                    </p>

                    <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-800"
                        style={{ width: `${stat.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Monthly Transactions Graph */}
          <div className="mt-8 bg-white bg-opacity-90 backdrop-blur-md rounded-3xl p-8 border border-orange-200 hover:border-orange-300 hover:shadow-xl transition-all duration-400 hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-orange-600" />
                <h3 className="text-gray-800 text-xl font-semibold">Monthly Transactions</h3>
              </div>

              <p className="text-gray-600 text-sm mb-6">
                Transaction volume over the last 12 months
              </p>

              <div className="relative h-64">
                <div className="w-full h-full bg-orange-50 rounded-2xl p-4 relative overflow-hidden">
                  <div className="flex items-end justify-between h-full gap-2">
                    {monthlyData.map((data, index) => (
                      <div
                        key={data.month}
                        className="flex-1 bg-gradient-to-t from-orange-400 to-orange-500 rounded-t-lg opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-y-105 relative group cursor-pointer"
                        style={{
                          height: `${data.height}%`,
                          animationDelay: `${index * 0.1}s`
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-90 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {data.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between mt-4 px-4">
                  {monthlyData.map((data) => (
                    <span
                      key={data.month}
                      className="text-gray-600 text-sm font-medium"
                    >
                      {data.month}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

       
     

      {/* Click outside to close dropdown */ }
  {/* {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        ></div>
      )} */}
  
  
};

export default CourierDashboard;