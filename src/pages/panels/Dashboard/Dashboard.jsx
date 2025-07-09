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
  Plus,
  User,
  Users,
  DollarSign,
  IndianRupee,
  Calendar,
  ArrowDown,
  ArrowUp,
  Home,
  Activity,
  Minus,
  AlertTriangle
} from 'lucide-react';
import SideBar from '../../../components/common/SideBar';
import { getDashboardData } from "../../../services/dashboardService";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import axios from 'axios';
import axiosInstance from '../../../utils/axiosInstance';

const CourierDashboard = () => {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('bar');

  // Get user info from sessionStorage
  const user = JSON.parse(sessionStorage.getItem('user'));
  const userType = user?.user_type;

  const today = new Date();
  const defaultStart = format(startOfMonth(subMonths(today, 11)), 'yyyy-MM-dd');
  const defaultEnd = format(endOfMonth(today), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [monthlyData, setMonthlyData] = useState([]);

  const [revenueStartDate, setRevenueStartDate] = useState(defaultStart);
  const [revenueEndDate, setRevenueEndDate] = useState(defaultEnd);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    getDashboardData()
      .then(response => {
        console.log('Dashboard API response:', response.data);
        setDashboardData(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Dashboard API error:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const fetchDefault = async () => {
      try {
        const response = await axiosInstance.get(`/user/v1/dashboard?start_date=${defaultStart}&end_date=${defaultEnd}`);
        const shipmentsPerMonth = response.data.shipments_per_month || { labels: [], data: [] };
        setMonthlyData((shipmentsPerMonth.labels || []).map((label, i) => ({
          month: label,
          shipments: (shipmentsPerMonth.data || [])[i] ?? 0
        })));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };
    fetchDefault();
  }, []);

  useEffect(() => {
    axiosInstance.get(`/user/v1/dashboard?start_date=${defaultStart}&end_date=${defaultEnd}`)
      .then(response => {
        const revenuePerMonth = response.data.revenue_per_month || { labels: [], data: [] };
        setRevenueData((revenuePerMonth.labels || []).map((label, i) => ({
          month: label,
          revenue: revenuePerMonth.data[i]
        })));
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Render different dashboards based on userType
  if (userType === 'supplier') {
    return <SupplierDashboard data={dashboardData} />;
  } else if (userType === 'super_admin') {
    return <SuperAdminDashboard data={dashboardData} />;
  } else if (userType === 'importer_exporter') {
    return <ImporterExporterDashboard data={dashboardData} />;
  } else {
    return <div>Unknown user type</div>;
  }
};

const BAR_COLOR = "#f97316"; // Tailwind orange
const PIE_COLORS = ["#f97316", "#38bdf8", "#22c55e", "#fbbf24"];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName() {
  const user = JSON.parse(sessionStorage.getItem('user'));
  return user?.first_name || user?.name?.split(' ')[0] || '';
}

function StatCard({ title, value, Icon }) {
  return (
    <div className="bg-white border border-orange-200 shadow-xl rounded-2xl p-6 flex flex-col items-center transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
      {Icon && <Icon className="w-8 h-8 mb-2 text-orange-500 drop-shadow" />}
      <div className="text-3xl font-extrabold text-gray-900 drop-shadow">{value}</div>
      <div className="text-gray-700 text-sm mt-2 font-semibold tracking-wide">{title}</div>
    </div>
  );
}

function SupplierDashboard({ data }) {
  const today = new Date();
  const defaultStart = format(startOfMonth(subMonths(today, 11)), 'yyyy-MM-dd');
  const defaultEnd = format(endOfMonth(today), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [monthlyData, setMonthlyData] = useState([]);

  const [revenueStartDate, setRevenueStartDate] = useState(defaultStart);
  const [revenueEndDate, setRevenueEndDate] = useState(defaultEnd);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    if (data && data.shipments_per_month) {
      setMonthlyData(
        (data.shipments_per_month.labels || []).map((label, i) => ({
          month: label,
          shipments: data.shipments_per_month.data?.[i] ?? 0
        }))
      );
    }
  }, [data]);

  useEffect(() => {
    axiosInstance.get(`/user/v1/dashboard?start_date=${defaultStart}&end_date=${defaultEnd}`)
      .then(response => {
        const revenuePerMonth = response.data.revenue_per_month || { labels: [], data: [] };
        setRevenueData((revenuePerMonth.labels || []).map((label, i) => ({
          month: label,
          revenue: revenuePerMonth.data[i]
        })));
      });
  }, []);

  const handleMonthChange = async (e) => {
    const month = e.target.value;
    console.log("Month picker changed:", month);
    setStartDate(month);
    if (month) {
      const start = `${month}-01`;
      const end = format(endOfMonth(new Date(start)), 'yyyy-MM-dd');
      console.log("Month picker changed:", month, "Requesting:", `/user/v1/dashboard?start_date=${start}&end_date=${end}`);
      const response = await axiosInstance.get(`/user/v1/dashboard?start_date=${start}&end_date=${end}`);
      console.log("API response for month:", response.data);
      const shipmentsPerMonth = response.data.shipments_per_month || { labels: [], data: [] };
      console.log("labels", shipmentsPerMonth.labels, "data", shipmentsPerMonth.data);
      setMonthlyData((shipmentsPerMonth.labels || []).map((label, i) => ({
        month: label,
        shipments: shipmentsPerMonth.data?.[i] ?? 0
      })));
    }
  };

  const handleDateFilter = async () => {
    if (startDate && endDate) {
      const response = await axiosInstance.get(`/user/v1/dashboard?start_date=${startDate}&end_date=${endDate}`);
      const shipmentsPerMonth = response.data.shipments_per_month || { labels: [], data: [] };
      setMonthlyData((shipmentsPerMonth.labels || []).map((label, i) => ({
        month: label,
        shipments: shipmentsPerMonth.data?.[i] ?? 0
      })));
    }
  };

  const handleRevenueDateFilter = async () => {
    if (revenueStartDate && revenueEndDate) {
      const response = await axiosInstance.get(`/user/v1/dashboard?start_date=${revenueStartDate}&end_date=${revenueEndDate}`);
      const revenuePerMonth = response.data.revenue_per_month || { labels: [], data: [] };
      setRevenueData((revenuePerMonth.labels || []).map((label, i) => ({
        month: label,
        revenue: revenuePerMonth.data[i]
      })));
    }
  };

  if (!data) {
    return <div>Loading dashboard data...</div>;
  }

  // Debug: Log the data structure
  console.log('SupplierDashboard data:', data);
  console.log('shipments_per_month:', data.shipments_per_month);
  console.log('revenue_per_month:', data.revenue_per_month);

  // Defensive fallback for missing fields
  const shipmentsPerMonth = data.shipments_per_month || { labels: [], data: [] };
  const revenuePerMonth = data.revenue_per_month || { labels: [], data: [] };

  const statCards = [
    { title: "Total Shipments Created", value: data.total_shipments_created, Icon: Package },
    { title: "Shipments Today", value: data.shipments_today, Icon: Calendar },
    { title: "Shipments This Month", value: data.shipments_this_month, Icon: Clock },
    { title: "Pending Shipments", value: data.pending_shipments, Icon: Truck },
    { title: "Delivered Shipments", value: data.delivered_shipments, Icon: CheckCircle },
    { title: "Pending Payments", value: data.pending_payments, Icon: IndianRupee },
    { title: "Completed Payments", value: data.completed_payments, Icon: IndianRupee },
    { title: "Total Revenue", value: `₹${data.total_revenue}`, Icon: TrendingUp },
  ];

  console.log("monthlyData", monthlyData);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6 text-orange-600">
        {getGreeting()}, {getFirstName()}!
      </h2>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((card, i) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            Icon={card.Icon}
            style={{
              animation: `fadeInUp 0.6s ${i * 0.1 + 0.2}s both`
            }}
          />
        ))}
      </div>

      {/* Charts side by side */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1 min-w-0">
          {/* Shipments Per Month Chart */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="text-lg font-semibold text-gray-700">Shipments Per Month</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-white"
              />
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-white"
              />
              <button
                onClick={handleDateFilter}
                className="px-3 py-1 bg-orange-500 text-white rounded-full disabled:opacity-60"
                disabled={!startDate || !endDate}
              >
                Filter
              </button>
            </div>
            <div className="w-full mb-8">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData} barCategoryGap={30}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload && payload.length ? (
                        <div className="bg-white p-3 rounded shadow text-sm border border-orange-100">
                          <div className="font-semibold text-gray-800 mb-1">{label}</div>
                          {payload.map((entry, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }}></span>
                              {entry.name}: <span className="font-bold">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  <Bar
                    dataKey="shipments"
                    name="Total Shipments"
                    fill="#f97316"
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {/* Revenue Per Month Chart */}
          <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <IndianRupee className="w-5 h-5 text-orange-500" />
              <span className="text-lg font-semibold text-gray-700">Revenue Per Month</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={revenueStartDate}
                onChange={e => setRevenueStartDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-white"
              />
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={revenueEndDate}
                onChange={e => setRevenueEndDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-white"
              />
              <button
                onClick={handleRevenueDateFilter}
                className="px-3 py-1 bg-orange-500 text-white rounded-full disabled:opacity-60"
                disabled={!revenueStartDate || !revenueEndDate}
              >
                Filter
              </button>
            </div>
            <div className="h-96">
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} barCategoryGap={30}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} />
                    <Tooltip
                      content={({ active, payload, label }) =>
                        active && payload && payload.length ? (
                          <div className="bg-white p-3 rounded shadow text-sm border border-orange-100">
                            <div className="font-semibold text-gray-800 mb-1">{label}</div>
                            {payload.map((entry, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }}></span>
                                {entry.name}: <span className="font-bold">₹{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        ) : null
                      }
                    />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#f97316"
                      radius={[8, 8, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-400 py-12">No revenue data to display</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuperAdminDashboard({ data }) {
  const today = new Date();
  const defaultStart = format(startOfMonth(subMonths(today, 11)), 'yyyy-MM-dd');
  const defaultEnd = format(endOfMonth(today), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [monthlyData, setMonthlyData] = useState([]);

  const [revenueStartDate, setRevenueStartDate] = useState(defaultStart);
  const [revenueEndDate, setRevenueEndDate] = useState(defaultEnd);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    if (data && data.shipments_per_month) {
      setMonthlyData(
        (data.shipments_per_month.labels || []).map((label, i) => ({
          month: label,
          shipments: data.shipments_per_month.data?.[i] ?? 0
        }))
      );
    }
  }, [data]);

  useEffect(() => {
    axiosInstance.get(`/user/v1/dashboard?start_date=${defaultStart}&end_date=${defaultEnd}`)
      .then(response => {
        const revenuePerMonth = response.data.revenue_per_month || { labels: [], data: [] };
        setRevenueData((revenuePerMonth.labels || []).map((label, i) => ({
          month: label,
          revenue: revenuePerMonth.data[i]
        })));
      });
  }, []);

  const handleMonthChange = async (e) => {
    const month = e.target.value;
    console.log("Month picker changed:", month);
    setStartDate(month);
    if (month) {
      const start = `${month}-01`;
      const end = format(endOfMonth(new Date(start)), 'yyyy-MM-dd');
      console.log("Month picker changed:", month, "Requesting:", `/user/v1/dashboard?start_date=${start}&end_date=${end}`);
      const response = await axiosInstance.get(`/user/v1/dashboard?start_date=${start}&end_date=${end}`);
      console.log("SuperAdmin API response for month:", response.data);
      const shipmentsPerMonth = response.data.shipments_per_month || { labels: [], data: [] };
      console.log("SuperAdmin labels", shipmentsPerMonth.labels, "data", shipmentsPerMonth.data);
      setMonthlyData((shipmentsPerMonth.labels || []).map((label, i) => ({
        month: label,
        shipments: shipmentsPerMonth.data?.[i] ?? 0
      })));
    }
  };

  const handleDateFilter = async () => {
    if (startDate && endDate) {
      const response = await axiosInstance.get(`/user/v1/dashboard?start_date=${startDate}&end_date=${endDate}`);
      const shipmentsPerMonth = response.data.shipments_per_month || { labels: [], data: [] };
      setMonthlyData((shipmentsPerMonth.labels || []).map((label, i) => ({
        month: label,
        shipments: shipmentsPerMonth.data?.[i] ?? 0
      })));
    }
  };

  const handleRevenueDateFilter = async () => {
    if (revenueStartDate && revenueEndDate) {
      const response = await axiosInstance.get(`/user/v1/dashboard?start_date=${revenueStartDate}&end_date=${revenueEndDate}`);
      const revenuePerMonth = response.data.revenue_per_month || { labels: [], data: [] };
      setRevenueData((revenuePerMonth.labels || []).map((label, i) => ({
        month: label,
        revenue: revenuePerMonth.data[i]
      })));
    }
  };

  if (!data) {
    return <div>Loading dashboard data...</div>;
  }

  // Debug: Log the data structure
  console.log('SuperAdminDashboard data:', data);
  console.log('top_performing_suppliers:', data.top_performing_suppliers);

  // Defensive fallback for missing fields
  const shipmentsPerMonth = data.shipments_per_month || { labels: [], data: [] };
  const topSuppliers = data.top_performing_suppliers || [];

  const revenuePerMonth = data.revenue_per_month || { labels: [], data: [] };

  const suppliersData = topSuppliers.map(supplier => ({
    name: supplier.name,
    revenue: supplier.revenue,
    shipments: supplier.shipments,
    user_type: supplier.user_type
  }));

  const statCards = [
    { title: "Total Shipments", value: data.total_shipments, Icon: Package },
    { title: "Shipments Today", value: data.shipments_today, Icon: Calendar },
    { title: "Shipments This Month", value: data.shipments_this_month, Icon: Clock },
    { title: "Active Shipments", value: data.active_shipments, Icon: Truck },
    { title: "Delivered Shipments", value: data.delivered_shipments, Icon: CheckCircle },
    { title: "Total Payments", value: data.total_payments, Icon: TrendingUp },
    { title: "Total Users", value: data.total_users, Icon: Users },
    { title: "Active Users", value: data.active_users, Icon: User },
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6 text-orange-600">
        {getGreeting()}, {getFirstName()}!
      </h2>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((card, i) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            Icon={card.Icon}
            style={{
              animation: `fadeInUp 0.6s ${i * 0.1 + 0.2}s both`
            }}
          />
        ))}
      </div>

      {/* Charts side by side */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1 min-w-0">
          {/* Shipments Per Month Chart */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="text-lg font-semibold text-gray-700">Shipments Per Month</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-white"
              />
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-white"
              />
              <button
                onClick={handleDateFilter}
                className="px-3 py-1 bg-orange-500 text-white rounded-full disabled:opacity-60"
                disabled={!startDate || !endDate}
              >
                Filter
              </button>
            </div>
            <div className="w-full mb-8">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData} barCategoryGap={30}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload && payload.length ? (
                        <div className="bg-white p-3 rounded shadow text-sm border border-orange-100">
                          <div className="font-semibold text-gray-800 mb-1">{label}</div>
                          {payload.map((entry, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }}></span>
                              {entry.name}: <span className="font-bold">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  <Bar
                    dataKey="shipments"
                    name="Total Shipments"
                    fill="#f97316"
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {/* Top Performing Suppliers Chart */}
          <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="text-lg font-semibold text-gray-700 flex-1">Top Performing Suppliers</span>
            </div>
            <div className="h-96">
              {suppliersData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={suppliersData} layout="vertical" barCategoryGap={30}>
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="revenue" name="Revenue" fill="#f97316" radius={[0, 8, 8, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-400 py-12">No supplier data to display</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImporterExporterDashboard({ data }) {
  const today = new Date();
  const defaultStart = format(startOfMonth(subMonths(today, 11)), 'yyyy-MM-dd');
  const defaultEnd = format(endOfMonth(today), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [monthlyData, setMonthlyData] = useState([]);

  const [revenueStartDate, setRevenueStartDate] = useState(defaultStart);
  const [revenueEndDate, setRevenueEndDate] = useState(defaultEnd);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    if (data && data.shipments_per_month) {
      setMonthlyData(
        (data.shipments_per_month.labels || []).map((label, i) => ({
          month: label,
          shipments: data.shipments_per_month.data?.[i] ?? 0
        }))
      );
    }
  }, [data]);

  useEffect(() => {
    axiosInstance.get(`/user/v1/dashboard?start_date=${defaultStart}&end_date=${defaultEnd}`)
      .then(response => {
        const revenuePerMonth = response.data.revenue_per_month || { labels: [], data: [] };
        setRevenueData((revenuePerMonth.labels || []).map((label, i) => ({
          month: label,
          revenue: revenuePerMonth.data[i]
        })));
      });
  }, []);

  const handleMonthChange = async (e) => {
    const month = e.target.value;
    console.log("Month picker changed:", month);
    setStartDate(month);
    if (month) {
      const start = `${month}-01`;
      const end = format(endOfMonth(new Date(start)), 'yyyy-MM-dd');
      console.log("Month picker changed:", month, "Requesting:", `/user/v1/dashboard?start_date=${start}&end_date=${end}`);
      const response = await axiosInstance.get(`/user/v1/dashboard?start_date=${start}&end_date=${end}`);
      console.log("ImporterExporter API response for month:", response.data);
      const shipmentsPerMonth = response.data.shipments_per_month || { labels: [], data: [] };
      console.log("ImporterExporter labels", shipmentsPerMonth.labels, "data", shipmentsPerMonth.data);
      setMonthlyData((shipmentsPerMonth.labels || []).map((label, i) => ({
        month: label,
        shipments: shipmentsPerMonth.data?.[i] ?? 0
      })));
    }
  };

  const handleDateFilter = async () => {
    if (startDate && endDate) {
      const response = await axiosInstance.get(`/user/v1/dashboard?start_date=${startDate}&end_date=${endDate}`);
      const shipmentsPerMonth = response.data.shipments_per_month || { labels: [], data: [] };
      setMonthlyData((shipmentsPerMonth.labels || []).map((label, i) => ({
        month: label,
        shipments: shipmentsPerMonth.data?.[i] ?? 0
      })));
    }
  };

  const handleRevenueDateFilter = async () => {
    if (revenueStartDate && revenueEndDate) {
      const response = await axiosInstance.get(`/user/v1/dashboard?start_date=${revenueStartDate}&end_date=${revenueEndDate}`);
      const revenuePerMonth = response.data.revenue_per_month || { labels: [], data: [] };
      setRevenueData((revenuePerMonth.labels || []).map((label, i) => ({
        month: label,
        revenue: revenuePerMonth.data[i]
      })));
    }
  };

  if (!data) {
    return <div>Loading dashboard data...</div>;
  }

  // Debug: Log the data structure
  console.log('ImporterExporterDashboard data:', data);
  console.log('shipments_per_month:', data.shipments_per_month);
  console.log('revenue_per_month:', data.revenue_per_month);

  // Defensive fallback for missing fields
  const shipmentsPerMonth = data.shipments_per_month || { labels: [], data: [] };
  const revenuePerMonth = data.revenue_per_month || { labels: [], data: [] };

  const statCards = [
    { title: "Total Shipments", value: data.total_shipments, Icon: Package },
    { title: "Shipments Today", value: data.shipments_today, Icon: Calendar },
    { title: "Shipments This Month", value: data.shipments_this_month, Icon: Clock },
    { title: "Active Shipments", value: data.active_shipments, Icon: Truck },
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6 text-orange-600">
        {getGreeting()}, {getFirstName()}!
      </h2>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((card, i) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            Icon={card.Icon}
            style={{
              animation: `fadeInUp 0.6s ${i * 0.1 + 0.2}s both`
            }}
          />
        ))}
      </div>
      {/* Charts side by side */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1 min-w-0">
          {/* Shipments Per Month Chart */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="text-lg font-semibold text-gray-700">Shipments Per Month</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-white"
              />
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-white"
              />
              <button
                onClick={handleDateFilter}
                className="px-3 py-1 bg-orange-500 text-white rounded-full disabled:opacity-60"
                disabled={!startDate || !endDate}
              >
                Filter
              </button>
            </div>
            <div className="w-full mb-8">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData} barCategoryGap={30}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload && payload.length ? (
                        <div className="bg-white p-3 rounded shadow text-sm border border-orange-100">
                          <div className="font-semibold text-gray-800 mb-1">{label}</div>
                          {payload.map((entry, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }}></span>
                              {entry.name}: <span className="font-bold">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  <Bar
                    dataKey="shipments"
                    name="Total Shipments"
                    fill="#f97316"
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {/* Revenue Per Month Chart */}
          <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <IndianRupee className="w-5 h-5 text-orange-500" />
              <span className="text-lg font-semibold text-gray-700">Revenue Per Month</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={revenueStartDate}
                onChange={e => setRevenueStartDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-white"
              />
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={revenueEndDate}
                onChange={e => setRevenueEndDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-white"
              />
              <button
                onClick={handleRevenueDateFilter}
                className="px-3 py-1 bg-orange-500 text-white rounded-full disabled:opacity-60"
                disabled={!revenueStartDate || !revenueEndDate}
              >
                Filter
              </button>
            </div>
            <div className="h-96">
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} barCategoryGap={30}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} />
                    <Tooltip
                      content={({ active, payload, label }) =>
                        active && payload && payload.length ? (
                          <div className="bg-white p-3 rounded shadow text-sm border border-orange-100">
                            <div className="font-semibold text-gray-800 mb-1">{label}</div>
                            {payload.map((entry, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }}></span>
                                {entry.name}: <span className="font-bold">₹{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        ) : null
                      }
                    />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#f97316"
                      radius={[8, 8, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-400 py-12">No revenue data to display</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourierDashboard;