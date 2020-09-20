const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const Joi = require("joi");
var cors = require("cors");

const { getDB, connect, getPrimaryKey } = require("./db");
const collection = "todo";
const app = express();

app.use(cors()); // Use this after the variable declaration

// schema used for data validation for our todo document
const schema = Joi.object().keys({
  title: Joi.string().required(),
});

// parses json data sent to us by the user
app.use(bodyParser.json());

// serve static html file to user(path.join(__dirname,'index.html'));
app.get("/", (req, res) => {
  res.status(200).json({ success: true });
});

// read
app.get("/todos", (req, res) => {
  // get all Todo documents within our todo collection
  // send back to user as json
  getDB()
    .collection(collection)
    .find({})
    .toArray((err, documents) => {
      if (err) console.log(err);
      else {
        res.status(200).json({
          success: true,
          data: documents,
        });
      }
    });
});

// update
app.put("/todos/:id", (req, res) => {
  // Primary Key of Todo Document we wish to update
  const todoID = req.params.id;
  // Document used to update
  const userInput = req.body;
  // Find Document By ID and Update
  getDB()
    .collection(collection)
    .findOneAndUpdate(
      { _id: getPrimaryKey(todoID) },
      { $set: { title: userInput.title } },
      { returnOriginal: false },
      (err, result) => {
        if (err) console.log(err);
        else {
          res.status(200).json({
            success: true,
            data: result,
          });
        }
      }
    );
});

//create
app.post("/todos", (req, res, next) => {
  // Document to be inserted
  const userInput = req.body;

  // Validate document
  // If document is invalid pass to error middleware
  // else insert document within todo collection
  //   Joi.validate(userInput, schema, (err, result) => {
  //     if (err) {
  //       const error = new Error("Invalid Input");
  //       error.status = 400;
  //       next(error);
  //     } else {
  getDB()
    .collection(collection)
    .insertOne(userInput, (err, result) => {
      if (err) {
        const error = new Error("Failed to insert Todo Document");
        error.status = 400;
        next(error);
      } else {
        res.status(200).json({
          result: result,
          document: result.ops[0],
          msg: "Successfully inserted Todo!!!",
          error: null,
        });
      }
    });
});
// });

//delete
app.delete("/todos/:id", (req, res) => {
  // Primary Key of Todo Document
  const todoID = req.params.id;
  // Find Document By ID and delete document from record
  getDB()
    .collection(collection)
    .findOneAndDelete({ _id: getPrimaryKey(todoID) }, (err, result) => {
      if (err) console.log(err);
      else res.status(200).json(result);
    });
});

// Middleware for handling Error
// Sends Error Response Back to User
app.use((err, req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "1800");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "PUT, POST, GET, DELETE, PATCH, OPTIONS"
  );
  // res.setHeader("Content-Type", "application/json;charset=utf-8"); // Opening this comment will cause problems
  res.status(err.status | 500).json({
    error: {
      message: err.message,
    },
  });
});

//Connect to the db
connect((err) => {
  // If err unable to connect to database
  // End application
  if (err) {
    console.log("unable to connect to database");
    process.exit(1);
  }
  // Successfully connected to database
  // Start up our Express Application
  // And listen for Request
  else {
    app.listen(3000, () => {
      console.log("connected to database, app listening on port 3000");
    });
  }
});
