import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Communities from "./Communities";
import loadingVideo from "../assets/loading.webm";
import stickerImg from "../assets/sticker.png";

const API_URL = import.meta.env.VITE_API_URL;

/** Deterministic color from a string — gives each user a unique gradient */
function getAvatarColor(name) {
    const colors = [
        ['#df860a', '#f5a623'],
        ['#6366f1', '#818cf8'],
        ['#ec4899', '#f472b6'],
        ['#14b8a6', '#2dd4bf'],
        ['#f43f5e', '#fb7185'],
        ['#8b5cf6', '#a78bfa'],
        ['#0ea5e9', '#38bdf8'],
        ['#f97316', '#fb923c'],
        ['#10b981', '#34d399'],
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

function Messages({ unreadPerChatter, setUnreadPerChatter, setUnreadMsgCount }) {
    const userId = JSON.parse(localStorage.getItem("user") || "{}").userId;
    const [chatters, setChatters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("chat");
    const [searchQuery, setSearchQuery] = useState("");

    const getChatters = async () => {
        try {
            const res = await axios.get(`${API_URL}/chatters/${userId}`);
            setChatters(res.data || []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching chatters:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        getChatters();
    }, [userId]);

    const handleChatClick = async (chatterId) => {
        const count = unreadPerChatter[chatterId] || 0;
        if (count > 0) {
            try {
                await axios.post(`${API_URL}/markread`, { userId, chatterId });

                setUnreadPerChatter((prev) => {
                    const updated = { ...prev };
                    delete updated[chatterId];
                    return updated;
                });

                setUnreadMsgCount((prev) => Math.max(prev - count, 0));
            } catch (err) {
                console.error("Error marking messages as read:", err);
            }
        }
    };

    const filteredChatters = chatters.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="messages-sidebar-content" >
            <div className="upper" style={{ position: "sticky", top: "0px", backgroundColor: "white" }}>
                <p className="headoo">Your Conversations</p>
                <p style={{ color: "grey", marginBottom: "9px" }}>Stay Connected and keep the convo going</p>

                {/* Tab Switcher */}
                <div className="messages-tab-switcher">
                    <button
                        className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
                        onClick={() => setActiveTab("chat")}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            Chat
                        </div>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "communities" ? "active" : ""}`}
                        onClick={() => setActiveTab("communities")}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            Communities
                        </div>
                    </button>
                </div>
            </div>

            {/* Chat Tab */}
            {activeTab === "chat" && (
                <>
                    <div style={{ marginBottom: "14px", display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="messages-search-input"
                            style={{ flex: 1, margin: 0 }}
                        />
                        <Link to="/search" style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "36px",
                            height: "36px",
                            backgroundColor: "rgba(0,0,0,0.05)",
                            borderRadius: "50%",
                            textDecoration: "none",
                            color: "inherit",
                            flexShrink: 0,
                            transition: "background-color 0.2s"
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.1)"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)"}
                            title="New Chat"
                        >
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
                        </Link>
                    </div>
                    {loading ? (<>
                        <div style={{ display: "flex", justifyContent: "center", padding: "30px 0" }}>
                            <video
                                src={loadingVideo}
                                autoPlay
                                loop
                                muted
                                playsInline
                                style={{ width: "auto", height: "30vh", marginTop: "40px" }}
                            />
                        </div>
                        <div style={{ color: "#888", textAlign: "center", padding: "15px 0" }}>Loading...</div>
                    </>
                    ) : filteredChatters.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px 0" }}>
                            <img src={stickerImg} alt="Start chatting" className="empty-chat-sticker" style={{ width: "160px" }} />
                            <p style={{ color: "#999", fontSize: "14px", lineHeight: "1.6", margin: "8px 0 0" }}>
                                {chatters.length === 0
                                    ? "No messages yet. Start a conversation by visiting someone's profile!"
                                    : "No chatters found."}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {filteredChatters.map((chatter) => {
                                const unreadCount = unreadPerChatter[chatter._id] || 0;
                                return (
                                    <Link
                                        key={chatter._id}
                                        to={`/chat/${chatter._id}`}
                                        onClick={() => handleChatClick(chatter._id)}
                                        className={`chatter-card ${unreadCount > 0 ? 'has-unread' : ''}`}
                                        style={{ textDecoration: 'none' }}
                                    >
                                        {/* Unread indicator dot */}
                                        {unreadCount > 0 && <div className="unread-dot" />}

                                        {/* Avatar: image or letter fallback */}
                                        {chatter.image ? (
                                            <img
                                                src={chatter.image}
                                                alt=""
                                                className="chatter-avatar"
                                            />
                                        ) : (
                                            <LetterAvatar name={chatter.name} />
                                        )}

                                        <div className="chatter-info">
                                            <span className="chatter-name">
                                                {chatter.name}
                                            </span>
                                            {chatter.latestMessage && (
                                                <span className="chatter-last-msg">
                                                    {chatter.latestMessage.split(/\s+/).slice(0, 4).join(" ")}
                                                    {chatter.latestMessage.split(/\s+/).length > 4 ? " ..." : ""}
                                                </span>
                                            )}
                                        </div>

                                        {/* Unread count badge */}
                                        {unreadCount > 0 && (
                                            <span className="unread-badge">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Communities Tab */}
            {activeTab === "communities" && (
                <Communities />
            )}
        </div>
    );
}

export default Messages;
