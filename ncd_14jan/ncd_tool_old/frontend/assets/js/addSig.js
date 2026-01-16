import { API_BASE_URL } from "./config.js";
let MESSAGES = [];
let ECUS = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadInitialData();
  document.getElementById("addSignalBtn").onclick = () => {
  addSignal(document.getElementById("signalsContainer"));
};
});


async function loadInitialData() {
  const [ msgRes, ecuRes] = await Promise.all([
    fetch(`${API_BASE_URL}/api/v1/messages`),
    fetch(`${API_BASE_URL}/api/v1/ecus`)
  ]);

  MESSAGES = (await msgRes.json()).data;
  ECUS = (await ecuRes.json()).data;

}

function addSignal(container) {
  const sigDiv = document.createElement("div");
  sigDiv.classList.remove("collapsed");

  sigDiv.className = "border rounded p-3 mt-3 signal-block";
  container.querySelectorAll(".signal-block").forEach(s => {
    s.classList.add("collapsed");
  });

  sigDiv.innerHTML = `
    <div class="collapsible-header d-flex justify-content-between align-items-center mb-2">
      <strong class="sig-title">New Signal</strong>
      <div>
        <button type="button" class="btn btn-sm btn-link toggle-sig">▼</button>
        <button type="button" class="btn btn-sm btn-link text-danger remove-sig">✕</button>
      </div>
    </div>

<div class="collapsible-body mt-2">

     <!-- MESSAGE -->
     
    <div class="mb-3">
      <label class="form-label">Message *</label>

      <input type="text"
            class="form-control form-control-sm msg-search"
            placeholder="Search Message">

      <div class="msg-list border rounded p-2 mt-1"
          style="max-height:150px; overflow-y:auto">
      </div>

      <!-- hidden selected value -->
      <input type="hidden" class="sig-message" required>
    </div>

    <div class="row g-2">
      <div class="col-md-4">
        <input class="form-control form-control-sm sig-name" placeholder="Signal Name">
      </div>
      <div class="col-md-2">
        <input type="number" class="form-control form-control-sm sig-start" placeholder="Start Bit">
      </div>
      <div class="col-md-2">
        <input type="number" class="form-control form-control-sm sig-length" placeholder="Length">
      </div>
      <div class="col-md-2 form-check mt-2">
        <input class="form-check-input sig-signed" type="checkbox">
        <label class="form-check-label small">Signed</label>
      </div>
      <div class="col-md-2 form-check mt-2">
        <input class="form-check-input sig-float" type="checkbox">
        <label class="form-check-label small">Float</label>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="col-md-3">
        <select class="form-select form-select-sm sig-mux">
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
      </div>
      <div class="col-md-3">
        <input class="form-control form-control-sm sig-mux-val"
               placeholder="Multiplex Value"
               disabled>
      </div>

      <div class="col-md-3">
        <select class="form-select form-select-sm sig-endian">
          <option value="little_endian" >Little Endian</option>
          <option value="big_endian">Big Endian</option>
        </select>
      </div>
      <div class="col-md-3">
        <input type="text"
              class="form-control form-control-sm receiver-ecu-search"
              placeholder="Search Receiver ECU">

        <div class="receiver-ecu-list border rounded p-2 mt-1"
            style="max-height:140px; overflow-y:auto">
        </div>
      </div>

    </div>

    <div class="row g-2 mt-2">
      <div class="col-md-2">
        <input type="number" step="0.01" class="form-control form-control-sm sig-factor" placeholder="Factor" value="">
      </div>
      <div class="col-md-2">
        <input type="number" step="0.01" class="form-control form-control-sm sig-offset" placeholder="Offset" value="">
      </div>
      <div class="col-md-2">
        <input type="number" class="form-control form-control-sm sig-min" placeholder="Min">
      </div>
      <div class="col-md-2">
        <input type="number" class="form-control form-control-sm sig-max" placeholder="Max">
      </div>
      
      <div class="col-md-2">
        <input class="form-control form-control-sm sig-init" placeholder="Initial Value">
      </div>
      <div class="col-md-2 mb-2">
        <input class="form-control form-control-sm sig-unit" placeholder="Unit">
      </div>
    </div>
    <div class="col-md-2">
        <input type="number" class="form-control form-control-sm sig-GenSigCycleTime" placeholder="GenSigCycleTime">
    </div>
    <textarea class="form-control form-control-sm mt-2 mb-2 sig-comment"
              placeholder="Comment"></textarea>

    <h4 style="font-size:15px">Value Description*</h4>
    <div class="kvPairs"></div>
    <button type="button" class="addKV btn btn-secondary btn-sm">+ Add Value</button>
    <br>
  `;

  // ---------- Receiver ECU (CHECKBOX + SEARCH) ----------
const receiverSearch = sigDiv.querySelector(".receiver-ecu-search");
const receiverList = sigDiv.querySelector(".receiver-ecu-list");

receiverList.innerHTML = "";

ECUS.forEach(e => {
  const id = `recv-${Date.now()}-${e.ecu_id}`;

  const div = document.createElement("div");
  div.className = "form-check small mb-1";

  div.innerHTML = `
    <input class="form-check-input sig-receiver-checkbox"
           type="checkbox"
           id="${id}"
           value="${e.ecu_id}">
    <label class="form-check-label" for="${id}">
      ${e.ecu_name}
    </label>
  `;

  receiverList.appendChild(div);
});

    // Search filter
    receiverSearch.addEventListener("input", () => {
      const q = receiverSearch.value.toLowerCase();
      receiverList.querySelectorAll(".form-check").forEach(div => {
        div.style.display = div.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });
    

    const msgSearch = sigDiv.querySelector(".msg-search");
    const msgList   = sigDiv.querySelector(".msg-list");
    const msgHidden = sigDiv.querySelector(".sig-message");

    // render list
    function renderMsgList(list) {
      msgList.innerHTML = "";

      list.forEach(m => {
        const div = document.createElement("div");
        div.className = "form-check small mb-1 msg-item";

        div.innerHTML = `
          <input class="form-check-input"
                type="radio"
                name="msg-${Date.now()}"
                value="${m.message_id}">
          <label class="form-check-label">
            ${m.name}
          </label>
        `;

        const radio = div.querySelector("input");

        radio.addEventListener("change", () => {
          msgHidden.value = radio.value;
          msgSearch.value = m.name;

          // highlight selected
          msgList.querySelectorAll(".msg-item").forEach(i =>
            i.classList.remove("bg-light")
          );
          div.classList.add("bg-light");
        });

        msgList.appendChild(div);
      });
    }

    // initial render
    renderMsgList(MESSAGES);

    // search filter
    msgSearch.addEventListener("input", () => {
      const q = msgSearch.value.toLowerCase().trim();

      if (!q) {
        renderMsgList(MESSAGES);
        return;
      }

      const filtered = MESSAGES.filter(m =>
        m.name.toLowerCase().includes(q)
      );

      renderMsgList(filtered);
    });



  sigDiv.querySelector(".toggle-sig").onclick = () => {
    sigDiv.classList.toggle("collapsed");
  };

  const sigNameInput = sigDiv.querySelector(".sig-name");
  const sigTitle = sigDiv.querySelector(".sig-title");

  sigNameInput.addEventListener("input", () => {
    sigTitle.textContent = sigNameInput.value || "Unnamed Signal";

    const messageDiv = sigDiv.closest(".message-block");
  });

  sigDiv.querySelector(".addKV").onclick = () => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "6px";
    row.style.marginBottom = "5px";

    row.innerHTML = `
      <input class="kvKey form-control form-control-sm" placeholder="Key" style="width:60px">
      <input class="kvValue form-control form-control-sm" placeholder="Value" style="flex:1">
      <button type="button" onclick="this.parentElement.remove()">X</button>
    `;
    sigDiv.querySelector(".kvPairs").appendChild(row);
  };

  sigDiv.querySelectorAll("input[type=number]").forEach(input => {
    input.addEventListener("input", () => {
      const v = input.value;
      if (v !== "" && (v < 0 || v > 64)) {
        input.style.borderColor = "red";
      } else {
        input.style.borderColor = "";
      }
    });
  });

  // Multiplex toggle logic
  const muxSelect = sigDiv.querySelector(".sig-mux");
  const muxVal = sigDiv.querySelector(".sig-mux-val");

  muxSelect.addEventListener("change", () => {
    muxVal.disabled = muxSelect.value !== "1";
    if (muxVal.disabled) muxVal.value = "";
  });

  sigDiv.querySelector(".remove-sig").onclick = () => sigDiv.remove();
  container.appendChild(sigDiv);

  const messageDiv = container.closest(".message-block");

    sigDiv.scrollIntoView({ behavior: "smooth" });

}


document.getElementById("signalsForm").addEventListener("submit", async e => {
  e.preventDefault();

  const payload = { signals: [] };

  function collectValueDesc(sigDiv) {
    const obj = {};
    sigDiv.querySelectorAll(".kvPairs > div").forEach(row => {
      const key = row.querySelector(".kvKey").value.trim();
      const value = row.querySelector(".kvValue").value.trim();
      if (key !== "") obj[key] = value;
    });
    return obj;
  }

  let hasError = false;

  document.querySelectorAll(".signal-block").forEach(sig => {
    const messageId = sig.querySelector(".sig-message").value;

    if (!messageId) {
      alert("Please select a message for all signals");
      hasError = true;
      return;
    }

    payload.signals.push({
      message_id: parseInt(messageId, 10), // ⭐ IMPORTANT
      sig_name: sig.querySelector(".sig-name").value.trim(),
      start_bit: parseInt(sig.querySelector(".sig-start").value, 10),
      length: parseInt(sig.querySelector(".sig-length").value, 10),
      is_signed: sig.querySelector(".sig-signed").checked,
      is_float: sig.querySelector(".sig-float").checked,
      is_multiplexed: sig.querySelector(".sig-mux").value === "1",
      multiplex_val: sig.querySelector(".sig-mux-val").value || null,
      endianness: sig.querySelector(".sig-endian").value,
      factor: parseFloat(sig.querySelector(".sig-factor").value) || 1,
      offset: parseFloat(sig.querySelector(".sig-offset").value) || 0,
      min_value: parseFloat(sig.querySelector(".sig-min").value),
      max_value: parseFloat(sig.querySelector(".sig-max").value),
      initial_value: sig.querySelector(".sig-init").value,
      unit: sig.querySelector(".sig-unit").value,
      comment: sig.querySelector(".sig-comment").value,
      value_desc: collectValueDesc(sig),
      receiver_ecu: Array.from(
        sig.querySelectorAll(".sig-receiver-checkbox:checked")
      ).map(cb => parseInt(cb.value))
    });
  });

  if (hasError) return;

  const res = await fetch(`${API_BASE_URL}/api/v1/signals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await res.json();

  if (json.success) {
    alert("Signals added successfully");
    window.history.back();
  } else {
    alert("Failed to add signals");
    console.error(json);
  }
});
