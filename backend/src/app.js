"use strict";

const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { Server: SocketIO } = require("socket.io");

const config = require("./config/env");
const apiRoutes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { securityHeaders } = require("./middleware/security");

const app = express();

app.use(securityHeaders);
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
if (config.env !== "test") {
  app.use(morgan(config.env === "development" ? "dev" : "combined"));
}

// Serve uploaded photos (foto profil & foto menu) secara statis
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    env: config.env,
    time: new Date().toISOString(),
  });
});

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

// ─── HTTP server + Socket.io ──────────────────────────────────────────────────
const httpServer = http.createServer(app);

const io = new SocketIO(httpServer, {
  cors: {
    origin: config.corsOrigin === "*" ? "*" : config.corsOrigin.split(","),
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[socket.io] client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[socket.io] client disconnected: ${socket.id}`);
  });
});

// Make io accessible to controllers via app.locals
app.locals.io = io;

module.exports = { app, httpServer, io };
