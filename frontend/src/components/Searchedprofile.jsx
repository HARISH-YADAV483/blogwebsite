import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./searchedprofile.css";

const API_URL = import.meta.env.VITE_API_URL;

function getInitial(str = "") {
    return str.trim().charAt(0).toUpperCase() || "?";
}

function readingTime(html = "") {
    const words = html.replace(/<[^>]+>/g, "").trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
}

function Searchedprofile({ unreadCount, setUnreadCount }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const storedUser    = JSON.parse(localStorage.getItem("user") || "{}");
    const userId        = storedUser.userId;
    const currentUsername = storedUser.username;

    const [blogs, setBlogs]           = useState([]);
    const [image, setImage]           = useState("");
    const [username, setUsername]     = useState("");
    const [bc, setBc]                 = useState("");
    const [bio, setBio]               = useState("");
    const [name, setName]             = useState("");
    const [isfollowing, setIsfollowing] = useState(false);
    const [followers, setFollowers]   = useState([]);
    const [following, setFollowing]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);

    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);

    const getprofile = async () => {
        try {
            setLoading(true);
            const res = await axios.post(`${API_URL}/searchprofile`, { id, username: currentUsername });
            setBlogs(res.data.veriblogs || []);
            setUsername(res.data.username || "");
            setImage(res.data.image || "");
            setIsfollowing(res.data.isfollowing || false);
            setFollowers(res.data.followers || []);
            setFollowing(res.data.following || []);
            setName(res.data.name || "");
            setBc(res.data.bc || "0");
            setBio(res.data.bio || "");
        } catch (err) {
            console.error("Error fetching profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const follow = async () => {
        try {
            const action = isfollowing ? "unfollow" : "follow";
            const res = await axios.post(`${API_URL}/${action}`, { userId, targetId: id });
            setIsfollowing(!isfollowing);
            setFollowers(res.data.followers || []);
            setFollowing(res.data.following || []);
        } catch (err) {
            console.error(`Failed to ${isfollowing ? "unfollow" : "follow"}`, err);
        }
    };

    const startChat = async () => {
        setMsgLoading(true);
        try {
            await axios.post(`${API_URL}/addchatter`, { userId, chatterId: id });
            navigate(`/chat/${id}`);
        } catch (err) {
            console.error("Error starting conversation:", err);
        } finally {
            setMsgLoading(false);
        }
    };

    useEffect(() => {
        getprofile();
        window.scrollTo({ top: 0 });
    }, [id]);

    if (loading) {
        return (
            <div className="sp-page">
                <div className="sp-loading">
                    <div className="sp-spinner" />
                    <p>Loading profile…</p>
                </div>
            </div>
        );
    }

    const isOwnProfile = userId === id;

    return (
        <div className="sp-page">

            {/* ── Back bar ── */}
            <div className="sp-back-bar">
                <button className="sp-back-btn" onClick={() => navigate(-1)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
                    </svg>
                    Back
                </button>
            </div>

            {/* ── Profile card ── */}
            <div className="sp-profile-card">

                {/* Avatar */}
                <div className="sp-avatar-wrap">
                    {image ? (
                        <img src={image} alt={username} className="sp-avatar" />
                    ) : (
                        <div className="sp-avatar-placeholder">
                            {getInitial(username || name)}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="sp-info">
                    <h1 className="sp-name">{name || username}</h1>
                    {username && <p className="sp-username">@{username}</p>}
                    {bio && <p className="sp-bio">{bio}</p>}

                    {/* BC coin */}
                    {bc && (
                        <div className="sp-bc-badge">
                            <span className="sp-bc-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
                            </span>
                            <span>{bc} BC</span>
                        </div>
                    )}

                    {/* Stats row */}
                    <div className="sp-stats-row">
                        <button
                            className="sp-stat-btn"
                            onClick={() => { setShowFollowers(!showFollowers); setShowFollowing(false); }}
                        >
                            <span className="sp-stat-num">{followers.length}</span>
                            <span className="sp-stat-label">Followers</span>
                        </button>
                        <div className="sp-stat-divider" />
                        <button
                            className="sp-stat-btn"
                            onClick={() => { setShowFollowing(!showFollowing); setShowFollowers(false); }}
                        >
                            <span className="sp-stat-num">{following.length}</span>
                            <span className="sp-stat-label">Following</span>
                        </button>
                        <div className="sp-stat-divider" />
                        <div className="sp-stat-btn">
                            <span className="sp-stat-num">{blogs.length}</span>
                            <span className="sp-stat-label">Blogs</span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    {!isOwnProfile && (
                        <div className="sp-actions">
                            <button
                                className={`sp-follow-btn${isfollowing ? " following" : ""}`}
                                onClick={follow}
                            >
                                {isfollowing ? (
                                    <>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Following
                                    </>
                                ) : (
                                    <>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        Follow
                                    </>
                                )}
                            </button>
                            <button className="sp-msg-btn" onClick={startChat} disabled={msgLoading}>
                                {msgLoading ? (
                                    <span className="sp-btn-spinner" />
                                ) : (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                )}
                                Message
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Followers list panel ── */}
            {showFollowers && (
                <div className="sp-list-panel sp-list-panel--followers">
                    <div className="sp-list-panel-header">
                        <h3>Followers</h3>
                        <button className="sp-list-close" onClick={() => setShowFollowers(false)}>✕</button>
                    </div>
                    {followers.length === 0 ? (
                        <p className="sp-list-empty">No followers yet</p>
                    ) : (
                        <div className="sp-list-items">
                            {followers.map(f => (
                                <Link key={f._id} to={`/profile/${f._id}`} className="sp-list-item" onClick={() => setShowFollowers(false)}>
                                    <div className="sp-list-avatar">{getInitial(f.username || f.name)}</div>
                                    <span>{f.username || f.name}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Following list panel ── */}
            {showFollowing && (
                <div className="sp-list-panel sp-list-panel--following">
                    <div className="sp-list-panel-header">
                        <h3>Following</h3>
                        <button className="sp-list-close" onClick={() => setShowFollowing(false)}>✕</button>
                    </div>
                    {following.length === 0 ? (
                        <p className="sp-list-empty">Not following anyone yet</p>
                    ) : (
                        <div className="sp-list-items">
                            {following.map(f => (
                                <Link key={f._id} to={`/profile/${f._id}`} className="sp-list-item" onClick={() => setShowFollowing(false)}>
                                    <div className="sp-list-avatar">{getInitial(f.username || f.name)}</div>
                                    <span>{f.username || f.name}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Blogs section ── */}
            <div className="sp-blogs-section">
                <h2 className="sp-blogs-heading">
                    {blogs.length > 0
                        ? `${username || name}'s Blogs`
                        : `No blogs yet`}
                </h2>

                {blogs.length > 0 ? (
                    <div className="sp-blogs-grid">
                        {blogs.map(blog => (
                            <article key={blog._id} className="sp-blog-card">
                                {blog.image && (
                                    <div className="sp-blog-thumb">
                                        <img src={blog.image} alt={blog.title} />
                                    </div>
                                )}
                                <div className="sp-blog-body">
                                    {blog.category && (
                                        <span className="sp-blog-category">{blog.category}</span>
                                    )}
                                    <h3 className="sp-blog-title">{blog.title}</h3>
                                    {blog.subtitle && (
                                        <p className="sp-blog-subtitle">{blog.subtitle}</p>
                                    )}
                                    <div className="sp-blog-meta">
                                        <span className="sp-blog-read">{readingTime(blog.content)} min read</span>
                                    </div>
                                    <Link to={`/blog/${blog._id}`} className="sp-blog-link">
                                        Read article
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="sp-blogs-empty">
                        <span>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </span>
                        <p>{name || username} hasn't published any blogs yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Searchedprofile;
