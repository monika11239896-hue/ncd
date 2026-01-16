import { initSaveMetadata, loadMetadata, loadTopologyHeader } from "./metadata.js";
import { initCanChannels } from "./channels.js";
import { initEcus } from "./ecu.js";
import { initPageEvents } from "./events.js";

document.addEventListener("DOMContentLoaded", () => {

  initSaveMetadata();
  loadMetadata();
  // global page buttons
  initPageEvents();


  if (window.location.pathname.includes("topology.html")) {
    loadTopologyHeader();
    initCanChannels();
    initEcus();

  }

});
