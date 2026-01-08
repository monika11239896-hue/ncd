const params = new URLSearchParams(window.location.search);
const TOPOLOGY_ID = params.get("topology_id");

if (!TOPOLOGY_ID ) {
  alert("Missing topology");
}

let messageIndex = 0;

const addMsgBtn = document.getElementById("addMessageBtn");
addMsgBtn.disabled = true;

document.addEventListener("DOMContentLoaded", async () => {
  await loadInitialData();
  document.getElementById("addMessageBtn").addEventListener("click", addMessage);
  addMsgBtn.disabled = false;
});


document.getElementById("messagesForm").addEventListener("submit", async e => {
  e.preventDefault();

  const messages = [];

  document.querySelectorAll(".message-block").forEach(msgBlock => {
    const msg = {
      name: msgBlock.querySelector(".msg-name").value.trim(),
      length: parseInt(msgBlock.querySelector(".msg-length").value, 10),
      isExtended: msgBlock.querySelector(".msg-ext").checked,
      comment: msgBlock.querySelector(".msg-comment").value.trim(),
      sender: msgBlock.querySelector(".msg-sender").value,
      canChannel: msgBlock.querySelector(".msg-can").value,
      signals: []
    };

    msgBlock.querySelectorAll(".signal-block").forEach(sigBlock => {
      msg.signals.push({
        sig_name: sigBlock.querySelector(".sig-name").value.trim(),
        start_bit: parseInt(sigBlock.querySelector(".sig-start").value, 10),
        length: parseInt(sigBlock.querySelector(".sig-length").value, 10),
        is_signed: sigBlock.querySelector(".sig-signed").checked,
        is_float: sigBlock.querySelector(".sig-float").checked,
        is_multiplexed: sigBlock.querySelector(".sig-mux").value,
        multiplex_val: sigBlock.querySelector(".sig-mux-val").value,
        endianness: sigBlock.querySelector(".sig-endian").value,
        factor: parseFloat(sigBlock.querySelector(".sig-factor").value) || 1,
        offset: parseFloat(sigBlock.querySelector(".sig-offset").value) || 0,
        min_value: parseFloat(sigBlock.querySelector(".sig-min").value),
        max_value: parseFloat(sigBlock.querySelector(".sig-max").value),
        initial_value: sigBlock.querySelector(".sig-init").value,
        unit: sigBlock.querySelector(".sig-unit").value,
        comment: sigBlock.querySelector(".sig-comment").value,
        receiver_ecu: sigBlock.querySelector(".sig-receiver").value
      });
    });

    messages.push(msg);
  });

  const payload = {
    topology_id: TOPOLOGY_ID,
    messages
  };

  const res = await fetch("/api/v1/messages-with-signals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await res.json();

  if (json.success) {
    alert("Messages saved successfully");
    window.location.href = `topology.html?id=${TOPOLOGY_ID}`;
  } else {
    alert("Failed to save messages");
    console.error(json);
  }
});


// ---------- Helpers ----------

function addMessage() {
  const container = document.getElementById("messagesContainer");
  const idx = messageIndex++;

  // Collapse all existing messages
  document.querySelectorAll(".message-block").forEach(m => {
    m.classList.add("collapsed");
  });

  const msgDiv = document.createElement("div");
  
  msgDiv.classList.remove("collapsed");
  msgDiv.className = "border rounded p-3 mb-3 message-block";

  msgDiv.innerHTML = `
      <div class="collapsible-header mb-2">
        <div class="d-flex justify-content-between align-items-center">
          <strong class="msg-title">New Message</strong>
          <div>
            <button type="button" class="btn btn-sm btn-link toggle-msg">▼</button>
            <button type="button" class="btn btn-sm btn-link text-danger remove-msg">✕</button>
          </div>
        </div>

        <!-- SIGNAL SUMMARY (VISIBLE WHEN COLLAPSED) -->
        <div class="signal-summary small text-muted mt-1"></div>
      </div>

    <div class="collapsible-body">

    <div class="row g-2 mb-2">
      <div class="col-md-4">
        <input class="form-control form-control-sm msg-name" placeholder="Message Name">
      </div>
      <div class="col-md-2">
        <input type="number" class="form-control form-control-sm msg-length" placeholder="Length">
      </div>
      <div class="col-md-2 d-flex align-items-center">
        <input type="checkbox" class="form-check-input me-1 msg-ext"> Extended
      </div>

      <div class="col-md-4">
        <select class="form-select form-select-sm msg-sender">
          <option value="">Sender ECU</option>
          ${ECUS.map(e => `<option value="${e.ecu_id}">${e.ecu_name}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="row g-2 mb-2">
    <div class="col-md-6">
        <input class="form-control form-control-sm msg-send-type" placeholder="Send Type">
      </div>
      <div class="col-md-6">
        <input class="form-control form-control-sm msg-cycle-time" placeholder="Cycle time">
      </div>
      </div>
    <div class="mb-2">
      <select class="form-select form-select-sm msg-can">
        <option value="">CAN Channel</option>
        ${CHANNELS.map(c =>
          `<option value="${c.channel_id}">${c.channel_name}</option>`
        ).join("")}
      </select>
    </div>

    <textarea class="form-control form-control-sm mb-2 msg-comment"
              placeholder="Comment"></textarea>

    <div class="signals-container"></div>

    <button type="button"
            class="btn btn-outline-secondary btn-sm add-signal">
      + Add Signal
    </button>
  `;

  const toggleBtn = msgDiv.querySelector(".toggle-msg");
  toggleBtn.onclick = () => {
    msgDiv.classList.toggle("collapsed");
    updateSignalSummary(msgDiv);
  };

  msgDiv.querySelector(".remove-msg").onclick = () => msgDiv.remove();
  msgDiv.querySelector(".add-signal").onclick = () =>
    addSignal(msgDiv.querySelector(".signals-container"));

    container.appendChild(msgDiv);
    updateSignalSummary(msgDiv);


  const nameInput = msgDiv.querySelector(".msg-name");
  const titleEl = msgDiv.querySelector(".msg-title");

nameInput.addEventListener("input", () => {
  titleEl.textContent = nameInput.value || " Message";
});

  
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

<div class="collapsible-body">


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
        <select class="form-select form-select-sm sig-receiver">
          <option value="">Receiver ECU</option>
          
        </select>
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
  sigDiv.querySelector(".toggle-sig").onclick = () => {
    sigDiv.classList.toggle("collapsed");
  };

  const sigNameInput = sigDiv.querySelector(".sig-name");
  const sigTitle = sigDiv.querySelector(".sig-title");

  sigNameInput.addEventListener("input", () => {
    sigTitle.textContent = sigNameInput.value || "Unnamed Signal";

    const messageDiv = sigDiv.closest(".message-block");
    updateSignalSummary(messageDiv);
  });
  sigDiv.querySelector(".remove-sig").onclick = () => {
    sigDiv.remove();
    updateSignalSummary(sigDiv.closest(".message-block"));
  };

    const ecuSelect = sigDiv.querySelector(".sig-receiver");

  ECUS.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e.ecu_id;
    opt.textContent = e.ecu_name;
    ecuSelect.appendChild(opt);
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
  updateSignalSummary(messageDiv);

    sigDiv.scrollIntoView({ behavior: "smooth" });

}

let ECUS = [];
let CHANNELS = [];

async function loadInitialData() {
  try {
    const [ecuRes, channelRes] = await Promise.all([
      fetch("/api/v1/ecus"),
      fetch("/api/v1/channels")
    ]);

    const ecuJson = await ecuRes.json();
    const channelJson = await channelRes.json();

    if (!ecuJson.success || !channelJson.success) {
      throw new Error("Failed to load ECU or Channel data");
    }

    ECUS = ecuJson.data;
    CHANNELS = channelJson.data;

    console.log("ECUs loaded:", ECUS);
    console.log("Channels loaded:", CHANNELS);

  } catch (err) {
    console.error("Failed to load ECU/Channel data", err);
  }
}
function updateSignalSummary(messageDiv) {
      if (!messageDiv) return;

      const summary = messageDiv.querySelector(".signal-summary");
      if (!summary) return;

      const signals = messageDiv.querySelectorAll(".signal-block .sig-name");

      if (signals.length === 0) {
        summary.textContent = "No signals";
        return;
      }

      summary.innerHTML = Array.from(signals)
        .map(s => `• ${s.value || "Unnamed Signal"}`)
        .join("<br>");
  }



