// src/components/LiveChat.jsx

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import styles from './css/liveChat.module.css';
import { Send, Clock, Calendar } from 'react-feather';

const SOCKET_SERVER_URL = 'http://localhost:4000';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function LiveChat() {
    const query = useQuery();
    const roomId = query.get('sessionId');
    const chatWith = query.get('chatWith') || 'Chat';
    const userId = query.get('userId');       // make sure you pass this in
    const userType = query.get('userType');     // "patient" or "doctor"

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socketRef = useRef();
    const endRef = useRef();

    // 1) connect, join & fetch history
    useEffect(() => {
        if (!roomId || !userId) return;
        socketRef.current = io(SOCKET_SERVER_URL);

        // join & ask for history
        socketRef.current.emit('joinRoom', roomId);

        socketRef.current.on('history', history => {
            // history = [{ from, text, timestamp }, …]
            setMessages(history);
        });

        socketRef.current.on('chatMessage', msg => {
            setMessages(prev => [...prev, msg]);
        });

        return () => socketRef.current.disconnect();
    }, [roomId, userId]);

    // 2) auto-scroll
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 3) send & persist
    const sendMessage = () => {
        if (!newMessage.trim()) return;
        socketRef.current.emit('chatMessage', {
            roomId,
            from: userId,
            text: newMessage.trim(),
        });
        setNewMessage('');
    };

    return (
            <div className={styles.chatBox}>
                <div className={styles.chatHeader}>
                    <h2>Chat with {chatWith}</h2>
                    <div className={styles.chatMeta}>
                        <span><Clock size={14} /> Live</span>
                        <span><Calendar size={14} /> Today</span>
                    </div>
                </div>

                <div className={styles.chatMessages}>
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={`${styles.chatMessage} ${m.from === userId ? styles.own : styles.other
                                }`}
                        >
                            <span>{m.text}</span>
                            <div className={styles.timestamp}>
                                {new Date(m.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    ))}
                    <div ref={endRef} />
                </div>

                <div className={styles.chatInputArea}>
                    <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                    />
                    <button onClick={sendMessage}><Send size={18} /></button>
                </div>
            </div>
    );
}
