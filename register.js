function register(){
  const name = document.getElementById("name").value;
  const reg = document.getElementById("reg").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if(!name || !reg || !email || !password){
    document.getElementById("msg").innerText = "All fields are required";
    return;
  }

  fetch("https://script.google.com/macros/s/AKfycby7lDB1nEMEbSrmx45oHZTpiI-cGr9FBGGANfSnt3bllYWtGaPAsQzCmfdJnqtb-Nj8/exec", {
    method: "POST",
    body: JSON.stringify({
      action: "register",
      name,
      reg,
      email,
      password
    })
  })
  .then(res => res.text())
  .then(response => {
    if(response === "success"){
      document.getElementById("msg").innerText = "Registration successful! Please login.";
      setTimeout(()=> window.location.href="login.html", 1500);
    } else {
      document.getElementById("msg").innerText = response;
    }
  });
}