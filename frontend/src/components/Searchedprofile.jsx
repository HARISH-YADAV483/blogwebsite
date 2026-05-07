import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;
function Searchedprofile({ unreadCount, setUnreadCount }) {
    const { id } = useParams();
    const [blogs, setblogs] = useState([]); 
    const [image, setimage] = useState("");
    const [Profilename, setname] = useState("");
    const [isfollowing, setisfollowing] = useState(false);
    const [followers, setfollowers] = useState([]);
    const [following, setfollowing] = useState([]);
    const [ischatter , setischatter] = useState(false);
    // UI state for showing lists
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const name = localStorage.getItem("name");
    const userId = localStorage.getItem("userId");
    const getprofile = async () => {
        try {
            const res = await axios.post(`${API_URL}/searchprofile`, { id, name });
            setblogs(res.data.veriblogs);
            setname(res.data.name);
            setimage(res.data.image);
            setisfollowing(res.data.isfollowing || false);
            setfollowers(res.data.followers || []);
            setfollowing(res.data.following || []);
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    };
    const follow = async () => {
        try {
            const action = isfollowing ? "unfollow" : "follow";
            const res = await axios.post(
                `${API_URL}/${action}`,
                { userId, targetId: id }
            );
            setisfollowing(!isfollowing);
            setfollowers(res.data.followers || []);
            setfollowing(res.data.following || []);
            //  setUnreadCount((prev) => Math.max(prev + 1, 0));
        } catch (err) {
            console.error(`Failed to ${isfollowing ? "unfollow" : "follow"}`, err);
        }
    };
    useEffect(() => {
        getprofile();
    }, [id]);
    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
            <h1>{Profilename}</h1>
            {image && (
                <img src={image} alt="" style={{ width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover", marginBottom: "15px" }} />
            )}
            
<br />
            {/* Show Follow and Message buttons only if it's not the user's own profile */}
            {userId !== id && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    <button onClick={follow} style={{ padding: "10px 20px", cursor: "pointer" }}>
                        {isfollowing ? "Unfollow" : "Follow"}
                    </button>
                    <button 
                        onClick={async () => {
                            try {
                                await axios.post(`${API_URL}/addchatter`, { userId, chatterId: id });
                                window.location.href = `/chat/${id}`;
                            } catch (err) {
                                console.error("Error starting conversation:", err);
                            }
                        }} 
                        style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: "#28a745" }}
                    >
                        Message
                    </button>
                </div>
            )}
            {/* Followers / Following counts */}
            <div style={{ display: "flex", gap: "20px", margin: "15px 0" }}>
                <span
                    onClick={() => setShowFollowers(!showFollowers)}
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                >
                    Followers: {followers.length}
                </span>
                <span
                    onClick={() => setShowFollowing(!showFollowing)}
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                >
                    Following: {following.length}
                </span>
            </div>
            {/* Followers list */}
            {showFollowers && (
                <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "10px", marginBottom: "15px" }}>
                    <h3>Followers</h3>
                    {followers.length === 0 ? (
                        <p style={{ color: "#888" }}>No followers yet</p>
                    ) : (
                        followers.map((f) => (
                            <div key={f._id} style={{ padding: "5px 0" }}>
                                <Link to={`/searchedprofile/${f._id}`}>{f.name}</Link>
                            </div>
                        ))
                    )}
                </div>
            )}
            {/* Following list */}
            {showFollowing && (
                <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "10px", marginBottom: "15px" }}>
                    <h3>Following</h3>
                    {following.length === 0 ? (
                        <p style={{ color: "#888" }}>Not following anyone yet</p>
                    ) : (
                        following.map((f) => (
                            <div key={f._id} style={{ padding: "5px 0" }}>
                                <Link to={`/searchedprofile/${f._id}`}>{f.name}</Link>
                            </div>
                        ))
                    )}
                </div>
            )}
            <h1>Blogs of {Profilename} : </h1>
            {blogs.length > 0 ? (
                <div>
                    {blogs.map((blog) => (
                        <div key={blog._id} style={{ borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "15px" }}>
                            {blog.image && (
                                <img src={blog.image} alt="" style={{ width: "300px", height: "auto" }} />
                            )}
                            <br />
                            <strong>{blog.title}</strong>
                            <br />
                            {blog.subtitle}
                            <br />
                            <Link to={`/blog/${blog._id}`} style={{ display: "inline-block", marginTop: "10px" }}>
                                Read Full blog
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div>No blogs submitted yet</div>
            )}
        </div>
    );
}
export default Searchedprofile;





