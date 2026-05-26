import { useState, useEffect } from "react"
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import blogchitLogo from '../assets/blogchit.png';

import { io } from 'socket.io-client';
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL;
const socket = io(import.meta.env.VITE_SOCKET_URL);

function Navbar({ unreadCount, setUnreadCount, unreadMsgCount, setUnreadMsgCount, unreadPerChatter, setUnreadPerChatter, unreadChatters, setUnreadChatters }) {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUsername = userData.username || null;
    const userId = userData.userId || null;
    const [message , setmessage] = useState("");
    const [token, setToken] = useState(userData.token || null);
    const [isLoggedIn, setIsLoggedIn] = useState(!!token);
    const [role, setrole] = useState(userData.role || "");
    const navigate = useNavigate();
    useEffect(() => {
        if (token) {
            const userData = JSON.parse(localStorage.getItem("user") || "{}");
            userData.token = token;
            localStorage.setItem("user", JSON.stringify(userData));
        } else {
            localStorage.removeItem('user');
        }
    }, [token]);

    useEffect(() => {

        if (currentUsername) {
            socket.emit("setup_user", userId);

            //Initial fetch of notifications
            axios.get(`${API_URL}/notifications/${userId}`)
                .then(res => {

                    setUnreadCount(res.data.filter(n => !n.isRead).length);
                })
                .catch(err => console.error("Error fetching notifs:", err));

            // Fetch initial unread message counts
            axios.get(`${API_URL}/unreadcounts/${userId}`)
                .then(res => {
                    const { unreadChatters, perChatter } = res.data;
                    setUnreadChatters(unreadChatters || []);
                    setUnreadMsgCount(unreadChatters?.length || 0);
                    setUnreadPerChatter(perChatter || {});
                })
                .catch(err => console.error("Error fetching unread counts:", err));
         }

        const handleNewNotification = (newNotif) => {

            setUnreadCount((prev) => Math.max(prev + 1, 0));
          
        };

        const handleNewUnreadMessage = (msg) => {
            // Only increment if the message is for this user (receiver)
            if (msg.receiverId?.toString() === userId) {
                setUnreadChatters((prev) => {
                    if (!prev.includes(msg.senderId.toString())) {
                        setUnreadMsgCount((prevCount) => prevCount + 1);
                        return [...prev, msg.senderId.toString()];
                    }
                    return prev;
                });

                setUnreadPerChatter((prev) => ({
                    ...prev,
                    [msg.senderId.toString()]: (prev[msg.senderId.toString()] || 0) + 1
                }));
            }
        };

      
        socket.on("new_unread_message", handleNewUnreadMessage);
          socket.on("receive_notification", handleNewNotification);

        return () => {
            socket.off("receive_notification", handleNewNotification);
            socket.off("new_unread_message", handleNewUnreadMessage);
        };
    }, [currentUsername]);

    return (<>
        {/* Mobile Top Navbar (< 1024px) */}
        <div className="mobile-top-navbar">
            <Link to="/">
                <img src={blogchitLogo} alt="BlogChit" className="navbar-logo" />
            </Link>
            <div className="navbar-actions">
                <Link to="/notti" className="nav-action-btn">
                    🔔
                    {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                </Link>
                <Link to="/write" className="nav-action-btn">
                    ✍️
                </Link>
            </div>
        </div>

        {/* Desktop Navbar (>= 1024px) */}
        <div className="desktop-navbar main" style={{ display: "flex", justifyContent: "space-around" }}>
            <div style={{ position: "relative", display: "inline-block" }}>
                <button style={{ position: "relative", padding: "10px", background: "#f0f0f0", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                   <Link to={"/notti"}> 🔔 Notifications {unreadCount > 0 && <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "red", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "10px" }}>{unreadCount}</span>}</Link>
                </button>

            </div>

            {role === "admin" && (
                <div><Link to={"/admin"}> admin</Link></div>
            )}

                        <Link to={"/profile"}>profile</Link>
            <Link to={"/search"}>search</Link>
            <Link to={"/communities"}>Communities</Link>
            <Link to={"/write"}>✍️ write blog</Link>
            <div style={{ position: "relative", display: "inline-block" }}>
                <Link to={"/messages"} onClick={() => { 
                    setUnreadMsgCount(0); 
                    setUnreadChatters([]); 
                    axios.post(`${API_URL}/clearunread`, { userId }).catch(err => console.error(err));
                }} style={{ position: "relative", textDecoration: "none", color: "inherit" }}>
                    💬 messages
                    {unreadMsgCount > 0 && (
                        <span style={{
                            position: "absolute",
                            top: "-10px",
                            right: "-14px",
                            background: "#ff3b30",
                            color: "white",
                            borderRadius: "50%",
                            padding: "2px 6px",
                            fontSize: "10px",
                            fontWeight: "bold",
                            minWidth: "18px",
                            textAlign: "center",
                            lineHeight: "14px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                        }}>
                            {unreadMsgCount}
                        </span>
                    )}
                </Link>
            </div>

        </div>

        <hr className="desktop-navbar-hr" />
    </>
    )
}

export default Navbar



