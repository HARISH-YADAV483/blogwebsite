import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function Messages() {
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

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
            <h1>Messages</h1>
            
            {loading ? (
                <p>Loading...</p>
            ) : chatters.length === 0 ? (
                <p style={{ color: "#888" }}>No messages yet. Start a conversation by visiting someone's profile!</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {chatters.map((chatter) => (
                        <div 
                            key={chatter._id} 
                            style={{ 
                                border: "1px solid #ddd", 
                                borderRadius: "8px", 
                                padding: "15px",
                                display: "flex",
                                alignItems: "center",
                                gap: "15px"
                            }}
                        >
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
                                style={{ 
                                    fontSize: "18px",
                                    fontWeight: "bold",
                                    textDecoration: "none",
                                    color: "#333"
                                }}
                            >
                                {chatter.name}
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Messages;

