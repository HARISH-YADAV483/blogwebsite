import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate , Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

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
        // Fetch private communities created by user to manage requests
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

    if (!userId) return <div>Please log in to see communities.</div>;

    const btnStyle = {
        padding: "8px 16px",
        background: "linear-gradient(135deg, #df860a, #f5a623)",
        color: "white",
        border: "none",
        borderRadius: "20px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px"
    };

    return (
        <div>
            <h1>Communities</h1>

            <div>
                <h2>Joined Communities</h2>
                {joinedCommunities.length === 0 ? <p>No joined communities.</p> : (
                    <ul>
                        {joinedCommunities.map(c => (
                            <li key={c._id}>
                                {c.name} ({c.type})
                                <button onClick={() => navigate(`/communiy/${c._id}`)}>Go to Chat</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <hr />

            <div>
                <h2>Popular Communities</h2>
                <ul>
                    {popularCommunities.map(c => (
                        <li key={c._id} >
                            <Link to={`/community/${c._id}`} >
                            
                            {c.name} - {c.memberCount} members
                            {!c.members?.includes(userId) && (
                                <button onClick={() => handleJoin(c._id)}>Join</button>
                            )}
                          
                        </Link>
                        </li>
                    ))}
                </ul>
            </div>

            <hr />

            <div style={{ marginBottom: "30px" }}>
                <h2 style={{ fontSize: "1.2rem", color: "#df860a", marginBottom: "15px" }}>Search Communities</h2>
                <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    <input 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        placeholder="Search communities..." 
                        style={{
                            flex: 1,
                            padding: "12px 20px",
                            borderRadius: "25px",
                            border: "1px solid rgba(223, 134, 10, 0.3)",
                            outline: "none",
                            background: "rgba(255, 255, 255, 0.9)",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
                        }}
                    />
                    <button type="submit" style={{
                        padding: "0 20px",
                        background: "linear-gradient(135deg, #df860a, #f5a623)",
                        color: "white",
                        border: "none",
                        borderRadius: "25px",
                        cursor: "pointer",
                        fontWeight: "600"
                    }}>Search</button>
                </form>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {searchResults.map(c => (
                        <div key={c._id} style={{
                            padding: "15px",
                            background: "rgba(255, 255, 255, 0.6)",
                            borderRadius: "12px",
                            border: "1px solid rgba(0,0,0,0.05)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <span style={{ fontWeight: "600" }}>{c.name} <span style={{ fontSize: "0.8em", color: "#888" }}>({c.type})</span></span>
                            {c.members?.includes(userId) ? (
                                <span style={{ color: "#34c759", fontWeight: "600", fontSize: "14px" }}>Joined</span>
                            ) : c.type === "public" ? (
                                <button onClick={() => handleJoin(c._id)} style={btnStyle}>Join</button>
                            ) : (
                                <button onClick={() => handleRequestJoin(c._id)} style={btnStyle}>Request</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <hr />

            <div>
                <h2>Manage Requests</h2>
                {myRequests.map(reqData => (
                    <div key={reqData.community._id}>
                        <h3>{reqData.community.name}</h3>
                        <ul>
                            {reqData.users.map(u => (
                                <li key={u._id}>
                                    {u.name}
                                    <button onClick={() => handleAcceptRequest(reqData.community._id, u._id)}>Accept</button>
                                    <button onClick={() => handleRejectRequest(reqData.community._id, u._id)}>Reject</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <hr />

            <div>
                <h2>Create Community</h2>
                <form onSubmit={handleCreate}>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Community Name" required />
                    
                    <div style={{ margin: '10px 0' }}>
                        <textarea 
                            value={desc} 
                            onChange={(e) => setDesc(e.target.value)} 
                            placeholder="Community Description" 
                            required 
                            rows="3"
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>
                    
                    <div style={{ margin: '10px 0' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Profile Image:</label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setImage(e.target.files[0])} 
                        />
                    </div>

                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="personal">Personal</option>
                    </select>
                    <div>
                        <h4>Add Chatters:</h4>
                        {availableChatters.map(chatter => (
                            <div key={chatter._id}>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedChatters.includes(chatter._id)} 
                                        onChange={() => handleChatterToggle(chatter._id)} 
                                    />
                                    {chatter.name}
                                </label>
                            </div>
                        ))}
                    </div>
                    <button type="submit" disabled={creating}>
                        {creating ? "Creating..." : "Create"}
                    </button>
                </form>
            </div>

        </div>
    );
}

export default Communities;