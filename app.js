require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// Middleware
app.use(helmet()); // Secure HTTP headers
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests

// Set allowed origins for CORS (restrict to known frontend URLs)
const allowedOrigins = ["http://localhost:3000"];
app.use((req, res, next) => {
	const origin = req.headers.origin;
	if (allowedOrigins.includes(origin)) {
		res.setHeader("Access-Control-Allow-Origin", origin);
	}
	res.setHeader("Access-Control-Allow-Methods", "POST");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization"
	);
	next();
});

// Rate Limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Google Apps Script Web App URL
const SCRIPT_URL = process.env.SCRIPT_URL || "";

console.log(SCRIPT_URL);

// Route for handling form submissions
app.post("/submit", async (req, res) => {
	try {
		// Forward the request to the Google Apps Script
		const response = await axios.post(SCRIPT_URL, req.body, {
			headers: { "Content-Type": "application/json" },
		});

		// Send the response back to the client
		res.status(response.status).send(response.data);
	} catch (error) {
		console.error("Error forwarding request:", error.message);
		if (error.response) {
			res.status(error.response.status).send(
				error.response.data || "Error occurred on the server."
			);
		} else if (error.request) {
			res.status(500).send("No response received from the server.");
		} else {
			res.status(500).send("Unexpected error: " + error.message);
		}
	}
});

// Start the server
const PORT = process.env.PORT || 4000; // Use environment variables in production
app.listen(PORT, () =>
	console.log(`Secure proxy server running on port ${PORT}`)
);
