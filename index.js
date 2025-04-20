require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const uuid = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration
const config = {
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
  endpoints: {
    b_graph: "https://b-graph.facebook.com",
    key: "https://b-api.facebook.com",
    business: "https://business.facebook.com"
  },
  oauthToken: "350685531728|62f8ce9f74b12f84c123cc23437a4a32",
  requestTimeout: 10000
};

// Error messages
const errorMessages = {
  ACCOUNT_IN_CHECKPOINT: "Account is in checkpoint. Please resolve this on Facebook first.",
  WRONG_CREDENTIALS: "Invalid email or password.",
  ACCOUNT_NOT_EXIST: "Account doesn't exist.",
  REQUEST_LIMIT: "Request limit reached. Try again later or use a VPN.",
  MISSING_FIELDS: "Please fill all required fields.",
  DEFAULT: "An unexpected error occurred. Please try again."
};

class FacebookTokenService {
  constructor() {
    this.session = axios.create({
      timeout: config.requestTimeout,
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
        'content-type': 'application/x-www-form-urlencoded',
        'x-fb-http-engine': 'Liger'
      };
      
      const data = new URLSearchParams({
        'adid': Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10),
        'format': 'json',
        'device_id': uuid.v4(),
        'email': email,
        'password': password,
        'generate_analytics_claims': '0',
        'credentials_type': 'password',
        'source': 'login',
        'error_detail_type': 'button_with_disabled',
        'enroll_misauth': 'false',
        'generate_session_cookies': '0',
        'generate_machine_id': '0',
        'fb_api_req_friendly_name': 'authenticate',
      }).toString();
      
      const response = await this.session.post(
        `${config.endpoints.b_graph}/auth/login`,
        data,
        { headers }
      );
      
      if (response.data?.session_key) {
        return { 
          success: true,
          token: response.data.access_token 
        };
      }
      
      const error = response.data?.error?.message || 'Unknown error';
      return {
        success: false,
        error: error.includes('checkpoint') ? errorMessages.ACCOUNT_IN_CHECKPOINT : 
              error.includes('credentials') ? errorMessages.WRONG_CREDENTIALS :
              errorMessages.DEFAULT
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || errorMessages.DEFAULT
      };
    }
  }

  async getEaad6v7Token(eaaauToken) {
    try {
      const url = `${config.endpoints.key}/method/auth.getSessionforApp?format=json&access_token=${eaaauToken}&new_app_id=275254692598279`;
      const response = await this.session.get(url);
      
      if (response.data?.access_token) {
        return { 
          success: true,
          token: response.data.access_token 
        };
      }
      
      return {
        success: false,
        error: errorMessages.DEFAULT
      };
      
    } catch (error) {
      return {
        success: false,
        error: errorMessages.DEFAULT
      };
    }
  }

  async getEaagToken(cookies) {
    try {
      let cookieString = cookies;
      try {
        const cookieObj = JSON.parse(cookies);
        if (Array.isArray(cookieObj)) {
          cookieString = cookieObj.map(c => `${c.name}=${c.value}`).join('; ');
        }
      } catch {}
      
      const headers = {
        'authority': 'business.facebook.com',
        'cookie': cookieString,
        'referer': 'https://www.facebook.com/',
        'user-agent': config.userAgent
      };
      
      const response = await this.session.get(
        'https://business.facebook.com/content_management',
        { headers }
      );
      
      const text = response.data;
      if (text.includes('EAAG')) {
        const token = text.split('EAAG')[1].split('","')[0];
        return { 
          success: true,
          token: `EAAG${token}` 
        };
      }
      
      return {
        success: false,
        error: "EAAG token not found. Check if cookies are valid."
      };
      
    } catch (error) {
      return {
        success: false,
        error: errorMessages.DEFAULT
      };
    }
  }

  async getBothTokens(email, password) {
    const eaaauResult = await this.getEaaauToken(email, password);
    if (!eaaauResult.success) {
      return eaaauResult;
    }
    
    const eaad6v7Result = await this.getEaad6v7Token(eaaauResult.token);
    return {
      success: eaad6v7Result.success,
      eaaau: eaaauResult.token,
      eaad6v7: eaad6v7Result.token,
      error: eaad6v7Result.error
    };
  }
}

// API Routes
app.post('/api/token', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      error: errorMessages.MISSING_FIELDS
    });
  }

  const service = new FacebookTokenService();
  const result = await service.getBothTokens(email, password);
  res.json(result);
});

app.post('/api/eaag', async (req, res) => {
  const { cookies } = req.body;
  if (!cookies) {
    return res.status(400).json({ 
      success: false,
      error: errorMessages.MISSING_FIELDS
    });
  }

  const service = new FacebookTokenService();
  const result = await service.getEaagToken(cookies);
  res.json(result);
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ 
    success: false,
    error: errorMessages.DEFAULT
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
