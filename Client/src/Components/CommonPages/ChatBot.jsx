// src/CommonPages/ChatBot.jsx

import React, { useState, useRef, useEffect } from "react";
import { X as CloseIcon, Send as SendIcon } from "react-feather";
import styles from "./css/chatbot.module.css";
import { getAllFAQs } from "./data/faqData";

const YES_RESPONSES = new Set([
    "yes", "y", "yeah", "yep", "correct", "right", "exactly", "sure"
]);
const NO_RESPONSES = new Set([
    "no", "n", "nope", "nah", "not really", "don’t", "dont"
]);

export default function Chatbot({ onClose }) {
    const [messages, setMessages] = useState([
        { from: "bot", text: "👋 Hi! How can I help you today?" },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [typing, setTyping] = useState(false);

    // If we have a “pending” FAQ, this object holds it until user confirms.
    // { question: "...", answer: "..." }
    const [pendingFAQ, setPendingFAQ] = useState(null);

    const scrollRef = useRef(null);

    // Scroll to bottom whenever messages or typing state change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, typing]);

    // A tiny set of stop‐words to ignore when matching
    const STOP_WORDS = new Set([
        "a", "an", "the", "in", "on", "for", "to", "how", "can", "is", "i", "do",
        "dont", "don’t", "of", "and"
    ]);

    // Return an integer “score” by counting overlapping non-stopwords
    function computeSimilarityScore(userText, faqText) {
        const userWords =
            userText
                .toLowerCase()
                .match(/\b[\w']+\b/g)
                ?.filter((w) => !STOP_WORDS.has(w)) || [];

        const faqWords =
            faqText
                .toLowerCase()
                .match(/\b[\w']+\b/g)
                ?.filter((w) => !STOP_WORDS.has(w)) || [];

        let score = 0;
        const faqSet = new Set(faqWords);
        userWords.forEach((w) => {
            if (faqSet.has(w)) score++;
        });
        return score;
    }

    async function handleUserSubmit(e) {
        e.preventDefault();
        const rawText = inputValue.trim();
        if (!rawText) return;

        // Always echo the user's text:
        setMessages((msgs) => [...msgs, { from: "user", text: rawText }]);
        setInputValue("");

        // If we are currently waiting on the user to confirm a previous suggestion:
        if (pendingFAQ) {
            const lower = rawText.toLowerCase();
            // User answered “yes”
            if (YES_RESPONSES.has(lower)) {
                setTyping(true);
                setTimeout(() => {
                    setTyping(false);
                    setMessages((msgs) => [
                        ...msgs,
                        { from: "bot", text: pendingFAQ.answer },
                    ]);
                    setPendingFAQ(null);
                }, 800);
                return;
            }
            // User answered “no”
            if (NO_RESPONSES.has(lower)) {
                setTyping(true);
                setTimeout(() => {
                    setTyping(false);
                    setMessages((msgs) => [
                        ...msgs,
                        {
                            from: "bot",
                            text:
                                "I’m sorry I couldn’t find an answer to that. You can try our FAQ page again, or please visit the Contact Us page for further assistance.",
                        },
                    ]);
                    setPendingFAQ(null);
                }, 800);
                return;
            }
            // If the user answered something else (neither a clear “yes” nor “no”),
            // treat it as a new question instead of confirmation:
            // → Fall through to “search again” logic below.
            setPendingFAQ(null);
            // (We will continue to try matching this new text as a fresh question.)
        }

        // Otherwise, treat as brand‐new question:

        // 1) Show “typing” for a moment
        setTyping(true);

        // 2) Perform FAQ matching
        const allFAQs = getAllFAQs();
        const lowerQ = rawText.toLowerCase();

        let bestMatch = null;
        let bestScore = 0;

        for (const faq of allFAQs) {
            // Score on FAQ.question and FAQ.answer
            const qScore = computeSimilarityScore(lowerQ, faq.question);
            const aScore = computeSimilarityScore(lowerQ, faq.answer);
            const total = qScore + aScore;
            if (total > bestScore) {
                bestScore = total;
                bestMatch = faq;
            }
        }

        // 3) After a short delay, either ask for confirmation or reply with fallback
        setTimeout(() => {
            setTyping(false);

            // If we have a reasonable match (at least one overlapping word):
            if (bestMatch && bestScore >= 1) {
                // Ask the user if this is what they meant:
                setMessages((msgs) => [
                    ...msgs,
                    {
                        from: "bot",
                        text: `It sounds like you might be asking: “${bestMatch.question}”. Is that correct? (yes/no)`,
                    },
                ]);
                // Store it until user confirms
                setPendingFAQ(bestMatch);
            } else {
                // No good match → fallback
                setMessages((msgs) => [
                    ...msgs,
                    {
                        from: "bot",
                        text:
                            "I’m sorry, I couldn’t find a clear answer. You can try our FAQ page again, or please visit the Contact Us page for further assistance.",
                    },
                ]);
                setPendingFAQ(null);
            }
        }, 800);
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
