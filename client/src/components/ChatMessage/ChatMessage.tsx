import React from 'react';
import './ChatMessage.css';

interface ChatMessageProps {
  text: string;
  isUser: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ text, isUser }) => {
  return (
    <article className={`message-container ${isUser ? 'user' : 'bot'}`}>
      <div className="sender">{isUser ? 'User' : 'Bot'}</div>
      <div className={`message ${isUser ? 'user' : 'bot'}`}>{text}</div>
    </article>
  );
};

export default ChatMessage;
