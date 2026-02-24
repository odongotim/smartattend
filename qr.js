const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzk10M26SgP4PrnBrBnnjSPzqAuNxauuG0-zKhY5NecJJEkeQqi_mJhJ-bnn1-UGMnR4w/exec";

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
