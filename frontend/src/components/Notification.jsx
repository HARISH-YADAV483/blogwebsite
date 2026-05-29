import axios from "axios";
import { useState, useEffect } from "react";
import "./notification.css";

const API_URL = import.meta.env.VITE_API_URL;

function Notification({ unreadCount, setUnreadCount, inline = false }) {
  const userId = JSON.parse(localStorage.getItem("user") || "{}").userId;
  const [notifications, setNotifications] = useState([]);
  const [oldNotifications, setOldNotifications] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const getnoti = async () => {
    setLoading(true);
    await axios
      .get(`${API_URL}/notifications/${userId}`)
      .then((res) => {
        setNotifications(res.data);
      })
      .catch((err) => console.error("Error fetching notifs:", err))
      .finally(() => setLoading(false));
  };

  const oldgetnoti = async () => {
    await axios
      .get(`${API_URL}/oldnotifications/${userId}`)
      .then((res) => {
        setOldNotifications(res.data);
        setShowHistory(true);
      })
      .catch((err) => console.error("Error fetching notifs:", err));
  };

  const read = async (id) => {
    await axios
      .post(`${API_URL}/read`, { id })
      .then((res) => {
        setMessage(res.data.message);
        setUnreadCount((prev) => Math.max(prev - 1, 0));
        setNotifications((prev) => prev.filter((noti) => noti._id !== id));
        setTimeout(() => setMessage(""), 2000);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    getnoti();
  }, []);

  const content = (
    <div className={`notti-panel ${inline ? "notti-panel--inline" : "notti-panel--page"}`}>
      {/* Header */}
      <div className="notti-header">
        <div className="notti-header__left">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <h2 className="notti-header__title">Notifications</h2>
          {unreadCount > 0 && <span className="notti-header__badge">{unreadCount}</span>}
        </div>
        <button className="notti-history-btn" onClick={showHistory ? () => setShowHistory(false) : oldgetnoti}>
          {showHistory ? "Hide History" : "View History"}
        </button>
      </div>

      {/* Toast message */}
      {message && <div className="notti-toast">{message}</div>}

      {/* New notifications */}
      <div className="notti-section">
        {loading ? (
          <div className="notti-loading">
            <div className="notti-skeleton" />
            <div className="notti-skeleton notti-skeleton--short" />
            <div className="notti-skeleton" />
          </div>
        ) : notifications.length > 0 ? (
          <ul className="notti-list">
            {notifications.map((notis) => (
              <li key={notis._id} className="notti-item notti-item--unread">
                <div className="notti-item__dot" />
                <div className="notti-item__body">
                  <p className="notti-item__text">{notis.message}</p>
                  <span className="notti-item__time">
                    {notis.createdAt ? new Date(notis.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Just now"}
                  </span>
                </div>
                <button className="notti-item__dismiss" onClick={() => read(notis._id)} title="Dismiss">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="notti-empty">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="notti-empty__icon">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="notti-empty__text">You're all caught up!</p>
            <p className="notti-empty__sub">No new notifications</p>
          </div>
        )}
      </div>

      {/* History section */}
      {showHistory && (
        <div className="notti-section notti-section--history">
          <div className="notti-section__label">Earlier</div>
          {oldNotifications.length > 0 ? (
            <ul className="notti-list">
              {oldNotifications.map((notis) => (
                <li key={notis._id} className="notti-item notti-item--read">
                  <div className="notti-item__dot notti-item__dot--read" />
                  <div className="notti-item__body">
                    <p className="notti-item__text">{notis.message}</p>
                    <span className="notti-item__time">
                      {notis.createdAt ? new Date(notis.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="notti-empty notti-empty--small">
              <p className="notti-empty__sub">No notification history</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // On mobile this is a full page — just return the panel
  return content;
}

export default Notification;