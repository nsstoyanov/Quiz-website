console.log("login.js loaded");
import { getUsers, setCurrentUser } from "./storage.js";

const form = document.getElementById("loginForm");
const errorEl = document.getElementById("error");
const loginBtn = document.getElementById("loginBtn");

document.getElementById("identifier").addEventListener("input", resetButton);
document.getElementById("password").addEventListener("input", resetButton);

function resetButton() {
  loginBtn.disabled = false;
  loginBtn.textContent = "Login";
  errorEl.textContent = "";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const identifier = document.getElementById("identifier").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  const users = getUsers();

  const user = users.find(u =>
  (u.email.toLowerCase() === identifier ||
   u.name.toLowerCase() === identifier) &&
   u.password === password);

  if (!user) {
    errorEl.textContent = "Wrong password or email/name";

    loginBtn.disabled = true;
    loginBtn.textContent = "Try again";

    return;
  }

    setCurrentUser(user);
    window.location.href = "quizzes.html";
});
