const express = require("express");
const path = require("path");
const fs = require("fs");

const promClient = require("prom-client");

const { pool, initDb } = require("./db");

const app = express();
const port = process.env.PORT || 8000;

const logPath = process.env.APP_LOG_PATH || "";
const logLevel = (process.env.LOG_LEVEL || "INFO").toUpperCase();

function writeLog(level, message) {
  const line = `${new Date().toISOString()} ${level} ${message}\n`;
  process.stdout.write(line);
  if (logPath) {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFile(logPath, line, () => { });
  }
}

function logInfo(message) {
  if (logLevel === "INFO" || logLevel === "DEBUG") {
    writeLog("INFO", message);
  }
}

function logError(message) {
  writeLog("ERROR", message);
}

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const ticketsCreated = new promClient.Counter({
  name: "helpdesk_tickets_created_total",
  help: "Total number of created tickets",
  registers: [register],
});

const ticketCreationDuration = new promClient.Histogram({
  name: "helpdesk_ticket_creation_duration_seconds",
  help: "Duration of ticket creation in seconds",
  labelNames: ["status"],
  registers: [register],
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));

app.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, description, status, created_at FROM tickets ORDER BY id DESC"
    );
    const tickets = result.rows.map((ticket) => ({
      ...ticket,
      created_at: ticket.created_at
        ? new Date(ticket.created_at)
          .toISOString()
          .slice(0, 16)
          .replace("T", " ")
        : "",
    }));
    res.render("index", { tickets });
  } catch (err) {
    logError(`list_tickets_failed error=${err.message}`);
    res.status(500).send("Failed to load tickets");
  }
});

app.get("/new", (_req, res) => {
  res.render("new");
});

app.post("/tickets", async (req, res) => {
  const { title, description = "" } = req.body;
  if (!title) {
    return res.status(400).send("Title is required");
  }

  try {
    const end = ticketCreationDuration.startTimer();
    const result = await pool.query(
      "INSERT INTO tickets (title, description, status) VALUES ($1, $2, $3) RETURNING id",
      [title, description, "open"]
    );
    const ticketId = result.rows[0]?.id;
    ticketsCreated.inc();
    end();
    logInfo(`ticket_created id=${ticketId}`);
    return res.redirect("/");
  } catch (err) {
    logError(`create_ticket_failed error=${err.message}`);
    return res.status(500).send("Failed to create ticket");
  }
});

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

async function start() {
  const maxAttempts = 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await initDb();
      logInfo("db_ready");
      break;
    } catch (err) {
      logError(`init_db_failed attempt=${attempt} error=${err.message}`);
      if (attempt === maxAttempts) {
        logError("db_init_exhausted");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  app.listen(port, () => {
    logInfo(`server_started port=${port}`);
  });
}

start();
