export function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

export function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

export function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

export function logout() {
  localStorage.removeItem("currentUser");
}
const QUIZ_KEY = "quizzes";

export function getQuizzes() {
  return JSON.parse(localStorage.getItem(QUIZ_KEY)) || [];
}

export function saveQuizzes(quizzes) {
  localStorage.setItem(QUIZ_KEY, JSON.stringify(quizzes));
}

export function getPublicQuizzes() {
  return getQuizzes().filter(q => q.isPublic);
}