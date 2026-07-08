// นำ URL ที่ได้จากการ Deploy Web App ใน GAS มาวางที่นี่
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbz2tchscNXI4YI4KKOH71U9nbmf_GLtonxg7Abk9Z-loxqrmnGKab_SFtFPU-caA3e8/exec";

let allAppsData = [];
let isAdmin = false;

document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();
  fetchApps();
  
  // Event Listeners
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  document.getElementById('adminToggleBtn').addEventListener('click', toggleAdminLogin);
  document.getElementById('addAppForm').addEventListener('submit', submitApp);
});

// ฟังก์ชันดึงข้อมูลผ่าน GET
async function fetchApps() {
  try {
    const response = await fetch(GAS_API_URL);
    const result = await response.json();
    
    if (result.status === "success") {
      allAppsData = result.data;
      document.getElementById('loadingIndicator').style.display = 'none';
      document.getElementById('appContainer').style.display = 'block';
      renderApps(allAppsData);
    }
  } catch (error) {
    Swal.fire('ข้อผิดพลาด!', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
  }
}

// ฟังก์ชันวาด UI
function renderApps(apps) {
  document.getElementById('grid-cat-1').innerHTML = '';
  document.getElementById('grid-cat-2').innerHTML = '';
  document.getElementById('grid-cat-3').innerHTML = '';
  document.getElementById('grid-cat-4').innerHTML = '';

  apps.forEach(app => {
    let adminBtn = '';
    if (isAdmin) {
      adminBtn = `<button onclick="confirmDelete(${app.row}, event)" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 z-10" title="ลบแอป">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>`;
    }

    const cardHTML = `
      <div class="relative app-card bg-white rounded-xl p-3 shadow-sm flex flex-col items-center text-center border border-gray-100 cursor-pointer" onclick="window.open('${app.link}', '_blank')">
        ${adminBtn}
        <div class="w-14 h-14 mb-2 flex items-center justify-center overflow-hidden rounded-2xl bg-gray-50">
          <img src="${app.icon}" alt="${app.name}" class="w-full h-full object-cover" onerror="this.src='https://cdn-icons-png.flaticon.com/512/2965/2965306.png'">
        </div>
        <span class="text-xs font-medium text-gray-700 truncate-2-lines w-full">${app.name}</span>
      </div>
    `;

    if (app.category === "ตรวจสอบความพร้อมใช้") document.getElementById('grid-cat-1').insertAdjacentHTML('beforeend', cardHTML);
    else if (app.category === "งานพยาบาล") document.getElementById('grid-cat-2').insertAdjacentHTML('beforeend', cardHTML);
    else if (app.category === "ผู้ช่วยเหลือคนไข้") document.getElementById('grid-cat-3').insertAdjacentHTML('beforeend', cardHTML);
    else document.getElementById('grid-cat-4').insertAdjacentHTML('beforeend', cardHTML);
  });

  // ซ่อนหมวดหมู่ที่ว่างเปล่า
  document.querySelectorAll('.category-section').forEach(section => {
    const grid = section.querySelector('.app-grid');
    section.style.display = grid.children.length === 0 ? 'none' : 'block';
  });
}

// ระบบค้นหา
function handleSearch(e) {
  const keyword = e.target.value.toLowerCase();
  const filteredApps = allAppsData.filter(app => app.name.toLowerCase().includes(keyword));
  renderApps(filteredApps);
}

// ระบบ Admin (4029)
function toggleAdminLogin() {
  if (isAdmin) {
    isAdmin = false;
    document.getElementById('adminPanel').classList.add('hidden');
    renderApps(allAppsData);
    Swal.fire({ title: 'ออกจากระบบสำเร็จ', icon: 'success', timer: 1000, showConfirmButton: false });
  } else {
    Swal.fire({
      title: 'เข้าสู่ระบบ Admin',
      input: 'password',
      inputPlaceholder: 'กรอกรหัสผ่าน',
      showCancelButton: true,
      confirmButtonText: 'เข้าสู่ระบบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#0d9488'
    }).then((result) => {
      if (result.isConfirmed) {
        if (result.value === "4029") {
          isAdmin = true;
          document.getElementById('adminPanel').classList.remove('hidden');
          renderApps(allAppsData);
          Swal.fire({ title: 'เข้าสู่ระบบสำเร็จ', icon: 'success', timer: 1000, showConfirmButton: false });
        } else {
          Swal.fire('รหัสผ่านไม่ถูกต้อง', '', 'error');
        }
      }
    });
  }
}

// ส่งข้อมูลไปบันทึก (POST)
async function submitApp(event) {
  event.preventDefault();
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = 'กำลังบันทึก...';

  const newApp = {
    name: document.getElementById('appName').value,
    category: document.getElementById('appCategory').value,
    icon: document.getElementById('appIcon').value,
    link: document.getElementById('appLink').value
  };

  const payload = { action: 'add', data: newApp };

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      // ส่งเป็น text/plain เพื่อหลีกเลี่ยง CORS Preflight 
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    
    const result = await response.json();
    if (result.status === "success") {
      allAppsData = result.data;
      renderApps(allAppsData);
      document.getElementById('addAppForm').reset();
      Swal.fire({ title: 'เพิ่มแอปสำเร็จ!', icon: 'success', timer: 1500, showConfirmButton: false });
    }
  } catch (error) {
    Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'บันทึกข้อมูล';
  }
}

// ระบบลบแอป (POST)
function confirmDelete(rowNumber, event) {
  event.stopPropagation();
  Swal.fire({
    title: 'ยืนยันการลบ?',
    text: "คุณต้องการลบแอปนี้ใช่หรือไม่?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'ใช่, ลบเลย!'
  }).then(async (result) => {
    if (result.isConfirmed) {
      Swal.fire({ title: 'กำลังลบ...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
      
      const payload = { action: 'delete', row: rowNumber };
      
      try {
        const response = await fetch(GAS_API_URL, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
        const result = await response.json();
        
        if (result.status === "success") {
          allAppsData = result.data;
          renderApps(allAppsData);
          Swal.fire({ title: 'ลบสำเร็จ!', icon: 'success', timer: 1500, showConfirmButton: false });
        }
      } catch (error) {
        Swal.fire('ผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
      }
    }
  });
}

// ลงทะเบียน Service Worker สำหรับ PWA
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker ลงทะเบียนสำเร็จ'))
      .catch(err => console.error('Service Worker Error:', err));
  }
}
