// ecus.js
import { API_BASE_URL } from "./config.js";

/* ===============================
   INIT ECUs (Topology page)
================================ */
export function initEcus() {
  bindCreateEcu();
  loadEcuTopology();
}

/* ===============================
   CREATE ECU
================================ */
function bindCreateEcu() {
  const btn = document.getElementById("saveEcuBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const input = document.getElementById("ecuNameInput");
    const ecuName = input.value.trim();

    if (!ecuName) {
      alert("ECU name is required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ecus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ecu_name: ecuName })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(json.message || "Failed to create ECU");
        return;
      }

      bootstrap.Modal.getInstance(
        document.getElementById("addEcuModal")
      ).hide();

      input.value = "";
      loadEcuTopology();

    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  });
}

/* ===============================
   DELETE ECU
================================ */
async function deleteEcu(ecuId) {
  if (!ecuId) {
    console.error("Invalid ECU ID:", ecuId);
    alert("Invalid ECU ID");
    return;
  }

  if (!confirm("Delete this ECU?")) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/ecus/${ecuId}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Delete failed");
    }

    // ✅ Refresh list
    loadEcuTopology();

  } catch (err) {
    console.error("Delete ECU error:", err);
    alert("Delete failed");
  }
}


/* ===============================
   LOAD ECU TOPOLOGY
================================ */
async function loadEcuTopology() {
  const container = document.getElementById("ecuList");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/ecu_topology`);
    const json = await res.json();

    if (!json.success) {
      alert("Failed to load ECU topology");
      return;
    }

    container.innerHTML = "";

    if (json.data.length === 0) {
      container.innerHTML =
        `<div class="text-muted">No ECUs added</div>`;
      return;
    }

    json.data.forEach((ecu, index) => {
      const collapseId = `ecuCollapse_${index}`;

      container.innerHTML += `
        <div class="mb-2">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-chevron-right ecu-chevron"
                 data-bs-toggle="collapse"
                 data-bs-target="#${collapseId}"></i>
              <strong>${ecu.ecu}</strong>
            </div>
            <a href="#"
               class="text-danger delete-ecu"
               data-id="${ecu.ecu_id}">
               ❌
            </a>
          </div>

          <div class="collapse ms-4 mt-1" id="${collapseId}">
            ${
              ecu.messages.length
                ? ecu.messages.map(msg => `
                    <div class="mt-1">
                      ↪ ${msg.name}
                      ${
                        msg.signals.length
                          ? `<ul class="list-unstyled ms-4">
                              ${msg.signals
                                .map(sig => `<li>↪ ${sig}</li>`)
                                .join("")}
                            </ul>`
                          : `<div class="text-muted ms-4">No signals</div>`
                      }
                    </div>
                  `).join("")
                : `<div class="text-muted">No messages</div>`
            }
          </div>
        </div>
      `;
    });

    bindDeleteEcu();
    bindChevronRotation();

  } catch (err) {
    console.error("Failed to load ECU topology", err);
  }
}

/* ===============================
   EVENTS
================================ */
function bindDeleteEcu() {
  const container = document.getElementById("ecuList");

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-ecu");
    if (!btn) return;

    e.preventDefault();

    const ecuId = btn.dataset.id;
    console.log("Deleting ECU ID:", ecuId);

    deleteEcu(ecuId);
  });
}

function bindChevronRotation() {
  document.querySelectorAll(".ecu-chevron").forEach(icon => {
    const target = document.querySelector(icon.dataset.bsTarget);

    target.addEventListener("shown.bs.collapse", () =>
      icon.classList.add("rotate")
    );
    target.addEventListener("hidden.bs.collapse", () =>
      icon.classList.remove("rotate")
    );
  });
}
