require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(

    process.env.CLIENT_API_KEY

);
const resend = new Resend(process.env.RESEND_API_KEY);
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors({

  origin: "http://localhost:5173"

}));
app.use(express.json());
const connectdb = () => {
    mongoose.connect(process.env.MONGO_URI);
    console.log("mongo connected")
}
connectdb();

const UserSchema = new mongoose.Schema({
    name: String,
    pass: String,
    email: String,
    role: String,
    blogliked: Array,
    blogcommented: Array,
    follower: Array,
    following: Array,
    image: String,
    chatters:Array
    
});
const User = mongoose.model("User", UserSchema);

const BlogSchema = new mongoose.Schema({
    title: String,
    subtitle: String,
    content: String,
    status: String,
    author: String,
    authorId: mongoose.Schema.Types.ObjectId,
    likes: Number,
    comments: Array,
    views: Number,
    image: String
});
const Blog = mongoose.model("Blog", BlogSchema);

const NotificationSchema = new mongoose.Schema({
    receiverId: mongoose.Schema.Types.ObjectId,
    senderId: mongoose.Schema.Types.ObjectId,
    senderName: String,
    message: String,
    
    blogId: mongoose.Schema.Types.ObjectId,
    time: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});
const Notification = mongoose.model("Notification", NotificationSchema);

const MessageSchema = new mongoose.Schema({
    senderId: mongoose.Schema.Types.ObjectId,
    receiverId: mongoose.Schema.Types.ObjectId,
    message: String,
    time: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", MessageSchema);

const JWT_SECRET = process.env.JWT_SECRET;

app.get("/", (req, res) => {
    res.send("backed is running");
})

///stup socket connections
const server = http.createServer(app);
// Initialize Socket.io with CORS enabled for your frontend
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", 
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // 1. User joins a room specific to their username when they log in
    socket.on('setup_user', (id) => {
        socket.join(id);
        console.log(`User ${id} joined their personal room`);
    });

    // Join private chat room
    socket.on('join_chat', (chatroom) => {
        socket.join(chatroom);
        console.log(`User ${socket.id} joined room ${chatroom}`);
    });

    // Handle message sending
    socket.on('send_message', (message) => {
        io.to(message.receiverId.toString()).to(message.senderId.toString()).emit('receive_message', message);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});


let otpStorage = {};


////verification with google.....////

app.post("/verifygoogle", async (req, res) => {

    try {

        const { credential } = req.body;

        const ticket = await client.verifyIdToken({

            idToken: credential,

            audience: process.env.CLIENT_API_KEY,

        });

        const payload = ticket.getPayload();

        if (!payload.email_verified) {

            return res.status(400).json({

                success: false,

                message: "Email not verified"

            });

        }
        const email = payload.email;
        const user = await User.findOne({ email });
        if (user) {
            res.json({
                success: false,

                message: "an account already exist with this email"
            })
        }
        else {
            res.json({

                success: true,

                email: payload.email,

                message: "email verified successfullt !!!"

            });
        }

    } catch (error) {

        res.status(400).json({

            success: false,

            message: "Google verification failed"

        });

    }

});



function generateOTP() {

    return Math.floor(

        100000 + Math.random() * 900000

    ).toString();

}

app.post("/sendotp", async (req, res) => {

    try {

        const { email } = req.body;



        if (!email) {

            return res.json({



                message: "Email is required",

            });

        }
        const user = await User.findOne({ email });
        if (user) {
            return res.json({ message: "an account with this email already exist" });
        }

        const otp = generateOTP();
        otpStorage[email] = otp;

        await resend.emails.send({

            from: "otp@harishpuhaniya.online",

            to: email,

            subject: "Your Verification Code",

            html: `

        <div style="font-family: Arial;">

          <h2>Your OTP is: ${otp}</h2>

          <p>This OTP expires in 5 minutes.</p>

        </div>

      `,

        });

        res.json({



            message: "OTP sent successfully",



        });

    } catch (error) {

        console.error(error);

        res.status(500).json({



            message: "Failed to send OTP",

        });

    }

});

app.post("/verifyotp", (req, res) => {
    const { email, otp } = req.body;
    if (otpStorage[email] === otp) {
        res.json({ success: true, message: "OTP verified successfully" });
    } else {
        res.status(400).json({ success: false, message: "Invalid OTP" });
    }
});



//registration
app.post("/regi", async (req, res) => {
    const { name, pass, email, image } = req.body;
    const exist = await User.findOne({ name });
    if (exist) {
        res.json({ message: "username already exist " })
    }
    else {
        const newUser = new User({ name, pass, email, role: "user", image });
        await newUser.save();
        res.json({
            message: "registration successful....",
            userId: newUser._id,
            name: newUser.name
        });
    }
})
//login
app.post("/logi", async (req, res) => {
    const { name, pass } = req.body;
    const exist = await User.findOne({ name });
    if (!exist) {
        res.json({ message: "  such username doesnt exist   " })
    }
    else {
        const passw = exist.pass;

        if (passw == pass) {

            const token = jwt.sign({ userId: exist._id, name: exist.name }, JWT_SECRET, { expiresIn: '1h' });

            const role = exist.role;
            res.json({ message: "user login done !!!   ", token, role, name: exist.name, userId: exist._id })

        }
        else {

            res.json({ message: "wrong password" });
        }
    }
})

app.post("/logout", (req, res) => {

    res.json({ message: "Logged out successfully" });
});
//blogs karyekall

//create
app.post("/blog", async (req, res) => {
    const { title, subtitle, content, author, authorId, image } = req.body;
    const newBlog = new Blog({ title, subtitle, content, status: "Pending", author, authorId, likes: 0, image });
    await newBlog.save();
    res.json({ message: "blog submission  successful...." });

})
//send for admin
app.get("/pendingblog", async (req, res) => {
    try {
        const limit = 5;
        const skip = parseInt(req.query.skip) || 0;
        const pend = await Blog.find({ status: "Pending" }).sort({ _id: -1 }).skip(skip).limit(limit);

        if (pend.length > 0) {
            res.json(pend);
        } else {
            res.json({ message: "No more pending blogs", blogs: [] });
        }
    } catch (error) {
        console.error("Error fetching pending blogs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
//send for home page
app.get("/verified", async (req, res) => {
    try {
        const limit = 5;
        const skip = parseInt(req.query.skip) || 0;
        const pend = await Blog.find({ status: "verified" }).sort({ _id: -1 }).skip(skip).limit(limit);

        if (pend.length > 0) {
            res.json(pend);
        } else {
            res.json({ message: "No more pending blogs", blogs: [] });
        }
    } catch (error) {
        console.error("Error fetching pending blogs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
//verify
app.post("/verify", async (req, res) => {
    try {
        const { id , comment} = req.body;
        const blog = await Blog.findById(id);
        blog.status = "verified";
        await blog.save();
        const authorId = blog.authorId;
         const notification = new Notification({
                receiverId: authorId,
             
                senderName: "ADMIN",
                message: `ADMIN  verified your blog: "${blog.title}" because "${comment}"`,
                blogId: blog._id
            });
            await notification.save();

            // Emit via Socket.io
            io.to(authorId.toString()).emit('receive_notification', {
                message: notification.message,
                time: notification.time,
                
                blogId: blog._id
            });

        res.json({ message: "one blog verified succesfully " });
    }
    catch (error) {
        console.log(error);
        res.json({ message: "unable to  verify blog " });
    }
})
//reject
app.post("/reject", async (req, res) => {
    try {
        const { id , comment } = req.body;
        const blog = await Blog.findById(id);
        blog.status = "rejected";
        await blog.save();
        const authorId = blog.authorId;

         const notification = new Notification({
                receiverId: authorId,
             
                senderName: "ADMIN",
                message: `ADMIN  rejected  your blog: "${blog.title}" because "${comment}"`,
                blogId: blog._id
            });
            await notification.save();

            // Emit via Socket.io
            io.to(authorId.toString()).emit('receive_notification', {
                message: notification.message,
                time: notification.time,
                
                blogId: blog._id
            });
        res.json({ message: "one blog rejected succesfully " });
    }
    catch (error) {
        console.log(error);
        res.json({ message: "unable to  reject blog " });
    }
})
//like...
app.post("/like", async (req, res) => {
    try {
        const { id, userId } = req.body;

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // If already liked → unlike
        if (user.blogliked.includes(id)) {
            user.blogliked = user.blogliked.filter(
                blogId => blogId.toString() !== id
            );

            blog.likes = Math.max((blog.likes || 0) - 1, 0);

            await user.save();
            await blog.save();

            return res.json({
                message: "Unliked successfully",
                likes: blog.likes
            });
        }

        // If not liked → like
        user.blogliked.push(id);
        blog.likes = (blog.likes || 0) + 1;

        await user.save();
        await blog.save();

        // Notification Logic
        const authorId = blog.authorId;
        if (authorId && authorId.toString() !== userId.toString()) {
            const notification = new Notification({
                receiverId: authorId,
                senderId: userId,
                senderName: user.name,
                message: `${user.name} liked your blog: "${blog.title}"`,
                blogId: blog._id
            });
            await notification.save();

            // Emit via Socket.io
            io.to(authorId.toString()).emit('receive_notification', {
                message: notification.message,
                time: notification.time,
                senderName: user.name,
                blogId: blog._id
            });
        }

        res.json({
            message: "Liked successfully",
            likes: blog.likes
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Unable to like/unlike"
        });
    }
});
//comments
app.post("/comments", async (req, res) => {
    try {
        const { comment, id, userId } = req.body;
        const blog = await Blog.findById(id);
        const user = await User.findById(userId)
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        blog.comments.push(comment);
        user.blogcommented.push(id);
        await user.save();
        await blog.save();

 const authorId = blog.authorId;
        if (authorId && authorId.toString() !== userId.toString()) {
            const notification = new Notification({
                receiverId: authorId,
                senderId: userId,
                senderName: user.name,
                message: `${user.name} commented on  your blog: " ${comment} ${blog.title}"`,
                
                blogId: blog._id
            });
            await notification.save();

            // Emit via Socket.io
            io.to(authorId.toString()).emit('receive_notification', {
                message: notification.message,
               
                time: notification.time,
                senderName: user.name,
                blogId: blog._id
            });
        }

        res.json({ comments: blog.comments });

    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Unable to commment"
        });
    }
})



//getfull blog
app.get("/blogs/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const blog = await Blog.findById(id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }
        blog.views = (blog.views || 0) + 1;
        blog.save();
        res.status(200).json(blog);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/// getting profile details 
app.post("/getprofile", async (req, res) => {
    try {
        const { userId, name } = req.body;
        let user;
        if (userId) {
            user = await User.findById(userId);
        } else if (name) {
            user = await User.findOne({ name });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userName = user.name;
        const blogs = await Blog.find({ author: userName });

        const veriblogs = blogs.filter(blog => blog.status === "verified");
        const vericount = veriblogs.length;
        const blogcount = blogs.length;
        const liked = user.blogliked || [];
        const commented = user.blogcommented || [];
        const image = user.image || "";

        // Resolve follower/following IDs to {_id, name} objects
        const followerIds = user.follower || [];
        const followingIds = user.following || [];
        const followerUsers = await User.find({ _id: { $in: followerIds } }, '_id name');
        const followingUsers = await User.find({ _id: { $in: followingIds } }, '_id name');

        res.status(200).json({
            blogcount,
            vericount,
            veriblogs,
            liked,
            commented,
            image,
            name: userName,
            followers: followerUsers,
            following: followingUsers
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});
app.post("/searchprofile", async (req, res) => {
    try {
        const { id, name: currentUserName } = req.body;
        let user;
        if (id) {
            user = await User.findById(id);
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const profileName = user.name;
        const blogs = await Blog.find({ author: profileName });
        const veriblogs = blogs.filter(blog => blog.status === "verified");
        const image = user.image || "";

        // Check if current user is following this profile
        let isfollowing = false;
        if (currentUserName) {
            const currentUser = await User.findOne({ name: currentUserName });
            if (currentUser && currentUser.following.includes(id)) {
                isfollowing = true;
            }
        }

        // Resolve follower/following IDs to {_id, name} objects
        const followerIds = user.follower || [];
        const followingIds = user.following || [];
        const followerUsers = await User.find({ _id: { $in: followerIds } }, '_id name');
        const followingUsers = await User.find({ _id: { $in: followingIds } }, '_id name');

        res.status(200).json({
            veriblogs,
            image,
            name: profileName,
            isfollowing,
            followers: followerUsers,
            following: followingUsers
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// Follow a user
app.post("/follow", async (req, res) => {
    try {
        const { userId, targetId } = req.body;
        if (!userId || !targetId) {
            return res.status(400).json({ message: "userId and targetId are required" });
        }
        if (userId === targetId) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const currentUser = await User.findById(userId);
        const targetUser = await User.findById(targetId);
        if (!currentUser || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Avoid duplicates
        if (!currentUser.following.includes(targetId)) {
            currentUser.following.push(targetId);
        }
        if (!targetUser.follower.includes(userId)) {
            targetUser.follower.push(userId);
        }

        await currentUser.save();
        await targetUser.save();

        // Send notification to the followed user
        const notification = new Notification({
            receiverId: targetId,
            senderId: userId,
            senderName: currentUser.name,
            message: `${currentUser.name} started following you`
        });
        await notification.save();
        io.to(targetId.toString()).emit('receive_notification', {
            message: notification.message,
            time: notification.time,
            senderName: currentUser.name
        });

        // Return updated follower/following lists with usernames
        const updatedFollowers = await User.find({ _id: { $in: targetUser.follower } }, '_id name');
        const updatedFollowing = await User.find({ _id: { $in: targetUser.following } }, '_id name');

        res.json({
            message: "Followed successfully",
            followers: updatedFollowers,
            following: updatedFollowing
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to follow" });
    }
});

// Unfollow a user
app.post("/unfollow", async (req, res) => {
    try {
        const { userId, targetId } = req.body;
        if (!userId || !targetId) {
            return res.status(400).json({ message: "userId and targetId are required" });
        }

        const currentUser = await User.findById(userId);
        const targetUser = await User.findById(targetId);
        if (!currentUser || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

       
        targetUser.follower = targetUser.follower.filter(
            fId => fId.toString() !== userId
        );

        await currentUser.save();
        await targetUser.save();

        // Return updated follower/following lists with usernames
        const updatedFollowers = await User.find({ _id: { $in: targetUser.follower } }, '_id name');
        const updatedFollowing = await User.find({ _id: { $in: targetUser.following } }, '_id name');

        res.json({
            message: "Unfollowed successfully",
            followers: updatedFollowers,
            following: updatedFollowing
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to unfollow" });
    }
});

app.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({
      receiverId: userId,
      isRead: false
    }).sort({ time: -1 });

    res.json(notifications || []);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});
app.get("/oldnotifications/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await Notification.find({ receiverId: userId }).sort({ time: -1 }) || [] ;
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add user to chatters list
app.post("/addchatter", async (req, res) => {
    try {
        const { userId, chatterId } = req.body;
        if (!userId || !chatterId) {
            return res.status(400).json({ message: "userId and chatterId are required" });
        }
        if (userId === chatterId) {
            return res.status(400).json({ message: "You cannot message yourself" });
        }

        const user = await User.findById(userId);
        const chatter = await User.findById(chatterId);
        if (!user || !chatter) {
            return res.status(404).json({ message: "User not found" });
        }

        // Add chatter to user's chatters list if not already present
        if (!user.chatters.includes(chatterId)) {
            user.chatters.push(chatterId);
            await user.save();
        }

        // Also add user to chatter's chatters list for bidirectional tracking
        if (!chatter.chatters.includes(userId)) {
            chatter.chatters.push(userId);
            await chatter.save();
        }

        res.json({ message: "Chatter added successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to add chatter" });
    }
});

// Get all chatters for a user
app.get("/chatters/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const chatterIds = user.chatters || [];
        const chatters = await User.find({ _id: { $in: chatterIds } }, '_id name image');
        
        res.json(chatters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to fetch chatters" });
    }
});
app.post("/read", async (req, res) => {
    try {
        const { id } = req.body;
        const notification = await Notification.findById(id) ;
        if(!notification){
            res.json({message : "noti not found"})
        }
        notification.isRead = !notification.isRead ;
        notification.save();
        res.json({
            message : "noti deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post("/search", async (req, res) => {
  try {
    const { search } = req.body;

    
    if (!search || search.trim() === "") {
      return res.json({
        message: "Search input is required"
      });
    }

    const userlist = await User.find({
     name: {
        $regex: search,
        $options: "i" // case-insensitive
      }
    });

    res.json(userlist);

  } catch (error) {
    res.json({
      message: "error 500"
    });
  }
});

// Get messages between two users
app.get("/messages/:userId/:chatterId", async (req, res) => {
  try {
    const { userId, chatterId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: chatterId },
        { senderId: chatterId, receiverId: userId }
      ]
    }).sort({ time: 1 }).limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send message
app.post("/sendmessage", async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    const newMessage = new Message({ senderId, receiverId, message });
    await newMessage.save();
    res.json(newMessage);
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})