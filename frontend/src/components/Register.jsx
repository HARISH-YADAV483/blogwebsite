

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axios from 'axios'
import "./register.css"
import blogchit from '../assets/blogchit.png';

const API_URL = import.meta.env.VITE_API_URL;

function Register() {
    const navigate = useNavigate();
    const [image, setimage] = useState(null);
    const [message, setmessage] = useState(null);
    const [formdata, setformdata] = useState({
        username: '',
        name: '',
        pass: '',
        dob: '',
        bio: ''
    });
    const [otp, setotp] = useState("");
    const [isverified, setisverified] = useState(false);
    const [email, setemail] = useState("");
    const [loading, setLoading] = useState(false);

    const [rawImage, setRawImage] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const [previewUrl, setpreviewUrl] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imgSrc, setImgSrc] = useState("");
    const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
    const containerSize = 300;

    const clampPan = (x, y, currentZoom, width = imgDimensions.width, height = imgDimensions.height) => {
        const baseScale = width ? Math.max(containerSize / width, containerSize / height) : 1;
        const curW = width * baseScale * currentZoom;
        const curH = height * baseScale * currentZoom;

        const minX = Math.min(containerSize - curW, 0);
        const minY = Math.min(containerSize - curH, 0);

        return {
            x: Math.min(Math.max(x, minX), 0),
            y: Math.min(Math.max(y, minY), 0)
        };
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setRawImage(file);
            const url = URL.createObjectURL(file);
            setImgSrc(url);
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setIsCropping(true);

            const img = new Image();
            img.onload = () => {
                setImgDimensions({ width: img.width, height: img.height });
            };
            img.src = url;
        }
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPan(clampPan(newX, newY, zoom));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const newX = e.touches[0].clientX - dragStart.x;
        const newY = e.touches[0].clientY - dragStart.y;
        setPan(clampPan(newX, newY, zoom));
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const handleZoomChange = (e) => {
        const newZoom = parseFloat(e.target.value);
        setZoom(newZoom);
        setPan(prev => clampPan(prev.x, prev.y, newZoom));
    };

    const handleCropConfirm = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");

        const img = new Image();
        img.onload = () => {
            const baseScale = imgDimensions.width ? Math.max(containerSize / imgDimensions.width, containerSize / imgDimensions.height) : 1;
            const curW = imgDimensions.width * baseScale * zoom;
            const curH = imgDimensions.height * baseScale * zoom;
            const ratio = 400 / containerSize;

            ctx.clearRect(0, 0, 400, 400);
            ctx.drawImage(img, pan.x * ratio, pan.y * ratio, curW * ratio, curH * ratio);

            canvas.toBlob((blob) => {
                if (!blob) return;
                const croppedFile = new File([blob], rawImage ? rawImage.name : "profile.jpg", { type: rawImage ? rawImage.type : "image/jpeg" });
                setimage(croppedFile);
                setpreviewUrl(URL.createObjectURL(croppedFile));
                setIsCropping(false);
            }, rawImage ? rawImage.type : "image/jpeg");
        };
        img.src = imgSrc;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setformdata(prev => ({ ...prev, [name]: value }));
    }

    const uploadImage = async () => {
        const data = new FormData();
        data.append("file", image);
        data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET); // Cloudinary preset
        data.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

        try {
            setLoading(true);
            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
                data
            );
            setLoading(false);
            return res.data.secure_url;
        } catch (error) {
            setLoading(false);
            console.log(error);
        }
    };

    const sendotp = async () => {
        await axios.post(`${API_URL}/sendotp`, { email })
            .then(res => {
                setmessage(res.data.message);
            })
            .catch(err => {
                console.error(err);
                console.log("unable to send otp");
            })
    }

    const verifyotp = async () => {
        await axios.post(`${API_URL}/verifyotp`, { email, otp })
            .then(res => {
                alert(res.data.message);
                setisverified(true);
            })
            .catch(err => {
                console.error(err);
                alert("Invalid OTP");
            })
    }

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post(
                `${API_URL}/verifygoogle`,
                {
                    credential: credentialResponse.credential,
                }
            );
            setmessage(res.data.message);
            if (res.data.success) {
                setemail(res.data.email);
                setisverified(true);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleregister = async (e) => {
        e.preventDefault();

        const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/;
        if (!usernameRegex.test(formdata.username)) {
            setmessage("Username must be 1-30 characters long and contain only letters, numbers, underscores, or periods.");
            return;
        }

        let imageUrl = "";
        if (image) {
            imageUrl = await uploadImage();
        }
        const updatedformData = {
            ...formdata,
            image: imageUrl
        };

        axios.post(`${API_URL}/regi`, { ...updatedformData, email })
            .then(res => {
                const msg = res.data.message?.toLowerCase() || "";
                if (msg.includes("exist") || msg.includes("failed") || msg.includes("invalid")) {
                    setmessage(res.data.message);
                } else {
                    navigate("/login", { state: { message: res.data.message || "Registration successful! Please login." } });
                }
            })
            .catch(err => {
                console.error(err);
                setmessage(err.response?.data?.message || "Registration failed");
            });
    }

    return (
        <>
            <div className="lody">

                <div className="information">
                    <div className="top"><p>Already have an account? <Link to="/login" style={{color:"rgb(196, 90, 3)" , textDecoration:"none"}}>Login</Link></p></div>
                    
                    <div className="welcome">
                        <h1 className="red">Join </h1>
                        <img src={blogchit} alt="blogCHIT" className="blogchit" />
                    </div>
                    
                    <div className="apra">
                        Where curious minds meet daily stories, sharp insights, honest conversations, and fresh digital perspectives.
                    </div>

                    <div className="form">
                        {!isverified ? (
                            <div className="emailveri">
                                <label>First you need to verify email to get registered:</label>
                                <input type="text" placeholder="Email" value={email} onChange={(e) => {
                                    setemail(e.target.value);
                                }} />
                                <button type="button" className="otp-btn" onClick={sendotp}>Send OTP</button>
                                
                                <label style={{marginTop: "20px"}}>Enter OTP</label>
                                <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => {
                                    setotp(e.target.value);
                                }} />
                                <button type="button" className="otp-btn" onClick={verifyotp}>Verify OTP</button>

                                <p style={{textAlign: "center", margin: "15px 0", color: "#666"}}>or verify with Google</p>
                                
                                <div style={{display: "flex", justifyContent: "center"}}>
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => console.log("Google Login Failed")}
                                    />
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleregister} method="post">
                                <label htmlFor="username">Username</label>
                                <input type="text" id="username" name="username" placeholder="Username" onChange={handleChange} value={formdata.username} />
                                
                                <label htmlFor="name">Full Name</label>
                                <input type="text" id="name" name="name" placeholder="Name" onChange={handleChange} value={formdata.name} />
                                
                                <label htmlFor="pass">Password</label>
                                <input type="password" id="pass" name="pass" placeholder="Create password" onChange={handleChange} value={formdata.pass} />
                                
                                <label htmlFor="bio">Bio</label>
                                <input type="text" id="bio" name="bio" placeholder="Bio" onChange={handleChange} value={formdata.bio} />
                                
                                <label htmlFor="dob">Date of Birth</label>
                                <input type="date" id="dob" name="dob" placeholder="DOB" onChange={handleChange} value={formdata.dob} />
                                
                                <label>Profile Image</label>
                                {previewUrl ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: "15px", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "15px", background: "rgba(255,255,255,0.05)" }}>
                                        <img src={previewUrl} alt="Cropped preview" style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", border: "2px solid #007bff" }} />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Image selected & cropped</p>
                                            <span style={{ fontSize: "12px", color: "#007bff", cursor: "pointer", textDecoration: "underline" }} onClick={() => { setimage(null); setpreviewUrl(null); setRawImage(null); }}>Change Image</span>
                                        </div>
                                    </div>
                                ) : (
                                    <input type="file" accept="image/*" onClick={(e) => { e.target.value = null; }} onChange={handleFileSelect} style={{ marginBottom: "15px" }} />
                                )}
                                <button type="submit">{loading ? "Uploading..." : "Register"}</button>
                            </form>
                        )}
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

                {isCropping && (
                    <div style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.85)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        zIndex: 999999,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "20px"
                    }}>
                        <div style={{
                            background: "#1e1e22",
                            color: "#fff",
                            padding: "25px",
                            borderRadius: "16px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                            width: "100%",
                            maxWidth: "380px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center"
                        }}>
                            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "600" }}>Crop Profile Picture</h3>

                            <div
                                style={{
                                    width: `${containerSize}px`,
                                    height: `${containerSize}px`,
                                    position: "relative",
                                    overflow: "hidden",
                                    backgroundColor: "#000",
                                    borderRadius: "12px",
                                    cursor: isDragging ? "grabbing" : "grab",
                                    userSelect: "none"
                                }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <img
                                    src={imgSrc}
                                    alt="Crop source"
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: `${imgDimensions.width ? imgDimensions.width * Math.max(containerSize / imgDimensions.width, containerSize / imgDimensions.height) * zoom : containerSize}px`,
                                        height: `${imgDimensions.height ? imgDimensions.height * Math.max(containerSize / imgDimensions.width, containerSize / imgDimensions.height) * zoom : containerSize}px`,
                                        transform: `translate(${pan.x}px, ${pan.y}px)`,
                                        pointerEvents: "none",
                                        maxWidth: "none",
                                        maxHeight: "none"
                                    }}
                                />

                                <div style={{
                                    position: "absolute",
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
                                    borderRadius: "50%",
                                    pointerEvents: "none",
                                    border: "2px solid rgba(255, 255, 255, 0.8)"
                                }} />
                            </div>

                            <p style={{ fontSize: "12px", color: "#aaa", margin: "12px 0 15px 0" }}>Drag image to adjust position</p>

                            <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", marginBottom: "25px" }}>
                                <span style={{ fontSize: "14px" }}>🔍</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="0.05"
                                    value={zoom}
                                    onChange={handleZoomChange}
                                    style={{ flex: 1, accentColor: "#007bff" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "15px", width: "100%" }}>
                                <button
                                    type="button"
                                    onClick={() => { setIsCropping(false); setRawImage(null); }}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        background: "#333",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "500"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCropConfirm}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        background: "#007bff",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "500"
                                    }}
                                >
                                    Crop & Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {message && <div className="message-quote">{message}</div>}
            </div>
        </>
    )
}

export default Register