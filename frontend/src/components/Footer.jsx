import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function Footer({ unreadMsgCount, setUnreadMsgCount, unreadChatters, setUnreadChatters }) {
    const location = useLocation();
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = userData.userId || null;
    const userName = userData.username || "";
    const [userImage, setUserImage] = useState("");

    useEffect(() => {
        if (userId) {
            axios.post(`${API_URL}/getprofile`, { username: userName })
                .then(res => {
                    setUserImage(res.data.image || "");
                })
                .catch(err => console.error("Error fetching profile image:", err));
        }
    }, [userId, userName]);

    const handleMessagesClick = () => {
        setUnreadMsgCount(0);
        setUnreadChatters([]);
        axios.post(`${API_URL}/clearunread`, { userId }).catch(err => console.error(err));
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="mobile-bottom-footer">
            {/* Home */}
            <Link to="/" className={`footer-nav-item ${isActive("/") ? "active" : ""}`}>
                <span className="footer-nav-icon">🏠</span>
                <span className="footer-nav-label">Home</span>
            </Link>

            {/* Messages */}
            <Link
                to="/messages"
                className={`footer-nav-item ${isActive("/messages") ? "active" : ""}`}
                onClick={handleMessagesClick}
            >
                <span className="footer-nav-icon">💬</span>
                {unreadMsgCount > 0 && <span className="footer-badge">{unreadMsgCount}</span>}
                <span className="footer-nav-label">Messages</span>
            </Link>

            {/* Search */}
            <Link to="/search" className={`footer-nav-item ${isActive("/search") ? "active" : ""}`}>
                <span className="footer-nav-icon">🔍</span>
                <span className="footer-nav-label">Search</span>
            </Link>

            {/* Profile */}
            <Link to="/profile" className={`footer-nav-item ${isActive("/profile") ? "active" : ""}`}>
                {userImage ? (
                    <img src={userImage} alt="" className="footer-profile-img" />
                ) : (
                    <span className="footer-profile-initial">
                        {userName ? userName.charAt(0) : "?"}
                    </span>
                )}
                <span className="footer-nav-label">Profile</span>
            </Link>
        </nav>
    );
}

export default Footer;
