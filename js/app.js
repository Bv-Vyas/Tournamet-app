const BACKEND_URL = "https://proxyserver-59li.onrender.com";

// ------------------ GLOBALS ------------------
let allTeams = [];
let activeSport = "Cricket"; // default sport filter
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
    container.innerHTML = `<p class="text-center text-muted">No ${activeSport} teams found.</p>`;
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
        <td>${p.role || "-"}</td>
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
 | Captain: ${captain}</p>
          </div>
        </div>
        <div class="card-body">
          <button class="btn btn-outline-primary w-100" type="button" 
                  data-bs-toggle="collapse" 
                  data-bs-target="#details-${index}" 
                  aria-expanded="false" 
                  aria-controls="details-${index}">
            View Team Details
          </button>
          <div class="collapse mt-3" id="details-${index}">
            <div class="card card-body bg-light">
              <h6 class="text-primary">Captain Details</h6>
              <p class="mb-1"><strong>Name:</strong> ${captain}</p>
              <p class="mb-1"><strong>Email:</strong> ${
                team["Captain Email"]
              }</p>
              <p class="mb-1"><strong>Mobile:</strong> ${
                team["Captain Mobile"]
              }</p>
              <p class="mb-3"><strong>Village:</strong> ${
                team["Captain Village"]
              }</p>
              <h6 class="text-secondary">Players</h6>
              <div class="table-responsive">
                <table class="table table-bordered table-sm mb-0">
                  <thead class="table-primary">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Father</th>
                      <th>Role</th>
                      <th>Mobile</th>
                      <th>Village</th>
                    </tr>
                  </thead>
                  <tbody>${playersTable}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ------------------ SPORT FILTER TABS ------------------
function setupSportFilters() {
  const container = document.getElementById("sportFilterContainer");
  if (!container) return;

  // Create filter buttons dynamically
  container.innerHTML = `
    <div class="d-flex justify-content-center mb-4">
      <button id="filter-cricket" class="btn me-2">Cricket</button>
      <button id="filter-volleyball" class="btn">Volleyball</button>
    </div>
  `;

  const cricketBtn = document.getElementById("filter-cricket");
  const volleyballBtn = document.getElementById("filter-volleyball");
  const searchInput = document.getElementById("teamSearch");

  // Set default active buttons
  cricketBtn.classList.add("btn-primary", "active");
  volleyballBtn.classList.add("btn-outline-primary");

  // Sport filter events
  cricketBtn.addEventListener("click", () => {
    activeSport = "Cricket";
    cricketBtn.classList.add("btn-primary", "active");
    cricketBtn.classList.remove("btn-outline-primary");
    volleyballBtn.classList.remove("btn-primary", "active");
    volleyballBtn.classList.add("btn-outline-primary");
    displayTeams();
  });

  volleyballBtn.addEventListener("click", () => {
    activeSport = "Volleyball";
    volleyballBtn.classList.add("btn-primary", "active");
    volleyballBtn.classList.remove("btn-outline-primary");
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

    const players = [];
    document.querySelectorAll(".player-row").forEach((row) => {
      players.push({
        name: row.querySelector(".p-name").value,
        father: row.querySelector(".p-father").value,
        role: row.querySelector(".p-role").value,
        village: row.querySelector(".p-village").value,
        mobile: row.querySelector(".p-mobile").value,
      });
    });

    const body = {
      action: "create",
      sport: form.sport.value,
      teamName: form.teamName.value,
      captainName: form.captainName.value,
      captainEmail: form.captainEmail.value,
      captainMobile: form.captainMobile.value,
      captainVillage: form.captainVillage.value,
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
        showNotification("Team created successfully!", "success");
        setTimeout(() => (window.location.href = "index.html"), 1500);
      } else {
        showNotification(
          "Failed: " + (data.message || "Unknown error"),
          "danger"
        );
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to create team.", "danger");
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
    <div class="col-md-3"><input type="text" class="form-control p-name" placeholder="Name" required></div>
    <div class="col-md-2"><input type="text" class="form-control p-father" placeholder="Father Name"></div>
    <div class="col-md-2"><input type="text" class="form-control p-role" placeholder="Role"></div>
    <div class="col-md-2"><input type="text" class="form-control p-village" placeholder="Village"></div>
    <div class="col-md-2"><input type="text" class="form-control p-mobile" placeholder="Mobile"></div>
    <div class="col-md-1"><button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.parentElement.remove()">X</button></div>
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
};
