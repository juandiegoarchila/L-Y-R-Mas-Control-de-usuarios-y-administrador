let MenuTogle = document.querySelector('.MenuTogle');
let sidebar = document.querySelector('.sidebar');
let main = document.querySelector('.main');

MenuTogle.onclick = function() {
    MenuTogle.classList.toggle('active');
    sidebar.classList.toggle('active');
    main.classList.toggle('active');
};

let Menulist = document.querySelectorAll('.Menulist li');

function activeLink() {
    Menulist.forEach((item) =>
        item.classList.remove('active'));
    this.classList.add('active');
}

Menulist.forEach((item) =>
    item.addEventListener('click', activeLink));

// Obtén la imagen, el nombre y la lista desplegable por sus identificadores
const profileImage = document.getElementById('profileImage');
const nameElement = document.querySelector('.dropbtn span'); // Modificado para seleccionar el elemento span dentro de .dropbtn
const dropdownContent = document.getElementById('dropdownContent');

// Agrega un controlador de eventos para hacer clic en la imagen o el nombre
function toggleDropdown() {
    // Mostrar u ocultar la lista desplegable
    dropdownContent.style.display = (dropdownContent.style.display === 'block') ? 'none' : 'block';
}

// Agrega un controlador de eventos para hacer clic en la imagen
profileImage.addEventListener('click', (event) => {
    // Prevenir que el evento de clic se propague al cuerpo del documento
    event.stopPropagation();

    // Mostrar u ocultar la lista desplegable
    toggleDropdown();
});

// Agrega un controlador de eventos para hacer clic en el nombre
nameElement.addEventListener('click', (event) => {
    // Prevenir que el evento de clic se propague al cuerpo del documento
    event.stopPropagation();

    // Mostrar u ocultar la lista desplegable
    toggleDropdown();
});

// Agrega un controlador de eventos al cuerpo del documento para ocultar la lista desplegable cuando se haga clic en cualquier otro lugar
document.body.addEventListener('click', () => {
    dropdownContent.style.display = 'none';
});

// Agrega un controlador de eventos para evitar que el clic en la lista desplegable se propague al cuerpo del documento
dropdownContent.addEventListener('click', (event) => {
    event.stopPropagation();
});
