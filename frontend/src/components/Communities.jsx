import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

// Reusing LetterAvatar from Messages.jsx for consistency
function getAvatarColor(name) {
    const colors = [
        ['#df860a', '#f5a623'], ['#6366f1', '#818cf8'], ['#ec4899', '#f472b6'],
        ['#14b8a6', '#2dd4bf'], ['#f43f5e', '#fb7185'], ['#8b5cf6', '#a78bfa'],
        ['#0ea5e9', '#38bdf8'], ['#f97316', '#fb923c'], ['#10b981', '#34d399'],
        ['#e11d48', '#f43f5e'],
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function LetterAvatar({ name, className = "" }) {
    const letter = (name || "?").charAt(0).toUpperCase();
    const [c1, c2] = getAvatarColor(name);
    return (
        <div
            className={`letter-avatar ${className}`}
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        >
            {letter}
        </div>
    );
}

function Communities() {
    const navigate = useNavigate();
    const userId = JSON.parse(localStorage.getItem("user") || "{}").userId;
    const [joinedCommunities, setJoinedCommunities] = useState([]);
    const [popularCommunities, setPopularCommunities] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [myRequests, setMyRequests] = useState([]);

    // Create Community State
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [image, setImage] = useState(null);
    const [type, setType] = useState("public");
    const [availableChatters, setAvailableChatters] = useState([]);
    const [selectedChatters, setSelectedChatters] = useState([]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchJoined();
            fetchPopular();
            fetchChatters();
            fetchMyRequests();
        }
    }, [userId]);

    const fetchJoined = async () => {
        try {
            const res = await axios.get(`${API_URL}/community/joined/${userId}`);
            setJoinedCommunities(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPopular = async () => {
        try {
            const res = await axios.get(`${API_URL}/community/popular`);
            setPopularCommunities(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchChatters = async () => {
        try {
            const res = await axios.get(`${API_URL}/chatters/${userId}`);
            setAvailableChatters(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMyRequests = async () => {
        try {
            const res = await axios.get(`${API_URL}/community/joined/${userId}`);
            const myPrivate = res.data.filter(c => c.creatorId === userId && c.type === "private");
            const requestsData = [];
            for (let c of myPrivate) {
                const reqs = await axios.get(`${API_URL}/community/requests/${c._id}`);
                if (reqs.data.length > 0) {
                    requestsData.push({ community: c, users: reqs.data });
                }
            }
            setMyRequests(requestsData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.get(`${API_URL}/community/search?q=${searchQuery}`);
            setSearchResults(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            let imageUrl = "";
            if (image) {
                const data = new FormData();
                data.append("file", image);
                data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
                data.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
                const res = await axios.post(
                    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
                    data
                );
                imageUrl = res.data.secure_url;
            }

            await axios.post(`${API_URL}/community/create`, {
                name,
                type,
                creatorId: userId,
                members: selectedChatters,
                desc,
                image: imageUrl
            });
            setName("");
            setDesc("");
            setImage(null);
            setSelectedChatters([]);
            fetchJoined();
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const handleJoin = async (communityId) => {
        try {
            await axios.post(`${API_URL}/community/join`, { userId, communityId });
            fetchJoined();
            setSearchResults(searchResults.map(c => c._id === communityId ? { ...c, members: [...c.members, userId] } : c));
        } catch (err) {
            console.error(err);
        }
    };

    const handleRequestJoin = async (communityId) => {
        try {
            await axios.post(`${API_URL}/community/request`, { userId, communityId });
            alert("Join request sent!");
        } catch (err) {
            console.error(err);
        }
    };

    const handleAcceptRequest = async (communityId, targetUserId) => {
        try {
            await axios.post(`${API_URL}/community/accept`, { creatorId: userId, userId: targetUserId, communityId });
            fetchMyRequests();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRejectRequest = async (communityId, targetUserId) => {
        try {
            await axios.post(`${API_URL}/community/reject`, { creatorId: userId, userId: targetUserId, communityId });
            fetchMyRequests();
        } catch (err) {
            console.error(err);
        }
    };

    const handleChatterToggle = (id) => {
        if (selectedChatters.includes(id)) {
            setSelectedChatters(selectedChatters.filter(c => c !== id));
        } else {
            setSelectedChatters([...selectedChatters, id]);
        }
    };

    if (!userId) return <div style={{ padding: "20px", color: "#888", textAlign: "center" }}>Please log in to see communities.</div>;

    const btnStyle = {
        padding: "8px 16px",
        background: "linear-gradient(135deg, #df860a, #f5a623)",
        color: "white",
        border: "none",
        borderRadius: "20px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px",
        boxShadow: "0 2px 6px rgba(223, 134, 10, 0.2)"
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px", paddingBottom: "20px" }}>

            {/* Search */}
            <div>
                <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Find communities..."
                        className="messages-search-input"
                        style={{ flex: 1 }}
                    />
                    <button type="submit" style={btnStyle}>Search</button>
                </form>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <h3 style={{ fontSize: "12px", color: "#888", margin: "5px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Search Results</h3>
                        {searchResults.map(c => (
                            <div key={c._id} className="chatter-card" style={{ cursor: 'default' }}>
                                {c.image ? <img src={c.image} alt="" className="chatter-avatar" /> : <LetterAvatar name={c.name} />}
                                <div className="chatter-info">
                                    <span className="chatter-name">{c.name}</span>
                                    <span className="chatter-last-msg">{c.type}</span>
                                </div>
                                {c.members?.includes(userId) ? (
                                    <span style={{ color: "#34c759", fontWeight: "600", fontSize: "12px", background: "rgba(52, 199, 89, 0.1)", padding: "4px 8px", borderRadius: "10px" }}>Joined</span>
                                ) : c.type === "public" ? (
                                    <button onClick={() => handleJoin(c._id)} style={{ ...btnStyle, padding: "6px 14px", fontSize: "12px" }}>Join</button>
                                ) : (
                                    <button onClick={() => handleRequestJoin(c._id)} style={{ ...btnStyle, padding: "6px 14px", fontSize: "12px" }}>Request</button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Joined Communities */}
            <div>
                <h3 style={{ fontSize: "12px", color: "#888", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Joined Communities</h3>
                {joinedCommunities.length === 0 ? (
                    <p style={{ color: "#999", fontSize: "13px", textAlign: "center", padding: "15px", background: "rgba(0,0,0,0.02)", borderRadius: "12px" }}>
                        You haven't joined any communities yet.
                    </p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {joinedCommunities.map(c => (
                            <Link key={c._id} to={`/communiy/${c._id}`} className="chatter-card" style={{ textDecoration: 'none' }}>
                                {c.image ? <img src={c.image} alt="" className="chatter-avatar" /> : <LetterAvatar name={c.name} />}
                                <div className="chatter-info">
                                    <span className="chatter-name">{c.name}</span>
                                    <span className="chatter-last-msg">{c.type}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Popular Communities */}
            {popularCommunities.length > 0 && (
                <div>
                    <h3 style={{ fontSize: "12px", color: "#888", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Popular</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {popularCommunities.map(c => (
                            <Link key={c._id} to={`/community/${c._id}`} className="chatter-card" style={{ textDecoration: 'none' }}>
                                {c.image ? <img src={c.image} alt="" className="chatter-avatar" /> : <LetterAvatar name={c.name} />}
                                <div className="chatter-info">
                                    <span className="chatter-name">{c.name}</span>
                                    <span className="chatter-last-msg">{c.memberCount} members</span>
                                </div>
                                {!c.members?.includes(userId) && (
                                    <button onClick={(e) => { e.preventDefault(); handleJoin(c._id); }} style={{ ...btnStyle, padding: "6px 14px", fontSize: "12px" }}>Join</button>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Manage Requests */}
            {myRequests.length > 0 && (
                <div>
                    <h3 style={{ fontSize: "12px", color: "#888", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Manage Requests</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {myRequests.map(reqData => (
                            <div key={reqData.community._id} style={{ background: "rgba(255,255,255,0.7)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                                <div style={{ fontWeight: "600", marginBottom: "12px", color: "#333" }}>{reqData.community.name}</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {reqData.users.map(u => (
                                        <div key={u._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", background: "rgba(255,255,255,0.9)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.04)" }}>
                                            <span style={{ fontWeight: "500" }}>{u.name}</span>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button onClick={() => handleAcceptRequest(reqData.community._id, u._id)} style={{ padding: "6px 12px", background: "#34c759", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Accept</button>
                                                <button onClick={() => handleRejectRequest(reqData.community._id, u._id)} style={{ padding: "6px 12px", background: "#ff3b30", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Reject</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Community Accordion */}
            <details style={{ background: "rgba(255,255,255,0.7)", padding: "14px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                <summary style={{ fontWeight: "600", cursor: "pointer", outline: "none", color: "#df860a", display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    Create New Community
                </summary>
                <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                    <input className="messages-search-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Community Name" required />

                    <textarea
                        className="messages-search-input"
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Brief Description"
                        required
                        rows="2"
                        style={{ resize: "vertical", borderRadius: "16px" }}
                    />

                    <div style={{ padding: "0 4px" }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>Profile Image</label>
                        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} style={{ fontSize: "13px" }} />
                    </div>

                    <div style={{ padding: "0 4px" }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>Privacy</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="messages-search-input" style={{ appearance: "auto" }}>
                            <option value="public">Public - Anyone can join</option>
                            <option value="private">Private - Requires approval</option>
                            <option value="personal">Personal - Invite only</option>
                        </select>
                    </div>

                    {availableChatters.length > 0 && (
                        <div style={{ padding: "0 4px" }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>Invite Chatters</label>
                            <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", background: "rgba(255,255,255,0.5)", padding: "10px", borderRadius: "12px" }}>
                                {availableChatters.map(chatter => (
                                    <label key={chatter._id} style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedChatters.includes(chatter._id)}
                                            onChange={() => handleChatterToggle(chatter._id)}
                                            style={{ width: "16px", height: "16px", accentColor: "#df860a" }}
                                        />
                                        {chatter.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <button type="submit" disabled={creating} style={{ ...btnStyle, marginTop: "8px", padding: "12px", fontSize: "15px" }}>
                        {creating ? "Creating Community..." : "Create Community"}
                    </button>
                </form>
            </details>

        </div>
    );
}

export default Communities;