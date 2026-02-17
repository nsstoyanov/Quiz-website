let draftQuestions = [];
let activeQuestionIndex = null;

const createQuizBtn = document.getElementById("createQuizBtn");
const quizTitleInput = document.getElementById("quizTitle");

const questionTextInput = document.getElementById("editQuestionText");
const questionTypeSelect = document.getElementById("questionType");
const optionsContainer = document.getElementById("optionsContainer");
const questionsPreview = document.getElementById("questionsPreview");

const addQuestionBtn = document.getElementById("addQuestionBtn");
const saveQuestionBtn = document.getElementById("saveQuestionBtn");
const saveQuizBtn = document.getElementById("saveQuizBtn");

const publicToggle = document.getElementById("publicToggle");

const fileInput = document.getElementById("editQuestionImage");
const fileNameEl = document.getElementById("fileName");
const previewEl = document.getElementById("questionImagePreview");
const removeBtn = document.getElementById("removeImageBtn");


async function saveCurrentQuestion() {
    if (activeQuestionIndex === null) return true;
    const updatedOptions = [];
    let hasCorrect = false;

    document.querySelectorAll(".option-row").forEach((row) => {
        const textInput = row.querySelector('input[type="text"]');
        const checkInput = row.querySelector('input[type="checkbox"], input[type="radio"]');

        const option = {
            text: (textInput?.value || "").trim(),
            correct: !!checkInput?.checked
        };

        if (option.correct) hasCorrect = true;
        updatedOptions.push(option);
    });

    if (!hasCorrect) return false;

    const imageFile = fileInput.files[0];
    const imageBase64 = imageFile
        ? await fileToBase64(imageFile)
        : draftQuestions[activeQuestionIndex].image;

    draftQuestions[activeQuestionIndex] = {
        ...draftQuestions[activeQuestionIndex],
        text: questionTextInput.value.trim(),
        type: questionTypeSelect.value,
        options: updatedOptions,
        image: imageBase64
    };

    if (editingQuiz) {
        editingQuiz.questions = structuredClone(draftQuestions);
        editingQuiz.title = quizTitleInput.value.trim();
        editingQuiz.isPublic = publicToggle.checked;
        localStorage.setItem("editingQuiz", JSON.stringify(editingQuiz));
    }

    return true;
}

fileInput?.addEventListener("change", () => {
    const file = fileInput.files[0];

    if (!file) {
        fileNameEl.textContent = "No image selected";
        previewEl.src = "";
        previewEl.style.display = "none";
        removeBtn.hidden = true;
        return;
    }

    fileNameEl.textContent = file.name;

    previewEl.src = URL.createObjectURL(file);
    previewEl.style.display = "block";
    removeBtn.hidden = false;
});

removeBtn?.addEventListener("click", () => {
    fileInput.value = "";
    fileNameEl.textContent = "No image selected";
    previewEl.src = "";
    previewEl.style.display = "none";
    removeBtn.hidden = true;
});

questionTextInput.addEventListener("input", () => {
    questionTextInput.style.height = "auto";
    questionTextInput.style.height = questionTextInput.scrollHeight + "px";
});

function renderOptions() {
    optionsContainer.innerHTML = "";

    if (questionTypeSelect.value === "boolean") {
        ["True", "False"].forEach((label, index) => {
            optionsContainer.innerHTML += `
        <div class="option-row">
            <label class="option-check">
                <input type="radio" name="correct" data-index="${index}">
                <span></span>
            </label>
            <input type="text" value="${label}" disabled>
        </div>
        `;
        });
        return;
    }

    for (let i = 0; i < 4; i++) {
        optionsContainer.innerHTML += `
      <div class="option-row">
      <label class="option-check">
        <input 
          type="${questionTypeSelect.value === "multiple" ? "checkbox" : "radio"}"
          name="correct"
          data-index="${i}"
        >
        <span></span>
      </label>
      <input type="text" placeholder="Option ${i + 1}">
    </div>
    `;
    }
}

questionTypeSelect?.addEventListener("change", renderOptions);
renderOptions();

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

addQuestionBtn?.addEventListener("click", async () => {
    quizTitleInput.classList.remove("input-error");
    optionsContainer.classList.remove("input-error");
    questionTextInput.classList.remove("input-error");

    const text = questionTextInput.value.trim();
    if (!text) {
        questionTextInput.classList.add("input-error");
        return;
    }

    const options = [];
    let hasCorrect = false;

    document.querySelectorAll(".option-row").forEach((row) => {
        const textInput = row.querySelector('input[type="text"]');
        const checkInput = row.querySelector('input[type="checkbox"], input[type="radio"]');

        const option = {
            text: textInput?.value || "",
            correct: checkInput?.checked || false,
        };

        if (option.correct) hasCorrect = true;
        options.push(option);
    });

    if (!hasCorrect) {
        optionsContainer.classList.add("input-error");
        return;
    }
    const imageFile = fileInput.files[0];
    const imageBase64 = imageFile ? await fileToBase64(imageFile) : null;

    draftQuestions.push({
        id: crypto.randomUUID(),
        text,
        type: questionTypeSelect.value,
        options,
        image: imageBase64,
    });

    const previewWrapper = document.getElementById("questionsPreviewWrapper");
    previewWrapper.classList.remove("quiz-error");

    const quizError = document.getElementById("quizQuestionsError");
    if (quizError) quizError.remove();

    renderQuestionsPreview();
    clearQuestionForm();
});

function loadQuestionIntoForm(index) {
    const q = draftQuestions[index];
    activeQuestionIndex = index;

    questionTextInput.value = q.text;
    questionTypeSelect.value = q.type;

    addQuestionBtn.style.display = "none";
    saveQuestionBtn.style.display = "block";

    renderOptions();

    document.querySelectorAll(".option-row").forEach((row, i) => {
        const textInput = row.querySelector('input[type="text"]');
        const checkInput = row.querySelector('input[type="checkbox"], input[type="radio"]');

        if (q.options[i]) {
            textInput.value = q.options[i].text;
            checkInput.checked = q.options[i].correct;
        }
    });

    renderQuestionsPreview();
}
function renderQuestionsPreview() {
    const tabs = document.getElementById("questionsTabs");
    tabs.innerHTML = "";

    draftQuestions.forEach((q, index) => {
        const tab = document.createElement("button");
        tab.className = "question-tab";
        tab.textContent = `Q-${index + 1}`;

        if (index === activeQuestionIndex) {
            tab.classList.add("active");
        }

        tab.addEventListener("click", () => {
            loadQuestionIntoForm(index);
        });

        tabs.appendChild(tab);
    });

    const addTab = document.createElement("button");
    addTab.className = "question-tab add";
    addTab.textContent = "+";
    addTab.addEventListener("click", () => {
        clearQuestionForm();
        activeQuestionIndex = null;
        renderQuestionsPreview();
    });

    tabs.appendChild(addTab);
}

function clearQuestionForm() {
    questionTextInput.value = "";
    questionTypeSelect.value = "singel";
    renderOptions();
    fileInput.value = "";
    fileNameEl.textContent = "No image selected";
    previewEl.style.display = "none";
    removeBtn.hidden = true;

    activeQuestionIndex = null;
    addQuestionBtn.style.display = "block";
    saveQuestionBtn.style.display = "none";
}

saveQuestionBtn.addEventListener("click", async () => {

    const ok = await saveCurrentQuestion();
    if (!ok) return;
    optionsContainer.classList.remove("input-error");
    clearQuestionForm();
    renderQuestionsPreview();

});

saveQuizBtn?.addEventListener("click", async () => {
    const ok = await saveCurrentQuestion();
    if (!ok) return;

    const title = quizTitleInput.value.trim();
    quizTitleInput.classList.remove("input-error");

    if (!title) {
        quizTitleInput.classList.add("input-error");
        return;
    }

    const previewWrapper = document.getElementById("questionsPreviewWrapper");
    previewWrapper.classList.remove("quiz-error");
    const existingError = document.getElementById("quizQuestionsError");
    if (existingError) existingError.remove();

    if (draftQuestions.length === 0) {
        previewWrapper.classList.add("quiz-error");
        const error = document.createElement("div");
        error.id = "quizQuestionsError";
        error.className = "quiz-error-text";
        error.textContent = "Add at least one question before saving the quiz";
        previewWrapper.after(error);
        return;
    }

    const user = JSON.parse(localStorage.getItem("currentUser"));
    const quizzes = JSON.parse(localStorage.getItem("quizzes")) || [];
    let toastMessage = "";

    if (editingQuiz) {
        const index = quizzes.findIndex(q => q.id === editingQuiz.id);
        if (index !== -1) {
            quizzes[index] = {
                ...editingQuiz,
                title,
                isPublic: publicToggle.checked,
                questions: structuredClone(draftQuestions) 
            };
        }
        toastMessage = "Changes saved ✅";
        localStorage.removeItem("editingQuiz"); 
        editingQuiz = null; 

    } else {
        const quiz = {
            id: crypto.randomUUID(),
            title,
            creatorId: user.id,
            creatorName: user.name,
            isPublic: publicToggle.checked,
            questions: structuredClone(draftQuestions),
        };
        quizzes.push(quiz);
        toastMessage = "Quiz created successfully 🎉";
    }

    localStorage.setItem("quizzes", JSON.stringify(quizzes));
    showToast(toastMessage);

    resetQuizEditor();
    window.showView("solve");
    window.renderSolveView?.();
});


document.getElementById("cancelEditBtn")?.addEventListener("click", () => {
    localStorage.removeItem("editingQuiz");
    showView("solve");
});
function resetQuizEditor() {
    draftQuestions = [];
    activeQuestionIndex = null;

    quizTitleInput.value = "";
    publicToggle.checked = false;

    questionTextInput.value = "";
    questionTypeSelect.selectedIndex = 0;

    fileInput.value = "";
    fileNameEl.textContent = "No image selected";
    previewEl.style.display = "none";
    removeBtn.hidden = true;

    addQuestionBtn.style.display = "block";
    saveQuestionBtn.style.display = "none";

    document.getElementById("questionsTabs").innerHTML = "";
    questionsPreview.innerHTML = "";

    renderOptions();
}

document.getElementById("backToQuizzesBtn")?.addEventListener("click", () => {
    localStorage.removeItem("editingQuiz");

    resetQuizEditor();
    showView("solve");
    window.renderSolveView?.();
});

let isEditMode = false;
let editingQuiz = null;

function setupEditView() {
    const pageTitle = document.querySelector(".createQuizView h2");
    const saveBtn = document.getElementById("saveQuizBtn");

    editingQuiz = JSON.parse(localStorage.getItem("editingQuiz"));

    if (editingQuiz) {
        isEditMode = true;
        pageTitle.textContent = "Edit quiz";
        saveBtn.textContent = "Save Quiz";

        quizTitleInput.value = editingQuiz.title;
        publicToggle.checked = editingQuiz.isPublic;
        draftQuestions = structuredClone(editingQuiz.questions);
        renderQuestionsPreview();
        if (draftQuestions.length > 0) {
            loadQuestionIntoForm(0);
        } else {
            clearQuestionForm();
        }


    } else {
        isEditMode = false;
        pageTitle.textContent = "Create quiz";
        saveBtn.textContent = "Create Quiz";

        quizTitleInput.value = "";
        publicToggle.checked = true;
        draftQuestions = [];
        clearQuestionForm();
        renderQuestionsPreview();
    }
}
function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

window.setupEditView = setupEditView;