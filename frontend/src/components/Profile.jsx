import axios from "axios";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { io } from 'socket.io-client';
import { 
    UserCircle, 
    BarChart2, 
    Archive as ArchiveIcon, 
    Shield, 
    LogOut, 
    Menu, 
    Plus,
    X,
    MessageSquare,
    Heart,
    Eye,
    CheckCircle
} from 'lucide-react';
import './profile.css';

const API_URL = import.meta.env.VITE_API_URL;
const socket = io(import.meta.env.VITE_SOCKET_URL);

function Profile() {
    const navigate = useNavigate();
    const currentUsername = JSON.parse(localStorage.getItem("user") || "{}").username;
    const userId = JSON.parse(localStorage.getItem("user") || "{}").userId;

    const [blogcount, setblogcunt] = useState("");
    const [vericount, setvericunt] = useState("");
    const [blogs, setBlogs] = useState([]);
    const [likes, setlikes] = useState([]);
    const [commentblog, setcommentblog] = useState([]);
    const [image, setimage] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [followers, setfollowers] = useState([]);
    const [following, setfollowing] = useState([]);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [chatters, setchatters] = useState([]);
    const [selectedBlogId, setSelectedBlogId] = useState(null);
    const [selectedChatters, setSelectedChatters] = useState([]);
    const [saved, setSaved] = useState([]);
    const [dob, setdob] = useState("");
    const [bc, setbc] = useState("");
    const [bio, setbio] = useState("");
    const [email, setemail] = useState("");
    const [phone, setphone] = useState("");
    const [username, setusername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loadingOtp, setLoadingOtp] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        dob: "",
        bio: "",
        email: "",
        phone: ""
    });

    // New layout states
    const [activeTab, setActiveTab] = useState("blogs");
    const [drawerOpen, setDrawerOpen] = useState(false);

    const getprofile = async () => {
        await axios.post(`${API_URL}/getprofile`, { username: currentUsername })
            .then(res => {
                setblogcunt(res.data.blogcount);
                setvericunt(res.data.vericount);
                setBlogs(res.data.veriblogs || []);
                setlikes(res.data.liked || []);
                setcommentblog(res.data.commented || []);
                setimage(res.data.image);
                setfollowers(res.data.followers || []);
                setfollowing(res.data.following || []);
                setchatters(res.data.chatters || []);
                setSaved(res.data.saved || []);
                setbc(res.data.bc || "0");
                setbio(res.data.bio || "blogCHIT user");
                setdob(res.data.dob || "");
                setemail(res.data.email || "");
                setphone(res.data.phone || "");
                setusername(res.data.username || "");
                setFormData({
                    username: res.data.username || "",
                    dob: res.data.dob || "",
                    bio: res.data.bio || "blogCHIT user",
                    email: res.data.email || "",
                    phone: res.data.phone || ""
                });
            })
            .catch(err => {
                console.error(err);
                console.log("unable to fetch count ");
            })
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const changedetails = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/changedetails`, {
                userId,
                username: formData.username,
                dob: formData.dob,
                bio: formData.bio,
                phone: formData.phone
            });

            if (res.data.success) {
                setusername(formData.username);
                setdob(formData.dob);
                setbio(formData.bio);
                setphone(formData.phone);

                const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
                storedUser.username = formData.username;
                localStorage.setItem("user", JSON.stringify(storedUser));

                alert(res.data.message || "Profile updated successfully!");
            } else {
                alert(res.data.message || "Failed to update profile.");
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "An error occurred while updating details.");
        }
    };

    const handleSendOtp = async () => {
        if (!email) {
            alert("No email associated with this account or profile is still loading.");
            return;
        }
        setLoadingOtp(true);
        try {
            const res = await axios.post(`${API_URL}/send-password-otp`, { userId });
            if (res.data.success) {
                setOtpSent(true);
                alert(res.data.message);
            } else {
                alert(res.data.message || "Failed to send OTP.");
            }
        } catch (err) {
            console.error("Error sending OTP:", err);
            alert(err.response?.data?.message || "An error occurred while sending OTP.");
        } finally {
            setLoadingOtp(false);
        }
    };

    const changepassword = async (e) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword || !otp) {
            alert("All fields (New Password, Confirm Password, OTP) are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("New Password and Confirm Password do not match.");
            return;
        }
        setLoadingSave(true);
        try {
            const res = await axios.post(`${API_URL}/changepassword`, {
                userId,
                newPassword,
                otp
            });
            if (res.data.success) {
                alert(res.data.message || "Password changed successfully!");
                setNewPassword("");
                setConfirmPassword("");
                setOtp("");
                setOtpSent(false);
            } else {
                alert(res.data.message || "Failed to change password.");
            }
        } catch (err) {
            console.error("Error changing password:", err);
            alert(err.response?.data?.message || "An error occurred while changing password.");
        } finally {
            setLoadingSave(false);
        }
    };

    const totalviews = blogs.reduce((sum, blog) => sum + (blog.views || 0), 0);
    const totallikes = blogs.reduce((sum, blog) => sum + (blog.likes || 0), 0);
    const totalcomments = blogs.reduce((sum, blog) => sum + (blog.comments?.length || 0), 0);

    const getnoti = async () => {
        await axios.get(`${API_URL}/notifications/${userId}`)
            .then(res => {
                setNotifications(res.data);
            })
            .catch(err => {
                console.error("Error fetching notifs:", err);
            });
    }

    useEffect(() => {
        getprofile();
        if (currentUsername) {
            socket.emit("setup_user", currentUsername);
        }
        const handleNewNotification = (newNotif) => {
            setNotifications(prev => [newNotif, ...prev]);
        };
        socket.on("receive_notification", handleNewNotification);
        return () => {
            socket.off("receive_notification", handleNewNotification);
        };
    }, [currentUsername]);

    useEffect(() => {
        if (activeTab === 'reach') {
            getnoti();
        }
    }, [activeTab]);


    const renderBlogList = (blogList, isArchive = false) => {
        if (blogList.length === 0) {
            return (
                <div className="profile-empty-state">
                    <ArchiveIcon />
                    <p>No blogs found here yet.</p>
                </div>
            )
        }
        return (
            <div className="profile-blogs-list">
                {blogList.map((blog) => (
                    <div key={blog._id} className="profile-blog-item">
                        {blog.image && (
                            <Link to={`/blog/${blog._id}`} className="profile-blog-image-wrapper">
                                <img src={blog.image} alt={blog.title} className="profile-blog-image" />
                            </Link>
                        )}
                        <div className="profile-blog-content">
                            {blog.category && <div className="profile-blog-category">{blog.category}</div>}
                            <Link to={`/blog/${blog._id}`} style={{ textDecoration: 'none' }}>
                                <h2 className="profile-blog-title">
                                    {blog.title}
                                    {!isArchive && <CheckCircle style={{ width: '16px', marginLeft: '8px', color: '#ff6b00', display: 'inline-block', verticalAlign: 'middle' }} />}
                                </h2>
                            </Link>
                            <p className="profile-blog-subtitle">{blog.subtitle}</p>
                            
                            <div className="profile-blog-meta">
                                {blog.author && <span>By {blog.author}</span>}
                                {blog.likes !== undefined && (
                                    <div className="profile-blog-meta-item">
                                        <Heart /> {blog.likes}
                                    </div>
                                )}
                                {blog.views !== undefined && (
                                    <div className="profile-blog-meta-item">
                                        <Eye /> {blog.views}
                                    </div>
                                )}
                                
                                {!isArchive && (
                                    <button 
                                        className="profile-btn" 
                                        style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#f5f5f5', color: '#111' }}
                                        onClick={() => setSelectedBlogId(selectedBlogId === blog._id ? null : blog._id)}
                                    >
                                        {selectedBlogId === blog._id ? "Cancel Share" : "Share"}
                                    </button>
                                )}
                            </div>

                            {selectedBlogId === blog._id && !isArchive && (
                                <div style={{ marginTop: '16px', padding: '16px', background: '#fafafa', borderRadius: '12px', border: '1px solid #eee' }}>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>Select chatters to share with:</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                                        {chatters.map((chatter) => (
                                            <label key={chatter._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
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
                                                {chatter.name}
                                            </label>
                                        ))}
                                        {chatters.length === 0 && <span style={{fontSize:'0.8rem', color:'#888'}}>No chatters available.</span>}
                                    </div>
                                    <button
                                        className="profile-btn"
                                        style={{ marginTop: '12px', width: '100%', padding: '8px' }}
                                        onClick={async () => {
                                            if (selectedChatters.length === 0) return;
                                            const blogUrl = `${import.meta.env.VITE_FRONTEND_URL}/blog/${selectedBlogId}`;
                                            const messageContent = `Check out this blog: ${blogUrl}`;

                                            try {
                                                await axios.post(`${API_URL}/shareblog`, { blogId: selectedBlogId, userId });

                                                for (const chatterId of selectedChatters) {
                                                    const messageData = {
                                                        senderId: userId,
                                                        receiverId: chatterId,
                                                        message: messageContent
                                                    };
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
                                    >
                                        Send Message
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const handleLogout = () => {
        axios.post(`${API_URL}/logout`)
            .then(() => {
                localStorage.removeItem('user');
                navigate("/");
                window.location.reload();
            })
            .catch(err => {
                console.error(err);
                alert("Logout failed");
            });
    };

    return (
        <div className="profile-page-wrapper">
            {/* Mobile Topbar */}
            <div className="profile-mobile-topbar">
                <button className="profile-menu-toggle" onClick={() => setDrawerOpen(true)}>
                    <Menu />
                </button>
                <span className="profile-mobile-topbar-title">@{username}</span>
                <div style={{ width: 24 }}></div> {/* Spacer for centering */}
            </div>

            {/* Sidebar Overlay (Mobile) */}
            <div 
                className={`profile-sidebar-overlay ${drawerOpen ? 'open' : ''}`}
                onClick={() => setDrawerOpen(false)}
            />

            {/* Sidebar */}
            <nav className={`profile-sidebar ${drawerOpen ? 'open' : ''}`}>
                <div className="profile-sidebar-header">
                    Settings
                </div>
                <div className="profile-sidebar-menu">
                    <button 
                        className={`profile-sidebar-item ${activeTab === 'blogs' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('blogs'); setDrawerOpen(false); }}
                    >
                        <MessageSquare /> Verified Blogs
                    </button>
                    <button 
                        className={`profile-sidebar-item ${activeTab === 'personal' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('personal'); setDrawerOpen(false); }}
                    >
                        <UserCircle /> Personal Details
                    </button>
                    <button 
                        className={`profile-sidebar-item ${activeTab === 'reach' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('reach'); setDrawerOpen(false); }}
                    >
                        <BarChart2 /> Your Reach
                    </button>
                    <button 
                        className={`profile-sidebar-item ${activeTab === 'archive' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('archive'); setDrawerOpen(false); }}
                    >
                        <ArchiveIcon /> Archive
                    </button>
                    <button 
                        className={`profile-sidebar-item ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('security'); setDrawerOpen(false); }}
                    >
                        <Shield /> Password & Security
                    </button>
                    
                    <div style={{ flex: 1 }}></div>
                    
                    <button 
                        className="profile-sidebar-item" 
                        style={{ color: '#ff3b30' }}
                        onClick={handleLogout}
                    >
                        <LogOut /> Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="profile-main-content">
                {/* Profile Header */}
                <header className="profile-header-section">
                    <div className="profile-avatar-container">
                        {image ? (
                            <img src={image} alt={username} className="profile-avatar" />
                        ) : (
                            <div className="profile-avatar-placeholder">
                                {username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="profile-info">
                        <div className="profile-username-row">
                            <h1 className="profile-username">@{username}</h1>
                            <div className="profile-bc-badge">
                                <span>BC</span>
                                <span>{bc}</span>
                            </div>
                        </div>
                        {/* {formData.username && <h2 className="profile-fullname">{formData.username}</h2>} */}
                        <p className="profile-bio">{bio}</p>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
                            <span>{blogcount} Blogs Submitted</span> &nbsp;&bull;&nbsp; <span>{vericount} Verified</span>
                        </div>
                    </div>
                </header>

                {/* Tab Content: Blogs */}
                {activeTab === 'blogs' && (
                    <>
                        <div className="profile-section-title">
                            Verified Blogs
                            <span className="profile-section-subtitle">Your published and verified content on blogCHIT</span>
                        </div>
                        {renderBlogList(blogs)}
                    </>
                )}

                {/* Tab Content: Personal */}
                {activeTab === 'personal' && (
                    <>
                        <div className="profile-section-title">
                            Edit Details
                            <span className="profile-section-subtitle">Update your personal information and bio</span>
                        </div>
                        <form className="profile-form" onSubmit={changedetails} style={{ marginBottom: '60px' }}>
                            <div className="profile-input-group">
                                <label>Username</label>
                                <input type="text" name="username" value={formData.username} onChange={handleChange} />
                            </div>
                            <div className="profile-input-group">
                                <label>Date of Birth</label>
                                <input type="text" name="dob" value={formData.dob} onChange={handleChange} />
                            </div>
                            <div className="profile-input-group">
                                <label>Bio</label>
                                <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3" />
                            </div>
                            <div className="profile-input-group">
                                <label>Phone</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                            <button type="submit" className="profile-btn">Save Changes</button>
                        </form>
                    </>
                )}

                {/* Tab Content: Reach */}
                {activeTab === 'reach' && (
                    <>
                        <div className="profile-section-title">
                            Your Reach Overview
                            <span className="profile-section-subtitle">Analytics and insights for your profile and blogs</span>
                        </div>
                        <div className="profile-stats-grid">
                            <div className="profile-stat-item">
                                <span className="profile-stat-value">{totalviews}</span>
                                <span className="profile-stat-label">Total Views</span>
                            </div>
                            <div className="profile-stat-item">
                                <span className="profile-stat-value">{totallikes}</span>
                                <span className="profile-stat-label">Total Likes</span>
                            </div>
                            <div className="profile-stat-item">
                                <span className="profile-stat-value">{totalcomments}</span>
                                <span className="profile-stat-label">Total Comments</span>
                            </div>
                            <div className="profile-stat-item" onClick={() => setShowFollowers(!showFollowers)} style={{ cursor: 'pointer' }}>
                                <span className="profile-stat-value">{followers.length}</span>
                                <span className="profile-stat-label">Followers</span>
                            </div>
                            <div className="profile-stat-item" onClick={() => setShowFollowing(!showFollowing)} style={{ cursor: 'pointer' }}>
                                <span className="profile-stat-value">{following.length}</span>
                                <span className="profile-stat-label">Following</span>
                            </div>
                        </div>

                        {/* Followers/Following Lists Expansion */}
                        {showFollowers && (
                            <div style={{ background: '#fafafa', padding: '20px', borderRadius: '12px', marginBottom: '40px' }}>
                                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Followers</h3>
                                {followers.length === 0 ? <p style={{ color: '#888' }}>No followers yet.</p> : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {followers.map(f => (
                                            <Link key={f._id} to={`/searchedprofile/${f._id}`} style={{ textDecoration: 'none', color: '#111', fontWeight: '500' }}>
                                                {f.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {showFollowing && (
                            <div style={{ background: '#fafafa', padding: '20px', borderRadius: '12px', marginBottom: '40px' }}>
                                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Following</h3>
                                {following.length === 0 ? <p style={{ color: '#888' }}>Not following anyone yet.</p> : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {following.map(f => (
                                            <Link key={f._id} to={`/searchedprofile/${f._id}`} style={{ textDecoration: 'none', color: '#111', fontWeight: '500' }}>
                                                {f.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="profile-section-title">Notification History</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {notifications.length === 0 ? (
                                <p style={{ color: '#888' }}>No notifications yet.</p>
                            ) : (
                                notifications.map((n, i) => (
                                    <div key={i} style={{ padding: '16px', background: '#fafafa', borderRadius: '12px' }}>
                                        <p style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#111' }}>{n.message}</p>
                                        <small style={{ color: '#888' }}>{new Date(n.time).toLocaleString()}</small>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* Tab Content: Archive */}
                {activeTab === 'archive' && (
                    <>
                        <div className="profile-section-title">
                            Liked Blogs
                            <span className="profile-section-subtitle">Blogs that you have liked</span>
                        </div>
                        {renderBlogList(likes, true)}
                        
                        <div className="profile-section-title" style={{ marginTop: '60px' }}>
                            Commented Blogs
                            <span className="profile-section-subtitle">Blogs where you left a comment</span>
                        </div>
                        {renderBlogList(commentblog, true)}

                        <div className="profile-section-title" style={{ marginTop: '60px' }}>
                            Saved Blogs
                            <span className="profile-section-subtitle">Your bookmarked and saved reads</span>
                        </div>
                        {renderBlogList(saved, true)}
                    </>
                )}

                {/* Tab Content: Security */}
                {activeTab === 'security' && (
                    <>
                        <div className="profile-section-title">
                            Security Settings
                            <span className="profile-section-subtitle">Manage your password and account security</span>
                        </div>
                        
                        <div style={{ marginBottom: '30px', padding: '20px', background: '#fafafa', borderRadius: '12px' }}>
                            <p style={{ margin: '0 0 12px 0', color: '#444' }}>
                                <strong>Registered Email:</strong> {email || "(No email stored in database)"}
                            </p>
                            <button 
                                className="profile-btn" 
                                style={{ background: '#fff', color: '#111', border: '1px solid #ddd' }}
                                onClick={handleSendOtp} 
                                disabled={loadingOtp}
                            >
                                {loadingOtp ? "Sending OTP..." : "Send OTP to Email"}
                            </button>
                        </div>

                        <form className="profile-form" onSubmit={changepassword}>
                            <div className="profile-input-group">
                                <label>New Password</label>
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                            </div>
                            <div className="profile-input-group">
                                <label>Confirm New Password</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            </div>
                            <div className="profile-input-group">
                                <label>OTP</label>
                                <input 
                                    type="text" 
                                    maxLength="6" 
                                    value={otp} 
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                                    placeholder="Enter OTP sent to your email" 
                                    required 
                                />
                            </div>
                            <button type="submit" className="profile-btn" disabled={loadingSave || !otpSent}>
                                {loadingSave ? "Saving..." : "Change Password"}
                            </button>
                        </form>
                    </>
                )}
            </main>

            {/* Floating Write Button */}
            <Link to="/writeblog" className="floating-write-btn">
                <Plus size={32} />
            </Link>
        </div>
    );
}

export default Profile;
