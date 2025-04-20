require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuration
const config = {
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
  endpoints: {
    b_graph: "https://b-graph.facebook.com",
    key: "https://b-api.facebook.com"
  },
  oauthToken: "350685531728|62f8ce9f74b12f84c123cc23437a4a32"
};

class FacebookTokenService {
  constructor() {
    this.axios = axios.create({
      headers: {
        'User-Agent': config.userAgent,
        'Accept-Language': 'en_US'
      }
    });
  }

  async getEaaauToken(email, password) {
    try {
      const headers = {
        'authorization': `OAuth ${config.oauthToken}`,
        'content-type': 'application/x-www-form-urlencoded'
      };

      const data = new URLSearchParams({
        email,
        password,
        'format': 'json',
        'credentials_type': 'password',
        'source': 'login',
        'generate_session_cookies': '0',
        'generate_machine_id': '0'
      });

      const response = await this.axios.post(
        `${config.endpoints.b_graph}/auth/login`,
        data,
        { headers }
      );

      if (response.data.access_token) {
        return { 
          success: true,
          token: response.data.access_token 
        };
      } else {
        return { 
          success: false,
          error: response.data.error?.message || 'Failed to get EAAAU token'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  async getEaad6v7Token(eaaauToken) {
    try {
      const url = `${config.endpoints.key}/method/auth.getSessionforApp?format=json&access_token=${eaaauToken}&new_app_id=275254692598279`;
      const response = await this.axios.get(url);

      if (response.data.access_token) {
        return {
          success: true,
          token: response.data.access_token
        };
      } else {
        return {
          success: false,
          error: response.data.error?.message || 'Failed to get EAAD6V7 token'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  async getBothTokens(email, password) {
    // Get EAAAU token first
    const eaaauResult = await this.getEaaauToken(email, password);
    if (!eaaauResult.success) {
      return {
        status: 400,
        error: eaaauResult.error || 'Failed to authenticate with Facebook'
      };
    }

    // Then get EAAD6V7 token
    const eaad6v7Result = await this.getEaad6v7Token(eaaauResult.token);
    if (!eaad6v7Result.success) {
      return {
        status: 400,
        error: eaad6v7Result.error || 'Failed to generate EAAD6V7 token',
        partialData: {
          EAAAU: eaaauResult.token
        }
      };
    }

    return {
      status: 200,
      data: {
        EAAAU: eaaauResult.token,
        EAAD6V7: eaad6v7Result.token,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Single endpoint
app.get('/get', async (req, res) => {
  try {
    const { u: username, pw: password } = req.query;
    
    if (!username || !password) {
      return res.status(400).json({
        status: 400,
        error: 'Both username and password parameters are required'
      });
    }

    const service = new FacebookTokenService();
    const result = await service.getBothTokens(username, password);

    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({
      status: 500,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});