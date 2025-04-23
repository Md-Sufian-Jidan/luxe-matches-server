const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.port || 5000;

//middlewares
app.use(cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true
  }));
  app.use(express.json());

app.get('/', (req, res) => {
    res.send('LuxeMatches is loving');
  });
  
  app.listen(port, () => {
    console.log(`server is running on ${port}`);
  });