

import { useState, useEffect } from "react"
import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL;

function Register() {
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
                setmessage(res.data.message);
            })
            .catch(err => {
                console.error(err);
                setmessage("Registration failed");
            });
    }

    return (
        <>
            {!isverified ? (
                <>
                    <h2>first you need to verify email to get registerd : </h2>
                    <input type="text" placeholder="email" value={email} onChange={(e) => {
                        setemail(e.target.value);
                    }} />
                    <button onClick={sendotp}>send otp</button>
                    <input type="text" placeholder="entreotp" value={otp} onChange={(e) => {
                        setotp(e.target.value);
                    }} />
                    <button onClick={verifyotp}>verify otp</button>

                    <h1>or verufy your email with google</h1>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => console.log("Google Login Failed")}
                    />
                </>
            ) : (
                <form onSubmit={handleregister} method="post">
                    <input type="text" name="username" placeholder="usermame" onChange={handleChange} value={formdata.username} />
                    <input type="text" name="name" placeholder="mame" onChange={handleChange} value={formdata.name} />
                    <input type="text" name="pass" placeholder="create password" onChange={handleChange} value={formdata.pass} />
                    <input type="text" name="bio" placeholder="bio" onChange={handleChange} value={formdata.bio} />
                    <input type="text" name="dob" placeholder="dob" onChange={handleChange} value={formdata.dob} />
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
                    <button type="submit">{loading ? "Uploading..." : "register"}</button>
                </form>
            )}
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
            {message && <p>{message}</p>}
            <p>Already have an account? <Link to="/login">Login</Link></p>
        </>
    )
}

export default Register