// public/app.js
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();
  
  // Form elements
  const tokensForm = document.getElementById('tokens-form');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  
  const showLoading = (text = 'Processing...') => {
    loadingText.textContent = text;
    loadingText.classList.add('pulse');
    loadingOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };
  
  const hideLoading = () => {
    loadingText.classList.remove('pulse');
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
      const response = await fetch(`/get/token?u=${encodeURIComponent(email)}&p=${encodeURIComponent(password)}`);
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Tokens Retrieved Successfully!', `
          <div class="text-left space-y-4">
            <div>
              <h3 class="font-medium text-blue-400 mb-1">EAAAU Token</h3>
              <div class="bg-gray-800 p-3 rounded-lg font-mono text-sm relative">
                <button onclick="copyToClipboard('${data.tokens.eaaau}')" class="absolute top-2 right-2 text-gray-400 hover:text-white">
                  <i data-lucide="copy" class="w-4 h-4"></i>
                </button>
                ${data.tokens.eaaau}
              </div>
            </div>
            <div>
              <h3 class="font-medium text-purple-400 mb-1">EAAD6V7 Token</h3>
              <div class="bg-gray-800 p-3 rounded-lg font-mono text-sm relative">
                <button onclick="copyToClipboard('${data.tokens.eaad6v7 || ''}')" class="absolute top-2 right-2 text-gray-400 hover:text-white" ${!data.tokens.eaad6v7 ? 'disabled' : ''}>
                  <i data-lucide="copy" class="w-4 h-4"></i>
                </button>
                ${data.tokens.eaad6v7 || '<span class="text-red-400">Failed to generate</span>'}
              </div>
            </div>
            ${data.error ? `<p class="text-red-400">Note: ${data.error}</p>` : ''}
          </div>
        `);
      } else {
        showError(data.error || 'Failed to get tokens');
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