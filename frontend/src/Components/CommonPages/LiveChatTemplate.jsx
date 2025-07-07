import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import styles from './css/liveChat.module.css';
import { Send, Clock, Calendar } from 'react-feather';
import { SOCKET_URL } from '../../config';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function LiveChat() {
    const query = useQuery();
    const sessionId = query.get('sessionId');
    const chatWith = decodeURIComponent(query.get('chatWith') || 'Chat');
    const userType = query.get('userType') || 'patient';
    const patientId = query.get('patientId');
    const doctorId = query.get('doctorId');
    const doctorAvatar = query.get('doctorAvatar'); // Fetch doctor avatar from query
    const patientAvatar = query.get('patientAvatar'); // Fetch patient avatar from query
    const userId = userType === 'doctor' ? doctorId : patientId;
    const appointmentTime = query.get('appointmentTime') || 'Unknown Time';
    const appointmentDate = query.get('appointmentDate') || 'Unknown Time';


    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const socketRef = useRef(null);
    const endRef = useRef(null);

    // 1) connect & join
    useEffect(() => {
        if (!sessionId) return;

        const socket = io(SOCKET_URL, { withCredentials: true });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('📡 Connected:', socket.id);
            socket.emit('joinRoom', sessionId);
        });

        socket.on('history', history => {
            console.log('📜 Received history', history.length);
            setMessages(history);
        });

        socket.on('chatMessage', msg => {
            console.log('👂 Received chatMessage', msg);
            setMessages(prev => [...prev, msg]);
        });

        return () => socket.disconnect();
    }, [sessionId]);

    // 2) scroll down
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 3) send new message
    const sendMessage = () => {
        console.log('🔥 sendMessage called – newMessage=', newMessage, 'userId=', userId);
        if (!newMessage.trim() || !socketRef.current || !userId) {
            console.warn('⚠️ sendMessage bail-out:', {
                empty: !newMessage.trim(),
                noSocket: !socketRef.current,
                noUser: !userId
            });
            return;
        }


        const payload = {
            room: sessionId,
            from: userId,    // must be a valid string
            text: newMessage.trim()
        };
        console.log('📝 Sending message', payload);
        socketRef.current.emit('chatMessage', payload);
        setNewMessage('');
    };

    return (
        <div className={styles.chatBox}>
            <div className={styles.chatHeader}>
                <div className={styles.chatAvatars}>
                    {doctorAvatar && <img src={doctorAvatar} alt="Doctor Avatar" className={styles.avatar} />}
                    {patientAvatar && <img src={patientAvatar} alt="Patient Avatar" className={styles.avatar} />}
                <h2>Chat with {chatWith}</h2> 
                </div>
                <div className={styles.chatMeta}>
                    <span className={styles.chatTime}><Clock size={14} /> {appointmentTime}</span>
                    <span className={styles.chatDate}><Calendar size={14} /> {appointmentDate}</span>
                    <span className={styles.liveTag}>Live Chat</span>
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
                                hour: '2-digit', minute: '2-digit'
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
                    placeholder="Type your message…"
                />
                <button onClick={sendMessage}><Send size={18} /></button>
            </div>
        </div>
    );
}
