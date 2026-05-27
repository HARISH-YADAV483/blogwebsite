import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Communities from "./Communities";

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
                // Remove this chatter from unread map
                setUnreadPerChatter((prev) => {
                    const updated = { ...prev };
                    delete updated[chatterId];
                    return updated;
                });
                // Subtract from total count
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
        <div className="messages-sidebar-content">
            <h1>Messages</h1>

            {/* Tab Switcher */}
            <div className="messages-tab-switcher">
                <button
                    className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
                    onClick={() => setActiveTab("chat")}
                >
                    💬 Chat
                </button>
                <button
                    className={`tab-btn ${activeTab === "communities" ? "active" : ""}`}
                    onClick={() => setActiveTab("communities")}
                >
                    👥 Communities
                </button>
            </div>

            {/* Chat Tab */}
            {activeTab === "chat" && (
                <>
                    <div style={{ marginBottom: "14px" }}>
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="messages-search-input"
                        />
                    </div>
                    {loading ? (
                        <p style={{ color: "#888", textAlign: "center", padding: "30px 0" }}>Loading...</p>
                    ) : filteredChatters.length === 0 ? (
                        <p style={{ color: "#999", textAlign: "center", padding: "30px 0", fontSize: "14px", lineHeight: "1.6" }}>
                            {chatters.length === 0
                                ? "No messages yet. Start a conversation by visiting someone's profile!"
                                : "No chatters found."}
                        </p>
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
