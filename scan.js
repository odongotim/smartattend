const userName = localStorage.getItem("name");
const regNo = localStorage.getItem("regNo");

if (userName && regNo) {
    document.getElementById("user").innerText = `Logged in as: ${userName} (${regNo})`;
}

function logout() {
    localStorage.clear();
    auth.signOut().then(() => {
        window.location.href = "login.html";
    });
}

let hasMarked = false; 

function markAttendance(qrData) {
    const user = auth.currentUser;

    if (!user) {
        alert("You are not logged in.");
        window.location.href = "login.html";
        return;
    }

    // --- DUPLICATE PREVENTION LOGIC ---
    // Create a unique ID for today (e.g., "BCS101_2026-02-26")
    const today = new Date().toISOString().split('T')[0]; 
    const docId = `${regNo}_${today}`; 

    const docRef = db.collection("attendance").doc(docId);

    docRef.get().then((doc) => {
        if (doc.exists) {
            // Document already exists for this student today
            document.getElementById("result").innerText = "Already marked for today!";
            document.getElementById("result").style.color = "orange";
            hasMarked = false; 
        } else {
            // No record yet, create one
            return docRef.set({
                uid: user.uid,
                name: userName,
                regNo: regNo,
                scanData: qrData || "No data",
                time: firebase.firestore.FieldValue.serverTimestamp(),
                date: today // Storing date string makes filtering easier later
            }).then(() => {
                document.getElementById("result").innerText = "Attendance marked!";
                document.getElementById("result").style.color = "green";
                console.log("Attendance saved with ID:", docId);
            });
        }
    }).catch(err => {
        console.error("Firebase Error:", err);
        alert("Error: " + err.message);
        hasMarked = false;
    });
}

function onScanSuccess(decodedText) {
    if (hasMarked) return;
    hasMarked = true;
    console.log("QR Scanned:", decodedText);
    markAttendance(decodedText);
}

// ---------------- Camera Controls ----------------
const html5QrCode = new Html5Qrcode("reader");
let cameras = [];
let currentCameraIndex = 0;
let isSwitching = false;

function startCamera(index) {
    if (!cameras || cameras.length === 0) return;
    const cameraId = cameras[index].id;

    html5QrCode.start(
        cameraId,
        { fps: 10, qrbox: 250 },
        onScanSuccess,
        errorMessage => { /* Scan noise */ }
    ).catch(err => console.error("Camera error:", err));
}

Html5Qrcode.getCameras().then(camList => {
    if (camList && camList.length) {
        cameras = camList;
        const backCam = camList.findIndex(c => c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("rear"));
        currentCameraIndex = backCam >= 0 ? backCam : 0;
        startCamera(currentCameraIndex);
    }
}).catch(err => console.error("Detection error:", err));

function switchCamera() {
    if (cameras.length < 2 || isSwitching) return;
    isSwitching = true;
    currentCameraIndex = (currentCameraIndex + 1) % cameras.length;

    html5QrCode.stop().then(() => startCamera(currentCameraIndex)).finally(() => { isSwitching = false; });
}