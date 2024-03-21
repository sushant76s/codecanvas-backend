const express = require("express");
const cors = require("cors");
const axios = require("axios");
const db = require("./config/database");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 3030;
const dbClient = process.env.DATABASE_CLIENT || "sqlite3";

const rapidApiKey = process.env.X_RAPID_API_KEY;


const options = {
  method: "GET",
  url: "https://judge0-ce.p.rapidapi.com/languages",
  headers: {
    "X-RapidAPI-Key": rapidApiKey,
    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
    "Access-Control-Allow-Origin": "*",
  },
};


// Middleware
app.use(cors());
app.use(bodyParser.json());


// GET Route to ensure server is running or not from frontend
app.get('/api/server-check', (req, res) => {
  try{
    res.status(200).json({status: true, message: "server is running!" });
  } catch (error) {
    console.error("Something went wrong!");
    res.status(500).json({status: false, message: "oops server is not running :(" });
  }
})

// GET Route to access all the entries
app.get("/api/data", (req, res) => {
  if (dbClient === "mysql" || dbClient === "postgresql") {
    db.query("SELECT * FROM submissions", (error, result) => {
      if (error) {
        console.error(error);
        return res
          .status(500)
          .json({ error: "An error occurred while fetching data" });
      }
      res.json(result);
    });
  } else {
    db.all("SELECT * FROM submissions", (error, rows) => {
      if (error) {
        console.error(error);
        return res
          .status(500)
          .json({ error: "An error occurred while fetching data" });
      }
      res.json(rows);
    });
  }
});

// POST Route to insert an entry
app.post("/api/data", (req, res) => {
  const formData = req.body;
  if (dbClient === "mysql") {
    db.query("INSERT INTO submissions SET ?", formData, (error) => {
      if (error) {
        console.error(error);
        return res
          .status(500)
          .json({ error: "An error occurred while adding data" });
      }
      res.send("Data added successfully!");
    });
  } else if (dbClient === "postgresql") {
    db.query(
      "INSERT INTO submissions (username, code_language, stdIn, stdOut, code) VALUES ($1, $2, $3, $4, $5)",
      [
        formData.username,
        formData.code_language,
        formData.stdIn,
        formData.stdOut,
        formData.code,
      ],
      (err) => {
        if (err) {
          console.error("Error inserting data into PostgreSQL:", err);
          return res
            .status(500)
            .json({ error: "An error occurred while adding data" });
        }
        res.send("Data added successfully!");
      }
    );
  } else {
    db.run(
      "INSERT INTO submissions (username, code_language, stdIn, stdOut, code) VALUES (?, ?, ?, ?, ?)",
      [
        formData.username,
        formData.code_language,
        formData.stdIn,
        formData.stdOut,
        formData.code,
      ],
      (error) => {
        if (error) {
          console.error(error);
          return res
            .status(500)
            .json({ error: "An error occurred while adding data" });
        }
        res.send("Data added successfully!");
      }
    );
  }
});

// Judge api to get all the languages
app.get("/api/languages", async (req, res) => {
  try {
    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

// Judge api to create a submission
app.post("/api/submit_code", async (req, res) => {
  try {
    const { language_id, source_code, stdin } = req.body;
    if (!language_id || !source_code) {
      return res
        .status(400)
        .json({ error: "Missing required data: code or language_id" });
    }

    const options2 = {
      method: "POST",
      url: "https://judge0-ce.p.rapidapi.com/submissions",
      params: {
        base64_encoded: "false",
        fields: "*",
      },
      headers: {
        "content-type": "application/json",
        "Content-Type": "application/json",
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "Access-Control-Allow-Origin": "*",
      },
      data: {
        language_id,
        source_code,
        stdin,
      },
    };

    const response = await axios.request(options2);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while submitting data" });
  }
});

// Judge api to get a submission
app.get("/api/submit_code/:submissionId", async (req, res) => {
  try {
    const { submissionId } = req.params;
    const options = {
      method: "GET",
      url: `https://judge0-ce.p.rapidapi.com/submissions/${submissionId}`,
      params: {
        base64_encoded: "false",
        fields: "*",
      },
      headers: {
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "Access-Control-Allow-Origin": "*",
      },
    };

    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

app.listen(port, () =>
  console.log(`server is running on: http://localhost:${port}`)
);
