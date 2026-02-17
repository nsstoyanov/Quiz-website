import { getPublicQuizzes } from "../storage.js";

let activeQuiz = null;
let players = [];
let currentQuestionIndex = 0;
let questionTimer = null;
let selectedAnswers = [];
const QUESTION_TIME = 15;
let score = 0;
let questionStartTime = 0;
let currentPlayer = null;


document.addEventListener("DOMContentLoaded", () => {
  const solveBtn = document.getElementById("solveBtn");
  const solveMenu = document.getElementById("solveMenu");

  const filterPublic = document.getElementById("filterPublic");
  const filterMy = document.getElementById("filterMy");

  const publicSection = document.getElementById("publicSection");
  const mySection = document.getElementById("mySection");

  if (publicSection && mySection) {
    publicSection.style.display = "block";
    mySection.style.display = "none";
  }

  solveBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    solveMenu?.classList.toggle("hidden");
      solveBtn.classList.add("active");
  });

  document.addEventListener("click", () => {
    solveMenu?.classList.add("hidden");
  });

  solveMenu?.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  filterPublic?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    window.showView?.("solve");          
    window.renderSolveView?.();          

    filterPublic.classList.add("active");
    filterMy.classList.remove("active");

    publicSection.style.display = "block";
    mySection.style.display = "none";

    solveMenu.classList.add("hidden");
    solveBtn.classList.add("active");
  });

  filterMy?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    window.showView?.("solve");
    window.renderSolveView?.();

    filterMy.classList.add("active");
    filterPublic.classList.remove("active");

    publicSection.style.display = "none";
    mySection.style.display = "block";

    solveMenu.classList.add("hidden");
    solveBtn.classList.add("active");
  });
});

window.renderSolveView = function () {
  const publicList = document.getElementById("publicQuizList");
  const myList = document.getElementById("myQuizList");

  if (!publicList || !myList) return;

  publicList.innerHTML = "";
  myList.innerHTML = "";

  const quizzes = JSON.parse(localStorage.getItem("quizzes")) || [];
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  quizzes.forEach((quiz) => {
    if (quiz.isPublic) {
      const publicCard = buildQuizCard(quiz,"public");
      publicList.appendChild(publicCard);
    }

    if (currentUser && quiz.creatorId === currentUser.id) {
      const myCard = buildQuizCard(quiz,"my");
      myList.appendChild(myCard);
    }
  });
};


function buildQuizCard(quiz, context) {
  const card = document.createElement("div");
  card.className = "quiz-card";

  card.innerHTML = `
    <div class="quiz-title">${quiz.title}</div>
    <div class="quiz-meta">by ${quiz.creatorName}</div>
    <div class="quiz-card-actions"></div>
  `;

  card.addEventListener("click", () => openLobby(quiz));

  const actions = card.querySelector(".quiz-card-actions");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (context === "public") {
    if (quiz.creatorId !== currentUser?.id) {
      const downloadBtn = document.createElement("button");
      downloadBtn.className = "quiz-action-btn download-btn";
      downloadBtn.textContent = "⬇ Download";

      downloadBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        downloadQuiz(quiz);
      });

      actions.appendChild(downloadBtn);
    }
  }

  if (context === "my") {
    const editBtn = document.createElement("button");
    editBtn.className = "quiz-action-btn edit-btn";
    editBtn.textContent = "✏ Edit";

    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditQuiz(quiz);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "quiz-action-btn delete-btn";
    deleteBtn.textContent = "🗑 Delete";

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteQuiz(quiz.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
  }

  return card;
}

function downloadQuiz(quiz) {
  const quizzes = JSON.parse(localStorage.getItem("quizzes")) || [];
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const copiedQuiz = {
    ...quiz,
    id: crypto.randomUUID(),        
    creatorId: currentUser.id,      
    creatorName: quiz.creatorName,  
    isPublic: false               
  };

  quizzes.push(copiedQuiz);
  localStorage.setItem("quizzes", JSON.stringify(quizzes));

  renderSolveView(); 
}

function openEditQuiz(quiz) {
  localStorage.setItem("editingQuiz", JSON.stringify(structuredClone(quiz)));
  showView("edit");

}

function deleteQuiz(quizId) {
  if (!confirm("Are you sure you want to delete this quiz?")) return;

  let quizzes = JSON.parse(localStorage.getItem("quizzes")) || [];
  quizzes = quizzes.filter((q) => q.id !== quizId);

  localStorage.setItem("quizzes", JSON.stringify(quizzes));
  window.renderSolveView?.();
}



function showSolveScreen(screenId) {
  document.querySelectorAll(".solve-screen").forEach(s =>
    s.classList.add("hidden")
  );
  document.getElementById(screenId)?.classList.remove("hidden");
}

function openLobby(quiz) {
  activeQuiz = quiz;
  players = [];
  score = 0;

  showSolveScreen("solveLobby");

  document.getElementById("lobbyQuizTitle").textContent = quiz.title;
  document.getElementById("lobbyQuizMeta").textContent =
    `by ${quiz.creatorName} • ${quiz.questions.length} questions`;

  renderPlayers();
}
document.getElementById("backToSolveListBtn")?.addEventListener("click", () => {
  resetSolveState();
});

document.getElementById("joinGameBtn")?.addEventListener("click", () => {
  const input = document.getElementById("playerNameInput");
  const name = input.value.trim();

  if (!name) {
    showLobbyError("Enter your name");
    return;
  }

  if (currentPlayer) {
    showLobbyError("You already joined");
    return;
  }

  currentPlayer = name;
  players = [name]; 

  input.value = "";
  input.disabled = true;
  document.getElementById("joinGameBtn").disabled = true;

  clearLobbyError();
  renderPlayers();
});


function showLobbyError(msg) {
  const el = document.getElementById("lobbyError");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearLobbyError() {
  const el = document.getElementById("lobbyError");
  if (!el) return;
  el.classList.add("hidden");
}

function renderPlayers() {
  const list = document.getElementById("playerList");
  if (!list) return;

  list.innerHTML = "";
  players.forEach(p => {
    const span = document.createElement("span");
    span.textContent = p;
    list.appendChild(span);
  });
}

document.getElementById("startGameBtn")?.addEventListener("click", () => {
  if (players.length === 0) {
    showLobbyError("Add at least one player to start");
    return;
  }

  startCountdown();
});

document.getElementById("backToSolveBtn")?.addEventListener("click", () => {
  resetSolveState();
});

function startCountdown() {
  document.body.classList.add("game-mode"); 

  showSolveScreen("solveCountdown");

  document.getElementById("countdownQuizTitle").textContent =
    activeQuiz.title;

  let count = 3;
  const el = document.getElementById("countdownNumber");
  el.textContent = count;

  const interval = setInterval(() => {
    count--;

    if (count === 0) {
      clearInterval(interval);
      goToFirstQuestion();
      return;
    }

    el.textContent = count;
    el.style.animation = "none";
    el.offsetHeight;
    el.style.animation = null;
  }, 1000);
}


function goToFirstQuestion() {
  currentQuestionIndex = 0;
  showQuestion();
}

function startTimer() {
  clearInterval(questionTimer);

  questionStartTime = Date.now(); 

  const fill = document.getElementById("timerFill");
  fill.style.transition = "none";
  fill.style.width = "100%";

  requestAnimationFrame(() => {
    fill.style.transition = `width ${QUESTION_TIME}s linear`;
    fill.style.width = "0%";
  });

  questionTimer = setTimeout(() => {
    handleAnswerSelection(-1); 
  }, QUESTION_TIME * 1000);
}

function calculatePoints() {
  const elapsed = (Date.now() - questionStartTime) / 1000;
  const remaining = Math.max(0, QUESTION_TIME - elapsed);
  return Math.round((remaining / QUESTION_TIME) * 1000);
}

function showQuestion() {
  showSolveScreen("solveQuestion");

  const question = activeQuiz.questions[currentQuestionIndex];

  document.getElementById("questionText").textContent = question.text;

  const img = document.getElementById("questionImage");

  if (question.image && question.image.trim() !== "") {
    img.src = question.image;
    img.onload = () => img.classList.remove("hidden");
    img.onerror = () => {
      img.classList.add("hidden");
      img.src = "";
    };
  } else {
    img.classList.add("hidden");
    img.src = "";
  }

  const grid = document.getElementById("answersGrid");
  grid.className = "answers-grid";

  renderAnswers(question);
  startTimer();
}


function renderAnswers(question) {
  const grid = document.getElementById("answersGrid");
  grid.innerHTML = "";

  selectedAnswers = [];

  if (question.type === "boolean") {
    renderBooleanAnswers(question);
    return;
  }

  if (question.type === "multiple") {
    renderMultipleAnswers(question);
    return;
  }

  question.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = option.text;
    btn.style.background = getAnswerColor(index);

    btn.addEventListener("click", () => {
      handleAnswerSelection(index);
    });

    grid.appendChild(btn);
  });
}


function renderBooleanAnswers(question) {
  const grid = document.getElementById("answersGrid");
  grid.classList.add("boolean-grid");

  const labels = ["True", "False"];

  labels.forEach((label, index) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn boolean-btn";
    btn.textContent = label;

    btn.style.background =
      label === "True" ? "#2ecc71" : "#e74c3c";

    btn.addEventListener("click", () => {
      handleAnswerSelection(index);
    });

    grid.appendChild(btn);
  });
}
function renderMultipleAnswers(question) {
  const grid = document.getElementById("answersGrid");

  question.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn multi-btn";
    btn.textContent = option.text;
    btn.style.background = getAnswerColor(index);

    btn.addEventListener("click", () => {
      toggleMultiAnswer(btn, index);
    });

    grid.appendChild(btn);
  });

  addSubmitButton();
}

function toggleMultiAnswer(button, index) {
  if (selectedAnswers.includes(index)) {
    selectedAnswers = selectedAnswers.filter(i => i !== index);
    button.classList.remove("selected");
  } else {
    selectedAnswers.push(index);
    button.classList.add("selected");
  }
}

function addSubmitButton() {
  const grid = document.getElementById("answersGrid");

  const submit = document.createElement("button");
  submit.textContent = "Submit";
  submit.className = "submit-btn";

  submit.addEventListener("click", submitMultipleAnswer);

  grid.appendChild(submit);
}
function submitMultipleAnswer() {
  clearInterval(questionTimer);

  const question = activeQuiz.questions[currentQuestionIndex];
  const buttons = document.querySelectorAll(".multi-btn");

  let allCorrect = true;

  buttons.forEach((btn, index) => {
    btn.disabled = true;

    const isCorrect = question.options[index].correct;
    const isSelected = selectedAnswers.includes(index);

    if (isCorrect) {
      btn.classList.add("correct");
    }
    else {
      btn.classList.add("wrong");
    }

    if (isSelected && !isCorrect) {
      btn.classList.add("wrong");
      allCorrect = false;
    }

    if (isCorrect && !isSelected) {
      allCorrect = false;
    }
  });

  if (allCorrect) {
    score += calculatePoints();
  }

  setTimeout(goToNextQuestion, 1500);
}




function getAnswerColor(index) {
  const colors = ["#e74c3c", "#3498db", "#f1c40f", "#2ecc71"];
  return colors[index % colors.length];
}

function handleAnswerSelection(selectedIndex) {
  clearInterval(questionTimer);

  const question = activeQuiz.questions[currentQuestionIndex];
  const buttons = document.querySelectorAll(".answer-btn");

  let answeredCorrectly = false;

  buttons.forEach((btn, index) => {
    btn.disabled = true;

    const isCorrect = question.options[index]?.correct === true;

    if (isCorrect) {
      btn.classList.add("correct");
    } else {
      btn.classList.add("wrong");
    }

    if (index === selectedIndex && isCorrect) {
      answeredCorrectly = true;
    }
  });

  if (answeredCorrectly) {
    score += calculatePoints();
  }

  setTimeout(goToNextQuestion, 1500);
}

function goToNextQuestion() {
  clearInterval(questionTimer);

  currentQuestionIndex++;

  if (currentQuestionIndex < activeQuiz.questions.length) {
    showQuestion();
  } else {
    showScoreboard();
  }
}

function showScoreboard() {
  showSolveScreen("solveScoreboard");

  document.getElementById("finalScore").textContent = score;
}

function resetSolveState() {
  document.body.classList.remove("game-mode");
  activeQuiz = null;
  players = [];
  currentPlayer = null;
  currentQuestionIndex = 0;
  score = 0;

  const input = document.getElementById("playerNameInput");
  const joinBtn = document.getElementById("joinGameBtn");

  if (input) input.disabled = false;
  if (joinBtn) joinBtn.disabled = false;

  clearLobbyError();
  showSolveScreen("solveList");
}

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getActiveGames() {
  return JSON.parse(localStorage.getItem("activeGames")) || {};
}

function saveActiveGames(games) {
  localStorage.setItem("activeGames", JSON.stringify(games));
}

document.getElementById("createPinBtn")?.addEventListener("click", () => {
  const pin = generatePin();

  const games = getActiveGames();

  games[pin] = {
    quizId: activeQuiz.id,
    hostId: JSON.parse(localStorage.getItem("currentUser"))?.id,
    players: []
  };

  saveActiveGames(games);

  document.getElementById("gamePinValue").textContent = pin;
  document.getElementById("gamePinDisplay").classList.remove("hidden");
});

document.getElementById("joinByPinBtn")?.addEventListener("click", () => {
  const pinInput = document.getElementById("gamePinInput");
  const errorEl = document.getElementById("joinPinError");

  const pin = pinInput.value.trim();
  const games = getActiveGames();

  if (!games[pin]) {
    errorEl.textContent = "Invalid game PIN";
    errorEl.classList.remove("hidden");
    return;
  }

  errorEl.classList.add("hidden");

  const quizId = games[pin].quizId;
  const quizzes = JSON.parse(localStorage.getItem("quizzes")) || [];
  const quiz = quizzes.find(q => q.id === quizId);

  if (!quiz) {
    errorEl.textContent = "Quiz not found";
    errorEl.classList.remove("hidden");
    return;
  }

  activeQuiz = quiz;
  showSolveScreen("solveLobby");

  document.getElementById("lobbyQuizTitle").textContent = quiz.title;
  document.getElementById("lobbyQuizMeta").textContent =
    `by ${quiz.creatorName} • ${quiz.questions.length} questions`;
});
