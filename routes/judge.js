const express = require('express');
const router = express.Router();
const axios = require("axios");
const dotenv = require('dotenv');

dotenv.config();

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

// languages available
router.get("/languages", async (req, res) => {
  try {
    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

// Create a submission
router.post("/submit_code", async (req, res) => {
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

// get a submission
router.get("/submit_code/:submissionId", async (req, res) => {
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


module.exports = router;