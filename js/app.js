const BACKEND_URL = "https://proxyserver-59li.onrender.com";

// ------------------ LOADING SPINNER ------------------
function showLoading() {
  const overlay = document.getElementById("loadingOverlay");
  overlay.classList.remove("d-none");
}

function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  overlay.classList.add("d-none");
}

let currentUser = null;

// --------- GOOGLE LOGIN ---------
function handleCredentialResponse(response) {
  const payload = JSON.parse(atob(response.credential.split(".")[1]));
  currentUser = { name: payload.name, email: payload.email };
  localStorage.setItem("jwt", response.credential); // Store JWT
  showLoginUI(currentUser);
}

function showLoginUI(user) {
  document.getElementById(
    "loginDiv"
  ).innerHTML = `<span class="text-light fw-semibold">${user.name}</span>`;
  const allowedCaptains = ["captain1@example.com"]; // Add your allowed captains
  if (allowedCaptains.includes(user.email.toLowerCase())) {
    const btn = document.getElementById("createTeamBtn");
    if (btn) btn.style.display = "inline-block";
  }
}

window.onload = () => {
  google.accounts.id.initialize({
    client_id:
      "529584314337-4gfhs62h24l6qai5qkaotbv62762f3nn.apps.googleusercontent.com",
    callback: handleCredentialResponse,
  });
  google.accounts.id.renderButton(document.getElementById("loginDiv"), {
    theme: "outline",
    size: "medium",
  });
  google.accounts.id.prompt();

  if (document.getElementById("teamsContainer")) loadTeams();
  if (document.getElementById("teamForm")) setupTeamForm();
  if (window.location.pathname.includes("team-details.html")) loadTeamDetails();
};

// --------- LOAD TEAMS (Updated with Expand Feature) ---------
async function loadTeams() {
  showLoading();
  try {
    const res = await fetch(`${BACKEND_URL}/api?action=list`);
    const data = await res.json();
    const container = document.getElementById("teamsContainer");
    container.innerHTML = "";

    if (!data.data || data.data.length === 0) {
      container.innerHTML = `<p class="text-center text-muted">No teams available yet.</p>`;
      return;
    }

    if (data.success && Array.isArray(data.data)) {
      data.data.forEach((team, index) => {
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
              <img src="images/PPL_logo.jpeg" class="card-img-top" alt="Team Image" style="height:200px; object-fit:cover;">
              <div class="position-absolute bottom-0 start-0 w-100 p-3 bg-dark bg-opacity-75 text-white">
                <h5 class="mb-1">${teamName}</h5>
                <p class="mb-0 small">${sport} | Captain: ${captain}</p>
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
                  <p class="mb-1"><strong>Email:</strong> ${team["Captain Email"]}</p>
                  <p class="mb-1"><strong>Mobile:</strong> ${team["Captain Mobile"]}</p>
                  <p class="mb-3"><strong>Village:</strong> ${team["Captain Village"]}</p>

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
    } else {
      console.error("Invalid data format:", data);
    }
  } catch (err) {
    console.error(err);
    document.getElementById(
      "teamsContainer"
    ).innerHTML = `<p class="text-danger text-center">Error fetching teams.</p>`;
  } finally {
    hideLoading(); // <-- Hide spinner after success or failure
  }
}

// --------- CREATE TEAM ---------
function setupTeamForm() {
  const form = document.getElementById("teamForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwt");
    if (!token) return alert("Login first to create a team!");

    const players = [];
    document.querySelectorAll(".player-row").forEach((row) => {
      players.push({
        name: row.querySelector(".p-name").value,
        fatherName: row.querySelector(".p-father").value,
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
      const res = await fetch(`${BACKEND_URL}/api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        alert("Team created successfully!");
        window.location.href = "index.html";
      } else {
        alert("Failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create team.");
    }
  });
}

// --------- ADD PLAYER ROW ---------
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
