import { useState, useEffect } from "react"
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { io } from 'socket.io-client';
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL;
const socket = io("http://localhost:5003");

function Navbar({ unreadCount, setUnreadCount }) {
    const name = localStorage.getItem("name");
    const userId = localStorage.getItem("userId"); 
   
    const [message , setmessage] = useState("");
    const [token, setToken] = useState(localStorage.getItem('token') || null);
     const [isLoggedIn, setIsLoggedIn] = useState(!!token);
    const [role, setrole] = useState(localStorage.getItem("role") || "");
    const navigate = useNavigate();
    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }, [token]);

    const handleLogout = () => {
        axios.post(`${API_URL}/logout`)
            .then(res => {
                setmessage(res.data.message);
                setToken(null);
                setIsLoggedIn(false);
                localStorage.removeItem("name");
                localStorage.removeItem("userId");
                localStorage.removeItem("role");
                   navigate("/");
            })
            .catch(err => {
                console.error(err);
                setmessage("Logout failed");
            });
    };
    useEffect(() => {

        if (name) {
            socket.emit("setup_user", userId);

            //Initial fetch of notifications
            axios.get(`${API_URL}/notifications/${userId}`)
                .then(res => {

                    setUnreadCount(res.data.filter(n => !n.isRead).length);
                })
                .catch(err => console.error("Error fetching notifs:", err));
         }

        const handleNewNotification = (newNotif) => {

            setUnreadCount((prev) => Math.max(prev + 1, 0));
          
        };

        socket.on("receive_notification", handleNewNotification);

        return () => {
            socket.off("receive_notification", handleNewNotification);
        };
    }, [name]);

    return (<>
        <div className="main" style={{ display: "flex", justifyContent: "space-around" }}>
            <div style={{ position: "relative", display: "inline-block" }}>
                <button style={{ position: "relative", padding: "10px", background: "#f0f0f0", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                   <Link to={"/notti"}> 🔔 Notifications {unreadCount > 0 && <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "red", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "10px" }}>{unreadCount}</span>}</Link>
                </button>

            </div>

            <button onClick={handleLogout}>Logout</button>
            {role === "admin" && (
                <div><Link to={"/admin"}> admin</Link></div>
            )}

            <Link to={"/profile"}>profile</Link>
<Link to={"/search"}>search</Link>
            <Link to={"/messages"}>messages</Link>

        </div>

        <hr />
    </>
    )
}

export default Navbar

