const API_URL = "https://proxyserver-59li.onrender.com/api"; // ✅ Change this to your backend proxy URL

// Extract team name from URL query
const params = new URLSearchParams(window.location.search);
const teamName = params.get("team");

// Get references to DOM elements
const teamInfoDiv = document.getElementById("teamInfo");
const playersTableBody = document.getElementById("playersTableBody");

async function fetchTeamDetails() {
  if (!teamName) {
    teamInfoDiv.innerHTML = `<p class="text-danger">No team selected.</p>`;
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}?teamName=${encodeURIComponent(teamName)}`
    );
    const data = await response.json();

    if (data.success && data.data.length > 0) {
      const team = data.data[0];

      // Captain & team info
      teamInfoDiv.innerHTML = `
        <div class="row mb-4">
          <div class="col-md-6">
            <h4 class="fw-bold">${team["Team Name"]}</h4>
            <p><strong>Sport:</strong> ${team["Sport"]}</p>
            <p><strong>Created On:</strong> ${new Date(
              team["CreatedAt"]
            ).toLocaleString()}</p>
          </div>
          <div class="col-md-6">
            <h5 class="fw-bold">Captain Details</h5>
            <p><strong>Name:</strong> ${team["Captain Name"]}</p>
            <p><strong>Email:</strong> ${team["Captain Email"]}</p>
            <p><strong>Mobile:</strong> ${team["Captain Mobile"]}</p>
            <p><strong>Village:</strong> ${team["Captain Village"]}</p>
          </div>
        </div>
      `;

      // Players table
      playersTableBody.innerHTML = "";
      team.players.forEach((player, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${player.name}</td>
          <td>${player.father}</td>
          <td>${player.role}</td>
          <td>${player.mobile}</td>
          <td>${player.village || "-"}</td>
        `;
        playersTableBody.appendChild(row);
      });
    } else {
      teamInfoDiv.innerHTML = `<p class="text-muted">No details found for this team.</p>`;
    }
  } catch (error) {
    console.error("Error fetching team details:", error);
    teamInfoDiv.innerHTML = `<p class="text-danger">Failed to load team details.</p>`;
  }
}

fetchTeamDetails();
