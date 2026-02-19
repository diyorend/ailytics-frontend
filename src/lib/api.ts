const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface RequestOptions extends RequestInit {
  body?: any;
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; name: string }) =>
    request('/api/auth/register', { method: 'POST', body: data }),
  
  login: (data: { email: string; password: string }) =>
    request('/api/auth/login', { method: 'POST', body: data }),

  // Dashboard
  getMetrics: () =>
    request('/api/dashboard/metrics'),
  
  getChartData: (range: string = '7d') =>
    request(`/api/dashboard/charts?range=${range}`),

  // Chat
  sendMessage: (message: string, conversationId?: string) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message, conversationId }),
    });
  },

  getHistory: (conversationId: string) =>
    request(`/api/chat/history?conversationId=${conversationId}`),

  getConversations: () =>
    request('/api/chat/conversations'),
};
