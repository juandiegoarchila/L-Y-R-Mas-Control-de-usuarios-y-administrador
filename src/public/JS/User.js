function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const passwordIcon = document.getElementById(iconId);
  
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      passwordIcon.className = 'fas fa-eye-slash';
    } else {
      passwordInput.type = 'password';
      passwordIcon.className = 'fas fa-eye';
    }
  }
  