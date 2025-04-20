// public/app.js
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();
  
  // Tab switching
  const loginTabBtn = document.getElementById('login-tab-btn');
  const cookiesTabBtn = document.getElementById('cookies-tab-btn');
  const loginTab = document.getElementById('login-tab');
  const cookiesTab = document.getElementById('cookies-tab');
  
  loginTabBtn.addEventListener('click', () => {
    loginTabBtn.classList.add('active');
    cookiesTabBtn.classList.remove('active');
    loginTab.classList.remove('hidden');
    loginTab.classList.add('active');
    cookiesTab.classList.add('hidden');
    cookiesTab.classList.remove('active');
  });
  
  cookiesTabBtn.addEventListener('click', () => {
    cookiesTabBtn.classList.add('active');
    loginTabBtn.classList.remove('active');
    cookiesTab.classList.remove('hidden');
    cookiesTab.classList.add('active');
    loginTab.classList.add('hidden');
    loginTab.classList.remove('active');
  });
  
  // Form submissions
  const tokensForm = document.getElementById('tokens-form');
  const cookiesForm = document.getElementById('cookies-form');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  
  const showLoading = (text = 'Processing...') => {
    loadingText.textContent = text;
    loadingOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };
  
  const hideLoading = () => {
    loadingOverlay.classList.add('hidden');
    document.body.style.overflow = 'auto';
  };
  
  const showSuccess = (title, html) => {
    Swal.fire({
      title,
      html,
      icon: 'success',
      background: '#1E293B',
      color: '#E2E8F0',
      confirmButtonColor: '#3B82F6',
      backdrop: 'rgba(0, 0, 0, 0.7)'
    });
  };
  
  const showError = (error) => {
    Swal.fire({
      title: 'Error',
      text: error,
      icon: 'error',
      background: '#1E293B',
      color: '#E2E8F0',
      confirmButtonColor: '#3B82F6',
      backdrop: 'rgba(0, 0, 0, 0.7)'
    });
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      Swal.fire({
        title: 'Copied!',
        text: 'Token copied to clipboard',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#1E293B',
        color: '#E2E8F0'
      });
    });
  };
  
  tokensForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    showLoading('Authenticating with Facebook...');
    
    try {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Tokens Retrieved Successfully!', `
          <div class="text-left space-y-4">
            <div>
              <h3 class="font-medium text-blue-400 mb-1">EAAAAU Token</h3>
              <div class="bg-gray-800 p-3 rounded-lg font-mono text-sm relative">
                <button onclick="copyToClipboard('${data.eaaau}')" class="absolute top-2 right-2 text-gray-400 hover:text-white">
                  <i data-lucide="copy" class="w-4 h-4"></i>
                </button>
                ${data.eaaau}
              </div>
            </div>
            <div>
              <h3 class="font-medium text-purple-400 mb-1">EAAD6V7 Token</h3>
              <div class="bg-gray-800 p-3 rounded-lg font-mono text-sm relative">
                <button onclick="copyToClipboard('${data.eaad6v7}')" class="absolute top-2 right-2 text-gray-400 hover:text-white">
                  <i data-lucide="copy" class="w-4 h-4"></i>
                </button>
                ${data.eaad6v7}
              </div>
            </div>
          </div>
        `);
      } else {
        showError(data.error);
      }
    } catch (error) {
      showError('Network error. Please try again.');
    } finally {
      hideLoading();
    }
  });
  
  cookiesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cookies = document.getElementById('cookies').value;
    
    showLoading('Extracting EAAG Token...');
    
    try {
      const response = await fetch('/api/eaag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cookies })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('EAAG Token Extracted!', `
          <div class="text-left">
            <div class="bg-gray-800 p-3 rounded-lg font-mono text-sm relative">
              <button onclick="copyToClipboard('${data.token}')" class="absolute top-2 right-2 text-gray-400 hover:text-white">
                <i data-lucide="copy" class="w-4 h-4"></i>
              </button>
              ${data.token}
            </div>
          </div>
        `);
      } else {
        showError(data.error);
      }
    } catch (error) {
      showError('Network error. Please try again.');
    } finally {
      hideLoading();
    }
  });
  
  // Expose copy function to global scope for SweetAlert buttons
  window.copyToClipboard = copyToClipboard;
});
