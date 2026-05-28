import { useState, useEffect } from "react"
import { Link } from "react-router-dom";
import axios from "axios";
import "./search.css";
import searchingVideo from "../assets/searching.webm";

const API_URL = import.meta.env.VITE_API_URL;

function Search() {
    const [userlist, setuserlist] = useState([]);
    const [search, setsearch] = useState("");
    const [loading, setLoading] = useState(false);

    const getusers = async () => {
        if (!search.trim()) {
            setuserlist([]);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/search`, { search });
            setuserlist(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            getusers();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search])

    return (
        <div className="search-page-container">
            <div className="search-input-wrapper">
                <svg className="search-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="url(#premium-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21.0004 20.9999L16.6504 16.6499" stroke="url(#premium-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <defs>
                        <linearGradient id="premium-grad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#df860a" />
                            <stop offset="1" stopColor="#f5a623" />
                        </linearGradient>
                    </defs>
                </svg>
                <input
                    type="text"
                    placeholder="Search BlogChit..."
                    value={search}
                    onChange={(e) => setsearch(e.target.value)}
                    className="search-input"
                    autoFocus
                />
            </div>

            {search.trim() === "" ? (
                <div className="search-empty-state">
                    <video
                        src={searchingVideo}
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                    <p className="search-empty-text">Discover new communities and friends</p>
                </div>
            ) : userlist.length > 0 ? (
                <div className="search-results-container">
                    {userlist.map((user) => (
                        <Link to={`/profile/${user._id}`} key={user._id} className="search-user-card">
                            {user.image ? (
                                <img src={user.image} alt="" className="search-user-avatar" />
                            ) : (
                                <div className="search-user-avatar-placeholder">
                                    {(user.username || user.name || "?").charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="search-user-info">
                                <span className="search-user-name">{user.name || user.username}</span>
                                {user.username && <span className="search-user-username">@{user.username}</span>}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="search-empty-state">
                    {/* Optionally we could use a different webm for "not found" but we'll stick to text here */}
                    <p className="search-empty-text">No users found for "{search}"</p>
                </div>
            )}
        </div>
    )
}

export default Search
