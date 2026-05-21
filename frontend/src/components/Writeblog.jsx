import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './writeblog.css';
import TiptapEditor from "./Tiptapeditor";

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
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    const [image, setimage] = useState(null);
    const [fileName, setFileName] = useState("");
    const [message, setmessage] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [blogdata, setblogdata] = useState({
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
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCategories = CATEGORIES.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

    const handlChange = (e) => {
        const { name, value } = e.target;
        setblogdata(prev => ({ ...prev, [name]: value }));
    };

    const uploadImage = async () => {
        const data = new FormData();
        data.append("file", image);
        data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
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
            console.error("Cloudinary upload failed:", error);
            throw error;
        }
    };

    const handlewriteb = async (e) => {
        e.preventDefault();
        setmessage(null);
        setIsSuccess(false);

        let imageUrl = "";
        try {
            if (image) {
                imageUrl = await uploadImage();
            }
            const updatedBlogData = {
                ...blogdata,
                image: imageUrl
            };

            const res = await axios.post(`${API_URL}/blog`, updatedBlogData);
            setmessage(res.data.message || "Blog created successfully!");
            setIsSuccess(true);

            setTimeout(() => {
                navigate("/");
            }, 1500);
        } catch (err) {
            console.error(err);
            setmessage("Blog submission failed. Please try again.");
            setIsSuccess(false);
        }
    };

    if (!token) {
        return null;
    }

    return (
        <div className="write-blog-container">
            <h2 className="write-blog-title">Write a New Blog</h2>

            {message && (
                <div className={`message-alert ${isSuccess ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handlewriteb} method="post" className="write-blog-form">
                <div className="form-group">
                    <label className="form-label">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={blogdata.title}
                        onChange={handlChange}
                        required
                        className="form-input"
                        placeholder="Enter blog title"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Subtitle</label>
                    <input
                        type="text"
                        name="subtitle"
                        value={blogdata.subtitle}
                        onChange={handlChange}
                        className="form-input"
                        placeholder="Enter blog subtitle"
                    />
                </div>

                <div className="form-group" ref={dropdownRef}>
                    <label className="form-label">Category</label>
                    <div className="category-dropdown-wrapper">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Select or type to search category..."
                            value={isDropdownOpen ? searchTerm : blogdata.category}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => {
                                setIsDropdownOpen(true);
                                setSearchTerm("");
                            }}
                        />
                        {isDropdownOpen && (
                            <div className="category-dropdown-list">
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map(cat => (
                                        <div
                                            key={cat}
                                            className="category-dropdown-item"
                                            onClick={() => {
                                                setblogdata(prev => ({ ...prev, category: cat }));
                                                setIsDropdownOpen(false);
                                                setSearchTerm("");
                                            }}
                                        >
                                            {cat}
                                        </div>
                                    ))
                                ) : (
                                    <div className="category-dropdown-item no-results">No categories found</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── TipTap Rich Text Editor replaces the old textarea ── */}
                <div className="form-group">
                    <label className="form-label">Content</label>
                    <TiptapEditor
                        content={blogdata.content}
                        setContent={(html) =>
                            setblogdata((prev) => ({ ...prev, content: html }))
                        }
                        onImageUpload={(url) => {
                            setblogdata(prev => ({ ...prev, contentImages: [...prev.contentImages, url] }));
                        }}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Cover Image</label>
                    <div className="file-input-wrapper">
                        <label className="file-input-button" htmlFor="cover-image-upload">
                            Choose File
                        </label>
                        <input
                            id="cover-image-upload"
                            type="file"
                            accept="image/*"
                            className="file-input-real"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                setimage(file);
                                setFileName(file ? file.name : "");
                            }}
                        />
                        {fileName ? (
                            <span className="file-name-preview">{fileName}</span>
                        ) : (
                            <span className="file-name-preview">No file chosen</span>
                        )}
                    </div>
                </div>

                <button type="submit" disabled={loading} className="submit-btn">
                    {loading ? "Uploading image & saving..." : "Publish Blog"}
                </button>
            </form>
        </div>
    );
}

export default Writeblog;