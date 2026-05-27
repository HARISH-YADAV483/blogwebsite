import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;
const socket = io(import.meta.env.VITE_SOCKET_URL);

function getAvatarColor(name) {
    const colors = [
        ['#df860a', '#f5a623'], ['#6366f1', '#818cf8'], ['#ec4899', '#f472b6'],
        ['#14b8a6', '#2dd4bf'], ['#f43f5e', '#fb7185'], ['#8b5cf6', '#a78bfa'],
        ['#0ea5e9', '#38bdf8'], ['#f97316', '#fb923c'], ['#10b981', '#34d399'],
        ['#e11d48', '#f43f5e'],
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function LetterAvatar({ name, className = "" }) {
    const letter = (name || "?").charAt(0).toUpperCase();
    const [c1, c2] = getAvatarColor(name);
    return (
        <div
            className={`letter-avatar ${className}`}
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        >
            {letter}
        </div>
    );
}

function Chat({ unreadPerChatter, setUnreadPerChatter, setUnreadMsgCount }) {
    const { chatterId } = useParams();
    const navigate = useNavigate();
    const userId = JSON.parse(localStorage.getItem("user") || "{}").userId;
    const currentUsername = JSON.parse(localStorage.getItem("user") || "{}").username;

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatterName, setChatterName] = useState("");
    const [chatterImage, setChatterImage] = useState("");
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);

    const toggleSelectMessage = (msg) => {
        if (selectedMessages.some(m => m._id === msg._id)) {
            setSelectedMessages(prev => prev.filter(m => m._id !== msg._id));
        } else {
            setSelectedMessages(prev => [...prev, msg]);
        }
    };

    const deleteMessages = async (type) => {
        if (selectedMessages.length === 0) return;
        const messageIds = selectedMessages.map(msg => msg._id);

        try {
            const res = await axios.post(`${API_URL}/messages/delete`, {
                messageIds,
                userId,
                type,
                chatroom
            });
            if (res.data.success) {
                if (type === "for_me") {
                    setMessages(prev => prev.filter(msg => !messageIds.includes(msg._id)));
                }
                setSelectedMessages([]);
                setIsSelectionMode(false);
            }
        } catch (err) {
            console.error("Error deleting messages:", err);
            alert("Failed to delete messages");
        }
    };

    const canDeletePermanently = selectedMessages.length > 0 && selectedMessages.every(msg => msg.senderId.toString() === userId.toString());

    // Pagination states
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Refs
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const previousScrollHeightRef = useRef(0);
    const shouldScrollToBottomRef = useRef(true);

    const scrollToBottom = (behavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        if (shouldScrollToBottomRef.current) {
            scrollToBottom();
        } else {
            if (chatContainerRef.current) {
                const currentScrollHeight = chatContainerRef.current.scrollHeight;
                const heightDifference = currentScrollHeight - previousScrollHeightRef.current;
                chatContainerRef.current.scrollTop += heightDifference;
                previousScrollHeightRef.current = currentScrollHeight;
            }
            shouldScrollToBottomRef.current = true;
        }
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
                shouldScrollToBottomRef.current = true;
                setMessages((prev) => [...prev, message]);
                // Auto-mark as read since user is in the chat
                if (message.senderId.toString() === chatterId) {
                    axios.post(`${API_URL}/markread`, { userId, chatterId }).catch(() => { });
                }
            }
        };

        const handleMessagesDeleted = ({ messageIds }) => {
            setMessages((prev) => prev.filter(msg => !messageIds.includes(msg._id)));
        };

        socket.on("receive_message", handleReceiveMessage);
        socket.on("messages_deleted", handleMessagesDeleted);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("messages_deleted", handleMessagesDeleted);
            if (userId && chatterId) {
                socket.emit("leave_chat", chatroom);
            }
        };
    }, [chatterId, userId, chatroom]);

    const loadChat = async (currentSkip = 0) => {
        try {
            if (currentSkip === 0) {
                const chatterRes = await axios.get(`${API_URL}/chatters/${userId}`);
                const chatter = chatterRes.data.find(c => c._id === chatterId);
                if (chatter) {
                    setChatterName(chatter.name);
                    setChatterImage(chatter.image || "");
                }
            } else {
                setIsLoadingMore(true);
                shouldScrollToBottomRef.current = false;
                if (chatContainerRef.current) {
                    previousScrollHeightRef.current = chatContainerRef.current.scrollHeight;
                }
            }

            const messagesRes = await axios.get(`${API_URL}/messages/${userId}/${chatterId}?skip=${currentSkip}&limit=20`);
            const fetchedMessages = messagesRes.data || [];

            if (fetchedMessages.length < 20) {
                setHasMore(false);
            }

            if (currentSkip === 0) {
                setMessages(fetchedMessages);
            } else {
                setMessages(prev => [...fetchedMessages, ...prev]);
            }

            setSkip(currentSkip);
            setLoading(false);
            setIsLoadingMore(false);
        } catch (err) {
            console.error("Error loading chat:", err);
            setLoading(false);
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (userId && chatterId) {
            setSkip(0);
            setHasMore(true);
            shouldScrollToBottomRef.current = true;
            loadChat(0);
        }
    }, [userId, chatterId]);

    const handleScroll = (e) => {
        if (e.target.scrollTop === 0 && hasMore && !isLoadingMore && !loading) {
            loadChat(skip + 20);
        }
    };

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

            shouldScrollToBottomRef.current = true;
            socket.emit("send_message", res.data);

            setNewMessage("");
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setShowShareMenu(false);
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        data.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

        try {
            setIsUploading(true);
            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
                data
            );
            setIsUploading(false);

            const messageData = {
                senderId: userId,
                receiverId: chatterId,
                message: res.data.secure_url
            };

            const sendRes = await axios.post(`${API_URL}/sendmessage`, messageData);
            socket.emit("send_message", sendRes.data);

        } catch (error) {
            setIsUploading(false);
            console.error("Upload error:", error);
            alert("Failed to upload file");
        }
    };

    if (!userId) {
        return <div>Please log in to chat</div>;
    }

    return (
        <div style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                padding: "15px 20px",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
                display: "flex",
                alignItems: "center",
                gap: "15px",
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
                position: "sticky",
                top: 0,
                zIndex: 10
            }}>
                {chatterImage ? (
                    <img
                        src={chatterImage}
                        alt=""
                        className="chat-header-avatar"
                    />
                ) : (
                    <LetterAvatar name={chatterName} className="small" />
                )}
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
                    <Link to={`/profile/${chatterId}`} style={{ textDecoration: 'none', color: '#1a1a1a' }}>
                        {chatterName}
                    </Link>
                </h2>
                <button
                    onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        setSelectedMessages([]);
                    }}
                    style={{
                        marginLeft: "auto",
                        marginRight: "10px",
                        padding: "5px 12px",
                        backgroundColor: isSelectionMode ? "#6c757d" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    {isSelectionMode ? "Cancel" : "Delete"}
                </button>
                <button onClick={() => navigate(-1)} className="hide-on-desktop">
                    Back
                </button>
            </div>

            <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                style={{
                    flex: 1,
                    padding: "20px",
                    overflowY: "auto",
                    backgroundColor: "transparent"
                }}>
                {loading ? (
                    <p>Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#888", marginTop: "50px" }}>
                        No messages yet. Start the conversation!
                    </p>
                ) : (
                    <>
                        {isLoadingMore && <div style={{ textAlign: "center", padding: "10px", color: "#888" }}>Loading older messages...</div>}
                        {messages.map((msg, index) => (
                            <div
                                key={msg._id || index}
                                onClick={() => isSelectionMode && toggleSelectMessage(msg)}
                                style={{
                                    marginBottom: "15px",
                                    display: "flex",
                                    justifyContent: msg.senderId.toString() === userId ? "flex-end" : "flex-start",
                                    alignItems: "center",
                                    gap: "10px",
                                    cursor: isSelectionMode ? "pointer" : "default"
                                }}
                            >
                                {isSelectionMode && (
                                    <input
                                        type="checkbox"
                                        checked={selectedMessages.some(m => m._id === msg._id)}
                                        onChange={() => toggleSelectMessage(msg)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: msg.senderId.toString() === userId ? "flex-end" : "flex-start",
                                    maxWidth: "75%"
                                }}>
                                    <div style={{
                                        display: "inline-block",
                                        padding: "12px 18px",
                                        borderRadius: "20px",
                                        borderBottomRightRadius: msg.senderId.toString() === userId ? "4px" : "20px",
                                        borderBottomLeftRadius: msg.senderId.toString() !== userId ? "4px" : "20px",
                                        background: msg.senderId.toString() === userId ? "linear-gradient(135deg, #df860a, #f5a623)" : "rgba(255, 255, 255, 0.9)",
                                        color: msg.senderId.toString() === userId ? "white" : "#333",
                                        wordWrap: "break-word",
                                        boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                                        border: msg.senderId.toString() === userId ? "none" : "1px solid rgba(0,0,0,0.05)"
                                    }}>
                                    {(() => {
                                        if (msg.message.includes(`${import.meta.env.VITE_FRONTEND_URL}/blog/`)) {
                                            const urlMatch = msg.message.match(new RegExp(`${import.meta.env.VITE_FRONTEND_URL}/blog/([a-zA-Z0-9_]+)`));
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
                                        if (msg.message.includes("cloudinary.com")) {
                                            let thumbUrl = msg.message;
                                            const dotIndex = thumbUrl.lastIndexOf('.');
                                            if (dotIndex !== -1 && dotIndex > thumbUrl.lastIndexOf('/')) {
                                                thumbUrl = thumbUrl.substring(0, dotIndex) + '.jpg';
                                            }

                                            // Optimize load time by requesting a smaller, compressed version
                                            thumbUrl = thumbUrl.replace("/upload/", "/upload/w_400,c_limit,q_auto,f_auto/");

                                            return (
                                                <a href={msg.message} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                        src={thumbUrl}
                                                        alt="shared file"
                                                        style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "5px", maxHeight: "300px", display: "block" }}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://via.placeholder.com/150?text=File";
                                                        }}
                                                    />
                                                </a>
                                            );
                                        }
                                        return msg.message;
                                    })()}
                                    </div>
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
                        ))}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} style={{
                padding: "15px",
                borderTop: "1px solid rgba(0,0,0,0.05)",
                display: "flex",
                gap: "10px",
                alignItems: "center",
                position: "relative",
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)"
            }}>
                <div style={{ position: "relative" }}>
                    <button
                        type="button"
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        style={{
                            padding: "12px",
                            backgroundColor: "#f0f0f0",
                            border: "1px solid #ddd",
                            borderRadius: "50%",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "44px",
                            height: "44px"
                        }}
                        title="Share"
                    >
                        ➕
                    </button>
                    {showShareMenu && (
                        <div style={{
                            position: "absolute",
                            bottom: "55px",
                            left: "0",
                            backgroundColor: "white",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                            display: "flex",
                            flexDirection: "column",
                            width: "200px",
                            zIndex: 10
                        }}>
                            <button
                                type="button"
                                onClick={() => navigate('/profile')}
                                style={{ padding: "12px 15px", border: "none", background: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid #eee" }}
                            >
                                📝 Share Blog
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                style={{ padding: "12px 15px", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
                            >
                                📁 Select File from Device
                            </button>
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                />
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isUploading ? "Uploading..." : "Type a message..."}
                    disabled={isUploading}
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
                        background: "linear-gradient(135deg, #df860a, #f5a623)",
                        color: "white",
                        border: "none",
                        borderRadius: "25px",
                        cursor: "pointer",
                        fontWeight: "600",
                        boxShadow: "0 4px 10px rgba(223, 134, 10, 0.3)"
                    }}
                >
                    Send
                </button>
            </form>

            {selectedMessages.length > 0 && (
                <div style={{
                    position: "absolute",
                    bottom: "75px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "90%",
                    maxWidth: "600px",
                    padding: "12px 20px",
                    background: "white",
                    borderRadius: "10px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                    border: "1px solid #ddd",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    zIndex: 100
                }}>
                    <span style={{ fontWeight: "500", color: "#333" }}>{selectedMessages.length} message(s) selected</span>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            onClick={() => deleteMessages("for_me")}
                            style={{ padding: "8px 15px", background: "#6c757d", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600" }}
                        >
                            Delete for me
                        </button>
                        {canDeletePermanently && (
                            <button
                                onClick={() => deleteMessages("permanently")}
                                style={{ padding: "8px 15px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600" }}
                            >
                                Delete permanently
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chat;

