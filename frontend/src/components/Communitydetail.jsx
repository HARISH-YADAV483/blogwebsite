import { useEffect , useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
function Communitydetail() {  
    const { id } = useParams();
const [name , setname] =useState("");
const [desc , setdesc] = useState("")
//array of objects
const [members, setmembers] = useState([]);
const [creator , setcreator] = useState({});

const [removeMode, setRemoveMode] = useState(false);
const [addMode, setAddMode] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState([]);

const userId = JSON.parse(localStorage.getItem("user") || "{}").userId;
const isMember = members.some(member => member._id === userId);

const handleJoin = async () => {
    try {
        const res = await axios.post(`${API_URL}/community/join`, { userId, communityId: id });
        if (res.data.success) {
            getcommunitydetail(); // refresh data
        }
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to join community");
    }
};

const handleRemoveMember = async (memberId) => {
    try {
        await axios.post(`${API_URL}/community/remove_member`, { creatorId: userId, communityId: id, memberId });
        getcommunitydetail(); // refresh data
    } catch (err) {
        console.error(err);
        alert("Failed to remove member");
    }
};

const searchUsers = async (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim() === "") {
        setSearchResults([]);
        return;
    }
    try {
        const res = await axios.post(`${API_URL}/search`, { search: e.target.value });
        setSearchResults(res.data);
    } catch (err) {
        console.error(err);
    }
};

const handleAddMember = async (memberId) => {
    try {
        await axios.post(`${API_URL}/community/add_members`, { creatorId: userId, communityId: id, memberIds: [memberId] });
        getcommunitydetail();
        setSearchQuery("");
        setSearchResults([]);
        setAddMode(false);
    } catch (err) {
        console.error(err);
        alert("Failed to add member");
    }
};


const getcommunitydetail = async() =>{
 await axios.get(`${API_URL}/communitydetail/${id}`)
.then(res => {
               setmembers(res.data.members);
               setname(res.data.name);
               setdesc(res.data.desc);
               setcreator(res.data.creator);


            })
            .catch(err => {
                console.error(err);
                setmessage("blog sumbit failsss");
            })
}    
useEffect(() => {
  getcommunitydetail();
    }, [id]);

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ padding: "20px", background: "#f9f9f9", borderRadius: "10px", marginBottom: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            {creator._id === userId && (
              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                <button 
                  onClick={() => { setAddMode(!addMode); setRemoveMode(false); }} 
                  style={{ padding: "8px 15px", background: addMode ? "#ccc" : "#4CAF50", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
                >
                  {addMode ? "Cancel Add" : "Add Members"}
                </button>
                <button 
                  onClick={() => { setRemoveMode(!removeMode); setAddMode(false); }} 
                  style={{ padding: "8px 15px", background: removeMode ? "#ccc" : "#f44336", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
                >
                  {removeMode ? "Cancel Remove" : "Remove Members"}
                </button>
              </div>
            )}
            
            {addMode && (
              <div style={{ marginBottom: "20px", background: "#fff", padding: "15px", borderRadius: "8px", border: "1px solid #eee" }}>
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={searchUsers} 
                  placeholder="Search users to add..." 
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", marginBottom: "10px" }}
                />
                {searchResults.length > 0 && (
                  <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #eee", borderRadius: "5px" }}>
                    {searchResults.map(user => {
                      const isAlreadyMember = members.some(m => m._id === user._id);
                      return (
                        <div key={user._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: "1px solid #eee" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {user.image ? (
                              <img src={user.image} alt={user.name} style={{ width: "30px", height: "30px", borderRadius: "50%" }} />
                            ) : (
                              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#ddd", display: "flex", justifyContent: "center", alignItems: "center" }}>?</div>
                            )}
                            <span>{user.name}</span>
                          </div>
                          {!isAlreadyMember ? (
                            <button onClick={() => handleAddMember(user._id)} style={{ padding: "5px 10px", background: "#2196F3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Add</button>
                          ) : (
                            <span style={{ fontSize: "0.85em", color: "#888" }}>Already a member</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Creator Section */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#333" }}>Creator:</h3>
              {creator?.image ? (
                  <img src={creator.image} alt={creator.name} style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover", border: "2px solid #ccc" }} />
              ) : (
                  <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "#ddd", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", color: "#555", border: "2px solid #ccc" }}>
                    {creator?.name ? creator.name.charAt(0).toUpperCase() : "?"}
                  </div>
              )}
              <span style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#444" }}>{creator?.name}</span>
            </div>
            
            {/* Members Section */}
            <div>
              <h3 style={{ margin: "0 0 12px 0", color: "#333", borderBottom: "1px solid #ddd", paddingBottom: "5px" }}>
                Members ({members?.length || 0})
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {members && members.map(member => (
                  <div key={member._id} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", padding: "6px 12px", borderRadius: "30px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", border: removeMode && member._id !== creator._id ? "1px solid #ffcccc" : "1px solid #eee" }}>
                    {member.image ? (
                      <img src={member.image} alt={member.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#ddd", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", color: "#555", fontSize: "14px" }}>
                        {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                    <span style={{ fontSize: "0.95rem", color: "#333", fontWeight: "500" }}>{member.name}</span>
                    {removeMode && member._id !== creator._id && (
                      <button 
                        onClick={() => handleRemoveMember(member._id)}
                        style={{ background: "transparent", border: "none", color: "#f44336", fontWeight: "bold", cursor: "pointer", marginLeft: "5px", padding: "0 5px" }}
                        title="Remove member"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "0 10px" }}>
            <h1 style={{ fontSize: "2.5rem", color: "#222", marginBottom: "10px" }}>{name}</h1>
            <hr style={{ border: "0", height: "1px", background: "#ddd", marginBottom: "20px" }} />
            <h2 style={{ fontSize: "1.3rem", color: "#555", lineHeight: "1.6", fontWeight: "normal" }}>{desc}</h2>
            <br />
            
            {isMember ? (
                <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: "12px", borderRadius: "8px", fontWeight: "bold", display: "inline-block", marginBottom: "20px" }}>
                    ✓ You are already in this community
                </div>
            ) : (
                <button onClick={handleJoin} style={{ padding: "10px 20px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px", fontSize: "1.1rem", cursor: "pointer", fontWeight: "bold", marginBottom: "20px", boxShadow: "0 2px 5px rgba(0,123,255,0.3)" }}>
                    Join Community
                </button>
            )}
            
            <hr style={{ border: "0", height: "1px", background: "#ddd" }} />
          </div>
        </div>
    ) 
}

export default Communitydetail