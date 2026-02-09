class SmartSelect {
  constructor(id, options, config = {}) {
    this.container = document.getElementById(id)
    this.options = options
    this.config = {
      multiple: true,
      placeholder: 'เลือก...',
      selected: null,
      onSelectionChange: null,
      ...config,
    }
    this.selectedValues = []
    this.filteredOptions = []
    this.highlightedIndex = -1
    this.init()
  }

  init() {
    this.handlePreSelection()
    this.render()
    this.cache()
    this.filteredOptions = [...this.options] // Init with all options
    this.bindEvents()
    this.updateUI()
  }

  handlePreSelection() {
    const init = this.config.selected
    if (!init) return
    const raw = Array.isArray(init) ? init : [init]
    const validValues = this.options.map((o) => String(o.value))
    const filtered = raw
      .map((v) => String(v))
      .filter((v) => validValues.includes(v))
    this.selectedValues = this.config.multiple
      ? [...new Set(filtered)]
      : filtered[0]
        ? [filtered[0]]
        : []
  }

  render() {
    // ปรับโครงสร้าง HTML:
    // 1. ลบ .chips-list wrapper ออก
    // 2. ตั้งชื่อ class ให้ container หลักเป็น .input-content เพื่อใช้อ้างอิงในการวาง Chips
    this.container.innerHTML = `
      <div class="smart-select-root relative w-full">
          <div class="input-wrapper min-h-12 w-full flex items-center px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-4 focus-within:ring-emerald-50 focus-within:border-emerald-500 transition-all cursor-text" id="${this.container.id}-wrapper">
              
              <!-- Container หลักสำหรับ Icon, Chips และ Input ให้เรียงต่อกัน (Flow) -->
              <div class="input-content flex flex-wrap items-center gap-2 flex-1">
                  <i class="fa-solid fa-magnifying-glass text-slate-400 text-sm ml-1 select-none"></i>
                  <!-- Chips จะถูกแทรกตรงนี้ -->
                  <input id="${this.container.id}-input" type="text" class="search-input flex-1 min-w-[20px] outline-none bg-transparent text-sm text-slate-700 py-1 font-medium placeholder:text-slate-400" placeholder="${this.config.placeholder}" autocomplete="off">
              </div>

              <div class="flex items-center gap-2 ml-1">
                  <span class="loading-indicator hidden text-emerald-500"><i class="fa-solid fa-circle-notch fa-spin"></i></span>
                  <i class="fa-solid fa-chevron-down chevron-icon text-slate-300 text-[10px] transition-transform duration-300 mr-1"></i>
              </div>
          </div>
          
          <div class="dropdown-menu hidden absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 transform origin-top transition-all duration-200">
              <div class="p-2 bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider px-3">ตัวเลือกที่มี</div>
              <ul class="options-list max-h-62.5 overflow-y-auto p-1 custom-scrollbar"></ul>
              <div class="no-data hidden p-8 text-center">
                  <div class="text-slate-300 text-2xl mb-2"><i class="fa-regular fa-folder-open"></i></div>
                  <div class="text-sm text-slate-500 font-medium">ไม่พบข้อมูลที่ค้นหา</div>
              </div>
          </div>
      </div>`
  }

  cache() {
    this.root = this.container.querySelector('.smart-select-root')
    this.input = this.container.querySelector('.search-input')
    this.wrapper = this.container.querySelector('.input-wrapper')
    // เปลี่ยนจาก chipsList เป็น inputContent แทน เพราะไม่มี chipsList แยกแล้ว
    this.inputContent = this.container.querySelector('.input-content')
    this.dropdown = this.container.querySelector('.dropdown-menu')
    this.optionsList = this.container.querySelector('.options-list')
    this.noDataMsg = this.container.querySelector('.no-data')
    this.chevron = this.container.querySelector('.chevron-icon')
  }

  bindEvents() {
    // Toggle Dropdown
    this.wrapper.addEventListener('click', (e) => {
      // ป้องกันการเปิด Dropdown ถ้ากดที่ปุ่มลบ Chip
      if (e.target.closest('.fa-xmark')) return

      if (e.target !== this.input) {
        this.input.focus()
        this.toggleDropdown(true)
      }
    })

    // Input Handling
    this.input.addEventListener('input', (e) => {
      this.filterOptions(e.target.value)
      this.toggleDropdown(true)
    })

    this.input.addEventListener('focus', () => this.toggleDropdown(true))

    // Keyboard Nav
    this.input.addEventListener('keydown', (e) => this.handleKeyDown(e))

    // Close outside
    document.addEventListener('click', (e) => {
      if (!this.root.contains(e.target)) {
        this.toggleDropdown(false)
      }
    })
  }

  toggleDropdown(show) {
    if (show) {
      this.dropdown.classList.remove('hidden')
      this.wrapper.classList.add(
        'ring-4',
        'ring-emerald-50',
        'border-emerald-500',
      )
      this.chevron.classList.add('rotate-180')
      this.renderOptions()
    } else {
      this.dropdown.classList.add('hidden')
      this.wrapper.classList.remove(
        'ring-4',
        'ring-emerald-50',
        'border-emerald-500',
      )
      this.chevron.classList.remove('rotate-180')
      this.highlightedIndex = -1
    }
  }

  filterOptions(query) {
    const lowerQuery = query.toLowerCase()
    this.filteredOptions = this.options.filter((o) =>
      o.label.toLowerCase().includes(lowerQuery),
    )

    if (this.filteredOptions.length === 0) {
      this.optionsList.classList.add('hidden')
      this.noDataMsg.classList.remove('hidden')
    } else {
      this.optionsList.classList.remove('hidden')
      this.noDataMsg.classList.add('hidden')
      this.highlightedIndex = 0 // Reset highlight on filter
    }
    this.renderOptions()
  }

  renderOptions() {
    this.optionsList.innerHTML = ''
    this.filteredOptions.forEach((opt, index) => {
      const isSelected = this.selectedValues.includes(String(opt.value))
      const isHighlighted = index === this.highlightedIndex

      const li = document.createElement('li')
      li.className = `
        flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm mb-1 transition-all
        ${isHighlighted ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}
        ${isSelected ? 'bg-emerald-50 text-emerald-700 font-medium' : ''}`

      li.innerHTML = `
        <div class="flex items-center gap-2 pointer-events-none">
            ${opt.icon ? `<i class="${opt.icon} w-5 text-center ${isSelected ? 'text-emerald-600' : 'text-slate-400'}"></i>` : ''}
            <span>${opt.label}</span>
        </div>
        ${isSelected ? '<i class="fa-solid fa-check text-emerald-600 pointer-events-none"></i>' : ''}`

      li.addEventListener('mousedown', (e) => {
        e.preventDefault()
      })

      li.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        this.selectOption(opt)
      })

      li.addEventListener('mouseenter', () => {
        this.highlightedIndex = index
        Array.from(this.optionsList.children).forEach((child, i) => {
          if (i === index) {
            child.classList.add('bg-slate-100', 'text-slate-900')
            child.classList.remove('text-slate-600', 'hover:bg-slate-50')
          } else {
            child.classList.remove('bg-slate-100', 'text-slate-900')
            child.classList.add('text-slate-600', 'hover:bg-slate-50')
          }
        })
      })

      this.optionsList.appendChild(li)
    })
  }

  selectOption(option) {
    const val = String(option.value)
    if (this.config.multiple) {
      if (this.selectedValues.includes(val)) {
        this.removeValue(val)
      } else {
        this.selectedValues.push(val)
      }
      this.input.value = ''
      this.filterOptions('')
    } else {
      this.selectedValues = [val]
      this.toggleDropdown(false)
      this.input.blur()
    }

    this.updateUI()
    this.triggerChange()

    if (this.config.multiple) {
      this.input.focus()
    }
  }

  removeValue(val) {
    this.selectedValues = this.selectedValues.filter((v) => v !== val)
    this.updateUI()

    // Fix: เรียก renderOptions เพื่ออัปเดตสถานะใน Dropdown (ลบติ๊กถูก/สีเขียวออก)
    // ทำให้เวลา Backspace แล้ว list อัปเดตทันที
    this.renderOptions()

    this.triggerChange()
  }

  updateUI() {
    // 1. ลบ Chips เก่าทั้งหมดออกจาก inputContent (ยกเว้น input และ icon)
    const existingChips = this.inputContent.querySelectorAll('.chip')
    existingChips.forEach((c) => c.remove())

    if (this.selectedValues.length > 0) {
      this.selectedValues.forEach((val) => {
        const opt = this.options.find((o) => String(o.value) === val)
        if (!opt) return

        const chip = document.createElement('div')
        chip.className = `chip chip-anim flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 select-none whitespace-nowrap`
        chip.innerHTML = `
          <span>${opt.label}</span>
          <i class="fa-solid fa-xmark ml-1 cursor-pointer hover:text-emerald-900 rounded-full p-0.5 text-[10px]"></i>`

        chip.querySelector('i').addEventListener('click', (e) => {
          e.stopPropagation()
          this.removeValue(val)
          // focus input กลับหลังลบ chip
          this.input.focus()
        })

        // 2. แทรก Chips เข้าไป "ก่อนหน้า Input" เสมอ
        this.inputContent.insertBefore(chip, this.input)
      })

      if (!this.config.multiple) {
        // กรณี Single Select:
        // ทำให้ Input เล็กลงและโปร่งใส เพื่อให้พิมพ์ Backspace ได้ แต่ไม่บัง Chip
        this.input.style.width = '1px'
        this.input.style.padding = '0'
        this.input.style.minWidth = '1px'
        this.input.placeholder = ''
      } else {
        // Reset style สำหรับ multiple
        this.input.style.width = ''
        this.input.style.padding = ''
        this.input.style.minWidth = '20px'
        this.input.placeholder = ''
      }
    } else {
      // กรณีไม่มีค่าที่เลือก Reset กลับเป็นปกติ
      this.input.placeholder = this.config.placeholder
      this.input.style.width = ''
      this.input.style.padding = ''
      this.input.style.minWidth = '20px'
    }
  }

  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        this.highlightedIndex = Math.min(
          this.highlightedIndex + 1,
          this.filteredOptions.length - 1,
        )
        this.scrollToHighlighted()
        this.renderOptions()
        break
      case 'ArrowUp':
        e.preventDefault()
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0)
        this.scrollToHighlighted()
        this.renderOptions()
        break
      case 'Enter':
        e.preventDefault()
        if (
          this.highlightedIndex >= 0 &&
          this.filteredOptions[this.highlightedIndex]
        ) {
          this.selectOption(this.filteredOptions[this.highlightedIndex])
        }
        break
      case 'Backspace':
        if (this.input.value === '' && this.selectedValues.length > 0) {
          // ลบค่าตัวล่าสุด
          this.removeValue(this.selectedValues[this.selectedValues.length - 1])
          // เนื่องจากเราเรียก this.renderOptions() ใน removeValue แล้ว สถานะใน list จะอัปเดตเอง
        }
        break
      case 'Escape':
        this.toggleDropdown(false)
        this.input.blur()
        break
    }
  }

  scrollToHighlighted() {
    const item = this.optionsList.children[this.highlightedIndex]
    if (item) {
      item.scrollIntoView({ block: 'nearest' })
    }
  }

  triggerChange() {
    if (this.config.onSelectionChange) {
      this.config.onSelectionChange(this.selectedValues)
    }
  }

  getValues() {
    return this.selectedValues
  }
}

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
  sidebarContent.innerHTML = ''

  mouData.forEach((yearGroup, index) => {
    const yearId = `year-${yearGroup.year}`
    const count = yearGroup.items.length

    // Create Accordion Item
    const section = document.createElement('div')
    section.className = 'mb-1'

    // Header (Year)
    section.innerHTML = `
      <button onclick="toggleAccordion('${yearId}')" 
          class="w-full flex justify-between items-center px-4 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition focus:outline-none border border-transparent hover:border-gray-200">
          <div class="flex items-center">
              <i class="fa-regular fa-calendar-check text-emerald-600 mr-3"></i>
              ปี ${yearGroup.year}
          </div>
          <div class="flex items-center">
              <span class="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-bold mr-2">${count}</span>
              <i id="icon-${yearId}" class="fa-solid fa-chevron-down text-gray-400 text-xs rotate-icon"></i>
          </div>
      </button>

      <div id="${yearId}" class="accordion-content pl-4 pr-2">
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
  const content = document.getElementById('year-' + id)
  const icon = document.getElementById('icon-' + id)

  if (content.style.maxHeight) {
    content.style.maxHeight = null
    content.classList.remove('active')
    icon.classList.remove('active')
  } else {
    content.style.maxHeight = content.scrollHeight + 'px'
    content.classList.add('active')
    icon.classList.add('active')
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
  document.getElementById('empty-state').classList.add('hidden')
  document.getElementById('content-view').classList.remove('hidden')

  // Populate Data
  document.getElementById('mou-title').textContent = selectedItem.title
  document.getElementById('mou-date').textContent = selectedItem.date
  document.getElementById('mou-partners').innerHTML =
    `<i class="fa-solid fa-users mr-1"></i> คู่ความร่วมมือ: ${selectedItem.partner}`
  document.getElementById('mou-objective').textContent = selectedItem.objective
  document.getElementById('share-link-input').value = selectedItem.link

  // Status Badge
  const statusBadge = document.getElementById('mou-status')
  statusBadge.textContent = selectedItem.status
  statusBadge.className =
    'px-2.5 py-0.5 rounded-full text-xs font-semibold border'

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

  // Tags
  const tagsContainer = document.getElementById('mou-tags')
  tagsContainer.innerHTML = selectedItem.tags
    .map(
      (tag) =>
        `<span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200 cursor-pointer">#${tag}</span>`,
    )
    .join('')

  // Scroll to top of main area (mobile friendly)
  document.getElementById('main-display-area').scrollTop = 0
}

// --- 5. Toggle Info Section ---
function toggleInfoSection() {
  const content = document.getElementById('info-content')
  const btn = document.getElementById('info-toggle-btn')

  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden')
    btn.style.transform = 'rotate(180deg)'
  } else {
    content.classList.add('hidden')
    btn.style.transform = 'rotate(0deg)'
  }
}

async function copyLink() {
  const copyText = document.getElementById('share-link-input')

  await navigator.clipboard
    .writeText(copyText.value)
    .then(() => {
      Toastify({
        text: 'คัดลอกลิงก์เรียบร้อยแล้ว!',
        duration: 3000,
        close: true,
        gravity: 'bottom', // `top` or `bottom`
        position: 'center', // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: 'linear-gradient(to right, #00b09b, #96c93d)',
        },
      }).showToast()
    })
    .catch((err) => {
      Toastify({
        text: 'ไม่สามารถคัดลอกลิงก์ได้!',
        duration: 3000,
        close: true,
        gravity: 'bottom', // `top` or `bottom`
        position: 'center', // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: 'linear-gradient(to right, #ad46ff, #f6339a)',
        },
      }).showToast()
      console.error(err)
    })
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
  } else {
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
    if (parent.classList.contains('hidden')) parent.classList.remove('hidden')
    targetItem.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  } else {
    allSidebarContent.forEach((elem) => elem.classList.remove('hidden'))
  }
}

function toggleSidebar() {
  sidebar.classList.toggle('open')

  if (sidebar.classList.contains('open')) {
    sidebarButton.classList.add('active')
  } else {
    sidebarButton.classList.remove('active')
  }

  console.info('click!')
}
