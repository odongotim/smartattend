const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzk10M26SgP4PrnBrBnnjSPzqAuNxauuG0-zKhY5NecJJEkeQqi_mJhJ-bnn1-UGMnR4w/exechttps://script.google.com/macros/s/AKfycbz_DCYh_Qk-FpAPhXmK0HStn7RmpYEPeQkXUnjjhp1JNuG_PoUAqsLxaHRC1-Tv0fq9QQ/exec";

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