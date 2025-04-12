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

document.addEventListener("DOMContentLoaded", () => {
  setupNavbar();
  setupAuthState();
  setupLogout();
  fetchJobListings();
  setupFormLamaran();
});

// === NAVBAR TOGGLE ===
function setupNavbar() {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

// === CEK LOGIN USER ===
function setupAuthState() {
  const authButtons = document.getElementById("auth-buttons");
  const userInfo = document.getElementById("user-info");
  const userEmail = document.getElementById("user-email");

  auth.onAuthStateChanged((user) => {
    if (user) {
      authButtons.style.display = "none";
      userInfo.style.display = "flex";
      userEmail.textContent = user.email;
    } else {
      authButtons.style.display = "flex";
      userInfo.style.display = "none";
    }
  });
}

// === LOGOUT ===
function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      auth.signOut().then(() => {
        alert("Berhasil logout!");
        window.location.reload();
      });
    });
  }
}

// === FETCH LOWONGAN DARI FIREBASE ===
function fetchJobListings() {
  const container = document.getElementById("jobs-container");
  container.innerHTML = "<p>Memuat lowongan...</p>";

  db.ref("users/perusahaan").once("value")
    .then((snapshot) => {
      container.innerHTML = "";

      if (snapshot.exists()) {
        let jobs = [];

        snapshot.forEach((perusahaanSnap) => {
          const perusahaanData = perusahaanSnap.val();
          const companyName = perusahaanData.nama || "Perusahaan";

          const lowongan = perusahaanData.lowongan;
          if (lowongan) {
            Object.entries(lowongan).forEach(([id, job]) => {
              job.jobId = id;
              job.companyName = companyName;
              jobs.push(job);
            });
          }
        });

        jobs.sort((a, b) => b.timestamp - a.timestamp);

        jobs.forEach((job) => {
          const card = document.createElement("div");
          card.className = "job-card";
          card.innerHTML = `
            <div class="job-content">
              <h3>${sanitizeHTML(job.title || "Tanpa Judul")}</h3>
              <div class="company">${sanitizeHTML(job.companyName)}</div>
              <div class="salary">${job.salary ? `Gaji: ${sanitizeHTML(job.salary)}` : "Gaji: Tidak Diberikan"}</div>
            </div>
          `;
          card.addEventListener("click", () => {
            openJobModal(job, job.companyName);
          });
          container.appendChild(card);
        });
      } else {
        container.innerHTML = "<p>Belum ada lowongan tersedia.</p>";
      }
    })
    .catch((error) => {
      console.error("Gagal memuat lowongan:", error);
      container.innerHTML = "<p>Gagal memuat lowongan. Silakan coba lagi nanti.</p>";
    });
}

// Helper untuk mencegah HTML injection
function sanitizeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// === BUKA MODAL DETAIL LOWONGAN ===
function openJobModal(job, companyName) {
  if (!job || typeof job !== "object") {
    alert("Data lowongan tidak lengkap.");
    return;
  }

  const form = document.getElementById("apply-form");
  form.dataset.jobId = job.jobId;

  document.getElementById("modal-title").textContent = job.title || "-";
  document.getElementById("modal-company").textContent = companyName || "-";
  document.getElementById("modal-location").textContent = job.location || "-";
  document.getElementById("modal-description").textContent = job.description || "-";
  document.getElementById("modal-posted").textContent = job.postedAt
    ? new Date(job.postedAt).toLocaleString()
    : "-";
  document.getElementById("modal-salary").textContent = job.salary ? `Gaji: ${job.salary}` : "Gaji: Tidak Diberikan";
  document.getElementById("modal-job-type").textContent = job.jobType ? `Tipe: ${job.jobType}` : "Tipe: Tidak Diberikan";

  // Tampilkan modal dengan mengubah display menjadi 'block'
  document.getElementById("job-modal").style.display = "block";

  const user = auth.currentUser;
  if (user) {
    form.style.display = "block";
    document.getElementById("login-warning").style.display = "none";
  } else {
    form.style.display = "none";
    document.getElementById("login-warning").style.display = "block";
  }

  // Menambahkan event listener untuk menutup modal
  const closeModalButton = document.getElementById("modal-close");
  if (closeModalButton) {
    closeModalButton.addEventListener("click", () => {
      closeJobModal();
    });
  }

  // Menutup modal jika klik di luar modal
  window.addEventListener("click", (e) => {
    if (e.target === document.getElementById("job-modal")) {
      closeJobModal();
    }
  });
}

// === MENUTUP MODAL ===
function closeJobModal() {
  document.getElementById("job-modal").style.display = "none";
}

// === HANDLE FORM LAMARAN ===
function setupFormLamaran() {
  const form = document.getElementById("apply-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nama = document.getElementById("nama").value.trim();
    const cvLink = document.getElementById("link-cv").value.trim();
    const jobId = form.dataset.jobId;

    if (!nama || !cvLink || !jobId) {
      alert("Semua field wajib diisi ya bestie!");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Kamu harus login dulu untuk melamar kerja ya!");
      return;
    }

    const lamaranRef = db.ref(`lamaran/${jobId}/${user.uid}`);
    lamaranRef.set({
      userId: user.uid,
      nama,
      email: user.email,
      link_cv: cvLink,
      lowongan: jobId,
      perusahaan: document.getElementById("modal-company").textContent,
      timestamp: Date.now()
    }).then(() => {
      alert("Lamaranmu berhasil dikirim! Good luck 🤞");
      form.reset();
      closeJobModal();
    }).catch((err) => {
      console.error("Gagal mengirim lamaran:", err);
      alert("Ups! Gagal mengirim lamaran. Coba lagi nanti ya.");
    });
  });
}

// === KATEGORI ===
const categoryCards = document.querySelectorAll(".category-card");

categoryCards.forEach(card => {
  card.addEventListener("click", () => {
    const kategori = card.getAttribute("data-kategori");
    filterByCategory(kategori);
  });
});

function filterByCategory(kategori) {
  const jobsContainer = document.getElementById("jobs-container");
  jobsContainer.innerHTML = "<p>Loading...</p>";

  db.ref("users/perusahaan").once("value").then((snapshot) => {
    jobsContainer.innerHTML = "";

    snapshot.forEach(companySnap => {
      const perusahaan = companySnap.val();
      const companyName = perusahaan.nama || "Perusahaan";
      const jobs = perusahaan.lowongan;

      if (jobs) {
        Object.entries(jobs).forEach(([jobId, job]) => {
          if (job.kategori === kategori) {
            job.jobId = jobId;
            job.companyName = companyName;

            const card = document.createElement("div");
            card.className = "job-card";
            card.innerHTML = `
              <div class="job-content">
                <h3>${sanitizeHTML(job.title || "Tanpa Judul")}</h3>
                <div class="company">${sanitizeHTML(companyName)}</div>
                <div class="salary">${job.salary ? `Gaji: ${sanitizeHTML(job.salary)}` : "Gaji: Tidak Diberikan"}</div>
              </div>
            `;
            card.addEventListener("click", () => openJobModal(job, companyName));
            jobsContainer.appendChild(card);
          }
        });
      }
    });

    if (jobsContainer.innerHTML === "") {
      jobsContainer.innerHTML = `<p>Tidak ada lowongan di kategori <strong>${kategori}</strong>.</p>`;
    }
  });
}
