const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz_DCYh_Qk-FpAPhXmK0HStn7RmpYEPeQkXUnjjhp1JNuG_PoUAqsLxaHRC1-Tv0fq9QQ/exec";

function saveLocation(){
  fetch(WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "saveSettings",
      lat: venueLat.value,
      lng: venueLng.value,
      radius: venueRadius.value
    })
  }).then(()=>alert("Location saved"));
}

function generateQR(){
  qr.innerHTML="";
  const today = new Date().toISOString().split("T")[0];
  new QRCode(qr,{ text: today, width:200, height:200 });
}
