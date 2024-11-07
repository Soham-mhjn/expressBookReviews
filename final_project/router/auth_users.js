const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  return !users.some(user => user.username === username);
};

// Check if username and password match the records
const authenticatedUser = (username, password) => {
  const user = users.find(user => user.username === username && user.password === password);
  return user !== undefined;
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (authenticatedUser(username, password)) {
    const token = jwt.sign({ username }, "fingerprint_customer", { expiresIn: '1h' }); // Replace with your actual secret key
    return res.status(200).json({ message: "Login successful", token });
  } else {
    return res.status(401).json({ message: "Invalid username or password" });
  }
});

// Add or update a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const { review } = req.body;
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, "fingerprint_customer"); // Replace with your actual secret key
    const username = decoded.username;

    if (!books[isbn]) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Add or update the review
    if (!books[isbn].reviews) {
      books[isbn].reviews = {};
    }
    books[isbn].reviews[username] = review;
    return res.status(200).json({ message: "Review added/updated successfully", reviews: books[isbn].reviews });
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const token = req.headers['authorization'];

  // Check if the user is authenticated
  if (!token) {
    return res.status(401).json({ message: "Unauthorized access. Please log in." });
  }

  // Decode the token to get the username
  let username;
  try {
    const decoded = jwt.verify(token, "fingerprint_customer"); // Replace "your_secret_key" with your actual secret key
    username = decoded.username;
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }

  // Check if the book exists
  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Check if the review exists
  if (!book.reviews[username]) {
    return res.status(404).json({ message: "Review not found for this user" });
  }

  // Delete the review
  delete book.reviews[username];
  return res.status(200).json({ message: "Review deleted successfully", reviews: book.reviews });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
