let CHANNELS = [];
let MESSAGES = [];
let ECUS = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadInitialData();
  document.getElementById("addSignalBtn").onclick = () => {
  addSignal(document.getElementById("signalsContainer"));
};
});


async function loadInitialData() {
  const [chRes, msgRes, ecuRes] = await Promise.all([
    fetch("/api/v1/channels"),
    fetch("/api/v1/messages"),
    fetch("/api/v1/ecus")
  ]);

  CHANNELS = (await chRes.json()).data;
  MESSAGES = (await msgRes.json()).data;
  ECUS = (await ecuRes.json()).data;

  const chSel = document.getElementById("canChannelSelect");
  CHANNELS.forEach(c => {
    chSel.innerHTML += `<option value="${c.channel_id}">
      ${c.channel_name}
    </option>`;
  });

  const msgSel = document.getElementById("messageSelect");
  MESSAGES.forEach(m => {
    msgSel.innerHTML += `<option value="${m.message_id}">
      ${m.name}
    </option>`;
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
  });
  sigDiv.querySelector(".remove-sig").onclick = () => {
    sigDiv.remove();
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

    sigDiv.scrollIntoView({ behavior: "smooth" });

}


document.getElementById("signalsForm").addEventListener("submit", async e => {
  e.preventDefault();

  const payload = {
    channel_id: document.getElementById("canChannelSelect").value,
    message_id: document.getElementById("messageSelect").value,
    signals: []
  };

  function collectValueDesc(sigDiv) {
  const obj = {};
  sigDiv.querySelectorAll(".kvPairs > div").forEach(row => {
    const key = row.querySelector(".kvKey").value.trim();
    const value = row.querySelector(".kvValue").value.trim();
    if (key !== "") {
      obj[key] = value;
    }
  });
  return obj;
}

  document.querySelectorAll(".signal-block").forEach(sig => {
    payload.signals.push({
        sig_name: sig.querySelector(".sig-name").value.trim(),
        start_bit: parseInt(sig.querySelector(".sig-start").value, 10),
        length: parseInt(sig.querySelector(".sig-length").value, 10),
        is_signed: sig.querySelector(".sig-signed").checked,
        is_float: sig.querySelector(".sig-float").checked,
        is_multiplexed: sig.querySelector(".sig-mux").value,
        multiplex_val: sig.querySelector(".sig-mux-val").value,
        endianness: sig.querySelector(".sig-endian").value,
        factor: parseFloat(sig.querySelector(".sig-factor").value) || 1,
        offset: parseFloat(sig.querySelector(".sig-offset").value) || 0,
        min_value: parseFloat(sig.querySelector(".sig-min").value),
        max_value: parseFloat(sig.querySelector(".sig-max").value),
        initial_value: sig.querySelector(".sig-init").value,
        unit: sig.querySelector(".sig-unit").value,
        comment: sig.querySelector(".sig-comment").value,
        value_desc: collectValueDesc(sig)   // ✅ HERE

    });
  });


  const res = await fetch("/api/v1/signals", {
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
