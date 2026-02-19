import { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, Activity } from 'lucide-react';
import Header from '@/components/Header';
import MetricCard from '@/components/MetricCard';
import Chart from '@/components/Chart';
import { api } from '@/lib/api';
import { DashboardMetrics as MetricsType, ChartData } from '@/types';

const Dashboard = () => {
  const [metrics, setMetrics] = useState<MetricsType | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsData, chartsData] = await Promise.all([
        api.getMetrics(),
        api.getChartData(dateRange),
      ]);
      setMetrics(metricsData);
      setChartData(chartsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header />
      
      <div className="p-6 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value={formatNumber(metrics?.totalUsers || 0)}
            change={8.2}
            icon={Users}
            iconColor="text-blue-600"
            iconBg="bg-blue-100 dark:bg-blue-900/20"
          />
          <MetricCard
            title="Revenue"
            value={formatCurrency(metrics?.revenue || 0)}
            change={metrics?.growth}
            icon={DollarSign}
            iconColor="text-green-600"
            iconBg="bg-green-100 dark:bg-green-900/20"
          />
          <MetricCard
            title="Growth Rate"
            value={`${metrics?.growth.toFixed(1)}%`}
            change={2.4}
            icon={TrendingUp}
            iconColor="text-purple-600"
            iconBg="bg-purple-100 dark:bg-purple-900/20"
          />
          <MetricCard
            title="Active Users"
            value={formatNumber(metrics?.activeUsers || 0)}
            change={5.7}
            icon={Activity}
            iconColor="text-orange-600"
            iconBg="bg-orange-100 dark:bg-orange-900/20"
          />
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Time Range:
          </span>
          <div className="flex gap-2">
            {[
              { label: '7 Days', value: '7d' },
              { label: '30 Days', value: '30d' },
              { label: '90 Days', value: '90d' },
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  dateRange === range.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-dark-hover text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartData && (
            <>
              <Chart
                data={chartData.revenue}
                title="Revenue Over Time"
                type="area"
                color="#10b981"
                valueFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Chart
                data={chartData.users}
                title="User Growth"
                type="line"
                color="#3b82f6"
                valueFormatter={(value) => value.toFixed(0)}
              />
              <Chart
                data={chartData.engagement}
                title="Engagement Rate"
                type="area"
                color="#8b5cf6"
                valueFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Quick Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Conversion Rate
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      3.24%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Avg. Session Duration
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      4m 32s
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Bounce Rate
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      42.8%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Customer Satisfaction
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      4.8/5.0
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
