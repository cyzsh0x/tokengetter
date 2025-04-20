require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const uuid = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration - simplified
const config = {
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
  endpoints: {
    b_graph: "https://b-graph.facebook.com",
    key: "https://b-api.facebook.com",
    business: "https://business.facebook.com"
  },
  oauthToken: "350685531728|62f8ce9f74b12f84c123cc23437a4a32"
};

// Error messages - simplified
const errorMessages = {
  DEFAULT: "An error occurred. Please try again."
};

class FacebookTokenService {
  constructor() {
    this.axios = axios.create({
      headers: {
        'User-Agent': config.userAgent
      }
    });
  }

  // Simplified token methods without simulated loading
  async getEaaauToken(email, password) {
    try {
      const response = await this.axios.post(
        `${config.endpoints.b_graph}/auth/login`,
        new URLSearchParams({
          email,
          password,
          // ... other required params
        }),
        {
          headers: {
            'authorization': `OAuth ${config.oauthToken}`,
            'content-type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return { token: response.data.access_token };
    } catch (error) {
      throw new Error(errorMessages.DEFAULT);
    }
  }

  async getEaagToken(cookies) {
    try {
      const response = await this.axios.get(
        `${config.endpoints.business}/content_management`,
        {
          headers: {
            'cookie': cookies,
            'user-agent': config.userAgent
          }
        }
      );
      const match = response.data.match(/EAAG\w+/);
      return { token: match ? match[0] : null };
    } catch (error) {
      throw new Error(errorMessages.DEFAULT);
    }
  }
}

// Routes - completely simplified
app.post('/token', async (req, res) => {
  try {
    const { email, password } = req.body;
    const service = new FacebookTokenService();
    const result = await service.getEaaauToken(email, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/eaag', async (req, res) => {
  try {
    const { cookies } = req.body;
    const service = new FacebookTokenService();
    const result = await service.getEaagToken(cookies);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Static file serving
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
