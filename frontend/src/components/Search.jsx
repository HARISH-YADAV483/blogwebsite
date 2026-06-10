import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./search.css";
import searchingVideo from "../assets/searching.webm";

const API_URL = import.meta.env.VITE_API_URL;

const TABS = [
    { key: "users",       label: "People",      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { key: "blogs",       label: "Blogs",        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
    { key: "communities", label: "Communities",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
];

function readingTime(html = "") {
    const words = html.replace(/<[^>]+>/g, "").trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
}

function Search() {
    const [query, setQuery]             = useState("");
    const [activeTab, setActiveTab]     = useState("users");
    const [users, setUsers]             = useState([]);
    const [blogs, setBlogs]             = useState([]);
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading]         = useState(false);
    const inputRef = useRef(null);

    /* ── Debounced fetch ── */
    useEffect(() => {
        if (!query.trim()) {
            setUsers([]); setBlogs([]); setCommunities([]);
            return;
        }
        const t = setTimeout(() => fetchAll(query.trim()), 300);
        return () => clearTimeout(t);
    }, [query]);

    const fetchAll = async (q) => {
        setLoading(true);
        try {
            const [uRes, bRes, cRes] = await Promise.allSettled([
                axios.post(`${API_URL}/search`, { search: q }),
                axios.get(`${API_URL}/search/blogs?q=${encodeURIComponent(q)}`),
                axios.get(`${API_URL}/community/search?q=${encodeURIComponent(q)}`),
            ]);
            setUsers(uRes.status === "fulfilled" && Array.isArray(uRes.value.data) ? uRes.value.data : []);
            setBlogs(bRes.status === "fulfilled" && Array.isArray(bRes.value.data) ? bRes.value.data : []);
            setCommunities(cRes.status === "fulfilled" && Array.isArray(cRes.value.data) ? cRes.value.data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const counts = { users: users.length, blogs: blogs.length, communities: communities.length };
    const isEmpty = query.trim() === "";

    return (
        <div className="search-page">
            {/* ── Search bar ── */}
            <div className="search-top">
                <div className="search-input-wrapper">
                    <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                            stroke="url(#sg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 21L16.65 16.65" stroke="url(#sg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <defs>
                            <linearGradient id="sg" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#df860a" /><stop offset="1" stopColor="#f5a623" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-input"
                        placeholder="Search BlogChit…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {query && (
                        <button className="search-clear-btn" onClick={() => { setQuery(""); inputRef.current?.focus(); }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* ── Tabs ── */}
                <div className="search-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`search-tab${activeTab === tab.key ? " active" : ""}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <span className="search-tab-icon">{tab.icon}</span>
                            <span>{tab.label}</span>
                            {!isEmpty && counts[tab.key] > 0 && (
                                <span className="search-tab-count">{counts[tab.key]}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Results area ── */}
            <div className="search-results-area">
                {isEmpty ? (
                    <div className="search-empty-state">
                        <video src={searchingVideo} autoPlay loop muted playsInline />
                        <p className="search-empty-text">Discover people, blogs & communities</p>
                    </div>
                ) : loading ? (
                    <div className="search-loading">
                        <div className="search-spinner" />
                        <p>Searching…</p>
                    </div>
                ) : (
                    <>
                        {/* ── USERS ── */}
                        {activeTab === "users" && (
                            <div className="search-section">
                                {users.length > 0 ? (
                                    <div className="search-list">
                                        {users.map(user => (
                                            <Link to={`/profile/${user._id}`} key={user._id} className="search-user-card">
                                                {user.image ? (
                                                    <img src={user.image} alt="" className="search-avatar" />
                                                ) : (
                                                    <div className="search-avatar-placeholder">
                                                        {(user.username || user.name || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="search-user-info">
                                                    <span className="search-user-name">{user.name || user.username}</span>
                                                    {user.username && <span className="search-user-handle">@{user.username}</span>}
                                                    {user.bio && <span className="search-user-bio">{user.bio}</span>}
                                                </div>
                                                <svg className="search-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 18l6-6-6-6" />
                                                </svg>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="search-no-results">
                                        <span className="search-no-results-icon">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        </span>
                                        <p>No people found for "<strong>{query}</strong>"</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── BLOGS ── */}
                        {activeTab === "blogs" && (
                            <div className="search-section">
                                {blogs.length > 0 ? (
                                    <div className="search-blog-grid">
                                        {blogs.map(blog => (
                                            <Link to={`/blog/${blog._id}`} key={blog._id} className="search-blog-card">
                                                {blog.image && (
                                                    <div className="search-blog-thumb">
                                                        <img src={blog.image} alt={blog.title} />
                                                    </div>
                                                )}
                                                <div className="search-blog-body">
                                                    {blog.category && (
                                                        <span className="search-blog-category">{blog.category}</span>
                                                    )}
                                                    <h3 className="search-blog-title">{blog.title}</h3>
                                                    {blog.subtitle && (
                                                        <p className="search-blog-subtitle">{blog.subtitle}</p>
                                                    )}
                                                    <div className="search-blog-meta">
                                                        <span className="search-blog-author">By {blog.author}</span>
                                                        <span className="search-blog-read">{readingTime(blog.content)} min read</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="search-no-results">
                                        <span className="search-no-results-icon">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                        </span>
                                        <p>No blogs found for "<strong>{query}</strong>"</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── COMMUNITIES ── */}
                        {activeTab === "communities" && (
                            <div className="search-section">
                                {communities.length > 0 ? (
                                    <div className="search-list">
                                        {communities.map(c => (
                                            <Link to={`/community/${c._id}`} key={c._id} className="search-community-card">
                                                {c.image ? (
                                                    <img src={c.image} alt="" className="search-avatar search-avatar--square" />
                                                ) : (
                                                    <div className="search-avatar-placeholder search-avatar-placeholder--community">
                                                        {(c.name || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="search-user-info">
                                                    <span className="search-user-name">{c.name}</span>
                                                    <span className="search-user-handle">
                                                        {c.type === "private" ? "🔒 Private" : "🌐 Public"}
                                                        {" · "}
                                                        {c.members?.length ?? 0} members
                                                    </span>
                                                    {c.desc && <span className="search-user-bio">{c.desc}</span>}
                                                </div>
                                                <svg className="search-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 18l6-6-6-6" />
                                                </svg>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="search-no-results">
                                        <span className="search-no-results-icon">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                        </span>
                                        <p>No communities found for "<strong>{query}</strong>"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Search;
