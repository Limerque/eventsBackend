// Import required packages
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://vanrooyenlimerique:Limie2004@cluster0.mxekmwh.mongodb.net/",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Create a schema for the data
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

// Create a model based on the schema
const User = mongoose.model("User", userSchema);

// Create a schema for the event data
const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
  },
  organizer: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  place: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

// Create a model based on the event schema
const Event = mongoose.model("Event", eventSchema);

// Middleware function to check if user is an admin
const isAdmin = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, "secret-key", (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (!decoded.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    req.userId = decoded.userId;
    next();
  });
};

// API routes

// User signup route
app.post("/signup", async (req, res) => {
  try {
    const { email, password, isAdmin } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      isAdmin,
    });

    await user.save();

    res.json({ message: "Signup successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      "secret-key"
    );

    res.json({ token, isAdmin: user.isAdmin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get all events
app.get("/find/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get a specific event by ID (accessible to all users)
app.get("/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "registeredUsers"
    );
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get all events (only accessible to admins)
app.get("/manage/events", isAdmin, async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to add a new event (only accessible to admins)
app.post("/manage/events", isAdmin, async (req, res) => {
  try {
    const {
      eventName,
      organizer,
      date,
      time,
      place,
      description,
      price,
      image,
    } = req.body;

    const event = new Event({
      eventName,
      organizer,
      date,
      time,
      place,
      description,
      price,
      image,
    });

    await event.save();

    res.json({ message: "Event added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to update an event by ID (only accessible to admins)
app.put("/manage/events/:id", isAdmin, async (req, res) => {
  try {
    const {
      eventName,
      organizer,
      date,
      time,
      place,
      description,
      price,
      image,
    } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    event.eventName = eventName;
    event.organizer = organizer;
    event.date = date;
    event.time = time;
    event.place = place;
    event.description = description;
    event.price = price;
    event.image = image;

    await event.save();

    res.json({ message: "Event updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to delete an event by ID (only accessible to admins)
app.delete("/manage/events/:id", isAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    await event.deleteOne();

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
module.exports = app;
