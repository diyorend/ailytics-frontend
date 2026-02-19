import { useState, useEffect, useRef, FormEvent } from 'react';
import { Send, Plus, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import ChatMessage from '@/components/ChatMessage';
import TypingIndicator from '@/components/TypingIndicator';
import { api } from '@/lib/api';
import { Message, Conversation, StreamEvent } from '@/types';

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setLoading(true);
      const data = await api.getHistory(conversationId);
      setMessages(data.messages || []);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setIsTyping(true);

    // Add user message to UI
    const tempUserMessage: Message = {
      id: Date.now().toString(),
      conversation_id: currentConversationId || '',
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      abortControllerRef.current = new AbortController();
      const response = await api.sendMessage(userMessage, currentConversationId || undefined);

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let newConversationId = currentConversationId;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const event: StreamEvent = JSON.parse(data);

                if (event.type === 'start' && event.conversationId) {
                  newConversationId = event.conversationId;
                  setCurrentConversationId(event.conversationId);
                }

                if (event.type === 'content' && event.text) {
                  assistantContent += event.text;
                  
                  // Update the last assistant message or create a new one
                  setMessages((prev) => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage?.role === 'assistant') {
                      return [
                        ...prev.slice(0, -1),
                        { ...lastMessage, content: assistantContent },
                      ];
                    } else {
                      return [
                        ...prev,
                        {
                          id: Date.now().toString(),
                          conversation_id: newConversationId || '',
                          role: 'assistant',
                          content: assistantContent,
                          created_at: new Date().toISOString(),
                        },
                      ];
                    }
                  });
                }

                if (event.type === 'end') {
                  setIsTyping(false);
                  fetchConversations();
                }

                if (event.type === 'error') {
                  throw new Error(event.text || 'An error occurred');
                }
              } catch (parseError) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      // Show error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          conversation_id: currentConversationId || '',
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-64 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <button
            onClick={startNewConversation}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`w-full text-left p-3 rounded-lg mb-2 transition-colors duration-200 ${
                currentConversationId === conv.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-700 dark:text-gray-300'
              }`}
            >
              <p className="font-medium text-sm truncate">{conv.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {new Date(conv.updated_at).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading conversation...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-6">
                  <Send className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Start a Conversation
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Ask me anything! I'm here to help you with your questions and tasks.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-dark-border p-4 bg-white dark:bg-dark-card">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isTyping}
                className="flex-1 input"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
