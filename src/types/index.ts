export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  totalUsers: number;
  revenue: number;
  growth: number;
  activeUsers: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface ChartData {
  revenue: ChartDataPoint[];
  users: ChartDataPoint[];
  engagement: ChartDataPoint[];
}

export interface StreamEvent {
  type: 'start' | 'content' | 'end' | 'error';
  text?: string;
  conversationId?: string;
}
