import React, { useEffect, useRef, useState } from 'react';
import { Button, Input, Spin, message } from 'antd';
import { SendOutlined, ClearOutlined } from '@ant-design/icons';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { InputRef } from 'antd/es/input';
import ChatMessage from '../ChatMessage/ChatMessage';
import './ChatWindow.css';

interface IMessage {
    text: string;
    isUser: boolean;
}

const ChatWindow: React.FC = () => {
    const [userMessage, setUserMessage] = useState<string>('') //сообщение пользователя
    const [chatMessages, setChatMessages] = useState<IMessage[]>(() => { //история сообщений
        const savedMessages = localStorage.getItem('chatMessages') //если есть в localStorage, то заполняем
        return savedMessages ? JSON.parse(savedMessages) : [] //если нет, то история сообщений пуста
    });
    const [loading, setLoading] = useState<boolean>(false) //загрузка ответа от Бота, по время загрузки крутится спиннер
    const inputRef = useRef<InputRef | null>(null) //для инпута, чтобы автофокус на нем всегда висел
    const chatContainerRef = useRef<HTMLDivElement | null>(null) //для окна чата, чтобы прокрчивать вниз всегда
    const [sessionId, setSessionId] = useState<string | null>(null) //ID сессии для работы с API GigaChat, он так быстрее работает с историей чата

    const generateSessionId = () => { //будем генерировать новый ID сессии при первом заходе на страницу, и после очистки истории чата
        const newSessionId = uuidv4()
        localStorage.setItem('sessionId', newSessionId)
        setSessionId(newSessionId)
    }

    useEffect(() => { //в localStorage хранится id сессии и история сообщений, чтобы при обновлении страницы, сообщения не пропадали и Gigachat помнил диалог
        let storedSessionId = localStorage.getItem('sessionId')
        if (!storedSessionId) {
            generateSessionId()
        } else {
            setSessionId(storedSessionId)

        }
    }, []);

    const sendMessage = async () => {
        if (!userMessage) return;
        const newUserMessage: IMessage = { text: userMessage, isUser: true };
        setUserMessage('');
        setChatMessages((prevMessages) => { //сначала в список добавляем сообщение, чтобы оно вывелось в чате сразу
            const newChatMessages = [...prevMessages, newUserMessage];
            return newChatMessages;
        });

        try {
            setLoading(true);
            const response = await axios.post(
                'http://127.0.0.1:8000/chat',
                { message: newUserMessage.text, history: [...chatMessages] },
                { headers: { 'X-Session-ID': sessionId } }
            );

            const botMessage: IMessage = { text: response.data.message, isUser: false }
            setChatMessages((prevMessages) => { //добавляем в список уже ответ от GigaChat
                const newChatMessages = [...prevMessages, botMessage]
                localStorage.setItem('chatMessages', JSON.stringify(newChatMessages))
                return newChatMessages
            });
        } catch (error) {
            message.error('Ошибка при отправке запроса');
        } finally {
            setLoading(false);
        }
    };

    const clearChatHistory = () => { // удаляем из localStorage ID сессии и историю чата, чтобы начать новый диалог
        localStorage.removeItem('chatMessages');
        localStorage.removeItem('sessionId');
        generateSessionId();
        setChatMessages([]);
    };

    useEffect(() => { //прокуртка чата вниз и автофокус на инпуте
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [chatMessages]);

    return (
        <main className="chat-container">
            <div className="chat-window" ref={chatContainerRef}>
                {chatMessages.length === 0 ? (
                    <div className="no-messages">Начните разговор...</div>
                ) : (
                    chatMessages.map((msg, index) => <ChatMessage key={index} text={msg.text} isUser={msg.isUser} />)
                )}
                {loading && (
                    <div className="loading">
                        <Spin size="small" />
                    </div>
                )}
            </div>
            <div className="input-container">
                <Input
                    ref={inputRef}
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onPressEnter={sendMessage}
                    placeholder="Введите сообщение"
                    disabled={loading}
                    autoFocus
                    style={{ flexGrow: 1 }}
                />
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    loading={loading}
                    disabled={loading}
                    style={{ marginLeft: '8px' }}
                >
                    Отправить
                </Button>
                <Button
                    type="default"
                    icon={<ClearOutlined />}
                    onClick={clearChatHistory}
                    style={{ marginLeft: '8px' }}
                >
                    Очистить историю
                </Button>
            </div>
        </main>
    );
};

export default ChatWindow;
