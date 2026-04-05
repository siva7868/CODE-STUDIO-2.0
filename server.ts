import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs-extra";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const JWT_SECRET = process.env.JWT_SECRET || "code-studio-secret-key";

// Ensure data directory and files exist
async function initData() {
  await fs.ensureDir(DATA_DIR);
  if (!(await fs.pathExists(USERS_FILE))) await fs.writeJson(USERS_FILE, []);
  if (!(await fs.pathExists(PROJECTS_FILE))) await fs.writeJson(PROJECTS_FILE, []);
}

initData();

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// --- Auth Routes ---

app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const users = await fs.readJson(USERS_FILE);
  if (users.find((u: any) => u.email === email)) {
    return res.status(400).json({ error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now().toString(), email, password: hashedPassword };
  users.push(newUser);
  await fs.writeJson(USERS_FILE, users);

  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: newUser.id, email: newUser.email } });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const users = await fs.readJson(USERS_FILE);
  const user = users.find((u: any) => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, email: user.email } });
});

app.get("/api/auth/me", authenticate, (req: any, res) => {
  res.json({ user: req.user });
});

// --- Project Routes ---

app.get("/api/projects", authenticate, async (req: any, res) => {
  const projects = await fs.readJson(PROJECTS_FILE);
  const userProjects = projects.filter((p: any) => p.userId === req.user.id);
  res.json(userProjects.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
});

app.post("/api/projects", authenticate, async (req: any, res) => {
  const projectData = req.body;
  const projects = await fs.readJson(PROJECTS_FILE);
  
  const index = projects.findIndex((p: any) => p.id === projectData.id);
  const now = new Date().toISOString();

  if (index !== -1) {
    // Update
    if (projects[index].userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
    projects[index] = { ...projects[index], ...projectData, updatedAt: now };
  } else {
    // Create
    const newProject = {
      ...projectData,
      id: projectData.id || `proj_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.id,
      createdAt: now,
      updatedAt: now
    };
    projects.push(newProject);
  }

  await fs.writeJson(PROJECTS_FILE, projects);
  res.json({ success: true });
});

app.delete("/api/projects/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  let projects = await fs.readJson(PROJECTS_FILE);
  
  const project = projects.find((p: any) => p.id === id);
  if (!project) return res.status(404).json({ error: "Not found" });
  if (project.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  projects = projects.filter((p: any) => p.id !== id);
  await fs.writeJson(PROJECTS_FILE, projects);
  res.json({ success: true });
});

// --- Vite Middleware ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
