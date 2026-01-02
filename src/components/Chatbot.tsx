import React, { useState } from 'react';

interface ChatbotProps {
  onClose: () => void;
  onRecommendCountries: (recommendation: { 
    activity: string; 
    interests: Array<{
      name: string;
      countries: Array<{
        name: string;
        description: string;
        coordinates: [number, number];
        imageUrl: string;
      }>;
    }>;
  }) => void;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface Interest {
  name: string;
  description: string;
}

interface AIResponse {
  content: {
    activity?: string;
    followUpQuestion?: string;
    availableInterests?: Interest[];
    interests?: string[];
    recommendations?: any[];
  } | string;
  error?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose, onRecommendCountries }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationStage, setConversationStage] = useState<'initial' | 'activity' | 'interests'>('initial');
  const [currentActivity, setCurrentActivity] = useState<string>('');
  const [currentInterests, setCurrentInterests] = useState<string[]>([]);
  const [lastAIResponse, setLastAIResponse] = useState<AIResponse | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: input,
          type: conversationStage === 'initial' ? 'activity_identification' : 
                conversationStage === 'activity' ? 'interest_refinement' : 'country_recommendation',
          currentActivity,
          currentInterests
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: AIResponse = await res.json();
      setLastAIResponse(data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Add AI response to chat
      if (typeof data.content === 'string') {
        setMessages([
          ...newMessages,
          { role: 'ai' as const, content: data.content }
        ]);
      } else if (typeof data.content === 'object') {
        // Handle JSON response
        setMessages([
          ...newMessages,
          { role: 'ai' as const, content: data.content.followUpQuestion || 'What would you like to know more about?' }
        ]);

        // Process different stages of conversation
        if (conversationStage === 'initial') {
          if (data.content.activity) {
            setCurrentActivity(data.content.activity);
            setConversationStage('activity');
          }
        } else if (conversationStage === 'activity') {
          if (data.content.interests) {
            setCurrentInterests(data.content.interests);
            setConversationStage('interests');
          }
        } else if (conversationStage === 'interests') {
          if (data.content.recommendations) {
            onRecommendCountries({
              activity: currentActivity,
              interests: data.content.recommendations
            });
            setInput('');
            return;
          }
        }
      } else {
        throw new Error('Invalid response format from server');
      }
      
      setInput('');
    } catch (e) {
      console.error('Chat error:', e);
      setMessages([
        ...newMessages,
        { role: 'ai' as const, content: 'Sorry, there was an error processing your request. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 12, minWidth: 320, maxWidth: 400, minHeight: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: 20, position: 'relative', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <button style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }} onClick={onClose} title="Close">×</button>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>AI Travel Assistant</div>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, maxHeight: 220 }}>
          {messages.length === 0 && (
            <div style={{ color: '#888', fontSize: 14 }}>
              Tell me about an activity you're interested in! For example:
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>"I want to explore theaters and performing arts"</li>
                <li>"Tell me about wine tasting opportunities"</li>
                <li>"I'm interested in historical architecture"</li>
              </ul>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} style={{ margin: '8px 0', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
              <span style={{
                display: 'inline-block',
                background: msg.role === 'user' ? '#e0f2fe' : '#f3f4f6',
                color: '#222',
                borderRadius: 8,
                padding: '6px 12px',
                maxWidth: 260,
                fontSize: 14
              }}>
                {msg.content}
                {msg.role === 'ai' && idx === messages.length - 1 && lastAIResponse?.content && typeof lastAIResponse.content === 'object' && lastAIResponse.content.availableInterests && (
                  <div style={{ marginTop: 8 }}>
                    {lastAIResponse.content.availableInterests.map((interest: Interest, i: number) => (
                      <div key={i} style={{ marginTop: 4, fontSize: 13 }}>
                        <span style={{ fontWeight: 500 }}>• {interest.name}</span>
                        <span style={{ color: '#666', marginLeft: 4 }}>{interest.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            id="chatbot-input"
            name="chatbot-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder={conversationStage === 'initial' ? "Type your interest..." : 
                        conversationStage === 'activity' ? "Tell me more about your preferences..." : 
                        "Any specific aspects you'd like to explore?"}
            style={{ flex: 1, border: '1px solid #eee', borderRadius: 6, padding: '8px 10px', fontSize: 14 }}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{ 
              background: '#0ea5e9', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6, 
              padding: '0 16px', 
              fontWeight: 500, 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot; 