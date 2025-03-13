// script.js


document.addEventListener('DOMContentLoaded', () => {
  const navbarBurger = document.querySelector('.navbar-burger');
  const navbarMenu = document.getElementById('navbarMenu');

  navbarBurger.addEventListener('click', () => {
    navbarBurger.classList.toggle('is-active');
    navbarMenu.classList.toggle('is-active');
  });
});
