// Fixed: Removed the double URL and kept the correct one
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwULUgwMUa0eOJAF4AwubRFc8aSBThVuykKqBx3h46sxuoVrX1F6i5Lvl474aMTVXPVig/exec";

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
  // Clear any existing scanner instance before starting
  if (scanner) {
    scanner.clear();
  }

  scanner = new Html5Qrcode("reader");

  const config = { 
    fps: 10, 
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0 
  };

  // facingMode: "environment" forces the back camera
  scanner.start(
    { facingMode: "environment" },
    config,
    async (qrText) => {
      if (scanned) return;
      scanned = true;

      try {
        await scanner.stop();
        document.getElementById("result").innerText = qrText;

        // Get location only AFTER a successful scan
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            sendScan(qrText, pos.coords.latitude, pos.coords.longitude);
          },
          (err) => {
            alert("Location error: " + err.message + " ❌. Please enable GPS.");
            scanned = false;
            startScanner(); // Restart scanner if location fails
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } catch (err) {
        console.error("Stop Error:", err);
      }
    }
  ).catch(err => {
    // This catches the "Requested device not found" error
    console.error("Camera Start Error:", err);
    alert("Camera Error: " + err + "\n\n1. Ensure no other app is using the camera.\n2. Check browser permissions.\n3. Try opening in Chrome/Safari directly.");
  });
}

function sendScan(qrText, lat, lng) {
  // Show a loading state if you have one
  document.getElementById("result").innerText = "Sending to server...";

  fetch(WEB_APP_URL, {
    method: "POST",
    mode: "cors", // Helps bypass CORS 'Network Error' on some mobile browsers
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "scan",
      qrData: qrText,
      userLat: lat,
      userLng: lng
    })
  })
  .then(() => {
    // With 'no-cors', we can't read the response body, 
    // but we know the request was sent successfully.
    alert("Scan submitted successfully! ✅");
    setTimeout(() => location.reload(), 1000);
  })
  .catch((error) => {
    console.error("Network Error:", error);
    alert("Network error ❌. Please check your internet connection.");
    scanned = false;
  });
}