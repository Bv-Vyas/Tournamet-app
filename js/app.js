const BACKEND_URL = "https://proxyserver-59li.onrender.com";

// ------------------ GLOBALS ------------------
let allTeams = [];
let activeSport = "क्रिकेट"; // default sport filter
let searchTerm = ""; // store current search term

// ------------------ LOADING SPINNER ------------------
function showLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.classList.remove("d-none");
}

function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.classList.add("d-none");
}

// ------------------ Assign Random Images to Teams ------------------
// Random image array
const teamImages = [
  "images/Team/Sport1.png",
  "images/Team/Sport3.png",
  "images/Team/Sport4.jpg",
  "images/Team/Sport5.jpg",
];

// Function to get a random image
function getRandomTeamImage() {
  const index = Math.floor(Math.random() * teamImages.length);
  return teamImages[index];
}

// ------------------ TOAST NOTIFICATIONS ------------------
function showNotification(message, type = "success", duration = 3000) {
  const container = document.getElementById("notificationContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-white bg-${type} border-0 mb-2`;
  toast.role = "alert";
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast, { delay: duration });
  bsToast.show();

  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

// ------------------ LOAD TEAMS ------------------
async function loadTeams() {
  showLoading();
  try {
    const res = await fetch(`${BACKEND_URL}/api?action=list`);
    const data = await res.json();
    allTeams = data.data || []; // store all teams
    displayTeams(); // display default active sport
  } catch (err) {
    console.error(err);
    showNotification("Error fetching teams.", "danger");
  } finally {
    hideLoading();
  }
}

// ------------------ DISPLAY TEAMS (FILTERED BY SPORT & SEARCH) ------------------
function displayTeams() {
  const container = document.getElementById("teamsContainer");
  container.innerHTML = "";

  // Filter by sport
  let filteredTeams = allTeams.filter(
    (team) => (team.Sport || "").toLowerCase() === activeSport.toLowerCase()
  );

  // Further filter by search term (team name or captain name)
  if (searchTerm) {
    filteredTeams = filteredTeams.filter(
      (team) =>
        (team["Team Name"] || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (team["Captain Name"] || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }

  if (filteredTeams.length === 0) {
    container.innerHTML = `<p class="text-center text-muted">कोई ${activeSport} टीम नहीं मिली.</p>`;
    return;
  }

  filteredTeams.forEach((team, index) => {
    const teamName = team["Team Name"] || "Unnamed Team";
    const sport = team["Sport"] || "Unknown Sport";
    const captain = team["Captain Name"] || "Unknown Captain";
    const players = team.players || [];

    const playersTable = players
      .map(
        (p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.name}</td>
        <td>${p.father || "-"}</td>
        <td>${p.mobile || "-"}</td>
        <td>${p.village || "-"}</td>
      </tr>`
      )
      .join("");

    const card = document.createElement("div");
    card.className = "col-md-4 mb-4";
    card.innerHTML = `
      <div class="card shadow-sm border-0">
        <div class="position-relative">
          <img src="${getRandomTeamImage()}" class="card-img-top" alt="Team Image" style="height:200px; object-fit:cover;">
          <div class="position-absolute bottom-0 start-0 w-100 p-3 bg-dark bg-opacity-75 text-white">
            <h5 class="mb-1">${teamName}</h5>
            <p class="mb-0 small"><label class="badge bg-primary text-white">${sport}</label>
 | कप्तान: ${captain}</p>
          </div>
        </div>
        <div class="card-body">
          <button class="btn btn-outline-primary w-100" type="button" 
                  data-bs-toggle="collapse" 
                  data-bs-target="#details-${index}" 
                  aria-expanded="false" 
                  aria-controls="details-${index}">
            टीम विवरण देखें
          </button>
          <div class="collapse mt-3" id="details-${index}">
            <div class="card card-body bg-light">
              <h6 class="text-primary">कप्तान का विवरण</h6>
              <p class="mb-1"><strong>नाम:</strong> ${captain}</p>
              <p class="mb-1"><strong>मोबाइल नं.:</strong> ${
                team["Captain Mobile"]
              }</p>
              <p class="mb-3"><strong>गाँव:</strong> ${
                team["Captain Village"]
              }</p>
              <h6 class="text-secondary">खिलाडी</h6>
              <div class="table-responsive">
                <table class="table table-bordered table-sm mb-0">
                  <thead class="table-primary">
                    <tr>
                      <th>#</th>
                      <th>नाम</th>
                      <th>पिता का नाम</th>
                      <th>मोबाइल नंबर</th>
                      <th>गाँव</th>
                    </tr>
                  </thead>
                  <tbody>${playersTable}</tbody>
                </table>
              </div>
                <button class="btn btn-sm btn-warning mt-2 w-100" 
                  onclick="openEditModal('${team.ID}')">
                  Edit Team
                </button>
            </div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ------------------ EDIT MODAL ------------------
function openEditModal(teamId) {
  const team = allTeams.find((t) => t.ID === teamId);
  if (!team) return showNotification("टीम नहीं मिली।", "danger");
  editingTeamId = teamId;

  const modal = new bootstrap.Modal(document.getElementById("editTeamModal"));
  const form = document.getElementById("editTeamForm");

  // Prefill captain details
  form.sport.value = team.Sport;
  form.sport.disabled = true;
  form.teamName.value = team["Team Name"];
  form.captainName.value = team["Captain Name"];
  form.captainMobile.value = team["Captain Mobile"];
  form.captainVillage.value = team["Captain Village"];

  // Prefill players
  const container = document.getElementById("editPlayersContainer");
  container.innerHTML = "";
  (team.players || []).forEach((p) => addEditPlayerRow(p));

  modal.show();
}

// ------------------ ADD PLAYER ROW IN EDIT ------------------
function addEditPlayerRow(player = {}) {
  const container = document.getElementById("editPlayersContainer");
  const div = document.createElement("div");
  div.className = "row g-2 mb-2 player-row";
  div.innerHTML = `
    <div class="col-md-3"><input type="text" class="form-control p-name" placeholder="नाम" value="${
      player.name || ""
    }" required></div>
    <div class="col-md-2"><input type="text" class="form-control p-father" placeholder="पिता का नाम" value="${
      player.father || ""
    }" required></div>
    <div class="col-md-2"><input type="text" class="form-control p-village" placeholder="गाँव" value="${
      player.village || ""
    }" required></div>
    <div class="col-md-2"><input type="text" class="form-control p-mobile" placeholder="मोबाइल नं." value="${
      player.mobile || ""
    }" required></div>
    <div class="col-md-1"><button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.parentElement.remove()">Remove</button></div>
  `;
  container.appendChild(div);
}

// ------------------ SAVE EDITED TEAM ------------------
async function saveEditedTeam(e) {
  e.preventDefault();

  const form = document.getElementById("editTeamForm");
  const mobileRegex = /^[0-9]{10}$/;
  const sport = form.sport.value.trim();
  const teamName = form.teamName.value.trim();
  const captainName = form.captainName.value.trim();
  const captainMobile = form.captainMobile.value.trim();
  const captainVillage = form.captainVillage.value.trim();

  if (
    !sport ||
    !teamName ||
    !captainName ||
    !captainVillage ||
    !mobileRegex.test(captainMobile)
  ) {
    return showNotification("कृपया सभी विवरण सही भरें।", "warning");
  }

  const playerRows = document.querySelectorAll(
    "#editPlayersContainer .player-row"
  );
  if (playerRows.length === 0)
    return showNotification("कम से कम एक खिलाड़ी होना चाहिए।", "warning");

  const players = [];
  for (let i = 0; i < playerRows.length; i++) {
    const row = playerRows[i];
    const name = row.querySelector(".p-name").value.trim();
    const father = row.querySelector(".p-father").value.trim();
    const village = row.querySelector(".p-village").value.trim();
    const mobile = row.querySelector(".p-mobile").value.trim();

    if (!name || !father || !village || !mobile || !mobileRegex.test(mobile)) {
      return showNotification(`खिलाड़ी ${i + 1} का विवरण गलत है।`, "warning");
    }
    players.push({ name, father, village, mobile });
  }

  const body = {
    action: "update",
    ID: editingTeamId,
    sport,
    teamName,
    captainName,
    captainMobile,
    captainVillage,
    players,
  };

  try {
    showLoading();
    const res = await fetch(`${BACKEND_URL}/api`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.status === "success") {
      showNotification("टीम सफलतापूर्वक अपडेट हुई!", "success");
      bootstrap.Modal.getInstance(
        document.getElementById("editTeamModal")
      ).hide();
      loadTeams();
    } else {
      showNotification(data.message || "अपडेट में त्रुटि", "danger");
    }
  } catch (err) {
    console.error(err);
    showNotification("अपडेट में विफल।", "danger");
  } finally {
    hideLoading();
  }
}

// ------------------ SPORT FILTER TABS ------------------
function setupSportFilters() {
  const container = document.getElementById("sportFilterContainer");
  if (!container) return;

  // Create filter buttons dynamically
  container.innerHTML = `
    <div class="d-flex justify-content-center mb-4">
      <button id="filter-cricket" class="btn me-2">क्रिकेट</button>
      <button id="filter-volleyball" class="btn me-2">वॉलीबाल</button>
      <button id="filter-Shooting Ball" class="btn">शूटिंग बॉल</button>
    </div>
  `;

  const cricketBtn = document.getElementById("filter-cricket");
  const volleyballBtn = document.getElementById("filter-volleyball");
  const ShootingBallBtn = document.getElementById("filter-Shooting Ball");
  const searchInput = document.getElementById("teamSearch");

  // Set default active buttons
  cricketBtn.classList.add("btn-primary", "active");
  volleyballBtn.classList.add("btn-outline-primary");
  ShootingBallBtn.classList.add("btn-outline-primary");

  // Sport filter events
  cricketBtn.addEventListener("click", () => {
    activeSport = "क्रिकेट";
    cricketBtn.classList.add("btn-primary", "active");
    cricketBtn.classList.remove("btn-outline-primary");
    volleyballBtn.classList.remove("btn-primary", "active");
    volleyballBtn.classList.add("btn-outline-primary");
    ShootingBallBtn.classList.remove("btn-primary", "active");
    ShootingBallBtn.classList.add("btn-outline-primary");
    displayTeams();
  });

  volleyballBtn.addEventListener("click", () => {
    activeSport = "वॉलीबॉल";
    volleyballBtn.classList.add("btn-primary", "active");
    volleyballBtn.classList.remove("btn-outline-primary");
    cricketBtn.classList.remove("btn-primary", "active");
    cricketBtn.classList.add("btn-outline-primary");
    ShootingBallBtn.classList.remove("btn-primary", "active");
    ShootingBallBtn.classList.add("btn-outline-primary");
    displayTeams();
  });

  ShootingBallBtn.addEventListener("click", () => {
    activeSport = "शूटिंग बॉल";
    ShootingBallBtn.classList.add("btn-primary", "active");
    ShootingBallBtn.classList.remove("btn-outline-primary");
    volleyballBtn.classList.remove("btn-primary", "active");
    volleyballBtn.classList.add("btn-outline-primary");
    cricketBtn.classList.remove("btn-primary", "active");
    cricketBtn.classList.add("btn-outline-primary");
    displayTeams();
  });

  // Search input event
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value.trim();
    displayTeams();
  });
}

// ------------------ CREATE TEAM ------------------
function setupTeamForm() {
  const form = document.getElementById("teamForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Remove previous highlights
    form
      .querySelectorAll(".is-invalid")
      .forEach((el) => el.classList.remove("is-invalid"));

    const mobileRegex = /^[0-9]{10}$/;

    // ✅ Captain Fields
    const sport = form.sport.value.trim();
    const teamName = form.teamName.value.trim();
    const captainName = form.captainName.value.trim();
    const captainMobile = form.captainMobile.value.trim();
    const captainVillage = form.captainVillage.value.trim();

    let valid = true;

    if (!sport) {
      form.sport.classList.add("is-invalid");
      valid = false;
    }
    if (!teamName) {
      form.teamName.classList.add("is-invalid");
      valid = false;
    }
    if (!captainName) {
      form.captainName.classList.add("is-invalid");
      valid = false;
    }
    if (!captainVillage) {
      form.captainVillage.classList.add("is-invalid");
      valid = false;
    }
    if (!mobileRegex.test(captainMobile)) {
      form.captainMobile.classList.add("is-invalid");
      valid = false;
      showNotification(
        "कृपया कप्तान का सही मोबाइल नंबर दर्ज करें (10 अंक)।",
        "warning"
      );
    }

    if (!valid) {
      showNotification(
        "कृपया कप्तान और टीम की सभी जानकारी सही ढंग से भरें।",
        "warning"
      );
      return;
    }

    // ✅ Validate Players
    const playerRows = document.querySelectorAll(".player-row");
    if (playerRows.length === 0) {
      showNotification("कम से कम एक खिलाड़ी जोड़ना आवश्यक है।", "warning");
      return;
    }

    const players = [];
    let allPlayersValid = true;

    playerRows.forEach((row, index) => {
      const nameInput = row.querySelector(".p-name");
      const fatherInput = row.querySelector(".p-father");
      const villageInput = row.querySelector(".p-village");
      const mobileInput = row.querySelector(".p-mobile");

      const name = nameInput.value.trim();
      const father = fatherInput.value.trim();
      const village = villageInput.value.trim();
      const mobile = mobileInput.value.trim();

      [nameInput, fatherInput, villageInput, mobileInput].forEach((el) =>
        el.classList.remove("is-invalid")
      );

      // Required field validation
      if (!name || !father || !village || !mobile) {
        allPlayersValid = false;
        showNotification(
          `कृपया खिलाड़ी ${index + 1} की सभी जानकारी भरें।`,
          "warning"
        );
        if (!name) nameInput.classList.add("is-invalid");
        if (!father) fatherInput.classList.add("is-invalid");
        if (!village) villageInput.classList.add("is-invalid");
        if (!mobile) mobileInput.classList.add("is-invalid");
      }
      // Mobile validation
      else if (!mobileRegex.test(mobile)) {
        mobileInput.classList.add("is-invalid");
        allPlayersValid = false;
        showNotification(
          `खिलाड़ी ${index + 1} का मोबाइल नंबर अमान्य है (10 अंक)।`,
          "warning"
        );
      }

      players.push({ name, father, village, mobile });
    });

    if (!allPlayersValid) return;

    // ✅ All Valid
    const body = {
      action: "create",
      sport,
      teamName,
      captainName,
      captainMobile,
      captainVillage,
      players,
    };

    try {
      showLoading();
      const res = await fetch(`${BACKEND_URL}/api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.status === "success") {
        showNotification("🎉 टीम सफलतापूर्वक बनाई गई!", "success");
        setTimeout(() => (window.location.href = "index.html"), 1500);
      } else {
        showNotification(
          "त्रुटि: " + (data.message || "अज्ञात त्रुटि"),
          "danger"
        );
      }
    } catch (err) {
      console.error(err);
      showNotification("टीम बनाने में विफल।", "danger");
    } finally {
      hideLoading();
    }
  });
}

// ------------------ ADD PLAYER ROW ------------------
function addPlayerRow() {
  const container = document.getElementById("playersContainer");
  const div = document.createElement("div");
  div.className = "row g-2 mb-2 player-row";
  div.innerHTML = `
    <div class="col-md-3"><input type="text" class="form-control p-name" placeholder="नाम" required></div>
    <div class="col-md-2"><input type="text" class="form-control p-father" placeholder="पिता का नाम" required></div>
    <div class="col-md-2"><input type="text" class="form-control p-village" placeholder="गाँव" required></div>
    <div class="col-md-2"><input type="text" class="form-control p-mobile" placeholder="मोबाइल नं." required></div>
    <div class="col-md-1"><button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.parentElement.remove()">Remove</button></div>
  `;
  container.appendChild(div);
}

// ------------------ ON PAGE LOAD ------------------
window.onload = () => {
  if (document.getElementById("teamsContainer")) {
    loadTeams();
    setupSportFilters();
  }
  if (document.getElementById("teamForm")) setupTeamForm();

  // Attach save edit event
  const editForm = document.getElementById("editTeamForm");
  if (editForm) editForm.addEventListener("submit", saveEditedTeam);
};
