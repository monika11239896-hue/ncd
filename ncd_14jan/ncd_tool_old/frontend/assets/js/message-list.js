const messages = [
  { id: 1001, name: "EngineSpeed", ecu: "ECU_Engine", channel: "CAN_1" },
  { id: 1002, name: "VehicleSpeed", ecu: "ECU_Body", channel: "CAN_1" },
  { id: 1003, name: "BrakeStatus", ecu: "ECU_Brake", channel: "CAN_2" },
  { id: 1004, name: "SteeringAngle", ecu: "ECU_Chassis", channel: "CAN_2" },
  { id: 1005, name: "BatteryVoltage", ecu: "ECU_Power", channel: "CAN_3" }
];

let selectedECU = "";
let selectedChannel = "";

const tbody = document.getElementById("messageTableBody");
const globalSearch = document.getElementById("globalSearch");

function renderTable() {
  const search = globalSearch.value.toLowerCase();

  const filtered = messages.filter(m =>
    (!selectedECU || m.ecu === selectedECU) &&
    (!selectedChannel || m.channel === selectedChannel) &&
    (!search ||
      `${m.id} ${m.name} ${m.ecu} ${m.channel}`
        .toLowerCase()
        .includes(search))
  );

  tbody.innerHTML = "";

  filtered.forEach(m => {
    tbody.innerHTML += `
      <tr>
        <td>${m.id}</td>
        <td>
          <a href="signal-list.html?messageId=${m.id}&messageName=${encodeURIComponent(m.name)}"
            class="message-link">
              ${m.name}
          </a>
        </td>
        <td><span class="badge badge-ecu">${m.ecu}</span></td>
        <td><span class="badge badge-channel">${m.channel}</span></td>
        <td class="text-end">
          <button class="action-btn"><i class="bi bi-eye"></i></button>
          <button class="action-btn"><i class="bi bi-pencil"></i></button>
          <button class="action-btn text-danger"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `;
  });
}

function populateFilters() {
  const ecuSet = [...new Set(messages.map(m => m.ecu))];
  const channelSet = [...new Set(messages.map(m => m.channel))];

  document.getElementById("ecuFilterList").innerHTML =
    `<div class="filter-item" onclick="selectECU('')">All</div>` +
    ecuSet.map(e => `<div class="filter-item" onclick="selectECU('${e}')">${e}</div>`).join("");

  document.getElementById("channelFilterList").innerHTML =
    `<div class="filter-item" onclick="selectChannel('')">All</div>` +
    channelSet.map(c => `<div class="filter-item" onclick="selectChannel('${c}')">${c}</div>`).join("");
}

function selectECU(ecu) {
  selectedECU = ecu;
  renderTable();
  closeDropdowns();

}

function selectChannel(channel) {
  selectedChannel = channel;
  renderTable();
  closeDropdowns();
}
function closeDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(d => {
    d.classList.remove('show');
  });
}

function filterDropdown(input, type) {
  const value = input.value.toLowerCase();
  const listId = type === "ecu" ? "ecuFilterList" : "channelFilterList";

  document.querySelectorAll(`#${listId} .filter-item`).forEach(item => {
    if (item.textContent === "All") {
      item.style.display = "block";
    } else {
      item.style.display = item.textContent.toLowerCase().includes(value)
        ? "block"
        : "none";
    }
  });
}

globalSearch.addEventListener("input", renderTable);

populateFilters();
renderTable();
