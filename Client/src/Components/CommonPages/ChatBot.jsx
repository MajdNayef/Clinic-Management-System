// src/Components/Chatbot.jsx
import React, { useState, useRef, useEffect } from "react"
import { Send, X } from "react-feather"
import styles from "./css/chatbot.module.css"

const Chatbot = ({ onClose }) => {
    const [messages, setMessages] = useState([
        { from: "bot", text: "Hi! 👋 I'm MedBot. How can I assist you today?" }
    ])
    const [input, setInput] = useState("")
    const chatEndRef = useRef(null)

    const sendMessage = () => {
        if (input.trim()) {
            setMessages([...messages, { from: "user", text: input }])
            setInput("")
            // Simulate bot reply
            setTimeout(() => {
                setMessages(prev => [...prev, { from: "bot", text: "Thanks for your message! We'll get back to you soon." }])
            }, 800)
        }
    }

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    return (
        <div className={styles.chatbotWrapper}>
            <div className={styles.header}>
                <span>💬 MedBot Support</span>
                <X className={styles.closeBtn} onClick={onClose} />
            </div>
            <div className={styles.messages}>
                {messages.map((msg, i) => (
                    <div key={i} className={`${styles.message} ${msg.from === "user" ? styles.user : styles.bot}`}>
                        {msg.text}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className={styles.inputArea}>
                <input
                    type="text"
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button onClick={sendMessage}>
                    <Send size={18} />
                </button>
            </div>
        </div>
    )
}

export default Chatbot
