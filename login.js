// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA_x09ePbtXQ96lLvXzrLkGUb1U3klBfOM",
  authDomain: "loker-bc23d.firebaseapp.com",
  databaseURL: "https://loker-bc23d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "loker-bc23d",
  storageBucket: "loker-bc23d.appspot.com",
  messagingSenderId: "292212374092",
  appId: "1:292212374092:web:ed2111258acffc1c0752e9",
  measurementId: "G-QECZ68YHJN"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Role toggle
const btnJobseeker = document.getElementById("btn-jobseeker");
const btnCompany = document.getElementById("btn-company");
const selectedRole = document.getElementById("selected-role");
document.getElementById("login-form").classList.add("active");

btnJobseeker.addEventListener("click", () => {
  btnJobseeker.classList.add("active");
  btnCompany.classList.remove("active");
  selectedRole.value = "jobseeker";
});

btnCompany.addEventListener("click", () => {
  btnCompany.classList.add("active");
  btnJobseeker.classList.remove("active");
  selectedRole.value = "company";
});

// Login
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = selectedRole.value;

  const rolePathMap = {
    jobseeker: "users/jobseeker",
    company: "users/perusahaan"
  };

  const userPath = rolePathMap[role];

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;

      db.ref(`${userPath}/${uid}`).once("value", (snapshot) => {
        if (snapshot.exists()) {
          alert("Login berhasil!");

          if (role === "jobseeker") {
            window.location.href = "index.html";
          } else {
            window.location.href = "dashboard.html";
          }
        } else {
          auth.signOut();
          alert("Akun ini bukan tipe " + role + ". Silakan pilih role yang sesuai.");
        }
      });
    })
    .catch((error) => {
      alert("Login gagal: " + error.message);
    });
});
