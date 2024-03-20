const express = require("express");
const cors = require("cors");
const axios = require("axios");
// const serveIndex = require('serve-index');
// const mysql = require("mysql");
const db = require("./config/database");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 3030;
const client = process.env.DATABASE_CLIENT || "sqlite3";

const rapidApiKey = process.env.X_RAPID_API_KEY;

// MySQL Connection
// const connection = mysql.createConnection({
//   host: process.env.MYSQL_HOST,
//   user: process.env.MYSQL_USER,
//   password: process.env.MYSQL_PASSWORD,
//   database: process.env.MYSQL_DATABASE,
// });

const options = {
  method: "GET",
  url: "https://judge0-ce.p.rapidapi.com/languages",
  headers: {
    "X-RapidAPI-Key": rapidApiKey,
    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
    "Access-Control-Allow-Origin": "*",
  },
};

// connection.connect((e) => {
//   if (e) {
//     console.log("Error connecting to MySQL: " + e.stack);
//     return;
//   }
//   console.log("Connected to MySQL as ID: " + connection.threadId);

//   // Check if table exists, if not, create it
//   connection.query(
//     `CREATE TABLE IF NOT EXISTS submissions (
//             id INT AUTO_INCREMENT PRIMARY KEY,
//             username VARCHAR(255),
//             code_language VARCHAR(255),
//             stdIn TEXT,
//             stdOut TEXT,
//             code TEXT,
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         )`,
//     (e, result) => {
//       if (e) throw e;
//       console.log("Table created or already exists");
//     }
//   );
// });

// Middleware
app.use(cors());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// GET Route
app.get("/api/data", (req, res) => {
  if (client === "mysql") {
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

// POST Route
app.post("/api/data", (req, res) => {
  const formData = req.body;
  // console.log("form: ", formData);
  if (client === "mysql") {
    db.query("INSERT INTO submissions SET ?", formData, (error) => {
      if (error) {
        console.error(error);
        return res
          .status(500)
          .json({ error: "An error occurred while adding data" });
      }
      res.send("Data added successfully!");
    });
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
    // Make the Axios request
    const response = await axios.request(options);
    // Send the response data from Axios to the client
    res.json(response.data);
  } catch (error) {
    // If there's an error, send an error response to the client
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

// Judge api to create a submission
app.post("/api/submit_code", async (req, res) => {
  try {
    const { language_id, source_code, stdin } = req.body;
    // console.log('lang: ', language_id);
    // console.log('stdin: ', stdin);
    // console.log('code: ', source_code);
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
    // console.log(response.data);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while submitting data" });
  }
});

// Judge api to get a submission
// token = 875bafc6-d321-42cd-98a1-b917e903b409
app.get("/api/submit_code/:submissionId", async (req, res) => {
  try {
    // Extract submissionId from the request parameters
    const { submissionId } = req.params;
    // console.log("sbID: ", submissionId);

    // Define Axios request options for GET request
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

    // Make the Axios request to fetch data
    const response = await axios.request(options);

    // Send the response data from Axios to the client
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

// app.use((req, res, next) => {
//     console.log('Time: ', Date.now());
//     next();
// })

// app.use('/request-type', (req, res, next) => {
//     console.log('request type: ', req.method);
//     next();
// });

// app.use('/public', express.static('public'));
// app.use('/public', serveIndex('public'));

// app.get('/', (req, res) => {
//     res.send('success.');
// });

app.listen(port, () =>
  console.log(`server is running on: http://localhost:${port}`)
);
