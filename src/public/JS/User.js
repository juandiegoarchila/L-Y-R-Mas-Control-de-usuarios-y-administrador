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

  // script para manejar la previsualización de la imagen
  function handleImageChange(input) {
    const previewImage = document.getElementById('previewImage');

    if (input.files && input.files[0]) {
      const reader = new FileReader();

      reader.onload = function (e) {
        previewImage.src = e.target.result;
      };

      reader.readAsDataURL(input.files[0]);
    }
  }