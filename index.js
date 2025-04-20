require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
    key: "https://b-api.facebook.com",
    business: "https://business.facebook.com"
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
        'x-fb-friendly-name': 'Authenticate',
        'x-fb-connection-type': 'Unknown',
        'accept-encoding': 'gzip, deflate',
        'content-type': 'application/x-www-form-urlencoded',
        'x-fb-http-engine': 'Liger'
      };

      const data = new URLSearchParams({
        adid: this.generateRandomHex(16),
        format: 'json',
        device_id: uuidv4(),
        email: email,
        password: password,
        generate_analytics_claims: '0',
        credentials_type: 'password',
        source: 'login',
        error_detail_type: 'button_with_disabled',
        enroll_misauth: 'false',
        generate_session_cookies: '0',
        generate_machine_id: '0',
        fb_api_req_friendly_name: 'authenticate',
      });

      const response = await this.axios.post(
        `${config.endpoints.b_graph}/auth/login`,
        data,
        { headers }
      );

      if (response.data.access_token) {
        return { 
          success: true,
          token: response.data.access_token.trim()
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
      const url = `${config.endpoints.key}/method/auth.getSessionforApp?format=json&access_token=${eaaauToken.trim()}&new_app_id=275254692598279`;
      const response = await this.axios.get(url);

      if (response.data.access_token) {
        return {
          success: true,
          token: response.data.access_token.trim()
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

  generateRandomHex(length) {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Main endpoint
app.get('/get/token', async (req, res) => {
  try {
    const { u: username, p: password } = req.query;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Both username (u) and password (p) parameters are required'
      });
    }

    const service = new FacebookTokenService();
    
    // Get EAAAU token first
    const eaaauResult = await service.getEaaauToken(username, password);
    if (!eaaauResult.success) {
      return res.status(400).json({
        success: false,
        error: eaaauResult.error
      });
    }

    // Then get EAAD6V7 token
    const eaad6v7Result = await service.getEaad6v7Token(eaaauResult.token);
    
    if (!eaad6v7Result.success) {
      return res.json({
        success: true,
        tokens: {
          eaaau: eaaauResult.token,
          eaad6v7: null
        },
        error: eaad6v7Result.error
      });
    }

    res.json({
      success: true,
      tokens: {
        eaaau: eaaauResult.token,
        eaad6v7: eaad6v7Result.token
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
