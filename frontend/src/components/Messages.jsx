import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function Messages({ unreadPerChatter, setUnreadPerChatter, setUnreadMsgCount }) {
    const userId = localStorage.getItem("userId");
    const [chatters, setChatters] = useState([]);
    const [loading, setLoading] = useState(true);

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
        <>
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
            <h1>Messages</h1>
            
            {loading ? (
                <p>Loading...</p>
            ) : chatters.length === 0 ? (
                <p style={{ color: "#888" }}>No messages yet. Start a conversation by visiting someone's profile!</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {chatters.map((chatter) => {
                        const unreadCount = unreadPerChatter[chatter._id] || 0;
                        return (
                            <div 
                                key={chatter._id} 
                                style={{ 
                                    border: unreadCount > 0 ? "2px solid #34c759" : "1px solid #ddd", 
                                    borderRadius: "8px", 
                                    padding: "15px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "15px",
                                    backgroundColor: unreadCount > 0 ? "#f0fff4" : "transparent",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                {/* Unread indicator dot */}
                                {unreadCount > 0 && (
                                    <div style={{
                                        width: "10px",
                                        height: "10px",
                                        borderRadius: "50%",
                                        backgroundColor: "#34c759",
                                        flexShrink: 0,
                                        boxShadow: "0 0 6px rgba(52, 199, 89, 0.5)"
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
                                            objectFit: "cover" 
                                        }} 
                                    />
                                )}
                                <Link 
                                    to={`/chat/${chatter._id}`} 
                                    onClick={() => handleChatClick(chatter._id)}
                                    style={{ 
                                        fontSize: "18px",
                                        fontWeight: unreadCount > 0 ? "800" : "bold",
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
                                        background: "#df860aff",
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
        </div>
        <div className="communities">
<h1>Communities</h1>

        </div>
        </>
    );
}

export default Messages;

