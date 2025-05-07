/**
 * File Upload Server
 * Handles multiple image and project file uploads for the portfolio website
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = 5000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static files from the current directory
app.use(express.static('.'));

// Ensure upload directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};
ensureDir('./uploads/images');
ensureDir('./uploads/projects');
ensureDir('./data');

// Data storage paths
const PROJECTS_FILE = './data/projects.json';
const PROFILE_FILE = './data/profile.json';

// Default profile data
const DEFAULT_PROFILE = {
  name: "John Doe",
  profession: "Web Developer",
  bio: "I'm a passionate web developer with over 5 years of experience in building responsive and user-friendly websites and applications.",
  email: "contact@example.com",
  github: "https://github.com/johndoe",
  instagram: "https://instagram.com/johndoe",
  youtube: "https://youtube.com/@johndoe",
  threads: "https://threads.net/@johndoe"
};

// Load data from disk
const loadData = (filePath, defaultData = []) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error loading data from ${filePath}:`, err);
  }
  return defaultData;
};

// Save data to disk
const saveData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error saving data to ${filePath}:`, err);
    return false;
  }
};

// Load projects from disk
const loadProjects = () => loadData(PROJECTS_FILE, []);

// Save projects to disk
const saveProjects = (projects) => saveData(PROJECTS_FILE, projects);

// Load profile from disk
const loadProfile = () => loadData(PROFILE_FILE, DEFAULT_PROFILE);

// Save profile to disk
const saveProfile = (profile) => saveData(PROFILE_FILE, profile);

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the destination folder based on file type
    const isImage = file.mimetype.startsWith('image/');
    const uploadDir = isImage ? './uploads/images/' : './uploads/projects/';
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Get original file extension
    const ext = path.extname(file.originalname);
    
    // Create a safe version of the original filename (remove unsafe characters)
    let safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '').replace(ext, '');
    
    // Use timestamp to avoid filename collisions while preserving the original name
    const timestamp = Date.now();
    
    // Store original filename in request object for potential use
    if (!req.originalFileNames) {
      req.originalFileNames = {};
    }
    
    // Create a unique filename based on the original name
    const uniqueFilename = `${safeOriginalName}_${timestamp}${ext}`;
    
    // Store mapping between unique filename and original filename
    req.originalFileNames[uniqueFilename] = file.originalname;
    
    cb(null, uniqueFilename);
  }
});

// Create multer upload middleware
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Endpoint for uploading multiple images
app.post('/upload/images', upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  
  // Return the paths to the uploaded files
  const uploadedFiles = req.files.map(file => {
    const filePath = '/' + file.path.replace(/\\/g, '/');
    return {
      filePath,
      fileName: file.originalname
    };
  });
  
  res.json({ 
    success: true, 
    files: uploadedFiles
  });
});

// Endpoint for uploading a single image
app.post('/upload/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Return the path to the uploaded file
  const filePath = '/' + req.file.path.replace(/\\/g, '/');
  res.json({ 
    success: true, 
    filePath: filePath,
    fileName: req.file.originalname
  });
});

// Endpoint for uploading multiple project files
app.post('/upload/projects', upload.array('projects', 50), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  
  // Return the paths to the uploaded files
  const uploadedFiles = req.files.map(file => {
    const filePath = '/' + file.path.replace(/\\/g, '/');
    return {
      filePath,
      fileName: file.originalname
    };
  });
  
  res.json({ 
    success: true, 
    files: uploadedFiles
  });
});

// Endpoint for uploading a single project file
app.post('/upload/project', upload.single('project'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Return the path to the uploaded file
  const filePath = '/' + req.file.path.replace(/\\/g, '/');
  res.json({ 
    success: true, 
    filePath: filePath,
    fileName: req.file.originalname
  });
});

// List all uploaded files
app.get('/uploads', (req, res) => {
  const imageFiles = fs.readdirSync('./uploads/images').map(file => '/uploads/images/' + file);
  const projectFiles = fs.readdirSync('./uploads/projects').map(file => '/uploads/projects/' + file);
  
  res.json({
    images: imageFiles,
    projects: projectFiles
  });
});

// API endpoints for projects
app.get('/api/projects', (req, res) => {
  const projects = loadProjects();
  res.json({
    success: true,
    projects: projects
  });
});

app.post('/api/projects', (req, res) => {
  if (!req.body || !req.body.projects || !Array.isArray(req.body.projects)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid projects data format. Expected array of projects.'
    });
  }
  
  const result = saveProjects(req.body.projects);
  
  res.json({
    success: result,
    message: result ? 'Projects saved successfully' : 'Failed to save projects'
  });
});

// API endpoints for profile
app.get('/api/profile', (req, res) => {
  const profile = loadProfile();
  res.json({
    success: true,
    profile: profile
  });
});

app.post('/api/profile', (req, res) => {
  if (!req.body || !req.body.profile || typeof req.body.profile !== 'object') {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid profile data format. Expected profile object.'
    });
  }
  
  const result = saveProfile(req.body.profile);
  
  res.json({
    success: result,
    message: result ? 'Profile saved successfully' : 'Failed to save profile'
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});