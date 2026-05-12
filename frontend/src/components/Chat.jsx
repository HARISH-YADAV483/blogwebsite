import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;
const socket = io("http://localhost:5003");

function Chat({ unreadPerChatter, setUnreadPerChatter, setUnreadMsgCount }) {
    const { chatterId } = useParams();
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");
    const name = localStorage.getItem("name");
    
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatterName, setChatterName] = useState("");
    const [chatterImage, setChatterImage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Create a deterministic chatroom ID so both users join the same room
    const chatroom = [userId, chatterId].sort().join("_");

    // Mark messages as read when entering the chat
    useEffect(() => {
        if (userId && chatterId) {
            const count = unreadPerChatter?.[chatterId] || 0;
            if (count > 0) {
                axios.post(`${API_URL}/markread`, { userId, chatterId })
                    .then(() => {
                        setUnreadPerChatter((prev) => {
                            const updated = { ...prev };
                            delete updated[chatterId];
                            return updated;
                        });
                        setUnreadMsgCount((prev) => Math.max(prev - count, 0));
                    })
                    .catch(err => console.error("Error marking read:", err));
            }
        }
    }, [chatterId, userId]);

    useEffect(() => {
        if (userId) {
            socket.emit("setup_user", userId);
        }

        // Join the private chat room
        if (userId && chatterId) {
            socket.emit("join_chat", chatroom);
        }

        const handleReceiveMessage = (message) => {
            if (message.senderId.toString() === chatterId || message.receiverId.toString() === chatterId) {
                setMessages((prev) => [...prev, message]);
                // Auto-mark as read since user is in the chat
                if (message.senderId.toString() === chatterId) {
                    axios.post(`${API_URL}/markread`, { userId, chatterId }).catch(() => {});
                }
            }
        };

        socket.on("receive_message", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
        };
    }, [chatterId, userId]);

    const loadChat = async () => {
        try {
            const chatterRes = await axios.get(`${API_URL}/chatters/${userId}`);
            const chatter = chatterRes.data.find(c => c._id === chatterId);
            if (chatter) {
                setChatterName(chatter.name);
                setChatterImage(chatter.image || "");
            }

            const messagesRes = await axios.get(`${API_URL}/messages/${userId}/${chatterId}`);
            setMessages(messagesRes.data || []);
            setLoading(false);
        } catch (err) {
            console.error("Error loading chat:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId && chatterId) {
            loadChat();
        }
    }, [userId, chatterId]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const messageData = {
                senderId: userId,
                receiverId: chatterId,
                message: newMessage
            };

            const res = await axios.post(`${API_URL}/sendmessage`, messageData);
            
            socket.emit("send_message", res.data);

            setNewMessage("");
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    if (!userId) {
        return <div>Please log in to chat</div>;
    }

    return (
        <div style={{ 
            height: "80vh", 
            display: "flex", 
            flexDirection: "column",
            maxWidth: "800px",
            margin: "0 auto",
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{ 
                padding: "15px", 
                borderBottom: "1px solid #ddd", 
                display: "flex", 
                alignItems: "center",
                gap: "10px"
            }}>
                {chatterImage && (
                    <img 
                        src={chatterImage} 
                        alt="" 
                        style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} 
                    />
                )}
                <h2>{chatterName}</h2>
                <button onClick={() => navigate(-1)} style={{ marginLeft: "auto" }}>
                    Back
                </button>
            </div>

            <div style={{ 
                flex: 1, 
                padding: "20px", 
                overflowY: "auto",
                backgroundColor: "#f9f9f9"
            }}>
                {loading ? (
                    <p>Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#888", marginTop: "50px" }}>
                        No messages yet. Start the conversation!
                    </p>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={msg._id || index}
                            style={{
                                marginBottom: "15px",
                                display: "flex",
                                justifyContent: msg.senderId.toString() === userId ? "flex-end" : "flex-start"
                            }}
                        >
                            <div style={{
                                maxWidth: "60%",
                                padding: "10px 15px",
                                borderRadius: "18px",
                                backgroundColor: msg.senderId.toString() === userId ? "#007bff" : "#e9ecef",
                                color: msg.senderId.toString() === userId ? "white" : "#333",
                                wordWrap: "break-word"
                            }}>
                                {(() => {
                                    if (msg.message.includes("http://localhost:5173/blog/")) {
                                        const urlMatch = msg.message.match(/http:\/\/localhost:5173\/blog\/([a-zA-Z0-9_]+)/);
                                        if (urlMatch) {
                                            const path = `/blog/${urlMatch[1]}`;
                                            return (
                                                <span 
                                                    onClick={() => navigate(path)} 
                                                    style={{ cursor: "pointer", textDecoration: "underline" }}
                                                >
                                                    {msg.message}
                                                </span>
                                            );
                                        }
                                    }
                                    return msg.message;
                                })()}
                                <div style={{
                                    fontSize: "12px",
                                    opacity: 0.7,
                                    marginTop: "5px",
                                    textAlign: msg.senderId.toString() === userId ? "right" : "left"
                                }}>
                                    {new Date(msg.time).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} style={{ 
                padding: "15px", 
                borderTop: "1px solid #ddd",
                display: "flex",
                gap: "10px"
            }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "25px",
                        outline: "none"
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
                />
                <button 
                    type="submit"
                    style={{
                        padding: "12px 20px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "25px",
                        cursor: "pointer"
                    }}
                >
                    Send
                </button>
            </form>
        </div>
    );
}

export default Chat;

