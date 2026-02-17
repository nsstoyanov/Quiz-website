document.addEventListener("DOMContentLoaded", () => {
  const views = {
    join: document.getElementById("joinView"),
    solve: document.getElementById("solveView"),
    edit: document.getElementById("editView"),
  };

  const navButtons = document.querySelectorAll(".nav-btn");
  const homeBtn = document.getElementById("homeBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  window.showView = function (viewName) {
    if (!views[viewName]) return;

    Object.values(views).forEach(v => v.classList.remove("active"));
    views[viewName].classList.add("active");

    navButtons.forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    if (viewName === "solve") {
      window.renderSolveView?.();
    }
    if (viewName !== "edit") {
      localStorage.removeItem("editingQuiz");
    }
    if (viewName === "edit" ) {
      window.setupEditView?.()
    }
  };

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (!view) return; 
      showView(view);
    });
  });

  homeBtn.addEventListener("click", () => showView("join"));

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });

  showView("join");
});
