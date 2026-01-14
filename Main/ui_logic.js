// ===============================
// Patient & Dispenser UI Logic
// ===============================
const patients = [
  { id: "001", name: "Amir", prescriptions: [{ medicine: "Paracetamol 500mg", datetime: "2025-10-22T09:30" }] },
  { id: "002", name: "John", prescriptions: [{ medicine: "Amlodipine 5mg", datetime: "2025-10-22T08:45" }] }
];

// Elements
const overlay = document.getElementById("login-overlay");
const tts = document.getElementById("tts-panel");
const dispenser = document.getElementById("dispenser-panel");
const patientTab = document.getElementById("patient-tab");
const patientModal = document.getElementById("patient-modal");
const patientList = document.getElementById("patient-list");

const bottle = document.getElementById("dispenser-bottle");
const medText = document.getElementById("dispenser-medicine");
const userText = document.getElementById("dispenser-username");

// ===== Login Buttons =====
document.getElementById("btn-patient").addEventListener("click", () => showForm("patient"));
document.getElementById("btn-staff").addEventListener("click", () => showForm("staff"));
document.getElementById("btn-visitor").addEventListener("click", () => {
  overlay.style.display = "none";
  tts.style.display = "flex";
});

function showForm(type) {
  document.getElementById("patient-form").style.display = type === "patient" ? "flex" : "none";
  document.getElementById("staff-form").style.display = type === "staff" ? "flex" : "none";
}

// ===== Verify Patient =====
document.getElementById("verify-patient").addEventListener("click", () => {
  const id = document.getElementById("patient-id").value.trim();
  const name = document.getElementById("patient-name").value.trim().toLowerCase();
  const p = patients.find(x => x.id === id && x.name.toLowerCase() === name);

  if (!p) {
    document.getElementById("patient-error").textContent = "Invalid details";
    return;
  }

  overlay.style.display = "none";
  tts.style.display = "flex";
  dispenser.style.display = "flex";
  userText.textContent = p.name;

  bottle.src = "Samples/Resources/bottle_empty.png";
  medText.textContent = `${p.prescriptions[0].medicine} – 1 dose`;
});

// ===== Staff Login =====
document.getElementById("login-staff").addEventListener("click", () => {
  const account = document.getElementById("staff-account").value;
  const password = document.getElementById("staff-password").value;

  if (account === "admin" && password === "password") {
    overlay.style.display = "none";
    tts.style.display = "flex";
    dispenser.style.display = "flex";
    patientTab.style.display = "block";
    userText.textContent = "admin";
    bottle.style.display = "none";
    medText.style.display = "none";
  } else {
    document.getElementById("staff-error").textContent = "Invalid login";
  }
});

// ===== PATIENT PANEL LOGIC =====
function renderPatients() {
  patientList.innerHTML = "";

  patients.forEach((p, i) => {
    const card = document.createElement("div");
    card.style.background = "#fff";
    card.style.border = "1px solid #ddd";
    card.style.borderRadius = "14px";
    card.style.padding = "12px";
    card.style.marginBottom = "12px";

    const prescriptionsHTML = p.prescriptions.map((rx, j) => {
      const [date, time] = rx.datetime.split("T");
      return `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
          <input
            value="${rx.medicine}"
            style="flex:2;padding:8px;border-radius:10px;border:1px solid #ccc;"
            data-patient-index="${i}" data-rx-index="${j}" data-field="medicine"
          >
          <input
            type="date"
            value="${date}"
            style="padding:8px;border-radius:10px;border:1px solid #ccc;"
            data-patient-index="${i}" data-rx-index="${j}" data-field="date"
          >
          <input
            type="time"
            value="${time}"
            style="padding:8px;border-radius:10px;border:1px solid #ccc;"
            data-patient-index="${i}" data-rx-index="${j}" data-field="time"
          >
          <button
            style="background:#ff5a5a;color:#fff;border:none;border-radius:10px;width:36px;height:36px;cursor:pointer;"
            data-patient-index="${i}" data-rx-index="${j}"
          >✕</button>
        </div>
      `;
    }).join("");

    card.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px;">P${p.id}</div>
      <input
        value="${p.name}"
        style="width:100%;padding:8px;border-radius:10px;border:1px solid #ccc;margin-bottom:10px;"
        data-patient-index="${i}" data-field="name"
      >
      ${prescriptionsHTML}
    `;

    patientList.appendChild(card);
  });

  // ===== Attach Event Listeners after rendering =====
  // Update patient name
  patientList.querySelectorAll('input[data-field="name"]').forEach(input => {
    input.addEventListener("input", e => {
      const idx = e.target.dataset.patientIndex;
      patients[idx].name = e.target.value;
    });
  });

  // Update prescription fields
  patientList.querySelectorAll('input[data-field]').forEach(input => {
    if (input.dataset.field === "medicine") {
      input.addEventListener("input", e => {
        const pi = e.target.dataset.patientIndex;
        const ri = e.target.dataset.rxIndex;
        patients[pi].prescriptions[ri].medicine = e.target.value;
      });
    }
    if (input.dataset.field === "date") {
      input.addEventListener("change", e => {
        const pi = e.target.dataset.patientIndex;
        const ri = e.target.dataset.rxIndex;
        const time = patients[pi].prescriptions[ri].datetime.split("T")[1];
        patients[pi].prescriptions[ri].datetime = e.target.value + "T" + time;
      });
    }
    if (input.dataset.field === "time") {
      input.addEventListener("change", e => {
        const pi = e.target.dataset.patientIndex;
        const ri = e.target.dataset.rxIndex;
        const date = patients[pi].prescriptions[ri].datetime.split("T")[0];
        patients[pi].prescriptions[ri].datetime = date + "T" + e.target.value;
      });
    }
  });

  // Delete prescription
  patientList.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", e => {
      const pi = e.target.dataset.patientIndex;
      patients[pi].prescriptions.splice(e.target.dataset.rxIndex, 1);
      renderPatients();
    });
  });
}

// Add new patient
document.getElementById("add-patient").addEventListener("click", () => {
  const newId = String(patients.length + 1).padStart(3, "0");
  patients.push({ id: newId, name: "New Patient", prescriptions: [{ medicine: "", datetime: new Date().toISOString().slice(0, 16) }] });
  renderPatients();
});

// Open patient modal
patientTab.addEventListener("click", () => {
  renderPatients();
  patientModal.style.display = "flex";
});

// Close modal
document.getElementById("close-modal").addEventListener("click", () => {
  patientModal.style.display = "none";
});

// ===== DISPENSER LOGIC =====
document.getElementById("dispense-btn").addEventListener("click", () => {
  const btn = document.getElementById("dispense-btn");
  btn.textContent = "Dispensing...";
  btn.disabled = true;

  setTimeout(() => {
    bottle.src = "https://raw.githubusercontent.com/jugendjohn/pixi-live2d-remake/main/Samples/Resources/bottle.png";
    medText.textContent = "Dispensed!";
    btn.textContent = "Dispense";
    btn.disabled = false;
  }, 1500);
});
