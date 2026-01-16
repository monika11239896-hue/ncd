// Read URL params
const params = new URLSearchParams(window.location.search);
const messageId = params.get("messageId");
const messageName = params.get("messageName");

// Header info
document.getElementById("messageTitle").textContent = `Signals – ${messageName}`;
document.getElementById("messageDetails").textContent =
  `Message ID: ${messageId}`;

// Dummy signal data (later replace with API)
const signals = [
  { id: 1, name: "Engine_RPM", receiver: "ECU_Dashboard", msgId: "1001" },
  { id: 2, name: "Engine_Temp", receiver: "ECU_AC", msgId: "1001" },
  { id: 3, name: "Oil_Pressure", receiver: "ECU_Service", msgId: "1001" },
  { id: 4, name: "Battery_Voltage", receiver: "ECU_Body", msgId: "1002" }
];

let selectedReceiver = "";

const tbody = document.getElementById("signalTableBody");
const searchInput = document.getElementById("signalSearch");

// Filter signals for selected message
const messageSignals = signals.filter(s => s.msgId === messageId);

function renderSignals() {
  const search = searchInput.value.toLowerCase();
  tbody.innerHTML = "";

  messageSignals
    .filter(s =>
      (!selectedReceiver || s.receiver === selectedReceiver) &&
      (!search || `${s.name} ${s.receiver}`.toLowerCase().includes(search))
    )
    .forEach((s, index) => {
      tbody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${s.name}</td>
          <td><span class="badge badge-ecu">${s.receiver}</span></td>
          <td class="text-end">
            <button class="action-btn"><i class="bi bi-eye"></i></button>
            <button class="action-btn"><i class="bi bi-pencil"></i></button>
            <button class="action-btn text-danger"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `;
    });
}

// Populate Receiver ECU filter
function populateReceiverFilter() {
  const ecus = [...new Set(messageSignals.map(s => s.receiver))];
  const list = document.getElementById("receiverEcuList");

  list.innerHTML =
    `<div class="filter-item" onclick="selectReceiver('')">All</div>` +
    ecus.map(e =>
      `<div class="filter-item" onclick="selectReceiver('${e}')">${e}</div>`
    ).join("");
}

function selectReceiver(ecu) {
  selectedReceiver = ecu;
  renderSignals();
}

function filterDropdown(input) {
  const value = input.value.toLowerCase();
  document.querySelectorAll(".filter-item").forEach(item => {
    item.style.display =
      item.textContent === "All" ||
      item.textContent.toLowerCase().includes(value)
        ? "block"
        : "none";
  });
}

searchInput.addEventListener("input", renderSignals);

populateReceiverFilter();
renderSignals();
