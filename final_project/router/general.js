const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js"); // Assuming books is an object
const public_users = express.Router();

// Simulate an asynchronous database function
const getBookByISBN = async (isbn) => {
  return books[isbn] || null;
};

// Register a new user
public_users.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const userExists = await axios.post('http://localhost:5000/checkUser', { username });
    if (userExists.data.exists) {
      return res.status(409).json({ message: "Username already exists" });
    }

    await axios.post('http://localhost:5000/addUser', { username, password });
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error registering user" });
  }
});

// Get the list of all books
public_users.get('/', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/books');
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching books" });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async (req, res) => {
  const isbn = req.params.isbn;
  try {
    const book = await getBookByISBN(isbn);
    if (book) {
      return res.status(200).json(book);
    } else {
      return res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching book by ISBN" });
  }
});

// Get book details based on author
public_users.get('/author/:author', async (req, res) => {
  const author = req.params.author;
  try {
    const booksByAuthor = Object.values(books).filter(book => book.author === author);
    if (booksByAuthor.length > 0) {
      return res.status(200).json(booksByAuthor);
    } else {
      return res.status(404).json({ message: "No books found for this author" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching books by author" });
  }
});

// Get book details based on title
public_users.get('/title/:title', async (req, res) => {
  const title = req.params.title.toLowerCase();
  try {
    const booksByTitle = Object.values(books).filter(book => book.title.toLowerCase().includes(title));
    if (booksByTitle.length > 0) {
      return res.status(200).json(booksByTitle);
    } else {
      return res.status(404).json({ message: "No books found with this title" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching books by title" });
  }
});

// Get book review based on ISBN
public_users.get('/review/:isbn', async (req, res) => {
  const isbn = req.params.isbn;
  try {
    const book = await getBookByISBN(isbn);
    if (book && book.reviews) {
      return res.status(200).json(book.reviews);
    } else {
      return res.status(404).json({ message: "Reviews not found for this book" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching reviews by ISBN" });
  }
});

module.exports.general = public_users;
