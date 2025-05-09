import React, { useState, useRef, useEffect } from "react";
import styles from "./css/liveChat.module.css";
import { Send, Clock, Calendar } from "react-feather";
import DashboardLayout from "./layout/DashboardLayout";

const ChatBox = ({ userType = "patient", chatWith = "Dr. Ruhidah" }) => {
    const [messages, setMessages] = useState([
        {
            from: "doctor",
            text: "Hello! How can I help you today?",
            timestamp: new Date(),
        },
        {
            from: "patient",
            text: "I have some chest pain since morning.",
            timestamp: new Date(),
        },
    ]);

    const [newMessage, setNewMessage] = useState("");
    const chatEndRef = useRef(null);

    const sendMessage = () => {
        if (newMessage.trim()) {
            setMessages((prev) => [
                ...prev,
                { from: userType, text: newMessage, timestamp: new Date() },
            ]);
            setNewMessage("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };

    const formatTime = (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <DashboardLayout>
            <div className={styles.chatBox}>
                {/* Header Info */}
                <div className={styles.chatHeader}>
                    <h2> {chatWith}</h2>
                    {/* <h2>Live Chat with {chatWith}</h2> */}
                    <div className={styles.chatMeta}>
                        <span className={styles.chatTime}>
                            <Clock size={14} /> 09:00 - 10:00 AM
                        </span>
                        <span className={styles.chatDate}>
                            <Calendar size={14} /> 12 / 1 / 2025
                        </span>
                        <span className={styles.liveTag}>Live Chat</span>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className={styles.chatMessages}>
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`${styles.chatMessage} ${msg.from === userType ? styles.own : styles.other
                                }`}
                        >
                            <span>{msg.text}</span>
                            <div className={styles.timestamp}>{formatTime(msg.timestamp)}</div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className={styles.chatInputArea}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message..."
                    />
                    <button onClick={sendMessage}>
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ChatBox;
