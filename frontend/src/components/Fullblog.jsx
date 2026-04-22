import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function Fullblog() {
    const { id } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setcomment] = useState("");
    const [comments, setcomments] = useState([]);
    const name = localStorage.getItem("name")

    const fetchBlog = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/blogs/${id}`);
            setBlog(res.data);
            setcomments(res.data.comments || []);
        } catch (err) {
            console.log(err);
            setBlog(null);
            alert(err?.response?.data?.message || "Failed to load blog");
        } finally {
            setLoading(false);
        }
    };
    const handlecomments = async () => {
        await axios.post(`${API_URL}/comments`, { comment, id , name})
            .then(res => {
                setcomments(res.data.comments);
                setcomment("");
            })
            .catch(err => {
                console.error(err);
                console.log("error while getting comments...")
            })
    }

    useEffect(() => {
        fetchBlog();
    }, [id]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!blog) {
        return <div>Blog not found</div>;
    }

    return (
        <>
            <Link to="/">Back to Home</Link>
            <h1>Full blog will appear here</h1>
            <h2> Title : {blog.title}</h2>
            <hr />
            <h3> Subtitle : {blog.subtitle}</h3>
            <hr />
            <p>
                <strong>AUTHOR:</strong> {blog.author}
            </p>
            <hr />
            <div className="blog-content">
                {blog.content}
            </div>

            <div className="heart-container" title="Like" onClick={() => like(blog._id)}>

                <input

                    type="checkbox"

                    className="checkbox"

                    id="Give-It-An-Id"

                />

                <div className="svg-container">

                    <svg

                        viewBox="0 0 24 24"

                        className="svg-outline"

                        xmlns="http://www.w3.org/2000/svg"

                    >

                        <path d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Zm-3.585,18.4a2.973,2.973,0,0,1-3.83,0C4.947,16.006,2,11.87,2,8.967a4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,11,8.967a1,1,0,0,0,2,0,4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,22,8.967C22,11.87,19.053,16.006,13.915,20.313Z" />

                    </svg>

                    <svg

                        viewBox="0 0 24 24"

                        className="svg-filled"

                        xmlns="http://www.w3.org/2000/svg"

                    >

                        <path d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Z" />

                    </svg>

                    <svg

                        className="svg-celebrate"

                        width="100"

                        height="100"

                        xmlns="http://www.w3.org/2000/svg"

                    >

                        <polygon points="10,10 20,20" />

                        <polygon points="10,50 20,50" />

                        <polygon points="20,80 30,70" />

                        <polygon points="90,10 80,20" />

                        <polygon points="90,50 80,50" />

                        <polygon points="80,80 70,70" />

                    </svg>

                </div>

            </div>
            <div className="comments" style={{ minHeight: "233px", width: "80vw", backgroundColor: "#333", padding: "20px", marginTop: "20px", borderRadius: "10px", overflowY: "auto" }}>
                <h1 style={{ color: "white", marginBottom: "15px" }}>Comment Box</h1>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {comments.length > 0 ? (
                        comments.map((c, index) => (
                            <div key={index} style={{
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                padding: "12px",
                                borderRadius: "8px",
                                color: "#333",
                                fontSize: "16px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }}>
                                {c}
                            </div>
                        ))
                    ) : (
                        <p style={{ color: "#ccc" }}>No comments yet. Be the first to comment!</p>
                    )}
                </div>
            </div>
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    value={comment}
                    placeholder="add your comment here"
                    style={{
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        flex: 1,
                        fontSize: "16px"
                    }}
                    onChange={(e) => {
                        setcomment(e.target.value);
                    }}
                />
                <button
                    onClick={handlecomments}
                    style={{
                        padding: "10px 25px",
                        backgroundColor: "#2ecc71",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        transition: "background 0.3s"
                    }}
                >
                    Add
                </button>
            </div>

        </>
    );

}
export default Fullblog;