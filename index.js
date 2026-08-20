const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const dotenv = require("dotenv");
dotenv.config();
const app = express()
const port = process.env.PORT || 6028;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World from express server!')
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})