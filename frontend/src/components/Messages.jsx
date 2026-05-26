import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Communities from "./Communities";

const API_URL = import.meta.env.VITE_API_URL;

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

    return (
        <div style={{ padding: "20px", height: "100%", boxSizing: "border-box", fontFamily: "'Inter', sans-serif", overflowY: "auto" }}>
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
                    <div style={{ marginBottom: "15px" }}>
                        <input 
                            type="text" 
                            placeholder="Search by name..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px 20px",
                                borderRadius: "25px",
                                border: "1px solid rgba(223, 134, 10, 0.3)",
                                outline: "none",
                                fontSize: "14px",
                                boxSizing: "border-box",
                                fontFamily: "'Inter', sans-serif",
                                background: "rgba(255, 255, 255, 0.9)",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
                            }}
                        />
                    </div>
                    {loading ? (
                        <p>Loading...</p>
                    ) : chatters.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                        <p style={{ color: "#888" }}>{chatters.length === 0 ? "No messages yet. Start a conversation by visiting someone's profile!" : "No chatters found."}</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {chatters.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((chatter) => {
                                const unreadCount = unreadPerChatter[chatter._id] || 0;
                                return (
                                    <div 
                                        key={chatter._id} 
                                        style={{ 
                                            border: unreadCount > 0 ? "1px solid #df860a" : "1px solid rgba(0,0,0,0.05)", 
                                            borderRadius: "16px", 
                                            padding: "12px 15px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "15px",
                                            backgroundColor: unreadCount > 0 ? "rgba(223, 134, 10, 0.05)" : "rgba(255, 255, 255, 0.6)",
                                            transition: "all 0.3s ease",
                                            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                                        }}
                                    >
                                        {/* Unread indicator dot */}
                                        {unreadCount > 0 && (
                                            <div style={{
                                                width: "10px",
                                                height: "10px",
                                                borderRadius: "50%",
                                                backgroundColor: "#df860a",
                                                flexShrink: 0,
                                                boxShadow: "0 0 8px rgba(223, 134, 10, 0.6)"
                                            }} />
                                        )}
                                        {chatter.image && (
                                            <img 
                                                src={chatter.image} 
                                                alt="" 
                                                style={{ 
                                                    width: "50px", 
                                                    height: "50px", 
                                                    borderRadius: "50%", 
                                                    objectFit: "cover",
                                                    border: "2px solid white",
                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                                                }} 
                                            />
                                        )}
                                        <Link 
                                            to={`/chat/${chatter._id}`} 
                                            onClick={() => handleChatClick(chatter._id)}
                                            style={{ 
                                                fontSize: "17px",
                                                fontWeight: unreadCount > 0 ? "800" : "600",
                                                textDecoration: "none",
                                                color: "#333",
                                                flex: 1
                                            }}
                                        >
                                            {chatter.name}
                                        </Link>
                                        {/* Unread count badge */}
                                        {unreadCount > 0 && (
                                            <span style={{
                                                background: "linear-gradient(135deg, #df860a, #f5a623)",
                                                color: "white",
                                                borderRadius: "12px",
                                                padding: "2px 8px",
                                                fontSize: "12px",
                                                fontWeight: "bold",
                                                minWidth: "22px",
                                                textAlign: "center"
                                            }}>
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
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
