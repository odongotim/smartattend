let scanner;
let scanned = false;

function logout() {
  localStorage.removeItem("isUserLoggedIn");
  location.href = "login.html";
}

window.onload = () => {
  if (localStorage.getItem("isUserLoggedIn") !== "true") {
    location.href = "login.html";
    return;
  }

  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  startScanner();
};

function startScanner() {
  scanner = new Html5Qrcode("reader");

  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },

    async (qrText) => {
      if (scanned) return;
      scanned = true;

      await scanner.stop();
      result.innerText = qrText;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendScan(qrText, pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          alert("Location permission denied ❌");
          scanned = false;
        },
        { enableHighAccuracy: true }
      );
    }
  );
}

function sendScan(qrText, lat, lng) {
  fetch(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "scan",
      qrData: qrText,
      userLat: lat,
      userLng: lng
    })
  })
  .then(res => res.text())
  .then(msg => alert(msg))
  .catch(() => alert("Network error ❌"));
}

function doGet(e) {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName("Attendance");

  if (!sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({ total: 0, today: 0, rows: [] })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  data.shift(); // remove header

  const todayStr = new Date().toDateString();
  let todayCount = 0;

  const rows = data.map(r => {
    const date = new Date(r[0]);
    if (date.toDateString() === todayStr) todayCount++;
    return {
      time: date.toLocaleString(),
      qr: r[1]
    };
  });

  return ContentService.createTextOutput(
    JSON.stringify({
      total: data.length,
      today: todayCount,
      rows: rows.reverse()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

const USERS = "Users";

// Handle both GET & POST
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActive();

  if (data.action === "register") return registerUser(ss, data);
  if (data.action === "login") return loginUser(ss, data);
  if (data.action === "scan") return handleScan(ss, data);
  if (data.action === "saveSettings") return saveSettings(ss, data);

  return respond("Invalid action");
}

// REGISTER
function registerUser(ss, data) {
  const sh = ss.getSheetByName(USERS) || ss.insertSheet(USERS);

  if (sh.getLastRow() === 0)
    sh.appendRow(["Username", "Password", "Registered"]);

  const users = sh.getRange(2,1,sh.getLastRow(),1).getValues().flat();
  if (users.includes(data.username))
    return respond("exists");

  sh.appendRow([data.username, data.password, new Date()]);
  return respond("registered");
}

// LOGIN
function loginUser(ss, data) {
  const sh = ss.getSheetByName(USERS);
  if (!sh) return respond("invalid");

  const rows = sh.getDataRange().getValues();
  for (let i=1;i<rows.length;i++){
    if (rows[i][0] === data.username && rows[i][1] === data.password)
      return respond("success");
  }
  return respond("invalid");
}