export function initPageEvents() {

  const addMessageBtn = document.getElementById("addMessage");
  if (addMessageBtn) {
    addMessageBtn.addEventListener("click", () => {
      const params = new URLSearchParams(window.location.search);
      const topologyId = params.get("id");

      window.location.href = `add-message.html?topology_id=${topologyId}`;
    });
  }

  const backBtn = document.getElementById("backToHomePage");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "/";
    });
  }

  const dbcBtn = document.getElementById("createDbcBtn");
  if (dbcBtn) {
    dbcBtn.addEventListener("click", () => {
      alert("This Page is under construction.");
    });
  }

}
