import { getUsers, saveUsers, setCurrentUser } from "./storage.js";

const form = document.getElementById("registerForm");
const errorEl = document.getElementById("error");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const repeatPassword = document.getElementById("repeatPassword").value;

  if (password.length < 6) {
    errorEl.textContent = "The password needs to atleast 6 symbols";
    return;
  }

  if (password !== repeatPassword) {
    errorEl.textContent = "Passwords dont match";
    return;
  }

  const users = getUsers();

  if(users.find(u => u.name.toLowerCase() === name)){
    errorEl.textContent = "This name already exist";
    return;
  }
  if (users.find(u => u.email.toLowerCase() === email)) {
    errorEl.textContent = "This email already exist";
    return;
  }

  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    password
  };

  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);

  window.location.href = "index.html";
});
