import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    // origin: "*",
    // methods: ["GET", "POST", "PUT", "DELETE"],
    // allowedHeaders: ["Content-Type", "Authorization"],
  })
);

//getting jason data from the request body and limiting the size of the request body to 16kb
app.use(
  express.json({
    limit: "16kb",
  })
);
// getting url encoded data from the request body and limiting the size of the request body to 16kb
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// creating a static file server to serve the files in the public directory
app.use(express.static("public"));

export default app;
