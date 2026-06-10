import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./fullblog.css";

const API_URL = import.meta.env.VITE_API_URL;

/* Utility: estimate reading time */
function readingTime(html = "") {
    const text = html.replace(/<[^>]+>/g, "");
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
}

/* Utility: first letter of author name for avatar */
function getInitial(name = "") {
    return name.trim().charAt(0).toUpperCase() || "?";
}

function Fullblog() {
    const { id } = useParams();
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = storedUser.userId;
    const currentUsername = storedUser.username || storedUser.name || "You";

    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState([]);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [saved, setSaved] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    /* Fetch blog */
    const fetchBlog = async () => {
        try {
            setLoading(true);
            const url = userId
                ? `${API_URL}/blogs/${id}?userId=${userId}`
                : `${API_URL}/blogs/${id}`;
            const res = await axios.get(url);
            setBlog(res.data);
            setComments(res.data.comments || []);
            setLiked(res.data.liked || false);
            setLikeCount(res.data.likesCount ?? res.data.likes ?? 0);
            setSaved(res.data.saved || false);
        } catch (err) {
            console.error(err);
            setBlog(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlog();
        window.scrollTo({ top: 0 });
    }, [id]);

    /* Like handler */
    const handleLike = async () => {
        if (!userId) return;
        try {
            setLiked((prev) => !prev);
            setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
            await axios.post(`${API_URL}/blogs/${id}/like`, { userId });
        } catch (err) {
            /* Revert on error */
            setLiked((prev) => !prev);
            setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
            console.error(err);
        }
    };

    /* Save / Bookmark handler */
    const handleSave = async () => {
        if (!userId) return;
        const prev = saved;
        setSaved(!prev);
        try {
            await axios.post(`${API_URL}/blogs/${id}/save`, { userId });
        } catch (err) {
            setSaved(prev); // revert on error
            console.error(err);
        }
    };

    /* Comment submit */
    const handleComment = async () => {
        if (!comment.trim() || !userId) return;
        setSubmitting(true);
        try {
            const res = await axios.post(`${API_URL}/comments`, {
                comment: comment.trim(),
                id,
                userId,
            });
            setComments(res.data.comments || comments);
            setComment("");
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    /* Share / copy link */
    const handleShare = async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* Fallback */
        }
    };

    /* ── Loading state ── */
    if (loading) {
        return (
            <div className="fullblog-page">
                <div className="fullblog-loading">
                    <div className="fullblog-loading-spinner" />
                    <p>Loading article…</p>
                </div>
            </div>
        );
    }

    /* ── Error state ── */
    if (!blog) {
        return (
            <div className="fullblog-page">
                <div className="fullblog-error">
                    <h2>Article not found</h2>
                    <p>The blog post you're looking for doesn't exist or was removed.</p>
                    <Link to="/" style={{ color: "var(--accent)", fontWeight: 600, marginTop: 8, textDecoration: "none" }}>
                        ← Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const mins = readingTime(blog.content);

    return (
        <div className="fullblog-page">

            {/* ── Back navigation bar ── */}
            <div className="fullblog-back-bar">
                <Link to="/" className="fullblog-back-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
                    </svg>
                    Back to Home
                </Link>
            </div>

            {/* ── Hero Cover Image ── */}
            {blog.image && (
                <div className="fullblog-hero">
                    <img src={blog.image} alt={blog.title} />
                    <div className="fullblog-hero-overlay" />
                </div>
            )}

            {/* ── Article ── */}
            <article className="fullblog-article">

                {/* Category + Read time */}
                <div className="fullblog-meta-row">
                    {blog.category && (
                        <span className="fullblog-category-badge">
                            {blog.category}
                        </span>
                    )}
                    <span className="fullblog-read-time">
                        {mins} min read
                    </span>
                </div>

                {/* Title */}
                <h1 className="fullblog-title">{blog.title}</h1>

                {/* Subtitle */}
                {blog.subtitle && (
                    <p className="fullblog-subtitle">{blog.subtitle}</p>
                )}

                {/* Author strip */}
                <div className="fullblog-author-strip">
                    <div className="fullblog-author-avatar">
                        {getInitial(blog.author)}
                    </div>
                    <div className="fullblog-author-info">
                        <span className="fullblog-author-name">{blog.author}</span>
                        <span className="fullblog-author-date">
                            {blog.createdAt
                                ? new Date(blog.createdAt).toLocaleDateString("en-US", {
                                      year: "numeric", month: "long", day: "numeric"
                                  })
                                : "Published"}
                        </span>
                    </div>
                </div>

                {/* Blog body */}
                <div
                    className="fullblog-content tiptap-editor-content"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                />

                {/* ── Engagement bar ── */}
                <div className="fullblog-engage-bar">
                    <div className="fullblog-engage-left">
                        {/* Like */}
                        <button
                            className={`fullblog-like-btn${liked ? " liked" : ""}`}
                            onClick={handleLike}
                            title={liked ? "Unlike" : "Like this article"}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "#ef4444" : "none"} stroke={liked ? "#ef4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            {likeCount > 0 ? likeCount : ""} {liked ? "Liked" : "Like"}
                        </button>

                        {/* Share / Copy link */}
                        <button
                            className="fullblog-share-btn"
                            onClick={handleShare}
                            title="Copy link"
                        >
                            {copied ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                    </svg>
                                    Share
                                </>
                            )}
                        </button>

                        {/* Save / Bookmark */}
                        <button
                            className={`fullblog-save-btn${saved ? " saved" : ""}`}
                            onClick={handleSave}
                            title={saved ? "Remove from saved" : "Save article"}
                        >
                            <svg
                                width="17" height="17"
                                viewBox="0 0 24 24"
                                fill={saved ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="2.1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                            {saved ? "Saved" : "Save"}
                        </button>
                    </div>
                </div>
            </article>

            {/* ── Comments Section ── */}
            <section className="fullblog-comments-section">
                <div className="fullblog-comments-header">
                    <h2 className="fullblog-comments-title">
                        Comments
                        {comments.length > 0 && (
                            <span className="fullblog-comment-count">{comments.length}</span>
                        )}
                    </h2>
                </div>

                {/* Add comment form */}
                <div className="fullblog-comment-form">
                    <div className="fullblog-comment-input-row">
                        <div className="fullblog-comment-avatar">
                            {getInitial(currentUsername)}
                        </div>
                        <div className="fullblog-comment-input-area">
                            <textarea
                                className="fullblog-comment-input"
                                placeholder="Share your thoughts on this article…"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                        handleComment();
                                    }
                                }}
                                rows={3}
                            />
                            <div className="fullblog-comment-submit-row">
                                <button
                                    className="fullblog-comment-submit"
                                    onClick={handleComment}
                                    disabled={!comment.trim() || submitting}
                                >
                                    {submitting ? "Posting…" : "Post Comment"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments list */}
                {comments.length > 0 ? (
                    <div className="fullblog-comments-list">
                        {comments.map((c, i) => (
                            <div className="fullblog-comment-card" key={i}>
                                <div className="fullblog-comment-card-header">
                                    <div className="fullblog-comment-card-avatar">
                                        {typeof c === "object" && c.user
                                            ? getInitial(c.user)
                                            : String(i + 1)}
                                    </div>
                                    <span className="fullblog-comment-card-user">
                                        {typeof c === "object" && c.user
                                            ? c.user
                                            : "Reader"}
                                    </span>
                                </div>
                                <p className="fullblog-comment-card-text">
                                    {typeof c === "object" ? c.comment || c.text : c}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="fullblog-no-comments">
                        <div className="no-comments-icon">💬</div>
                        <p>No comments yet — be the first to share your thoughts!</p>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Fullblog;