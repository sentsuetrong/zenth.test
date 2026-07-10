// --- 1. Mock Data ---
const mouData = [
  {
    year: 2567,
    items: [
      {
        id: 6,
        title:
          'MOU ความร่วมมือทางวิชาการและการแลกเปลี่ยนบุคลากร กับ บริษัท เทคอินโนเวชั่น จำกัด',
        date: '15 มกราคม 2567',
        partner: 'คณะวิทยาศาสตร์ และ บจก. เทคอินโนเวชั่น',
        status: 'Active',
        objective:
          'เพื่อส่งเสริมการแลกเปลี่ยนเรียนรู้ทางด้านเทคโนโลยีปัญญาประดิษฐ์ และเปิดโอกาสให้นักศึกษาได้ฝึกงานในสถานที่จริง',
        tags: ['AI', 'Internship', 'Technology'],
        link: 'https://mou-sys.local/v/101',
      },
      {
        id: 5,
        title: 'MOU การพัฒนานวัตกรรมชุมชนยั่งยืน กับ อบต. บางรัก',
        date: '20 กุมภาพันธ์ 2567',
        partner: 'ศูนย์บริการวิชาการ และ อบต. บางรัก',
        status: 'Active',
        objective:
          'เพื่อร่วมมือกันพัฒนาผลิตภัณฑ์ชุมชนและส่งเสริมการตลาดออนไลน์ให้กับวิสาหกิจชุมชน',
        tags: ['Community', 'Development', 'OTOP'],
        link: 'https://mou-sys.local/v/102',
      },
    ],
  },
  {
    year: 2566,
    items: [
      {
        id: 4,
        title:
          'MOU การวิจัยร่วมด้านพลังงานทดแทน กับ สถาบันวิจัยพลังงานแห่งชาติ',
        date: '10 พฤศจิกายน 2566',
        partner: 'วิทยาลัยพลังงาน',
        status: 'Warning', // Near expire
        objective:
          'วิจัยและพัฒนาแผงโซลาร์เซลล์ประสิทธิภาพสูงสำหรับภูมิอากาศร้อนชื้น',
        tags: ['Energy', 'Solar', 'Research'],
        link: 'https://mou-sys.local/v/201',
      },
      {
        id: 3,
        title: 'MOU ความร่วมมือด้านการแพทย์ทางไกล กับ โรงพยาบาลศูนย์กลาง',
        date: '5 สิงหาคม 2566',
        partner: 'คณะแพทยศาสตร์',
        status: 'Active',
        objective: 'พัฒนาระบบ Telemedicine เพื่อรองรับผู้ป่วยในพื้นที่ห่างไกล',
        tags: ['Medical', 'Telehealth', 'Hospital'],
        link: 'https://mou-sys.local/v/202',
      },
      {
        id: 2,
        title: 'MOU โครงการบัณฑิตพันธุ์ใหม่ กับ ภาคอุตสาหกรรมยานยนต์',
        date: '12 มีนาคม 2566',
        partner: 'คณะวิศวกรรมศาสตร์',
        status: 'Active',
        objective:
          'สร้างหลักสูตรระยะสั้นเพื่อ Upskill/Reskill แรงงานในอุตสาหกรรมยานยนต์ไฟฟ้า (EV)',
        tags: ['EV', 'Engineering', 'Education'],
        link: 'https://mou-sys.local/v/203',
      },
    ],
  },
  {
    year: 2565,
    items: [
      {
        id: 1,
        title: 'MOU การแลกเปลี่ยนนักศึกษานานาชาติ กับ University of Tokyo',
        date: '1 มิถุนายน 2565',
        partner: 'ฝ่ายวิเทศสัมพันธ์',
        status: 'Expired',
        objective: 'โครงการแลกเปลี่ยนนักศึกษาระยะสั้น 1 ภาคการศึกษา',
        tags: ['Exchange', 'International', 'Japan'],
        link: 'https://mou-sys.local/v/301<?= site_url() ?>',
      },
    ],
  },
]

// --- 2. Render Sidebar ---
const sidebarContent = document.getElementById('sidebar-content')

function renderSidebar() {
  if (!sidebarContent) return;
  sidebarContent.innerHTML = ''

  mouData.forEach((yearGroup, index) => {
    const yearId = `year-${yearGroup.year}`
    const count = yearGroup.items.length

    // Create Accordion Item
    const section = document.createElement('div')
    section.className = 'mb-1'

    // Header (Year)
    section.innerHTML = `
      <button onclick="toggleAccordion('${yearGroup.year}')" 
          class="w-full flex justify-between items-center px-4 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition focus:outline-none border border-transparent hover:border-gray-200">
          <div class="flex items-center">
              <i class="fa-regular fa-calendar-check text-emerald-600 mr-3"></i>
              ปี ${yearGroup.year}
          </div>
          <div class="flex items-center">
              <span class="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-bold mr-2">${count}</span>
              <i id="icon-year-${yearGroup.year}" class="fa-solid fa-chevron-down text-gray-400 text-xs rotate-icon"></i>
          </div>
      </button>

      <div id="content-year-${yearGroup.year}" class="accordion-content pl-4 pr-2 hidden">
        <div class="py-2 space-y-1 border-l-2 border-gray-100 ml-4 pl-2">
          ${yearGroup.items
            .map(
              (item) => `
              <a href="#" onclick="selectMou(${item.id}); return false;" 
                  class="px-3 py-2 text-xs text-gray-600 rounded-md hover:bg-emerald-50 hover:text-emerald-700 transition truncate group flex items-start">
                  <i class="fa-solid fa-file-lines mt-0.5 mr-2 text-gray-300 group-hover:text-emerald-400"></i>
                  <span class="whitespace-normal line-clamp-2">${item.title}</span>
              </a>`,
            )
            .join('')}
        </div>
      </div>
                `

    sidebarContent.appendChild(section)
  })
}

// --- 3. Accordion Logic ---
function toggleAccordion(id) {
  const content = document.getElementById('content-year-' + id)
  const icon = document.getElementById('icon-year-' + id)
  if (!content || !icon) return;

  const isHidden = content.classList.contains('hidden');
  if (isHidden) {
    content.classList.remove('hidden');
    icon.classList.add('active');
  } else {
    content.classList.add('hidden');
    icon.classList.remove('active');
  }
}

// --- 4. Main Content Logic ---
function selectMou(id) {
  // Find data
  let selectedItem = null
  mouData.forEach((group) => {
    const found = group.items.find((i) => i.id === id)
    if (found) selectedItem = found
  })

  if (!selectedItem) return

  // Hide Empty State, Show Content
  const emptyState = document.getElementById('empty-state');
  const contentView = document.getElementById('content-view');
  if (emptyState) emptyState.classList.add('hidden');
  if (contentView) contentView.classList.remove('hidden');

  // Populate Data
  const mouTitle = document.getElementById('mou-title');
  const mouDate = document.getElementById('mou-date');
  const mouPartners = document.getElementById('mou-partners');
  const mouObjective = document.getElementById('mou-objective');
  const shareLinkInput = document.getElementById('share-link-input');

  if (mouTitle) mouTitle.textContent = selectedItem.title;
  if (mouDate) mouDate.textContent = selectedItem.date;
  if (mouPartners) mouPartners.innerHTML = `<i class="fa-solid fa-users mr-1"></i> คู่ความร่วมมือ: ${selectedItem.partner}`;
  if (mouObjective) mouObjective.textContent = selectedItem.objective;
  if (shareLinkInput) shareLinkInput.value = selectedItem.link;

  // Status Badge
  const statusBadge = document.getElementById('mou-status')
  if (statusBadge) {
    statusBadge.textContent = selectedItem.status
    statusBadge.className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold border'

    if (selectedItem.status === 'Active') {
      statusBadge.classList.add(
        'bg-green-100',
        'text-green-700',
        'border-green-200',
      )
      statusBadge.innerHTML = 'ใช้งานปกติ'
    } else if (selectedItem.status === 'Warning') {
      statusBadge.classList.add(
        'bg-yellow-100',
        'text-yellow-700',
        'border-yellow-200',
      )
      statusBadge.innerHTML = 'ใกล้หมดอายุ'
    } else {
      statusBadge.classList.add('bg-red-100', 'text-red-700', 'border-red-200')
      statusBadge.innerHTML = 'หมดอายุแล้ว'
    }
  }

  // Tags
  const tagsContainer = document.getElementById('mou-tags')
  if (tagsContainer) {
    tagsContainer.innerHTML = selectedItem.tags
      .map(
        (tag) =>
          `<span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200 cursor-pointer">#${tag}</span>`,
      )
      .join('')
  }

  // Scroll to top of main area (mobile friendly)
  const mainDisplayArea = document.getElementById('main-display-area');
  if (mainDisplayArea) mainDisplayArea.scrollTop = 0;
}

// --- 5. Toggle Info Section ---
function toggleInfoSection() {
  const content = document.getElementById('info-content')
  const btn = document.getElementById('info-toggle-btn')
  if (!content || !btn) return;

  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden')
    btn.style.transform = 'rotate(180deg)'
  } else {
    content.classList.add('hidden')
    btn.style.transform = 'rotate(0deg)'
  }
}

function showToast(message, type = 'success') {
  let style = {};
  let icon = '';
  
  switch(type) {
    case 'success':
      style = { background: 'rgba(16, 185, 129, 0.95)', color: '#ffffff' };
      icon = '<i class="fa-solid fa-circle-check mr-2 text-white text-sm"></i>';
      break;
    case 'danger':
    case 'error':
      style = { background: 'rgba(239, 68, 68, 0.95)', color: '#ffffff' };
      icon = '<i class="fa-solid fa-circle-xmark mr-2 text-white text-sm"></i>';
      break;
    case 'warning':
      style = { background: 'rgba(245, 158, 11, 0.95)', color: '#ffffff' };
      icon = '<i class="fa-solid fa-triangle-exclamation mr-2 text-white text-sm"></i>';
      break;
    case 'info':
      style = { background: 'rgba(59, 130, 246, 0.95)', color: '#ffffff' };
      icon = '<i class="fa-solid fa-circle-info mr-2 text-white text-sm"></i>';
      break;
    default:
      style = { background: 'rgba(30, 41, 59, 0.95)', color: '#ffffff' };
      icon = '<i class="fa-solid fa-bell mr-2 text-white text-sm"></i>';
  }
  
  style = {
    ...style,
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(8px)',
    webkitBackdropFilter: 'blur(8px)',
    padding: '12px 24px',
    fontWeight: '600',
    fontSize: '13px'
  };

  Toastify({
    text: `${icon} ${message}`,
    duration: 3000,
    close: true,
    gravity: 'bottom',
    position: 'center',
    style: style,
    escapeMarkup: false
  }).showToast();
}

async function copyLink() {
  const copyText = document.getElementById('share-link-input');
  const textToCopy = copyText ? copyText.value : '';

  let success = false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      success = true;
    } catch (err) {}
  }
  if (!success) {
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      success = document.execCommand('copy');
    } catch (err) {}
    textArea.remove();
  }

  if (success) {
    showToast('คัดลอกลิงก์เรียบร้อยแล้ว!', 'success');
  } else {
    showToast('ไม่สามารถคัดลอกลิงก์ได้อัตโนมัติ กรุณาคัดลอกด้วยตนเอง!', 'danger');
  }
}

const sidebar = document.getElementById('sidebar-left')
const sidebarButton = document.getElementById('btn-sidebar')

const allSidebarButtons = document.querySelectorAll(
  '#sidebar-content .btn-toggle',
)
const allSidebarContent = document.querySelectorAll(
  '#sidebar-content .year-content',
)
const allSidebarItems = document.querySelectorAll(
  '#sidebar-content .year-content .reactive-link.item',
)

function expandYear(yearId = null) {
  const target = document.getElementById(`content-year-${yearId}`)

  if (yearId !== null && target) {
    target.classList.toggle('hidden')
  } else if (allSidebarButtons.length > 0) {
    allSidebarButtons[0].classList.toggle('hidden')
  }
}

function showItem(itemId = null) {
  if (itemId) {
    const targetItem = document.querySelector(`.item[data-id="${itemId}"]`)
    if (!targetItem) return

    if (window.location.href !== targetItem.getAttribute('href'))
      window.history.pushState(null, null, targetItem.getAttribute('href'))

    allSidebarItems.forEach((elem) => elem.classList.remove('active'))
    targetItem.classList.add('active')

    const parent = targetItem.closest('.year-content')
    if (parent && parent.classList.contains('hidden')) parent.classList.remove('hidden')
    targetItem.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  } else {
    allSidebarContent.forEach((elem) => elem.classList.remove('hidden'))
  }
}

function toggleSidebar(forceClose = false) {
  if (!sidebar) return;
  sidebar.classList.toggle('open')

  if (sidebarButton) {
    if (sidebar.classList.contains('open')) {
      sidebarButton.classList.add('active')
    } else {
      sidebarButton.classList.remove('active')
    }
  }
}

let resizeTimeout
window.addEventListener('resize', () => {
  if (resizeTimeout) cancelAnimationFrame(resizeTimeout)
  resizeTimeout = requestAnimationFrame(() => {
    if (window.innerWidth >= 1024) {
      toggleSidebar(true) // Reset sidebar on desktop
      const mobileMenuDropdown = document.getElementById('mobile-menu-dropdown');
      if (mobileMenuDropdown) mobileMenuDropdown.classList.add('hidden')
    }
  })
})

// Responsive Sidebar Toggle & Backdrop handler
document.addEventListener('DOMContentLoaded', () => {
  const sidebarEl = document.getElementById('sidebar-left');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const backdropEl = document.getElementById('sidebar-backdrop');

  if (sidebarEl && toggleBtn && backdropEl) {
    const openSidebar = () => {
      sidebarEl.classList.remove('-translate-x-full');
      sidebarEl.classList.add('translate-x-0', 'shadow-2xl');
      backdropEl.classList.remove('hidden');
      requestAnimationFrame(() => {
        backdropEl.classList.remove('opacity-0');
        backdropEl.classList.add('opacity-100');
      });
    };

    const closeSidebar = () => {
      sidebarEl.classList.remove('translate-x-0', 'shadow-2xl');
      sidebarEl.classList.add('-translate-x-full');
      backdropEl.classList.remove('opacity-100');
      backdropEl.classList.add('opacity-0');
      
      setTimeout(() => {
        if (sidebarEl.classList.contains('-translate-x-full')) {
          backdropEl.classList.add('hidden');
        }
      }, 300);
    };

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sidebarEl.classList.contains('-translate-x-full')) {
        openSidebar();
      } else {
        closeSidebar();
      }
    });

    backdropEl.addEventListener('click', closeSidebar);

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) {
        sidebarEl.classList.remove('translate-x-0', 'shadow-2xl');
        sidebarEl.classList.add('-translate-x-full');
        backdropEl.classList.add('hidden');
        backdropEl.classList.remove('opacity-100', 'opacity-0');
      }
    });
  }
});
