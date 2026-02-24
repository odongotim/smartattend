const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyB__67wnnswnzRP08TvQfhrA2Na-sl2IEZAGmfAVHZoCdMtRwkdrDRhruI6E5hFYVh8Q/exec";

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
    alert("Geolocation is not supported by this browser.");
    return;
  }

  startScanner();
};

function startScanner() {
  if (scanner) scanner.clear();

  scanner = new Html5Qrcode("reader");

  const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

  scanner.start(
    { facingMode: "environment" },
    config,
    async (qrText) => {
      if (scanned) return;
      scanned = true;

      try {
        await scanner.stop();
        document.getElementById("result").innerText = qrText;

        navigator.geolocation.getCurrentPosition(
          (pos) => sendScan(qrText, pos.coords.latitude, pos.coords.longitude),
          (err) => {
            alert("Location error: " + err.message + ". Please enable GPS.");
            scanned = false;
            startScanner();
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } catch (err) {
        console.error("Stop Error:", err);
        scanned = false;
      }
    }
  ).catch(err => {
    console.error("Camera Start Error:", err);
    alert("Camera Error: " + err);
  });
}

function sendScan(qrText, lat, lng) {
  document.getElementById("result").innerText = "Sending to server...";

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
  .then(response => {
    console.log("Server response:", response);
    alert(response);
    scanned = false;
    startScanner(); // restart scanner for next QR
  })
  .catch(error => {
    console.error("Network Error:", error);
    alert("Network error ❌. Please check your internet connection.");
    scanned = false;
    startScanner();
  });
}