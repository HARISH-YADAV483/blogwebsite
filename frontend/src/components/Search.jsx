import { useState , useEffect} from "react"
import { Link } from "react-router-dom";
import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;
function Search() {
    const [userlist , setuserlist] = useState([]);
    const [search , setsearch] = useState("");
    const [message , setmessage] = useState("");
    const getusers =async() =>{
        await axios.post(`${API_URL}/search` , {search})
        .then(res =>{
            setuserlist(res.data);
            
        })
        .catch(err =>{
            
         
            console.error(err);
        })
    }
useEffect(
   () =>{
    getusers();
   }, [search]
)
  return (
    <>
 <input type="text" onChange={(e) =>{
    setsearch(e.target.value);
 }} />
 {
    userlist.length>0 && (
        <div>
            {userlist.map((user) =>(
                <div key={user._id}>
                    <Link to={`/profile/${user._id}`} > {user.username}</Link>
                   
                </div>
            )
            )}
        </div>
    )
 }
    </>
  )
}
export default Search
