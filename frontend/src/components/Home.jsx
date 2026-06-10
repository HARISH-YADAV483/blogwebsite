import { useState, useEffect, useRef } from "react"
import birdImg from '../assets/bird.png';
import earnmoney from '../assets/earnmoney.png';
import './earnmoney.css';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios'
import './home.css'
import { io } from 'socket.io-client';
const socket = io(import.meta.env.VITE_SOCKET_URL);
const API_URL = import.meta.env.VITE_API_URL;
function Home() {
    const [blogs, setBlogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [message, setmessage] = useState(null);
    const navigate = useNavigate();
    const [chatters, setchatters] = useState([]);
    const [topblogs, settopblogs] = useState([]);
    const trendingRef = useRef(null);
    const verifiedRef = useRef(null);
    const [trendingInView, setTrendingInView] = useState(false);
    const [verifiedInView, setVerifiedInView] = useState(false);
    const [selectedBlogId, setSelectedBlogId] = useState(null);
    const [selectedChatters, setSelectedChatters] = useState([]);
    const userId = JSON.parse(localStorage.getItem("user") || "{}").userId
    const [role, setrole] = useState(JSON.parse(localStorage.getItem("user") || "{}").role || "");
    const token = JSON.parse(localStorage.getItem("user") || "{}").token;

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTrendingInView(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );
        if (trendingRef.current) observer.observe(trendingRef.current);
        return () => { if (trendingRef.current) observer.unobserve(trendingRef.current); };
    }, [topblogs]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVerifiedInView(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.05 }
        );
        if (verifiedRef.current) observer.observe(verifiedRef.current);
        return () => { if (verifiedRef.current) observer.unobserve(verifiedRef.current); };
    }, [blogs]);

    const gettopblogs = async () => {
        await axios.get(`${API_URL}/gettopblogs`)
            .then(res => {
                if (res.data.blogs) {
                    settopblogs(res.data.blogs);
                    // alert(res.data.message);
                } else {
                    console.warn(res.data.message || "Failed to fetch trending blogs");
                }
            })
            .catch(err => {
                console.error("Error fetching trending blogs:", err);
            })
    }

    const getVerifiedBlogs = async (page = 1) => {
        try {
            const res = await axios.get(`${API_URL}/verified?page=${page}`);
            if (res.data && Array.isArray(res.data.blogs)) {
                setBlogs(res.data.blogs);
                setTotalPages(res.data.totalPages || 1);
                setCurrentPage(res.data.page || 1);
                setmessage("");
                // scroll to section top
                if (verifiedRef.current && page > 1) {
                    verifiedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                setBlogs([]);
                setmessage("No blogs found");
            }
        } catch (err) {
            console.error(err);
            setmessage("Error fetching blogs");
        }
    }

    const like = async (id) => {
        await axios.post(`${API_URL}/like`, { id, userId })
            .then(res => {
                setmessage(res.data.message);
                setBlogs(prevBlogs => prevBlogs.map(blog =>
                    blog._id === id ? { ...blog, likes: res.data.likes } : blog
                ));
            })
            .catch(err => {
                console.error(err);
                console.log("unable to like ");
                setmessage("Unable to like blog");
            })
    }
    const save = async (id) => {
        await axios.post(`${API_URL}/save`, { id, userId })
            .then(res => {
                setmessage(res.data.message);

            })
            .catch(err => {
                console.error(err);
                console.log("unable to save ");
                setmessage("Unable to save blog");
            })
    }
    const formatDate = (blog) => {
        if (blog.createdAt) {
            return new Date(blog.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            });
        }
        if (blog.time) {
            return new Date(blog.time).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            });
        }
        return "March 24, 2026";
    };

    const getChatters = async () => {
        try {
            const res = await axios.get(`${API_URL}/chatters/${userId}`);
            setchatters(res.data || []);

        } catch (err) {
            console.error("Error fetching chatters:", err);

        }
    };
    useEffect(() => {
        const interval = setInterval(() => {
            settopblogs(prev => {
                if (prev.length <= 1) return prev;
                return [...prev.slice(1), prev[0]];
            });
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (token) {
            getVerifiedBlogs(1);
            getChatters();
            gettopblogs();
        }
    }, [token]);

    if (!token) {
        return null;
    }

    return (
        < >
           
            <section className="hero-section">

                {/* Radial glow blob */}
                <div className="hero-glow-blob" />

                {/* LEFT – Copy */}
                <div className="hero-left">
                    <div className="hero-badge">
                        <span className="hero-badge-plus">✦</span>
                        WHERE IDEAS TURN INTO IMPACT
                    </div>

                    <h1 className="hero-headline">
                        Write.<br />
                        <span className="hero-highlight">Connect.</span><br />
                        Grow Together.
                    </h1>

                    <p className="hero-subtext">
                        BlogCHIT combines blogging, messaging, and communities
                        into one platform where ideas don't just get published —
                        they start conversations.
                    </p>

                    <div className="hero-ctas">
                        <Link to="/write" className="hero-btn-primary">
                            Start Writing <span className="hero-btn-arrow">→</span>
                        </Link>
                        <Link to="/communities" className="hero-btn-secondary">
                            Explore Communities
                        </Link>
                    </div>

                    <div className="hero-stats">
                        <div className="hero-stat">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                            <span className="hero-stat-num">10,000+</span>
                            <span className="hero-stat-label">Blogs</span>
                        </div>
                        <div className="hero-stat-divider" />
                        <div className="hero-stat">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            <span className="hero-stat-num">2,000+</span>
                            <span className="hero-stat-label">Creators</span>
                        </div>
                        <div className="hero-stat-divider" />
                        <div className="hero-stat">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            <span className="hero-stat-num">50+</span>
                            <span className="hero-stat-label">Communities</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT – Bird + floating cards */}
                <div className="hero-right">
                    {/* Sparkles */}
                    <span className="hero-sparkle s1">✦</span>
                    <span className="hero-sparkle s2">✦</span>
                    <span className="hero-sparkle s3">+</span>
                    <span className="hero-sparkle s4">+</span>

                    {/* Origami Bird */}
                    <img src={birdImg} alt="BlogCHIT bird" className="hero-bird" />

                    {/* Dashed curved SVG connectors */}
                    <svg className="hero-connectors" viewBox="0 0 420 380" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M210 130 Q310 60 360 90" stroke="#ff6b00" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4" />
                        <path d="M250 200 Q370 170 380 220" stroke="#ff6b00" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4" />
                        <path d="M220 260 Q340 290 360 310" stroke="#ff6b00" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4" />
                    </svg>

                    {/* Floating Card – Blog Post */}
                    <div className="hero-card card-blog">
                        <div className="hero-card-icon-wrap">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                        </div>
                        <div className="hero-card-body">
                            <p className="hero-card-title">Blog Post</p>
                            <div className="hero-card-lines">
                                <span /><span /><span className="short" />
                            </div>
                            <div className="hero-card-img-placeholder" />
                        </div>
                    </div>

                    {/* Floating Card – New Comment */}
                    <div className="hero-card card-comment">
                        <div className="hero-card-icon-wrap">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        </div>
                        <div className="hero-card-body">
                            <p className="hero-card-title">New Comment</p>
                            <div className="hero-card-comment-row">
                                <div className="hero-card-avatar a1" />
                                <span className="hero-card-comment-text">Great post! Totally agree with your thoughts.</span>
                            </div>
                            <div className="hero-card-comment-row" style={{ opacity: 0.5 }}>
                                <div className="hero-card-avatar a2" />
                                <span className="hero-card-comment-text">This changed my perspective!</span>
                            </div>
                        </div>
                    </div>

                    {/* Floating Card – Join Community */}
                    <div className="hero-card card-community">
                        <div className="hero-card-icon-wrap">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </div>
                        <div className="hero-card-body">
                            <p className="hero-card-title">Join Community</p>
                            <div className="hero-card-avatars-row">
                                <div className="hero-card-avatar-sm" style={{ background: '#f4a261' }} />
                                <div className="hero-card-avatar-sm" style={{ background: '#2a9d8f' }} />
                                <div className="hero-card-avatar-sm" style={{ background: '#e76f51' }} />
                                <div className="hero-card-avatar-sm" style={{ background: '#264653' }} />
                                <div className="hero-card-avatar-count">+120</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CATEGORIES TRAINS ────────────────────────────────────── */}
            {(() => {
                const categories = [
                    "Technology", "Artificial Intelligence", "Design",
                    "Business", "Science", "Health & Wellness",
                    "Finance", "Travel", "Food",
                    "Sports", "Photography", "Music",
                    "Education", "Environment", "Politics",
                    "Culture", "Gaming", "Movies",
                ];
                const row1 = categories.slice(0, 9);
                const row2 = categories.slice(9);
                return (
                    <section className="cat-section">
                        <div className="cat-heading-row">
                            <h2 className="cat-heading">Discover Categories</h2>
                        </div>
                        {/* Row 1 — left to right */}
                        <div className="cat-track-wrapper" onMouseEnter={e => e.currentTarget.querySelector('.cat-track').style.animationPlayState = 'paused'} onMouseLeave={e => e.currentTarget.querySelector('.cat-track').style.animationPlayState = 'running'}>
                            <div className="cat-track cat-track-ltr">
                                {[...row1, ...row1, ...row1].map((cat, i) => (
                                    <Link key={`r1-${i}`} to={`/search?category=${encodeURIComponent(cat)}`} className="cat-pill">
                                        <span className="cat-label">{cat}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Row 2 — right to left */}
                        <div className="cat-track-wrapper" onMouseEnter={e => e.currentTarget.querySelector('.cat-track').style.animationPlayState = 'paused'} onMouseLeave={e => e.currentTarget.querySelector('.cat-track').style.animationPlayState = 'running'}>
                            <div className="cat-track cat-track-rtl">
                                {[...row2, ...row2, ...row2].map((cat, i) => (
                                    <Link key={`r2-${i}`} to={`/search?category=${encodeURIComponent(cat)}`} className="cat-pill">
                                        <span className="cat-label">{cat}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                );
            })()}
      

            {topblogs && topblogs.length > 0 && (
                <section ref={trendingRef} className={`trending-section ${trendingInView ? 'in-view' : ''}`}>
                    <div className="trending-header">
                        <h2 className="trending-main-title">Trending</h2>
                        <Link to="/search" className="trending-browse-btn">Browse more</Link>
                    </div>

                    <div className="trending-container">
                        <div
                            className="trending-track-wrapper"
                            onMouseEnter={e => e.currentTarget.querySelector('.trending-track').style.animationPlayState = 'paused'}
                            onMouseLeave={e => e.currentTarget.querySelector('.trending-track').style.animationPlayState = 'running'}
                        >
                            <div className="trending-track">
                                {[...topblogs.slice(0, 10), ...topblogs.slice(0, 10)].map((blog, idx) => (
                                    <Link key={`${blog._id}-${idx}`} to={`/blog/${blog._id}`} className="trending-card">
                                        <div className="trending-img-wrapper">
                                            {blog.category && (
                                                <span className="trending-badge">{blog.category}</span>
                                            )}
                                            {blog.image ? (
                                                <img src={blog.image} alt={blog.title} className="trending-img" />
                                            ) : (
                                                <div className="trending-img-fallback">
                                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5">
                                                        <path d="M4 19.5A2.5 2.5 0 0 1 6 17h12v3H6a2.5 2.5 0 0 1-2.5-2.5z" />
                                                        <path d="M6 2c0 .6-.4 1-1 1s-1-.4-1-1 .4-1 1-1 1 .4 1 1zM18 2c0 .6-.4 1-1 1s-1-.4-1-1 .4-1 1-1 1 .4 1 1z" />
                                                        <path d="M4 6v10.5M18 6v11M6 6h12V2H6v4z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        <div className="trending-meta">
                                            <span>{formatDate(blog)}</span>
                                            <span className="trending-meta-dot">•</span>
                                            <span>{blog.comments?.length || 0} {blog.comments?.length === 1 ? "Comment" : "Comments"}</span>
                                        </div>

                                        <h3 className="trending-title">{blog.title}</h3>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ─── EARN MONEY SECTION ─────────────────────────────── */}
            <section className="earn-section">
                {/* Decorative floating orbs */}
                <div className="earn-orb earn-orb-1" />
                <div className="earn-orb earn-orb-2" />
                <div className="earn-orb earn-orb-3" />

                <div className="earn-container">
                    {/* Left — Image */}
                    <div className="earn-image-col">
                        <div className="earn-image-wrapper">
                            <img src={earnmoney} alt="Earn money with BlogCHIT" className="earn-hero-img" />
                            <div className="earn-image-glow" />
                        </div>
                    </div>

                    {/* Right — Content */}
                    <div className="earn-content-col">
                        <span className="earn-eyebrow">💰 MONETIZE YOUR WRITING</span>
                        <h2 className="earn-title">
                            Earn Money with <span className="earn-highlight">BlogCHIT</span>
                        </h2>
                        <p className="earn-desc">
                            Turn your passion for writing into a steady income stream. Start earning from day one.
                        </p>

                        <div className="earn-steps">
                            <div className="earn-step-card">
                                <div className="earn-step-num">1</div>
                                <div className="earn-step-info">
                                    <h4>Register</h4>
                                    <p>Create your free account in 10 seconds.</p>
                                </div>
                            </div>
                            <div className="earn-step-card">
                                <div className="earn-step-num">2</div>
                                <div className="earn-step-info">
                                    <h4>Publish</h4>
                                    <p>Share knowledge & get paid per view.</p>
                                </div>
                            </div>
                            <div className="earn-step-card">
                                <div className="earn-step-num">3</div>
                                <div className="earn-step-info">
                                    <h4>Earn</h4>
                                    <p>Up to ₹500 per 1,000 views.</p>
                                </div>
                            </div>
                            <div className="earn-step-card">
                                <div className="earn-step-num">4</div>
                                <div className="earn-step-info">
                                    <h4>Withdraw</h4>
                                    <p>Instant earnings via UPI.</p>
                                </div>
                            </div>
                        </div>

                        <Link to="/profile" className="earn-cta-btn">
                            Read Now
                            <span className="earn-cta-arrow">→</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── VERIFIED BLOGS GRID ─────────────────────────────── */}
            <section ref={verifiedRef} className={`vblogs-section ${verifiedInView ? 'vblogs-in-view' : ''}`}>
                <div className="vblogs-header">
                    <div className="vblogs-header-left">
                        <span className="vblogs-eyebrow">✦ EDITOR'S PICKS</span>
                        <h2 className="vblogs-title">Verified Blogs</h2>
                    </div>
                    <div className="vblogs-page-info">
                        Page {currentPage} of {totalPages}
                    </div>
                </div>

                {blogs.length === 0 ? (
                    <div className="vblogs-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        <p>No blogs available yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="vblogs-grid">
                        {blogs.map((blog, idx) => (
                            <Link
                                key={blog._id}
                                to={`/blog/${blog._id}`}
                                className="vblog-card"
                                style={{ animationDelay: `${idx * 0.07}s` }}
                            >
                                {/* Cover Image */}
                                <div className="vblog-cover">
                                    {blog.image ? (
                                        <img src={blog.image} alt={blog.title} className="vblog-cover-img" />
                                    ) : (
                                        <div className="vblog-cover-fallback">
                                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    {blog.category && (
                                        <span className="vblog-category">{blog.category}</span>
                                    )}
                                </div>

                                {/* Card Body */}
                                <div className="vblog-body">
                                    <h3 className="vblog-card-title">{blog.title}</h3>
                                    {blog.subtitle && (
                                        <p className="vblog-subtitle">{blog.subtitle}</p>
                                    )}
                                    {/* Author row */}
                                    <div className="vblog-author-row">
                                        <div className="vblog-author-avatar">
                                            {blog.author ? blog.author.charAt(0).toUpperCase() : 'A'}
                                        </div>
                                        <span className="vblog-author-name">{blog.author || 'Anonymous'}</span>
                                    </div>
                                    {/* Fading content preview */}
                                    {blog.content && (
                                        <div className="vblog-content-preview">
                                            <p className="vblog-content-text">
                                                {blog.content.replace(/<[^>]+>/g, '').slice(0, 180)}
                                            </p>
                                            <div className="vblog-content-fade" />
                                        </div>
                                    )}
                                    {/* Footer */}
                                    <div className="vblog-footer">
                                        <span className="vblog-likes">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="#ff6b00" stroke="none">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                            </svg>
                                            {blog.likes || 0}
                                        </span>
                                        <span className="vblog-read-cta">Read →</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="vblogs-pagination">
                        <button
                            className="vpag-btn vpag-prev"
                            disabled={currentPage === 1}
                            onClick={() => getVerifiedBlogs(currentPage - 1)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            Previous
                        </button>

                        <div className="vpag-dots">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                <button
                                    key={pg}
                                    className={`vpag-dot ${pg === currentPage ? 'active' : ''}`}
                                    onClick={() => getVerifiedBlogs(pg)}
                                >
                                    {pg}
                                </button>
                            ))}
                        </div>

                        <button
                            className="vpag-btn vpag-next"
                            disabled={currentPage === totalPages}
                            onClick={() => getVerifiedBlogs(currentPage + 1)}
                        >
                            Next
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                )}
            </section>

            {/* ─── FOOTER ────────────────────────────────────────────── */}
            <footer className="home-footer">
                <div className="home-footer-content">
                    <div className="footer-brand">
                        <h3>BlogCHIT</h3>
                        <p>Where ideas turn into impact. Join our community of creators today.</p>
                    </div>
                    <div className="footer-links-group">
                        <h4>Developer</h4>
                        <a href="https://harishpuhaniya.online" target="_blank" rel="noopener noreferrer">harishpuhaniya.online</a>
                        <a href="mailto:harishuhaniya@gmail.com">harishuhaniya@gmail.com</a>
                    </div>
                    <div className="footer-socials">
                        <h4>Connect</h4>
                        <div className="social-icons">
                            <a href="https://www.instagram.com/harishpuhaniya/" target="_blank" rel="noopener noreferrer" title="Instagram">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                            <a href="https://x.com/HPuhaniya49514" target="_blank" rel="noopener noreferrer" title="X (Twitter)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                            </a>
                        </div>
                    </div>
                </div>
                <div className="home-footer-bottom">
                    <p>&copy; {new Date().getFullYear()} BlogCHIT. Built by <a href="https://harishpuhaniya.online" target="_blank" rel="noopener noreferrer">Harish Puhaniya</a>.</p>
                </div>
            </footer>
        </>
    )
}

export default Home
