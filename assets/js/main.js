class SmartSelect {
  constructor(containerId, options, config = {}) {
    this.container = document.getElementById(containerId)
    if (!this.container) return
    this.options = options
    this.config = {
      multiple: config.multiple !== undefined ? config.multiple : true,
      placeholder: config.placeholder || 'เลือก...',
      maxHeight: config.maxHeight || '250px',
      selected: config.selected || null,
      onSelectionChange: config.onSelectionChange || null,
    }

    this.selectedValues = []
    this.filteredOptions = []
    this.highlightedIndex = -1
    this.inputId = `${containerId}-input`

    this.init()
  }

  init() {
    this.handlePreSelection()
    this.renderBaseStructure()
    this.cacheElements()
    this.bindEvents()
    this.updateUI()
  }

  handlePreSelection() {
    const initial = this.config.selected
    if (!initial) return

    let rawValues = Array.isArray(initial) ? initial : [initial]

    const validValues = this.options.map((o) => String(o.value))
    const filtered = rawValues
      .map((v) => String(v))
      .filter((v) => validValues.includes(v))

    if (this.config.multiple) {
      this.selectedValues = [...new Set(filtered)]
    } else {
      this.selectedValues = filtered.length > 0 ? [filtered[0]] : []
    }
  }

  renderBaseStructure() {
    this.container.innerHTML = `
          <div class="smart-select-root relative w-full">
              <div class="input-wrapper min-h-[48px] w-full flex items-center p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:border-transparent focus:ring-4 focus:ring-emerald-500 focus-within:border-emerald-600 transition-all cursor-text">
                  <div class="flex flex-wrap items-center gap-2 grow">
                      <div class="chips-list flex flex-wrap gap-2"></div>
                      <input id="${this.inputId}" type="text" class="search-input grow min-w-[60px] outline-none bg-transparent text-sm text-gray-700 py-1" placeholder="${this.config.placeholder}" autocomplete="off">
                  </div>
                  <i class="fa-solid fa-chevron-down chevron-icon text-gray-300 text-[10px] transition-transform duration-300 ml-2"></i>
              </div>
              <div class="dropdown-menu hidden absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-md shadow-lg overflow-hidden">
                  <ul class="options-list overflow-y-auto custom-scrollbar p-2" style="max-height: ${this.config.maxHeight}"></ul>
                  <div class="no-data hidden pb-4 text-center text-sm text-gray-400 font-light">ไม่พบผลลัพธ์</div>
              </div>
          </div>`
  }

  cacheElements() {
    this.root = this.container.querySelector('.smart-select-root')
    this.inputWrapper = this.container.querySelector('.input-wrapper')
    this.searchInput = this.container.querySelector('.search-input')
    this.chipsList = this.container.querySelector('.chips-list')
    this.dropdownMenu = this.container.querySelector('.dropdown-menu')
    this.optionsList = this.container.querySelector('.options-list')
    this.noData = this.container.querySelector('.no-data')
  }

  bindEvents() {
    this.inputWrapper.onclick = () => this.searchInput.focus()
    this.searchInput.onfocus = () => this.openDropdown()
    this.searchInput.oninput = (e) => {
      this.openDropdown()
      this.filterOptions(e.target.value)
    }
    this.searchInput.onkeydown = (e) => this.handleKeyDown(e)
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) this.closeDropdown()
    })
  }

  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        this.openDropdown()
        this.highlightedIndex = Math.min(
          this.highlightedIndex + 1,
          this.filteredOptions.length - 1,
        )
        this.updateHighlight()
        break
      case 'ArrowUp':
        e.preventDefault()
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0)
        this.updateHighlight()
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
        if (this.searchInput.value === '' && this.selectedValues.length > 0) {
          this.removeOption(this.selectedValues[this.selectedValues.length - 1])
        }
        break
      case 'Escape':
        this.closeDropdown()
        break
    }
  }

  updateHighlight() {
    const listItems = this.optionsList.querySelectorAll('li')
    listItems.forEach((li, idx) => {
      if (idx === this.highlightedIndex) {
        li.classList.add('option-highlighted')
        li.scrollIntoView({ block: 'nearest' })
      } else {
        li.classList.remove('option-highlighted')
      }
    })
  }

  openDropdown() {
    if (this.dropdownMenu.classList.contains('hidden')) {
      this.dropdownMenu.classList.remove('hidden')
      this.root.classList.add('select-is-open')
      this.filterOptions(this.searchInput.value)
    }
  }

  closeDropdown() {
    this.dropdownMenu.classList.add('hidden')
    this.root.classList.remove('select-is-open')
    this.highlightedIndex = -1
  }

  filterOptions(query = '') {
    this.filteredOptions = this.options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query.toLowerCase()) &&
        !this.selectedValues.includes(String(opt.value)),
    )

    this.optionsList.innerHTML = ''
    this.highlightedIndex = this.filteredOptions.length > 0 ? 0 : -1

    if (this.filteredOptions.length === 0) {
      this.noData.classList.remove('hidden')
    } else {
      this.noData.classList.add('hidden')
      const fragment = document.createDocumentFragment()
      this.filteredOptions.forEach((opt, idx) => {
        const li = document.createElement('li')
        li.className = `px-3 py-2 text-sm cursor-pointer rounded-md transition-all flex items-center justify-between group ${idx === 0 ? 'option-highlighted' : ''}`
        li.innerHTML = `<span>${opt.label}</span><i class="fa-solid fa-plus text-gray-200 group-hover:text-emerald-400 text-[10px]"></i>`
        li.onmouseenter = () => {
          this.highlightedIndex = idx
          this.updateHighlight()
        }
        li.onclick = (e) => {
          e.stopPropagation()
          this.selectOption(opt)
        }
        fragment.appendChild(li)
      })
      this.optionsList.appendChild(fragment)
    }
  }

  selectOption(opt) {
    const value = String(opt.value)
    if (this.config.multiple) {
      this.selectedValues.push(value)
    } else {
      this.selectedValues = [value]
      this.closeDropdown()
    }
    this.searchInput.value = ''
    this.updateUI()
    if (this.config.onSelectionChange)
      this.config.onSelectionChange(this.getValues())
  }

  removeOption(val) {
    this.selectedValues = this.selectedValues.filter((v) => v !== String(val))
    this.updateUI()
    if (this.config.onSelectionChange)
      this.config.onSelectionChange(this.getValues())
  }

  updateUI() {
    this.chipsList.innerHTML = ''
    const fragment = document.createDocumentFragment()
    this.selectedValues.forEach((val) => {
      const opt = this.options.find((o) => String(o.value) === val)
      if (!opt) return
      const chip = document.createElement('div')
      chip.className =
        'flex items-center gap-1.5 px-2 py-1 bg-emerald-600 text-white text-[12px] font-medium rounded-md animate-in zoom-in-95 duration-200'
      chip.innerHTML = `<span>${opt.label}</span><button type="button" class="hover:bg-emerald-800 rounded p-0.5"><i class="fa-solid fa-xmark text-[10px]"></i></button>`
      chip.querySelector('button').onclick = (e) => {
        e.stopPropagation()
        this.removeOption(val)
      }
      fragment.appendChild(chip)
    })
    this.chipsList.appendChild(fragment)
    this.searchInput.placeholder =
      this.selectedValues.length > 0 ? '' : this.config.placeholder
    this.filterOptions(this.searchInput.value)
  }

  getValues() {
    return this.config.multiple
      ? this.selectedValues
      : this.selectedValues[0] || null
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
