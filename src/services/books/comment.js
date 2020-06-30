const express = require("express")
const path = require("path")
const uniqid = require("uniqid")
const { check, validationResult, sanitizeBody } = require("express-validator")
const fs = require("fs-extra")
const multer = require("multer")
const { join } = require("path")
const { readDB, writeDB , readComment ,writeComment} = require("../../utilities")
const { runInNewContext } = require("vm")

const bookJsonPath = path.join(__dirname,"books.json")
const commentJsonPath = path.join(__dirname,"comments.json")
const commentsRouter = express.Router()

commentsRouter.get("/", async (req, res, next) => {
  try {
    const data = await readComment(commentJsonPath)

    res.send({ numberOfItems: data.length, data })
  } catch (error) {
    console.log(error)
    const err = new Error("While getting comment list a problem occurred!")
    next(err)
  }
})

commentsRouter.get("/:id", async (req, res, next) => {
    try {
      const comments = await readComment(commentJsonPath)
      const comment = comments.find((b) => b.id === req.params.id)
      if (comment) {
        res.send(comment)
      } else {
        const error = new Error()
        error.httpStatusCode = 404
        next(error)
      }
    } catch (error) {
      console.log(error)
      next("While reading books list a problem occurred!")
    }
  })
  
  commentsRouter.post(
    "/",
    [
      check("rate").exists().withMessage("rate is required"),
      check("text").exists().withMessage("Category is required"),
      sanitizeBody("rate").toFloat(),
    ],
    async (req, res, next) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        const error = new Error()
        error.httpStatusCode = 400
        error.message = errors
        next(error)
      }
      try {
       const books = await readDB(bookJsonPath)
       const bookFound = books.find((book) => book.asin === req.body.asin)
       if(bookFound){
        const newComment = {...req.body , id:uniqid() , 
            createdAt : new Date(),
             updatedAt : new Date()
            }
                const comments = await readComment(commentJsonPath)
                 comments.push(newComment)
                 await writeComment(commentJsonPath, comments)
       }
       else{
           const err= new Error("Invalid asin")
           err.httpStatusCode = 400
           next(err)
       }
      } catch (error) {
        next(error)
      }
    }
  )
  
  commentsRouter.put("/:id", async (req, res, next) => {
    try {
      const books = await readComment(commentJsonPath)
      const book = books.find((b) => b.id === req.params.id)
      if (book) {
        const position = books.indexOf(book)
        const bookUpdated = { ...book, ...req.body } // In this way we can also implement the "patch" endpoint
        books[position] = bookUpdated
        await writeDB(commentJsonPath, books)
        res.status(200).send("Updated")
      } else {
        const error = new Error(`Book with id ${req.params.id} not found`)
        error.httpStatusCode = 404
        next(error)
      }
    } catch (error) {
      next(error)
    }
  })
  
  commentsRouter.delete("/:id", async (req, res, next) => {
    try {
      const books = await readComment(commentJsonPath)
      const book = books.find((b) => b.id === req.params.id)
      if (book) {
        await writeDB(
          commentJsonPath,
          books.filter((x) => x.id !== req.params.id)
        )
        res.send("Deleted")
      } else {
        const error = new Error(`Book with id ${req.params.id} not found`)
        error.httpStatusCode = 404
        next(error)
      }
    } catch (error) {
      next(error)
    }
  })
  


module.exports = commentsRouter
