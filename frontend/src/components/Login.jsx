import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from 'axios'
import "./register.css";
import blogchit from '../assets/blogchit.png';

const API_URL = import.meta.env.VITE_API_URL;

function Login() {   
    const location = useLocation();
    const [message, setmessage] = useState(location.state?.message || null);
    const [formdata, setformdata] = useState({
        name: '',
        pass: ''
    });
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const [token, setToken] = useState(userData.token || null);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setmessage(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setformdata(prev => ({ ...prev, [name]: value }));
    }

    const handlelogin = (e) => {
        e.preventDefault();
        axios.post(`${API_URL}/logi`, formdata)
            .then(res => {
                setmessage(res.data.message);
                if (res.data.token) {
                    localStorage.setItem("user", JSON.stringify({ token: res.data.token, name: res.data.name, role: res.data.role, userId: res.data.userId }));
                    if (typeof socket !== 'undefined') {
                        socket.emit("setup_user", res.data.name);
                    }
                    navigate("/");
                }
            })
            .catch(err => {
                console.error(err);
                setmessage("login failed");
            });
    }

    return (
        <><div className="lody">
            <div className="information">
                <div className="top"><p>Don't have an account? <Link to="/register" style={{color:"rgb(196, 90, 3)" , textDecoration:"none"}}>Register</Link></p></div>
                <div className="welcome">
            <h1 className="red">Welcome to </h1>
            <img src={blogchit} alt="blogCHIT"  className="blogchit"/>
            </div>
            <div className="apra">
                Where curious minds meet daily stories, sharp insights, honest conversations, and fresh digital perspectives.
            </div>
            <div className="form">
            <form onSubmit={handlelogin} method="post">
                <label htmlFor="email">E-mail or Username</label>
                <input type="text" name="name" onChange={handleChange} value={formdata.name} placeholder="Username or E-mail"  id="email"/>
                <label htmlFor="pass">Password</label>
                <input type="password" name="pass" onChange={handleChange} value={formdata.pass} placeholder="Your password" id="pass" />
                <button type="submit">Login</button>
            </form>
            </div>
            <div className="forgot">
            <Link to="/forgotpass" style={{color:"rgb(196, 90, 3)" , textDecoration:"none"}}>Forgot password ? </Link>
            </div>

           
            </div>

            <div className="styleo">
                {/* Animated background elements */}
                <div className="styleo-bg-pattern"></div>
                <div className="styleo-orb styleo-orb-1"></div>
                <div className="styleo-orb styleo-orb-2"></div>
                <div className="styleo-orb styleo-orb-3"></div>
                
                {/* Grid dots pattern */}
                <div className="styleo-dots"></div>

                {/* Main content */}
                <div className="styleo-content">
                    {/* Logo mark */}
                    <div className="styleo-logo-mark">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <rect width="48" height="48" rx="12" fill="rgba(219,100,2,0.1)"/>
                            <path d="M14 18C14 16.9 14.9 16 16 16H28C29.1 16 30 16.9 30 18V26C30 27.1 29.1 28 28 28H20L16 32V28H16C14.9 28 14 27.1 14 26V18Z" fill="#DB6402"/>
                            <circle cx="20" cy="22" r="1.5" fill="white"/>
                            <circle cx="24" cy="22" r="1.5" fill="white"/>
                            <circle cx="28" cy="22" r="1.5" fill="white"/>
                            <path d="M22 24C22 22.9 22.9 22 24 22H34C35.1 22 36 22.9 36 24V32C36 33.1 35.1 34 34 34H28L24 38V34H24C22.9 34 22 33.1 22 32V24Z" fill="rgba(219,100,2,0.4)"/>
                        </svg>
                    </div>

                    {/* Tagline */}
                    <h2 className="styleo-tagline">
                        Your stories<br/>deserve to be<br/><span>heard.</span>
                    </h2>

                    {/* Feature cards */}
                    <div className="styleo-features">
                        <div className="styleo-feature-card">
                            <div className="styleo-feature-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                </svg>
                            </div>
                            <div>
                                <h4>Write & Publish</h4>
                                <p>Rich editor with images, quotes & formatting</p>
                            </div>
                        </div>
                        <div className="styleo-feature-card">
                            <div className="styleo-feature-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                                </svg>
                            </div>
                            <div>
                                <h4>Communities</h4>
                                <p>Join groups, share ideas & grow together</p>
                            </div>
                        </div>
                        <div className="styleo-feature-card">
                            <div className="styleo-feature-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                                </svg>
                            </div>
                            <div>
                                <h4>Real-time Chat</h4>
                                <p>Message creators & engage in conversations</p>
                            </div>
                        </div>
                    </div>

                    {/* Social proof */}
                    <div className="styleo-social-proof">
                        <div className="styleo-avatars">
                            <div className="styleo-avatar" style={{background: '#E8913A'}}>K</div>
                            <div className="styleo-avatar" style={{background: '#f57104ff'}}>A</div>
                            <div className="styleo-avatar" style={{background: '#F4A742'}}>R</div>
                            <div className="styleo-avatar" style={{background: '#f87408ff'}}>M</div>
                            <div className="styleo-avatar styleo-avatar-more">+</div>
                        </div>
                        <p className="styleo-proof-text">Join <strong>with</strong> writers & readers already on blogCHIT</p>
                    </div>

                    {/* Stats row */}
                    <div className="styleo-stats">
                        <div className="styleo-stat">
                            <span className="styleo-stat-num">n+</span>
                            <span className="styleo-stat-label">Blogs</span>
                        </div>
                        <div className="styleo-stat-divider"></div>
                        <div className="styleo-stat">
                            <span className="styleo-stat-num">50+</span>
                            <span className="styleo-stat-label">Categories</span>
                        </div>
                        <div className="styleo-stat-divider"></div>
                        <div className="styleo-stat">
                            <span className="styleo-stat-num">24/7</span>
                            <span className="styleo-stat-label">Live Chat</span>
                        </div>
                    </div>
                </div>
            </div>
            </div>
             {message && <div className="message-quote">{message}</div>}
            
        </>
    ) 
}

export default Login