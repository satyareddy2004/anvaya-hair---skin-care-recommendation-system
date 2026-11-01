const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `${timestamp}-${Math.round(Math.random() * 1E9)}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only .jpg, .jpeg, and .png files are allowed!'));
        }
    }
});

// Ensure uploads directory exists
const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory:', uploadDir);
}

// Upload route
router.post('/', upload.single('photo'), (req, res) => {
    try {
        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        console.log('File uploaded:', req.file.path);
        const relativePath = path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');
        res.json({ success: true, filePath: relativePath });
    } catch (error) {
        console.error('Upload error:', error.message);
        res.status(500).json({ success: false, error: 'Upload failed', details: error.message });
    }
});

module.exports = router;