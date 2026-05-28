import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom";
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
    const location = useLocation();
    const currentPath = location.pathname;
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
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                </Link>
                <Link to="/write" className="nav-action-btn">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </Link>
            </div>
        </div>

        {/* Desktop Navbar (>= 1024px) */}
        <nav className="desktop-navbar" id="desktop-navbar">
            <div className="desktop-navbar__inner">
                {/* Logo — left side */}
                <Link to="/" className="desktop-navbar__logo-link">
                    <img src={blogchitLogo} alt="BlogChit" className="desktop-navbar__logo" />
                </Link>

                {/* Nav links — right side, bottom-aligned */}
                <div className="desktop-navbar__links">
                    <Link to="/write" className={`desktop-nav-link${currentPath === '/write' ? ' active' : ''}`} id="nav-write">
                        <svg className="desktop-nav-link__icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span className="desktop-nav-link__label">Write Blog</span>
                    </Link>

                    <Link to="/search" className={`desktop-nav-link${currentPath === '/search' ? ' active' : ''}`} id="nav-search">
                        <svg className="desktop-nav-link__icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <span className="desktop-nav-link__label">Search</span>
                    </Link>

                    <Link to="/messages" className={`desktop-nav-link${(currentPath.startsWith('/messages') || currentPath.startsWith('/chat') || currentPath.startsWith('/communities') || currentPath.startsWith('/communiy')) ? ' active' : ''}`} id="nav-messages" onClick={() => { 
                        setUnreadMsgCount(0); 
                        setUnreadChatters([]); 
                        axios.post(`${API_URL}/clearunread`, { userId }).catch(err => console.error(err));
                    }}>
                        <svg className="desktop-nav-link__icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="desktop-nav-link__label">Messages</span>
                        {unreadMsgCount > 0 && (
                            <span className="desktop-nav-link__badge">{unreadMsgCount}</span>
                        )}
                    </Link>

                    <Link to="/notti" className={`desktop-nav-link${currentPath === '/notti' ? ' active' : ''}`} id="nav-notifications">
                        <svg className="desktop-nav-link__icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span className="desktop-nav-link__label">Notifications</span>
                        {unreadCount > 0 && (
                            <span className="desktop-nav-link__badge">{unreadCount}</span>
                        )}
                    </Link>

                    <Link to="/profile" className={`desktop-nav-link${currentPath === '/profile' ? ' active' : ''}`} id="nav-profile">
                        <svg className="desktop-nav-link__icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span className="desktop-nav-link__label">Profile</span>
                    </Link>
                </div>
            </div>
        </nav>
    </>

    )
}

export default Navbar



