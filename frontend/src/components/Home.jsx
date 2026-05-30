import { useState, useEffect } from "react"
import birdImg from '../assets/bird.png';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios'
import './home.css'
import { io } from 'socket.io-client';
const socket = io(import.meta.env.VITE_SOCKET_URL);
const API_URL = import.meta.env.VITE_API_URL;
function Home() {
    const [blogs, setBlogs] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [message, setmessage] = useState(null);
    const navigate = useNavigate();
    const [chatters , setchatters] = useState([]);
    const [topblogs , settopblogs] = useState([]);
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

const gettopblogs = async() =>{ 
    await axios.get(`${API_URL}/gettopblogs`)
    .then(res =>{
        if (res.data.blogs) {
            settopblogs(res.data.blogs);
            // alert(res.data.message);
        } else {
            console.warn(res.data.message || "Failed to fetch trending blogs");
        }
    })
    .catch(err =>{
        console.error("Error fetching trending blogs:", err);
    })
}

    const getpendingblogs = async (isLoadMore = false) => {
        const skip = isLoadMore ? blogs.length : 0;
        const limit = 5;

        await axios.get(`${API_URL}/verified?skip=${skip}`)
            .then(res => {
                if (Array.isArray(res.data)) {
                    if (isLoadMore) {
                        setBlogs(prev => [...prev, ...res.data]);
                    } else {
                        setBlogs(res.data);
                    }
                    if (res.data.length < limit) {
                        setHasMore(false);
                    } else {
                        setHasMore(true);
                    }
                    setmessage("");
                } else {
                    if (!isLoadMore) setBlogs([]);
                    setmessage(res.data.message || "No more pending blogs");
                    setHasMore(false);
                }
            })
            .catch(err => {
                console.error(err);
                console.log("unable to fetch");
                setmessage("Error fetching blogs");
            })
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
            getpendingblogs();
            getChatters();
            gettopblogs();
        }
    }, [token]);

    if (!token) {
        return null; 
    }

    return (
        <>
            {/* ─── HERO SECTION ─────────────────────────────────────── */}
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
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            <span className="hero-stat-num">10,000+</span>
                            <span className="hero-stat-label">Blogs</span>
                        </div>
                        <div className="hero-stat-divider" />
                        <div className="hero-stat">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <span className="hero-stat-num">2,000+</span>
                            <span className="hero-stat-label">Creators</span>
                        </div>
                        <div className="hero-stat-divider" />
                        <div className="hero-stat">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
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
                        <path d="M210 130 Q310 60 360 90" stroke="#ff6b00" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4"/>
                        <path d="M250 200 Q370 170 380 220" stroke="#ff6b00" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4"/>
                        <path d="M220 260 Q340 290 360 310" stroke="#ff6b00" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4"/>
                    </svg>

                    {/* Floating Card – Blog Post */}
                    <div className="hero-card card-blog">
                        <div className="hero-card-icon-wrap">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <div className="hero-card-body">
                            <p className="hero-card-title">New Comment</p>
                            <div className="hero-card-comment-row">
                                <div className="hero-card-avatar a1" />
                                <span className="hero-card-comment-text">Great post! Totally agree with your thoughts.</span>
                            </div>
                            <div className="hero-card-comment-row" style={{opacity:0.5}}>
                                <div className="hero-card-avatar a2" />
                                <span className="hero-card-comment-text">This changed my perspective!</span>
                            </div>
                        </div>
                    </div>

                    {/* Floating Card – Join Community */}
                    <div className="hero-card card-community">
                        <div className="hero-card-icon-wrap">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <div className="hero-card-body">
                            <p className="hero-card-title">Join Community</p>
                            <div className="hero-card-avatars-row">
                                <div className="hero-card-avatar-sm" style={{background:'#f4a261'}} />
                                <div className="hero-card-avatar-sm" style={{background:'#2a9d8f'}} />
                                <div className="hero-card-avatar-sm" style={{background:'#e76f51'}} />
                                <div className="hero-card-avatar-sm" style={{background:'#264653'}} />
                                <div className="hero-card-avatar-count">+120</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CURRENTLY TRENDING ─────────────────────────────────── */}
            {topblogs && topblogs.length > 0 && (
                <section className="trending-section">
                    <div className="trending-header">
                        <h2 className="trending-main-title">Currently Trending</h2>
                        <Link to="/search" className="trending-browse-btn">Browse more</Link>
                    </div>

                    <div className="trending-container">
                        <div className="trending-grid">
                            {topblogs.slice(0, 3).map((blog) => (
                                <Link key={blog._id} to={`/blog/${blog._id}`} className="trending-card">
                                    <div className="trending-img-wrapper">
                                        {blog.category && (
                                            <span className="trending-badge">{blog.category}</span>
                                        )}
                                        {blog.image ? (
                                            <img src={blog.image} alt={blog.title} className="trending-img" />
                                        ) : (
                                            <div className="trending-img-fallback">
                                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5">
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6 17h12v3H6a2.5 2.5 0 0 1-2.5-2.5z"/>
                                                    <path d="M6 2c0 .6-.4 1-1 1s-1-.4-1-1 .4-1 1-1 1 .4 1 1zM18 2c0 .6-.4 1-1 1s-1-.4-1-1 .4-1 1-1 1 .4 1 1z"/>
                                                    <path d="M4 6v10.5M18 6v11M6 6h12V2H6v4z"/>
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
                </section>
            )}
<br />
<br />
<br />
<br />
<br />
<br />
<br />
<br />
<br />
<br />
<br />
<br />
<br />
<br />
<br />
<br />
<br />
            {/* ─── BLOG FEED ─────────────────────────────────────────── */}
            <div className="main">
                {blogs.map((blog) => (
                    <div key={blog._id} className="blog-card">
                        {blog.image && (
                            <img src={blog.image} alt="" style={{ width: "300px", height: "auto" }} />
                        )}
                        {blog.category && (
                            <div style={{ backgroundColor: "#333", color: "white", padding: "4px 8px", borderRadius: "4px", display: "inline-block", marginBottom: "8px", fontSize: "12px" }}>
                                {blog.category}
                            </div>
                        )}
                        <h2>{blog.title}</h2>
                        <h4 style={{ color: "#aaa", margin: "4px 0" }}>{blog.subtitle}</h4>
                        <p style={{ fontSize: "14px", color: "#888", marginBottom: "12px" }}>By {blog.author}</p>
                        {blog.likes}
                        <div className="heart-container" title="Like" onClick={() => like(blog._id)}>
                            <input type="checkbox" className="checkbox" id="Give-It-An-Id" />
                            <div className="svg-container">
                                <svg viewBox="0 0 24 24" className="svg-outline" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Zm-3.585,18.4a2.973,2.973,0,0,1-3.83,0C4.947,16.006,2,11.87,2,8.967a4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,11,8.967a1,1,0,0,0,2,0,4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,22,8.967C22,11.87,19.053,16.006,13.915,20.313Z" />
                                </svg>
                                <svg viewBox="0 0 24 24" className="svg-filled" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Z" />
                                </svg>
                                <svg className="svg-celebrate" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                                    <polygon points="10,10 20,20" /><polygon points="10,50 20,50" /><polygon points="20,80 30,70" />
                                    <polygon points="90,10 80,20" /><polygon points="90,50 80,50" /><polygon points="80,80 70,70" />
                                </svg>
                            </div>
                        </div>
                        views: "" {blog.views} ""
                        <Link to={`/blog/${blog._id}`}>comment 📝</Link>
                        <Link to={`/blog/${blog._id}`}>Read Full blog</Link>
                        <button onClick={() => setSelectedBlogId(selectedBlogId === blog._id ? null : blog._id)}>
                            {selectedBlogId === blog._id ? "cancel" : "share"}
                        </button>
                        <button onClick={() => save(blog._id)}>save</button>
                        <hr />
                    </div>
                ))}

                {selectedBlogId && (
                    <div style={{ padding: "20px", background: "lightblue" }}>
                        <h3>Select chatters to share with:</h3>
                        {chatters.map((chatter) => (
                            <div key={chatter._id}>
                                <div style={{ display: "flex" }}>
                                    <p>{chatter.name}</p>
                                    <input
                                        type="checkbox"
                                        checked={selectedChatters.includes(chatter._id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedChatters([...selectedChatters, chatter._id]);
                                            } else {
                                                setSelectedChatters(selectedChatters.filter(id => id !== chatter._id));
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={async () => {
                                if (selectedChatters.length === 0) return;
                                const blogUrl = `${import.meta.env.VITE_FRONTEND_URL}/blog/${selectedBlogId}`;
                                const messageContent = `Check out this blog: ${blogUrl}`;
                                try {
                                    await axios.post(`${API_URL}/shareblog`, { blogId: selectedBlogId, userId });
                                    for (const chatterId of selectedChatters) {
                                        const messageData = { senderId: userId, receiverId: chatterId, message: messageContent };
                                        const res = await axios.post(`${API_URL}/sendmessage`, messageData);
                                        socket.emit("send_message", res.data);
                                    }
                                    setSelectedBlogId(null);
                                    setSelectedChatters([]);
                                    alert("Shared successfully!");
                                } catch (err) {
                                    console.error("Error sharing:", err);
                                    alert("Failed to share.");
                                }
                            }}
                            style={{ marginTop: "10px", padding: "5px 10px" }}
                        >
                            Send
                        </button>
                    </div>
                )}

                {hasMore && (
                    <button onClick={() => getpendingblogs(true)}>Load More</button>
                )}
            </div>
            {message && <p>{message}</p>}
        </>
    )
}

export default Home
