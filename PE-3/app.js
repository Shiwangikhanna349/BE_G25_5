const express = require("express");
const fs = require("fs");
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

const readPosts = () => {
  return new Promise((resolve, reject) => {
    fs.readFile("posts.json", "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  });
};

app.get("/", async (req, res, next) => {
  try {
    const posts = await readPosts();
    const user = null;

    const searchQuery = req.query.search;
    let filteredPosts = posts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredPosts = posts.filter((post) =>
        post.title.toLowerCase().includes(query)
      );
    }

    res.render("home", {
      posts: filteredPosts,
      user,
      searchQuery: searchQuery || "",
    });
  } catch (error) {
    next(error);
  }
});

app.get("/post/:id", async (req, res, next) => {
  try {
    const posts = await readPosts();
    const post = posts.find((p) => p.id === parseInt(req.params.id));

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
  const user = null;
  res.render("addPost", { user });
});

app.post("/addPost", async (req, res, next) => {
  try {
    const { title, content, imageUrl } = req.body;
    const posts = await readPosts();

    const newPost = {
      id: posts.length > 0 ? posts[posts.length - 1].id + 1 : 1,
      title,
      content,
      imageUrl: imageUrl || null,
      date: new Date().toISOString(),
    };

    posts.push(newPost);
    await fs.promises.writeFile("posts.json", JSON.stringify(posts, null, 2));

    res.redirect("/");
  } catch (error) {
    next(error);
  }
});

app.get("/editPost/:id", async (req, res, next) => {
  try {
    const posts = await readPosts();
    const post = posts.find((p) => p.id === parseInt(req.params.id));

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
    const posts = await readPosts();
    const postIndex = posts.findIndex((p) => p.id === parseInt(req.params.id));

    if (postIndex === -1) {
      return res.status(404).render("error", {
        error: "Post not found",
        status: 404,
      });
    }

    posts[postIndex] = {
      ...posts[postIndex],
      title,
      content,
      imageUrl: imageUrl || null,
      date: new Date().toISOString(),
    };

    await fs.promises.writeFile("posts.json", JSON.stringify(posts, null, 2));
    res.redirect("/");
  } catch (error) {
    next(error);
  }
});

app.post("/deletePost/:id", async (req, res, next) => {
  try {
    const posts = await readPosts();
    const updatedPosts = posts.filter((p) => p.id !== parseInt(req.params.id));

    if (updatedPosts.length === posts.length) {
      return res.status(404).render("error", {
        error: "Post not found",
        status: 404,
      });
    }

    await fs.promises.writeFile(
      "posts.json",
      JSON.stringify(updatedPosts, null, 2)
    );
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
  console.log(`Press Ctrl+C to stop the server`);
});
