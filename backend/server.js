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

  origin: process.env.FRONTEND_URL

}));
app.use(express.json());
const connectdb = () => {
    mongoose.connect(process.env.MONGO_URI);
    console.log("mongo connected")
}
connectdb();

const UserSchema = new mongoose.Schema({
    username: String,
    pass: String,
    email: String,
    role: String,
    blogliked: Array,
    blogcommented: Array,
    follower: Array,
    following: Array,
    image: String,
    chatters:Array,
    unreadChatters: Array,
    communities: Array,
    savedblogs: Array,
    bio: String,
    dob: String,
    name:String,
    phone: String,
    bc: Number
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
    image: String,
    category: String,
    contentImages: [String],
    commentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sharers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
const Blog = mongoose.model("Blog", BlogSchema);

const BlogViewSchema = new mongoose.Schema({
    blogId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    count: { type: Number, default: 0 }
});
const BlogView = mongoose.model("BlogView", BlogViewSchema);

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
    time: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId }]
});
const Message = mongoose.model("Message", MessageSchema);

const DeletedMessageSchema = new mongoose.Schema({
    originalId: mongoose.Schema.Types.ObjectId,
    senderId: mongoose.Schema.Types.ObjectId,
    receiverId: mongoose.Schema.Types.ObjectId,
    message: String,
    time: Date,
    deletedAt: { type: Date, default: Date.now },
    deletedByType: String
});
const DeletedMessage = mongoose.model("DeletedMessage", DeletedMessageSchema);

const CommunitySchema = new mongoose.Schema({
    name: String,
    creatorId: mongoose.Schema.Types.ObjectId,
    type: String,
    members: Array,
    requests: Array,
    desc:String,
    image: String,
    createdAt: { type: Date, default: Date.now }
});
const Community = mongoose.model("Community", CommunitySchema);

const CommunityMessageSchema = new mongoose.Schema({
    communityId: mongoose.Schema.Types.ObjectId,
    senderId: mongoose.Schema.Types.ObjectId,
    message: String,
    time: { type: Date, default: Date.now },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId }]
});
const CommunityMessage = mongoose.model("CommunityMessage", CommunityMessageSchema);

const DeletedCommunityMessageSchema = new mongoose.Schema({
    originalId: mongoose.Schema.Types.ObjectId,
    communityId: mongoose.Schema.Types.ObjectId,
    senderId: mongoose.Schema.Types.ObjectId,
    message: String,
    time: Date,
    deletedAt: { type: Date, default: Date.now },
    deletedByType: String
});
const DeletedCommunityMessage = mongoose.model("DeletedCommunityMessage", DeletedCommunityMessageSchema);

const JWT_SECRET = process.env.JWT_SECRET;

app.get("/", (req, res) => {
    res.send("backed is running");
})

///stup socket connections
const server = http.createServer(app);
// Initialize Socket.io with CORS enabled for your frontend
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL, 
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
    socket.on('send_message', async (message) => {
        io.to(message.receiverId.toString()).to(message.senderId.toString()).emit('receive_message', message);

        const chatroom = [message.senderId.toString(), message.receiverId.toString()].sort().join("_");
        const roomSockets = io.sockets.adapter.rooms.get(chatroom);
        let receiverInChat = false;
        
        if (roomSockets) {
            for (const socketId of roomSockets) {
                const s = io.sockets.sockets.get(socketId);
                if (s && s.rooms.has(message.receiverId.toString())) {
                    receiverInChat = true;
                    break;
                }
            }
        }

        if (!receiverInChat) {
            // Notify receiver's personal room about new unread message
            io.to(message.receiverId.toString()).emit('new_unread_message', message);

            // Update receiver's unreadChatters in the database
            try {
               await User.findByIdAndUpdate(message.receiverId, {
                    $addToSet: { unreadChatters: message.senderId }
                });
            } catch (err) {
                console.error("Error updating unreadChatters:", err);
            }
        }
    });

    socket.on('leave_chat', (chatroom) => {
        socket.leave(chatroom);
        console.log(`User ${socket.id} left room ${chatroom}`);
    });

    socket.on('join_community_chat', (communityId) => {
        socket.join(communityId);
        console.log(`User ${socket.id} joined community room ${communityId}`);
    });

    socket.on('send_community_message', async (message) => {
        io.to(message.communityId.toString()).emit('receive_community_message', message);
    });

    socket.on('leave_community_chat', (communityId) => {
        socket.leave(communityId);
        console.log(`User ${socket.id} left community room ${communityId}`);
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
    const { name, pass, email, image , dob, bio , username} = req.body;
    const exist = await User.findOne({ username });
    if (exist) {
        res.json({ message: "username already exist " })
    }
    else {
        const newUser = new User({ username, pass, email, role: "user", image , bio , dob, name  });
        await newUser.save();
        res.json({
            message: "registration successful....",
            userId: newUser._id,
            username: newUser.username
        });
    }
})
//login
app.post("/logi", async (req, res) => {
    const { name, pass } = req.body;
   const exist = await User.findOne({
  $or: [
    { username: name },
    { email: name }
  ]
});
    if (!exist) {
        res.json({ message: "  such username doesnt exist   " })
    }
    else {
        const passw = exist.pass;

        if (passw == pass) {

            const token = jwt.sign({ userId: exist._id, username: exist.username }, JWT_SECRET, { expiresIn: '1h' });

            const role = exist.role;
            res.json({ message: "user login done !!!   ", token, role, username: exist.username, userId: exist._id })

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
    const { title, subtitle, content, author, authorId, image, category, contentImages } = req.body;
    const newBlog = new Blog({ title, subtitle, content, status: "Pending", author, authorId, likes: 0, image, category, contentImages: contentImages || [] });
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
        const authorid = blog.authorId ;
        const writer = await User.findById(authorid);
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
            writer.bc = Math.max((writer.bc || 0) - 0.5, 0);
            

            await user.save();
            await blog.save();
            await writer.save();

            return res.json({
                message: "Unliked successfully",
                likes: blog.likes
            });
        }

        // If not liked → like
        user.blogliked.push(id);
        blog.likes = (blog.likes || 0) + 1;
        writer.bc = (writer.bc || 0) + 0.5;

        await user.save();
        await blog.save();
        await writer.save();

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
//save
app.post("/save", async (req, res) => {
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

        // If already saved → do nothing
        if (user.savedblogs.includes(id)) {
           

            return res.json({
                message: "saved successfully",
                
            });
        }

        // If not liked → like
        user.savedblogs.push(id);
      

        await user.save();
  

       
       

        res.json({
            message: "saved successfully",
          
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Unable to save"
        });
    }
});
//comments
app.post("/comments", async (req, res) => {
    try {
        const { comment, id, userId } = req.body;
        const blog = await Blog.findById(id);
        const user = await User.findById(userId);
        const writerid = blog.authorId;
        const writer = await User.findById(writerid);

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        blog.comments.push(comment);
        user.blogcommented.push(id);

        // Push userId to commentors if not already present
        if (!blog.commentors.some(cId => cId.toString() === userId.toString())) {
            blog.commentors.push(userId);
            writer.bc = (writer.bc || 0) + 1 ;

        }
await writer.save();
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

//share blog - track sharer
app.post("/shareblog", async (req, res) => {
    try {
        const { blogId, userId } = req.body;
        const blog = await Blog.findById(blogId);
        const writerid =  blog.authorId;
        const writer  = await User.findById(writerid);

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        // Push userId to sharers if not already present
        if (!blog.sharers.some(sId => sId.toString() === userId.toString())) {
            blog.sharers.push(userId);
            writer.bc = (writer.bc || 0) + 1 ;
            await writer.save();
            await blog.save();
            
        }

        res.json({ message: "Sharer tracked successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to track sharer" });
    }
})



//getfull blog
app.get("/blogs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        const blog = await Blog.findById(id);
        const writerid = blog.authorId;
        const writer = await User.findById(writerid);


        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }

        if (userId) {
            let blogView = await BlogView.findOne({ blogId: id, userId });
            if (!blogView) {
                blogView = new BlogView({ blogId: id, userId, count: 1 });
                await blogView.save();
                blog.views = (blog.views || 0) + 1;
                writer.bc = (writer.bc || 0) + 0.1 ;
                await writer.save();

                await blog.save();
            } else if (blogView.count < 10) {
                blogView.count += 1;
                await blogView.save();
                blog.views = (blog.views || 0) + 1;
                writer.bc = (writer.bc || 0) + 0.1 ;
                await writer.save();
                await blog.save();
            }
        } else {
            // For anonymous/guest users, we can just increment the views

            await blog.save();
        }

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
        const { userId, username } = req.body;
        let user;
        if (userId) {
            user = await User.findById(userId);
        } else if (username) {
            user = await User.findOne({ username });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userName = user.username;
        const blogs = await Blog.find({ author: userName });
        const bc = user.bc;

        const veriblogs = blogs.filter(blog => blog.status === "verified");
        const vericount = veriblogs.length;
        const blogcount = blogs.length;
        const likedIds = user.blogliked || [];
        const commentedIds = user.blogcommented || [];
        const savedIds = user.savedblogs || [];

        const liked = await Blog.find({ _id: { $in: likedIds } }, '_id title');
        const commented = await Blog.find({ _id: { $in: commentedIds } }, '_id title');
        const saved = await Blog.find({ _id: { $in: savedIds } }, '_id title');
        const image = user.image || "";
        
        const chatterIds = user.chatters || [];
        const chatters = await User.find({ _id: { $in: chatterIds } }, '_id name image');
        // Resolve follower/following IDs to {_id, name} objects
        const followerIds = user.follower || [];
        const followingIds = user.following || [];
        const followerUsers = await User.find({ _id: { $in: followerIds } }, '_id name');
        const followingUsers = await User.find({ _id: { $in: followingIds } }, '_id name');

        let profileBc = 0;
        if (user.image && user.image.trim() !== "") profileBc += 2;
        if (user.bio && user.bio.trim() !== "") profileBc += 2;
        if (user.dob && user.dob.trim() !== "") profileBc += 2;
        if (user.phone && user.phone.trim() !== "") profileBc += 2;
        if (user.name && user.name.trim() !== "") profileBc += 1;
        if (user.email && user.email.trim() !== "") profileBc += 1;
        const computedBc = (bc || 0) + profileBc;

        res.status(200).json({
            blogcount,
            vericount,
            veriblogs,
            liked,
            commented,
            image,
            name: userName,
            username: userName,
            followers: followerUsers,
            following: followingUsers,
            chatters,
            saved,
            bio: user.bio || "",
            dob: user.dob || "",
            email: user.email || "",
            phone: user.phone || "",
            bc: computedBc
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

app.post("/changedetails", async (req, res) => {
    try {
        const { userId, username, dob, bio, phone } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // If the username is being changed, check if it's already taken
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Username is already taken" });
            }

            // Also update the author field in the User's blogs!
            await Blog.updateMany({ authorId: userId }, { author: username });

            user.username = username;
        }

        if (dob !== undefined) user.dob = dob;
        if (bio !== undefined) user.bio = bio;
        if (phone !== undefined) user.phone = phone;

        await user.save();

        res.json({ success: true, message: "Profile updated successfully!" });
    } catch (error) {
        console.error("Error updating profile details:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.post("/send-password-otp", async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const email = user.email;
        if (!email) {
            return res.status(400).json({ success: false, message: "No email associated with this account" });
        }

        const otp = generateOTP();
        otpStorage[email] = otp;

        await resend.emails.send({
            from: "otp@harishpuhaniya.online",
            to: email,
            subject: "Password Reset Verification Code",
            html: `
                <div style="font-family: Arial; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Hello ${user.name},</p>
                    <p>You requested to change your password. Please use the verification code below to complete the request:</p>
                    <div style="background: #f4f4f4; padding: 10px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>This OTP expires in 5 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        });

        res.json({ success: true, message: "Verification code sent to your registered email!" });
    } catch (error) {
        console.error("Error sending password OTP:", error);
        res.status(500).json({ success: false, message: "Failed to send OTP code" });
    }
});
app.post("/send-forgot-otp", async (req, res) => {
    try {
        const { namee } = req.body;
        if (!namee) {
            return res.status(400).json({ success: false, message: "username or email is required" });
        }

        const user = await User.findOne({
  $or: [
    { name: namee },
    { email: namee }
  ]
});
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const email = user.email;
        if (!email) {
            return res.status(400).json({ success: false, message: "No email associated with this account" });
        }

        const otp = generateOTP();
        otpStorage[email] = otp;

        await resend.emails.send({
            from: "otp@harishpuhaniya.online",
            to: email,
            subject: "Password Reset Verification Code",
            html: `
                <div style="font-family: Arial; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Hello ${user.name},</p>
                    <p>You requested to change your password. Please use the verification code below to complete the request:</p>
                    <div style="background: #f4f4f4; padding: 10px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>This OTP expires in 5 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        });

        res.json({ success: true, message: "Verification code sent to your registered email!" });
    } catch (error) {
        console.error("Error sending password OTP:", error);
        res.status(500).json({ success: false, message: "Failed to send OTP code" });
    }
});

app.post("/forgot-password-reset", async (req, res) => {
    try {
        const { namee, newPassword, otp } = req.body;
        if (!namee || !newPassword || !otp) {
            return res.status(400).json({ success: false, message: "All fields (namee, newPassword, otp) are required" });
        }

        const user = await User.findOne({
            $or: [
                { name: namee },
                { email: namee }
            ]
        });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const email = user.email;
        if (!email) {
            return res.status(400).json({ success: false, message: "No email associated with this account" });
        }

        // Verify OTP
        const storedOtp = otpStorage[email];
        if (!storedOtp || storedOtp.toString().trim() !== otp.toString().trim()) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        // Update password
        user.pass = newPassword;
        await user.save();

        // Clear OTP from storage
        delete otpStorage[email];

        res.json({ success: true, message: "Password reset successfully!" });
    } catch (error) {
        console.error("Error in forgot-password-reset:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});


app.post("/changepassword", async (req, res) => {
    try {
        const { userId, newPassword, otp } = req.body;
        if (!userId || !newPassword || !otp) {
            return res.status(400).json({ success: false, message: "All fields (userId, newPassword, otp) are required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const email = user.email;
        if (!email) {
            return res.status(400).json({ success: false, message: "No email associated with this account" });
        }

        // Verify OTP
        const storedOtp = otpStorage[email];
        if (!storedOtp || storedOtp.toString().trim() !== otp.toString().trim()) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        // Update password
        user.pass = newPassword;
        await user.save();

        // Clear OTP from storage
        delete otpStorage[email];

        res.json({ success: true, message: "Password updated successfully!" });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});


app.post("/searchprofile", async (req, res) => {
    try {
        const { id, username: currentUserName } = req.body;
        let user;
        if (id) {
            user = await User.findById(id);
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const profileName = user.username;
        const blogs = await Blog.find({ author: profileName });
        const veriblogs = blogs.filter(blog => blog.status === "verified");
        const image = user.image || "";
        const bc  = user.bc || "0";
        const bio = user.bio || "blogCHIT user";
        const name = user.name ;

        // Check if current user is following this profile
        let isfollowing = false;
        if (currentUserName) {
            const currentUser = await User.findOne({ username: currentUserName });
            if (currentUser && currentUser.following.includes(id)) {
                isfollowing = true;
            }
        }

        // Resolve follower/following IDs to {_id, username} objects
        const followerIds = user.follower || [];
        const followingIds = user.following || [];
        const followerUsers = await User.find({ _id: { $in: followerIds } }, '_id username');
        const followingUsers = await User.find({ _id: { $in: followingIds } }, '_id username');

        res.status(200).json({
            veriblogs,
            image,
            username: profileName,
            isfollowing,
            followers: followerUsers,
            following: followingUsers,
            bc,
            bio, 
            name
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
            senderName: currentUser.username,
            message: `${currentUser.username} started following you`
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
        
        // Find latest message for each chatter
        const chattersWithLatest = await Promise.all(chatters.map(async (chatter) => {
            const latestMsg = await Message.findOne({
                $or: [
                    { senderId: userId, receiverId: chatter._id },
                    { senderId: chatter._id, receiverId: userId }
                ],
                deletedBy: { $ne: new mongoose.Types.ObjectId(userId) }
            }).sort({ time: -1 });
            
            return {
                ...chatter.toObject(),
                latestMessageTime: latestMsg ? latestMsg.time : new Date(0)
            };
        }));
        
        chattersWithLatest.sort((a, b) => new Date(b.latestMessageTime) - new Date(a.latestMessageTime));
        
        res.json(chattersWithLatest);
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
     username: {
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
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 20;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: chatterId },
        { senderId: chatterId, receiverId: userId }
      ],
      deletedBy: { $ne: new mongoose.Types.ObjectId(userId) }
    })
    .sort({ time: -1 })
    .skip(skip)
    .limit(limit);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete personal messages
app.post("/messages/delete", async (req, res) => {
  try {
    const { messageIds, userId, type, chatroom } = req.body;
    if (!messageIds || !userId || !type) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (type === "for_me") {
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $addToSet: { deletedBy: new mongoose.Types.ObjectId(userId) } }
      );
      return res.json({ success: true, message: "Messages deleted for you" });
    } else if (type === "permanently") {
      const messagesToDelete = await Message.find({ _id: { $in: messageIds }, senderId: userId });
      const deletedDocs = messagesToDelete.map(msg => ({
        originalId: msg._id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        message: msg.message,
        time: msg.time,
        deletedByType: "permanently"
      }));
      if (deletedDocs.length > 0) {
        await DeletedMessage.insertMany(deletedDocs);
      }

      await Message.deleteMany({ _id: { $in: messageIds }, senderId: userId });

      // Emit socket event to both users in the room
      if (chatroom) {
        io.to(chatroom).emit("messages_deleted", { messageIds });
      }

      return res.json({ success: true, message: "Messages deleted permanently" });
    }

    res.status(400).json({ success: false, message: "Invalid delete type" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send message
app.post("/sendmessage", async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    const newMessage = new Message({ senderId, receiverId, message, isRead: false });
    await newMessage.save();
    res.json(newMessage);
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all messages from a sender as read for a receiver
app.post("/markread", async (req, res) => {
  try {
    const { userId, chatterId } = req.body;
    await Message.updateMany(
      { senderId: chatterId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread message counts grouped by sender
app.get("/unreadcounts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get unique senders from Messages
    const counts = await Message.aggregate([
      { $match: { receiverId: new mongoose.Types.ObjectId(userId), isRead: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } }
    ]);
    
    const perChatter = {};
    counts.forEach(c => { perChatter[c._id.toString()] = c.count; });
    
    // Get unreadChatters from User document
    const user = await User.findById(userId);
    const unreadChatters = user?.unreadChatters || [];
    
    res.json({ 
      total: counts.length, // Unique chatters count
      perChatter,
      unreadChatters
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/clearunread", async (req, res) => {
  try {
    const { userId } = req.body;
    await User.findByIdAndUpdate(userId, { $set: { unreadChatters: [] } });
    res.json({ message: "Unread chatters cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- COMMUNITIES API ---
app.post("/community/create", async (req, res) => {
    try {
        const { name, type, creatorId, members, desc, image } = req.body;
        const newCommunity = new Community({
            name,
            type,
            creatorId,
            members: [creatorId, ...(members || [])],
            requests: [],
            desc,
            image
        });
        await newCommunity.save();
        
        await User.updateMany(
            { _id: { $in: newCommunity.members } },
            { $addToSet: { communities: newCommunity._id } }
        );

        res.json({ success: true, community: newCommunity });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/community/joined/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const communities = await Community.find({ _id: { $in: user.communities } });
        res.json(communities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/community/popular", async (req, res) => {
    try {
        const communities = await Community.aggregate([
            { $match: { type: "public" } },
            { $addFields: { memberCount: { $size: "$members" } } },
            { $sort: { memberCount: -1 } },
            { $limit: 10 }
        ]);
        res.json(communities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/community/search", async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const communities = await Community.find({
            name: { $regex: q, $options: "i" },
            type: { $in: ["public", "private"] }
        });
        res.json(communities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/community/join", async (req, res) => {
    try {
        const { userId, communityId } = req.body;
        const community = await Community.findById(communityId);
        if (!community) return res.status(404).json({ message: "Community not found" });
        if (community.type !== "public") return res.status(403).json({ message: "Not a public community" });

        if (!community.members.includes(userId)) {
            community.members.push(userId);
            await community.save();
        }
        await User.findByIdAndUpdate(userId, { $addToSet: { communities: communityId } });

        res.json({ success: true, message: "Joined successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/community/request", async (req, res) => {
    try {
        const { userId, communityId } = req.body;
        const community = await Community.findById(communityId);
        if (!community) return res.status(404).json({ message: "Community not found" });
        if (community.type !== "private") return res.status(403).json({ message: "Not a private community" });

        if (!community.requests.includes(userId) && !community.members.includes(userId)) {
            community.requests.push(userId);
            await community.save();
        }

        res.json({ success: true, message: "Request sent" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/community/requests/:communityId", async (req, res) => {
    try {
        const { communityId } = req.params;
        const community = await Community.findById(communityId);
        if (!community) return res.status(404).json({ message: "Community not found" });

        const requesters = await User.find({ _id: { $in: community.requests } }, '_id name image');
        res.json(requesters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/community/accept", async (req, res) => {
    try {
        const { creatorId, userId, communityId } = req.body;
        const community = await Community.findById(communityId);
        if (!community) return res.status(404).json({ message: "Community not found" });
        if (community.creatorId.toString() !== creatorId) return res.status(403).json({ message: "Unauthorized" });

        community.requests = community.requests.filter(id => id.toString() !== userId);
        if (!community.members.includes(userId)) {
            community.members.push(userId);
        }
        await community.save();

        await User.findByIdAndUpdate(userId, { $addToSet: { communities: communityId } });
        res.json({ success: true, message: "Request accepted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/community/reject", async (req, res) => {
    try {
        const { creatorId, userId, communityId } = req.body;
        const community = await Community.findById(communityId);
        if (!community) return res.status(404).json({ message: "Community not found" });
        if (community.creatorId.toString() !== creatorId) return res.status(403).json({ message: "Unauthorized" });

        community.requests = community.requests.filter(id => id.toString() !== userId);
        await community.save();

        res.json({ success: true, message: "Request rejected" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/community/add_members", async (req, res) => {
    try {
        const { creatorId, communityId, memberIds } = req.body;
        const community = await Community.findById(communityId);
        if (!community) return res.status(404).json({ message: "Community not found" });
        if (community.creatorId.toString() !== creatorId) return res.status(403).json({ message: "Unauthorized" });

        community.members = [...new Set([...community.members, ...memberIds])];
        await community.save();

        await User.updateMany(
            { _id: { $in: memberIds } },
            { $addToSet: { communities: communityId } }
        );
        res.json({ success: true, message: "Members added" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/community/remove_member", async (req, res) => {
    try {
        const { creatorId, communityId, memberId } = req.body;
        const community = await Community.findById(communityId);
        if (!community) return res.status(404).json({ message: "Community not found" });
        if (community.creatorId.toString() !== creatorId) return res.status(403).json({ message: "Unauthorized" });

        community.members = community.members.filter(id => id.toString() !== memberId);
        await community.save();

        await User.findByIdAndUpdate(memberId, { $pull: { communities: communityId } });
        
        res.json({ success: true, message: "Member removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/community/:communityId/messages", async (req, res) => {
    try {
        const { communityId } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const skip = parseInt(req.query.skip) || 0;
        const userId = req.query.userId;

        const query = { communityId };
        if (userId) {
            query.deletedBy = { $ne: new mongoose.Types.ObjectId(userId) };
        }

        const messages = await CommunityMessage.find(query)
            .sort({ time: -1 })
            .skip(skip)
            .limit(limit);
        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete community messages
app.post("/community/messages/delete", async (req, res) => {
  try {
    const { messageIds, userId, type, communityId } = req.body;
    if (!messageIds || !userId || !type || !communityId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (type === "for_me") {
      await CommunityMessage.updateMany(
        { _id: { $in: messageIds } },
        { $addToSet: { deletedBy: new mongoose.Types.ObjectId(userId) } }
      );
      return res.json({ success: true, message: "Messages deleted for you" });
    } else if (type === "permanently") {
      const messagesToDelete = await CommunityMessage.find({ _id: { $in: messageIds }, senderId: userId });
      const deletedDocs = messagesToDelete.map(msg => ({
        originalId: msg._id,
        communityId: msg.communityId,
        senderId: msg.senderId,
        message: msg.message,
        time: msg.time,
        deletedByType: "permanently"
      }));
      if (deletedDocs.length > 0) {
        await DeletedCommunityMessage.insertMany(deletedDocs);
      }

      await CommunityMessage.deleteMany({ _id: { $in: messageIds }, senderId: userId });

      // Emit socket event to the community room
      io.to(communityId).emit("community_messages_deleted", { communityId, messageIds });

      return res.json({ success: true, message: "Messages deleted permanently" });
    }

    res.status(400).json({ success: false, message: "Invalid delete type" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/community/:communityId/sendmessage", async (req, res) => {
    try {
        const { communityId } = req.params;
        const { senderId, message } = req.body;

        const newMsg = new CommunityMessage({
            communityId,
            senderId,
            message
        });
        await newMsg.save();

        res.json(newMsg);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
//getfull blog
app.get("/communitydetail/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const community = await Community.findById(id);

        if (!community) {
            return res.status(404).json({
                success: false,
                message: "community not found"
            });
        }
    let name = community.name 
    const creatorid = community.creatorId
   const creator = await User.findById(creatorid).select("image name");
        const desc = community.desc || "it is a public community" ;
        const members_id = community.members;
       const members = await User.find({
  _id: { $in: members_id }
}).select("image name");

 res.status(200).json({
           name,
            creator,
            desc,
            members,
            
        });


    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})