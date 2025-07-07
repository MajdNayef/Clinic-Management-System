// src/CommonPages/ChatBot.jsx

import React, { useState, useRef, useEffect } from "react";
import { X as CloseIcon, Send as SendIcon } from "react-feather";
import { v4 as uuidv4 } from "uuid";
import styles from "./css/chatbot.module.css";

export default function Chatbot({ onClose }) {
    // Unique session for maintaining context in Dialogflow
    const sessionId = useRef(uuidv4()).current;
    const [messages, setMessages] = useState([
        { from: "bot", text: "👋 Hi! How can I help you today?" },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [typing, setTyping] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll on new messages or typing indicator
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, typing]);

    // Handle user submission by sending to Dialogflow
    async function handleUserSubmit(e) {
        e.preventDefault();
        const text = inputValue.trim();
        if (!text) return;

        // Echo user message
        setMessages((msgs) => [...msgs, { from: "user", text }]);
        setInputValue("");
        setTyping(true);

        try {
            const res = await fetch("/api/dialogflow/detectIntent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, sessionId }),
            });
            const { reply } = await res.json();
            setTyping(false);
            setMessages((msgs) => [...msgs, { from: "bot", text: reply }]);
        } catch (err) {
            setTyping(false);
            setMessages((msgs) => [
                ...msgs,
                { from: "bot", text: "😞 Oops, something went wrong." },
            ]);
        }
    }

    return (
        <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
                <div className={styles.chatbotTitle}>Need Help? Chat with us</div>
                <button className={styles.closeBtn} onClick={onClose}>
                    <CloseIcon size={18} />
                </button>
            </div>

            <div className={styles.chatBody} ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={
                            msg.from === "bot" ? styles.botMessage : styles.userMessage
                        }
                    >
                        {msg.text}
                    </div>
                ))}

                {typing && (
                    <div className={styles.chatbotTyping}>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                        <span>typing...</span>
                    </div>
                )}
            </div>

            <form className={styles.chatInputForm} onSubmit={handleUserSubmit}>
                <input
                    type="text"
                    placeholder="Type your question..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
                <button type="submit">
                    <SendIcon size={18} />
                </button>
            </form>
        </div>
    );
}
