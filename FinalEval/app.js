const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const morgan = require("morgan");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const Post = require("./models/Post");

mongoose.connect(
  "mongodb+srv://Shiwangi:Shiw7870@cluster0.gzrkb0n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB Atlas");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

app.get("/", async (req, res, next) => {
  try {
    const searchQuery = req.query.search;
    let filter = {};
    if (searchQuery) {
      filter.title = { $regex: searchQuery, $options: "i" };
    }
    const posts = await Post.find(filter).sort({ date: -1 });
    res.render("home", {
      posts,
      searchQuery: searchQuery || "",
    });
  } catch (error) {
    next(error);
  }
});

app.get("/post/:id", async (req, res, next) => {
  try {
    const post = await Post.findOne({ id: parseInt(req.params.id) });
    if (!post) {
      return res.status(404).render("error", {
        error: "Post not found",
        status: 404,
      });
    }
    res.render("post", { post });
  } catch (error) {
    next(error);
  }
});

app.get("/addPost", (req, res) => {
  res.render("addPost");
});

app.post("/addPost", async (req, res, next) => {
  try {
    const { title, content, imageUrl } = req.body;

    const lastPost = await Post.findOne().sort({ id: -1 });
    const nextId = lastPost ? lastPost.id + 1 : 1;
    const newPost = new Post({
      id: nextId,
      title,
      content,
      imageUrl: imageUrl || null,
      date: new Date(),
    });
    await newPost.save();
    res.redirect("/");
  } catch (error) {
    next(error);
  }
});

app.get("/editPost/:id", async (req, res, next) => {
  try {
    const post = await Post.findOne({ id: parseInt(req.params.id) });
    if (!post) {
      return res.status(404).render("error", {
        error: "Post not found",
        status: 404,
      });
    }
    const user = null;
    res.render("editPost", { post, user });
  } catch (error) {
    next(error);
  }
});

app.post("/editPost/:id", async (req, res, next) => {
  try {
    const { title, content, imageUrl } = req.body;
    const post = await Post.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      {
        title,
        content,
        imageUrl: imageUrl || null,
        date: new Date(),
      },
      { new: true }
    );
    if (!post) {
      return res.status(404).render("error", {
        error: "Post not found",
        status: 404,
      });
    }
    res.redirect("/");
  } catch (error) {
    next(error);
  }
});

app.post("/deletePost/:id", async (req, res, next) => {
  try {
    const deleted = await Post.findOneAndDelete({
      id: parseInt(req.params.id),
    });
    if (!deleted) {
      return res.status(404).render("error", {
        error: "Post not found",
        status: 404,
      });
    }
    res.redirect("/");
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);

  const errorMessage =
    process.env.NODE_ENV === "development"
      ? err.message
      : "Something went wrong! Please try again later.";

  res.status(err.status || 500).render("error", {
    error: errorMessage,
    status: err.status || 500,
  });
});

app.use((req, res) => {
  res.status(404).render("error", {
    error: "Page not found",
    status: 404,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
