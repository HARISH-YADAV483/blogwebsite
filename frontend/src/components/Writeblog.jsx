import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from 'axios';
import './writeblog.css';
import TiptapEditor from "./TiptapEditor";

const API_URL = import.meta.env.VITE_API_URL;

const CATEGORIES = [
    "Lifestyle", "Personal", "Business", "Technology", "Finance",
    "Health & Wellness", "Education", "Travel", "Food", "Fashion & Beauty",
    "Entertainment", "Sports", "News & Politics", "Marketing", "Career & Jobs",
    "Parenting & Family", "Relationships", "Science", "Gaming", "Photography & Art",
    "DIY & Crafts", "Automotive", "Real Estate", "Religion & Spirituality", "Environment & Sustainability",
    "Pets & Animals", "Agriculture & Farming", "Law & Legal", "History", "Self-Improvement & Motivation",
    "E-commerce", "Cryptocurrency & Blockchain", "Social Media & Influencer", "Productivity", "Books & Literature",
    "Music", "Movies & TV Shows", "Home Decor & Interior Design", "Fitness & Gym", "Mental Health",
    "Software & Programming", "AI", "Startup", "Leadership", "Design", "Data Science", "Web Development",
    "Cybersecurity", "Blockchain", "Space"
];

function Writeblog() {
    const navigate = useNavigate();
    const token = JSON.parse(localStorage.getItem("user") || "{}").token;

    useEffect(() => {
        if (!token) navigate("/login");
    }, [token, navigate]);

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [fileName, setFileName] = useState("");
    const [message, setMessage] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [blogdata, setBlogdata] = useState({
        title: '',
        subtitle: '',
        content: '',
        category: '',
        contentImages: [],
        author: JSON.parse(localStorage.getItem("user") || "{}").name || "",
        authorId: JSON.parse(localStorage.getItem("user") || "{}").userId || "",
        image: '',
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    /* Close dropdown on outside click */
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCategories = CATEGORIES.filter(c =>
        c.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBlogdata(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImage(file);
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const uploadImage = async () => {
        const data = new FormData();
        data.append("file", image);
        data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        data.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

        const res = await axios.post(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
            data
        );
        return res.data.secure_url;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setIsSuccess(false);
        setLoading(true);

        try {
            let imageUrl = "";
            if (image) imageUrl = await uploadImage();

            const res = await axios.post(`${API_URL}/blog`, {
                ...blogdata,
                image: imageUrl
            });

            setMessage(res.data.message || "Blog published successfully!");
            setIsSuccess(true);

            setTimeout(() => navigate("/"), 1600);
        } catch (err) {
            console.error(err);
            setMessage("Blog submission failed. Please try again.");
            setIsSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="write-blog-page">

            {/* ── Sticky back bar ── */}
            {/* <div className="write-blog-back-bar">
                <Link to="/" className="write-blog-back-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
                    </svg>
                    Back to Home
                </Link>
            </div> */}

            <div className="write-blog-container">

                {/* ── Page header ── */}
                <div className="write-blog-header">
                    <h1 className="write-blog-title">Write a New Blog</h1>
                    <p className="write-blog-subtitle-text">Share your story with the world</p>
                </div>

                {/* ── Alert ── */}
                {message && (
                    <div className={`wb-message-alert ${isSuccess ? 'success' : 'error'}`}>
                        {isSuccess ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        )}
                        {message}
                    </div>
                )}

                {/* ── Form card ── */}
                <div className="write-blog-form-card">
                    <form onSubmit={handleSubmit} className="write-blog-form">

                        {/* Title + Subtitle in 2 columns on desktop */}
                        <div className="wb-form-row-2">
                            <div className="form-group">
                                <label className="form-label">
                                    Title <span className="form-label-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={blogdata.title}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                    placeholder="Give your blog a catchy title…"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Subtitle</label>
                                <input
                                    type="text"
                                    name="subtitle"
                                    value={blogdata.subtitle}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="A brief tagline or description…"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="form-group" ref={dropdownRef}>
                            <label className="form-label">Category</label>
                            <div className="category-dropdown-wrapper">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search or select a category…"
                                    value={isDropdownOpen ? searchTerm : blogdata.category}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => {
                                        setIsDropdownOpen(true);
                                        setSearchTerm("");
                                    }}
                                    readOnly={!isDropdownOpen && !!blogdata.category}
                                />
                                {blogdata.category && !isDropdownOpen && (
                                    <div style={{ marginTop: 6 }}>
                                        <span className="wb-selected-category">
                                            ✓ {blogdata.category}
                                        </span>
                                    </div>
                                )}
                                {isDropdownOpen && (
                                    <div className="category-dropdown-list">
                                        {filteredCategories.length > 0 ? (
                                            filteredCategories.map(cat => (
                                                <div
                                                    key={cat}
                                                    className="category-dropdown-item"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setBlogdata(prev => ({ ...prev, category: cat }));
                                                        setIsDropdownOpen(false);
                                                        setSearchTerm("");
                                                    }}
                                                >
                                                    {cat}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="category-dropdown-item no-results">
                                                No categories found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <hr className="wb-divider" />

                        {/* Content editor */}
                        <div className="form-group">
                            <label className="form-label">
                                Content <span className="form-label-required">*</span>
                            </label>
                            <TiptapEditor
                                content={blogdata.content}
                                setContent={(html) =>
                                    setBlogdata(prev => ({ ...prev, content: html }))
                                }
                                onImageUpload={(url) => {
                                    setBlogdata(prev => ({
                                        ...prev,
                                        contentImages: [...prev.contentImages, url]
                                    }));
                                }}
                            />
                        </div>

                        <hr className="wb-divider" />

                        {/* Cover Image */}
                        <div className="form-group">
                            <label className="form-label">Cover Image</label>
                            <div className={`wb-cover-upload-area${fileName ? ' has-file' : ''}`}>
                                <input
                                    id="cover-image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="file-input-real"
                                    onChange={handleImageChange}
                                />
                                {!fileName ? (
                                    <>
                                        <div className="wb-upload-icon">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                        </div>
                                        <p className="wb-upload-label">Click to upload a cover image</p>
                                        <p className="wb-upload-hint">PNG, JPG, WEBP up to 10MB</p>
                                    </>
                                ) : (
                                    <div className="wb-file-preview">
                                        <span className="wb-file-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </span>
                                        <span className="file-name-preview">{fileName}</span>
                                    </div>
                                )}
                            </div>
                            {imagePreview && (
                                <img src={imagePreview} alt="Cover preview" className="wb-cover-thumb" />
                            )}
                        </div>

                        {/* Submit */}
                        <div className="wb-submit-bar">
                            <p className="wb-submit-hint">
                                Tip: Press <kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', border: '1px solid #e2e8f0' }}>⌘ Enter</kbd> in comment box to post
                            </p>
                            <button
                                type="submit"
                                disabled={loading}
                                className="submit-btn"
                            >
                                {loading ? (
                                    <>
                                        <span className="submit-btn-spinner" />
                                        Uploading & Saving…
                                    </>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="22" y1="2" x2="11" y2="13" />
                                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                        </svg>
                                        Publish Blog
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}

export default Writeblog;
