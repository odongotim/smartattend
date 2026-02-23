const user = JSON.parse(localStorage.getItem("attendanceUser"));
if(!user) window.location.href = "index.html";

document.getElementById("welcome").innerText = "Welcome, " + user.name;

// ---------------- Geolocation Check ----------------
function checkLocation(userLat, userLng) {
  const venueLat = parseFloat(localStorage.getItem("venueLat"));
  const venueLng = parseFloat(localStorage.getItem("venueLng"));
  const radius = parseFloat(localStorage.getItem("venueRadius"));

  if(!venueLat || !venueLng || !radius){
    alert("Venue location not set by admin. Contact organizer.");
    return false;
  }

  const R = 6371000; // Earth radius in meters
  const dLat = (userLat - venueLat) * Math.PI / 180;
  const dLng = (userLng - venueLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(venueLat*Math.PI/180) * Math.cos(userLat*Math.PI/180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance <= radius;
}

// ---------------- Attendance Function ----------------
function markAttendance(qrData){
  const today = new Date();
  const eventName = qrData;

  if(localStorage.getItem(eventName)){
    document.getElementById("status").innerText = "Attendance already marked today!";
    return;
  }

  // Send data to Google Sheets
  fetch("https://script.google.com/macros/s/AKfycby7lDB1nEMEbSrmx45oHZTpiI-cGr9FBGGANfSnt3bllYWtGaPAsQzCmfdJnqtb-Nj8/exec", {
    method: "POST",
    body: JSON.stringify({
      name: user.name,
      reg: user.reg,
      email: user.email,
      event: eventName,
      time: today.toLocaleString()
    })
  }).then(()=>{
    localStorage.setItem(eventName, "submitted");
    document.getElementById("status").innerText = "Attendance marked successfully!";
  });
}

// ---------------- Camera-only QR Scan ----------------
const html5QrCode = new Html5Qrcode("reader");
html5QrCode.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: 250 },
  (decodedText) => {
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(function(position){
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        if(checkLocation(userLat, userLng)){
          markAttendance(decodedText);
        } else {
          document.getElementById("status").innerText = "You are not at the venue. Attendance denied.";
        }
      }, function(error){
        alert("Location access is required to mark attendance.");
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }
);