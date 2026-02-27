// Add this helper function at the top of scan.js
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

function onScanSuccess(decodedText) {
    if (hasMarked) return;

    const parts = decodedText.split('|');
    if (parts.length < 5) {
        updateStatus("Invalid QR Format", "red");
        return;
    }

    const [sessionName, timestamp, qLat, qLng, expiryMins] = parts;
    const currentTime = Date.now();
    const expiryLimit = parseInt(expiryMins) * 60 * 1000;

    // 1. Time Check
    if (currentTime - parseInt(timestamp) > expiryLimit) {
        updateStatus("QR Code Expired", "red");
        return;
    }

    // 2. Location Check
    updateStatus("Verifying Location...", "orange");
    navigator.geolocation.getCurrentPosition(pos => {
        const distance = getDistance(pos.coords.latitude, pos.coords.longitude, parseFloat(qLat), parseFloat(qLng));
        
        if (distance > 50) { // Limit: 50 meters
            updateStatus(`Too Far: ${Math.round(distance)}m away`, "red");
        } else {
            hasMarked = true;
            markAttendance(sessionName);
        }
    }, err => {
        updateStatus("Enable GPS to mark attendance", "red");
    });
}

function updateStatus(msg, color) {
    const res = document.getElementById("result");
    res.innerText = msg;
    res.style.color = color;
}