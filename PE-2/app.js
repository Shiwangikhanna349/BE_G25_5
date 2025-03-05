const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  try {
    const posts = JSON.parse(fs.readFileSync("posts.json", "utf8"));
    res.render("home", { posts });
  } catch (error) {
    res.status(500).render("error", { error: "Error loading posts" });
  }
});

app.get("/post/:id", (req, res) => {
  try {
    const posts = JSON.parse(fs.readFileSync("posts.json", "utf8"));
    const post = posts.find((p) => p.id === parseInt(req.params.id));

    if (!post) {
      return res.status(404).render("error", { error: "Post not found" });
    }

    res.render("post", { post });
  } catch (error) {
    res.status(500).render("error", { error: "Error loading post" });
  }
});

app.get("/addPost", (req, res) => {
  res.render("addPost");
});

app.post("/addPost", (req, res) => {
  try {
    const { title, content } = req.body;
    const posts = JSON.parse(fs.readFileSync("posts.json", "utf8"));

    const newPost = {
      id: posts.length > 0 ? posts[posts.length - 1].id + 1 : 1,
      title,
      content,
      date: new Date().toISOString(),
    };

    posts.push(newPost);
    fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));

    res.redirect("/");
  } catch (error) {
    res.status(500).render("error", { error: "Error adding post" });
  }
});

app.get("/editPost/:id", (req, res) => {
  try {
    const posts = JSON.parse(fs.readFileSync("posts.json", "utf8"));
    const post = posts.find((p) => p.id === parseInt(req.params.id));

    if (!post) {
      return res.status(404).render("error", { error: "Post not found" });
    }

    res.render("editPost", { post });
  } catch (error) {
    res
      .status(500)
      .render("error", { error: "Error loading post for editing" });
  }
});

app.post("/editPost/:id", (req, res) => {
  try {
    const { title, content } = req.body;
    const posts = JSON.parse(fs.readFileSync("posts.json", "utf8"));
    const postIndex = posts.findIndex((p) => p.id === parseInt(req.params.id));

    if (postIndex === -1) {
      return res.status(404).render("error", { error: "Post not found" });
    }

    posts[postIndex] = {
      ...posts[postIndex],
      title,
      content,
      date: new Date().toISOString(),
    };

    fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));
    res.redirect("/");
  } catch (error) {
    res.status(500).render("error", { error: "Error updating post" });
  }
});

app.post("/deletePost/:id", (req, res) => {
  try {
    const posts = JSON.parse(fs.readFileSync("posts.json", "utf8"));
    const updatedPosts = posts.filter((p) => p.id !== parseInt(req.params.id));

    if (updatedPosts.length === posts.length) {
      return res.status(404).render("error", { error: "Post not found" });
    }

    fs.writeFileSync("posts.json", JSON.stringify(updatedPosts, null, 2));
    res.redirect("/");
  } catch (error) {
    res.status(500).render("error", { error: "Error deleting post" });
  }
});

app.get("*", (req, res) => {
  res.status(404).render("error", { error: "Page not found" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
