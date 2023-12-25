const cors = require('cors')
require('dotenv/config')
const express = require('express')
const connectDB = require('./connectDB.js')
const Book = require('./models/books.js')
const multer = require('multer')
const fs = require('fs');

const app = express()
const PORT = process.env.PORT || 8000
connectDB()
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use("/uploads", express.static("uploads"))

app.get("/api/books", async (req, res) => {
  try {
    const category = req.query.category
    const filter = {}
    if (category) {
      filter.category = { $in: [category] };
    }

    const data = await Book.find(filter)
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: "an error fetching books" })
  }
})


app.get("/api/books/:slug", async (req, res) => {
  try {
    const slugParam = req.params.slug

    const data = await Book.findOne({ slug: slugParam })
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: "an error fetching books" })
  }
})



// Create A Book
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
})
const upload = multer({ storage: storage })

app.post("/api/books", upload.single("thumbnail"), async (req, res) => {
  try {
    const newBook = new Book({
      title: req.body.title,
      slug: req.body.slug,
      stars: req.body.stars,
      description: req.body.description,
      category: req.body.category.split(","),
      thumbnail: req.file.filename,
    })
    await Book.create(newBook);
    res.status(200).json("Data Submitted");
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: "An error occurred while fetching books." });
  }
});


// Update A Book
app.put("/api/books", upload.single("thumbnail"), async (req, res) => {
  try {

    const bookId = req.body.bookId;

    const updateBook = {
      title: req.body.title,
      slug: req.body.slug,
      stars: req.body.stars,
      description: req.body.description,
      category: req.body.category.split(","),
    }

    if (req.file) {
      updateBook.thumbnail = req.file.filename;
    }

    await Book.findByIdAndUpdate(bookId, updateBook)
    res.json("Data Submitted");
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching books." });
  }
});




app.delete("/api/books/:id", async (req, res) => {
  const bookId = req.params.id;

  try {

    const book = await Book.findById(bookId);
    const filePath = `uploads/${book.thumbnail}`;

    // Use unlink to delete the file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${err.message}`);
      } else {
        console.log('File deleted successfully');
      }
    });

    await Book.deleteOne({_id: bookId});
    res.status(200).json("How dare you!" + req.body.bookId);

  } catch (error) {
    res.status(400).json(error);
  }
});


app.get("/", (req, res) => {
  res.json("hi there")
})

app.listen(PORT, () => {
  console.log(`server is running on port: ${PORT} `)
})
