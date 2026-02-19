import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '@/types';

interface ChartProps {
  data: ChartDataPoint[];
  title: string;
  type?: 'line' | 'area';
  color?: string;
  valueFormatter?: (value: number) => string;
}

const Chart = ({ data, title, type = 'line', color = '#0ea5e9', valueFormatter }: ChartProps) => {
  const formattedData = data.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: point.value,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {payload[0].payload.date}
          </p>
          <p className="text-sm font-semibold" style={{ color }}>
            {valueFormatter ? valueFormatter(payload[0].value) : payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const ChartComponent = type === 'area' ? AreaChart : LineChart;
  const DataComponent = type === 'area' ? Area : Line;

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => valueFormatter ? valueFormatter(value) : value.toFixed(0)}
          />
          <Tooltip content={<CustomTooltip />} />
          {type === 'area' ? (
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
