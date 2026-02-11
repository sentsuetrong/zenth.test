class SmartSelect {
  constructor(id, options, config = {}) {
    this.container = document.getElementById(id)
    // รับข้อมูลมาแล้ว Process ทันทีเพื่อเตรียม Search String
    this.options = Array.isArray(options) ? this.processData(options) : []
    this.config = {
      multiple: true,
      placeholder: 'Select option...',
      selected: null,
      fetchData: null,
      onSelectionChange: null,
      batchSize: 50, // จำนวนรายการที่จะ Render ต่อรอบ (Lazy Load)
      ...config,
    }
    this.selectedValues = []
    this.filteredOptions = [] // ข้อมูลที่ผ่านการ Filter แล้ว (รอ Render)
    this.highlightedIndex = -1
    this.isLoading = false
    this.hasError = false
    this.hasInitialSelectionProcessed = false

    // ตัวแปรสำหรับ Lazy Rendering
    this.renderedCount = 0

    this.init()
  }

  /**
   * เตรียมข้อมูล: รวม Label, Subtitle, Keywords เป็น String เดียว (ตัวพิมพ์เล็ก)
   * เพื่อลดภาระการประมวลผลตอน User พิมพ์ค้นหา
   */
  processData(data) {
    return data.map((item) => {
      const kw = Array.isArray(item.keywords)
        ? item.keywords.join(' ')
        : item.keywords || ''

      // สร้าง _searchStr ไว้เทียบตอนค้นหา (Pre-computation)
      item._searchStr =
        `${item.label} ${item.subtitle || ''} ${kw}`.toLowerCase()
      return item
    })
  }

  init() {
    this.render()
    this.cache()

    if (this.config.fetchData) {
      this.loadData()
    } else {
      // กรณี Static Data
      this.filteredOptions = [...this.options]
      this.handlePreSelection()
      this.updateUI()
      // ไม่ Render Options ทันที รอ user เปิด (เพื่อ performance)
    }
    this.bindEvents()
  }

  async loadData() {
    if (!this.config.fetchData) return

    this.setLoading(true)
    this.setError(false)
    this.optionsList.innerHTML = ''

    try {
      const rawData = await this.config.fetchData()
      if (!Array.isArray(rawData)) throw new Error('Invalid data format')

      // Process ข้อมูลทันทีที่ได้รับมา
      this.options = this.processData(rawData)
      this.filteredOptions = [...this.options]

      const validIds = this.options.map((o) => String(o.value))
      this.selectedValues = this.selectedValues.filter((val) =>
        validIds.includes(val),
      )

      this.handlePreSelection()
      this.updateUI()

      if (!this.dropdown.classList.contains('hidden')) {
        this.resetRender() // Render Batch แรก
      }
    } catch (err) {
      console.error('SmartSelect Load Error:', err)
      this.setError(true)
    } finally {
      this.setLoading(false)
    }
  }

  reload() {
    this.loadData()
  }

  setLoading(loading) {
    this.isLoading = loading
    if (loading) {
      this.loadingIndicator.classList.remove('hidden')
      this.chevron.classList.add('hidden')
      this.wrapper.classList.add(
        'bg-slate-50',
        'opacity-75',
        'cursor-not-allowed',
        'pointer-events-none',
      )
      this.input.classList.add('cursor-not-allowed')
      this.input.disabled = true
      this.noDataMsg.classList.add('hidden')
      this.errorMsg.classList.add('hidden')
    } else {
      this.loadingIndicator.classList.add('hidden')
      this.chevron.classList.remove('hidden')
      this.wrapper.classList.remove(
        'bg-slate-50',
        'opacity-75',
        'cursor-not-allowed',
        'pointer-events-none',
      )
      this.input.classList.remove('cursor-not-allowed')
      this.input.disabled = false
    }
  }

  setError(isError) {
    this.hasError = isError
    if (isError) {
      this.errorMsg.classList.remove('hidden')
      this.optionsList.classList.add('hidden')
      this.noDataMsg.classList.add('hidden')
      if (this.dropdown.classList.contains('hidden')) this.toggleDropdown(true)
    } else {
      this.errorMsg.classList.add('hidden')
      this.optionsList.classList.remove('hidden')
    }
  }

  handlePreSelection() {
    if (this.hasInitialSelectionProcessed) return

    const init = this.config.selected
    if (!init) {
      this.hasInitialSelectionProcessed = true
      return
    }

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

    this.hasInitialSelectionProcessed = true
  }

  render() {
    this.container.innerHTML = `
      <div class="smart-select-root relative w-full group">
        <div class="input-wrapper min-h-12 w-full flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-500 transition-all duration-200 cursor-text" id="${this.container.id}-wrapper">
          <div class="input-content relative flex flex-wrap items-center gap-2 flex-1 overflow-hidden">
            <span class="input-measure absolute invisible whitespace-pre text-sm font-medium pointer-events-none"></span>
            <input id="${this.container.id}-input" type="text" class="search-input flex-1 min-w-12.5 max-w-full outline-none bg-transparent text-sm text-slate-700 font-medium placeholder:text-slate-400" placeholder="${this.config.placeholder}" autocomplete="off">
          </div>
          <div class="flex items-center gap-2 ml-1 min-w-5 justify-end">
            <span class="loading-indicator hidden text-emerald-500 animate-spin">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </span>
            <i class="fa-solid fa-chevron-down chevron-icon text-slate-400 text-xs transition-transform duration-300"></i>
          </div>
        </div>
        <div class="dropdown-menu hidden opacity-0 translate-y-2 absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-lg shadow-xl overflow-hidden ring-1 ring-black/5 origin-top transition-all duration-200 ease-out">
          ${this.config.multiple ? '<div class="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-700 uppercase tracking-wider"><span class="text-red-500 font-bold">*</span> เลือกได้แบบหลายตัวเลือก</div>' : ''}
          
          <!-- Options List container -->
          <ul class="options-list max-h-60 overflow-y-auto p-1 custom-scrollbar scroll-smooth"></ul>
          
          <!-- Loading More Indicator (Infinite Scroll) -->
          <div class="load-more hidden py-2 text-center text-xs text-slate-400 italic bg-slate-50 border-t border-slate-100">
            <i class="fa-solid fa-circle-notch fa-spin mr-1"></i> กำลังโหลดข้อมูลเพิ่ม...
          </div>

          <div class="no-data hidden p-6 text-center"><div class="text-slate-300 text-3xl mb-2"><i class="fa-regular fa-folder-open"></i></div><div class="text-sm text-slate-500 font-medium">ไม่พบข้อมูล</div></div>
          <div class="error-msg hidden p-6 text-center"><div class="text-red-300 text-3xl mb-2"><i class="fa-solid fa-circle-exclamation"></i></div><div class="text-sm text-slate-600 font-medium mb-3">โหลดข้อมูลไม่สำเร็จ</div><button type="button" class="btn-retry px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-full font-medium transition-colors"><i class="fa-solid fa-rotate-right mr-1"></i> ลองใหม่</button></div>
        </div>
      </div>`
  }

  cache() {
    this.root = this.container.querySelector('.smart-select-root')
    this.input = this.container.querySelector('.search-input')
    this.wrapper = this.container.querySelector('.input-wrapper')
    this.inputContent = this.container.querySelector('.input-content')
    this.dropdown = this.container.querySelector('.dropdown-menu')
    this.optionsList = this.container.querySelector('.options-list')
    this.loadMoreIndicator = this.container.querySelector('.load-more') // New
    this.noDataMsg = this.container.querySelector('.no-data')
    this.errorMsg = this.container.querySelector('.error-msg')
    this.btnRetry = this.container.querySelector('.btn-retry')
    this.chevron = this.container.querySelector('.chevron-icon')
    this.loadingIndicator = this.container.querySelector('.loading-indicator')
    this.measureSpan = this.container.querySelector('.input-measure')
  }

  bindEvents() {
    this.btnRetry.addEventListener('click', (e) => {
      e.stopPropagation()
      this.reload()
    })

    this.wrapper.addEventListener('click', (e) => {
      if (this.isLoading) return
      if (e.target.closest('.fa-xmark')) return
      if (e.target !== this.input) {
        this.input.focus()
        this.toggleDropdown(true)
      }
    })

    this.input.addEventListener('input', (e) => {
      this.toggleDropdown(true)
      this.filterOptions(e.target.value)
      this.adjustInputWidth()
    })
    this.input.addEventListener('focus', () => {
      if (!this.isLoading) this.toggleDropdown(true)
    })

    this.input.addEventListener('keydown', (e) => this.handleKeyDown(e))

    document.addEventListener('click', (e) => {
      if (!this.root.contains(e.target)) this.toggleDropdown(false)
    })

    this.optionsList.addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()
      if (this.isLoading) return
      const li = e.target.closest('li')
      if (li) {
        const index = parseInt(li.dataset.index, 10)
        if (!isNaN(index) && this.filteredOptions[index])
          this.selectOption(this.filteredOptions[index])
      }
    })

    this.optionsList.addEventListener('mouseover', (e) => {
      if (this.isLoading) return
      const li = e.target.closest('li')
      if (li) {
        const index = parseInt(li.dataset.index, 10)
        if (index !== this.highlightedIndex) {
          this.updateHighlightUI(this.highlightedIndex, index)
          this.highlightedIndex = index
        }
      }
    })
    this.optionsList.addEventListener('mousedown', (e) => e.preventDefault())

    // Event: Infinite Scroll
    this.optionsList.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.optionsList
      // ถ้าเลื่อนลงมาเกือบสุด (เหลือ 20px)
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        this.renderNextBatch()
      }
    })
  }

  adjustInputWidth() {
    if (!this.config.multiple && this.selectedValues.length > 0) return
    const value = this.input.value
    if (value) {
      this.measureSpan.textContent = value
      this.input.style.width = `${this.measureSpan.offsetWidth + 24}px`
    } else {
      if (this.selectedValues.length > 0) {
        this.input.style.width = ''
      } else {
        this.measureSpan.textContent = this.config.placeholder
        this.input.style.width = `${this.measureSpan.offsetWidth + 24}px`
      }
    }
  }

  toggleDropdown(show) {
    if (this.isLoading && show) return

    if (show) {
      const wasHidden = this.dropdown.classList.contains('hidden')
      this.dropdown.classList.remove('hidden')
      requestAnimationFrame(() => {
        this.dropdown.classList.remove('opacity-0', 'translate-y-2')
        this.dropdown.classList.add('opacity-100', 'translate-y-0')
      })
      this.wrapper.classList.add(
        'ring-2',
        'ring-emerald-100',
        'border-emerald-500',
      )
      this.chevron.classList.add('rotate-180', 'text-emerald-500')
      this.chevron.classList.remove('text-slate-400')

      // ถ้าเพิ่งเปิด และไม่มี Error ให้ Reset การแสดงผลใหม่
      if (wasHidden && !this.hasError) {
        if (this.input.value) {
          this.filterOptions(this.input.value)
        } else {
          this.filteredOptions = [...this.options] // Reset filter
          this.resetRender()
        }
      }
    } else {
      this.dropdown.classList.remove('opacity-100', 'translate-y-0')
      this.dropdown.classList.add('opacity-0', 'translate-y-2')
      setTimeout(() => {
        if (!this.dropdown.classList.contains('opacity-100'))
          this.dropdown.classList.add('hidden')
      }, 200)
      this.wrapper.classList.remove(
        'ring-2',
        'ring-emerald-100',
        'border-emerald-500',
      )
      this.chevron.classList.add('text-slate-400')
      this.chevron.classList.remove('rotate-180', 'text-emerald-500')
      this.highlightedIndex = -1
      if (this.input.value !== '') {
        this.input.value = ''
        this.filterOptions('') // Reset filter internally
        this.adjustInputWidth()
      }
    }
  }

  /**
   * Optimized Filter Logic
   * ใช้ _searchStr ที่เตรียมไว้แล้ว แทนการเรียก .toLowerCase() ใหม่ทุกรอบ
   */
  filterOptions(query, activeValue = null) {
    if (this.isLoading || this.hasError) return

    const lowerQuery = query.toLowerCase().trim()

    if (!lowerQuery) {
      this.filteredOptions = [...this.options]
    } else {
      // Pre-computed search: เร็วกว่าเดิมมาก
      this.filteredOptions = this.options.filter((o) =>
        o._searchStr.includes(lowerQuery),
      )
    }

    if (this.filteredOptions.length === 0) {
      this.optionsList.classList.add('hidden')
      this.loadMoreIndicator.classList.add('hidden')
      this.noDataMsg.classList.remove('hidden')
    } else {
      this.optionsList.classList.remove('hidden')
      this.noDataMsg.classList.add('hidden')

      // Reset Highlight
      if (activeValue !== null) {
        const idx = this.filteredOptions.findIndex(
          (o) => String(o.value) === String(activeValue),
        )
        this.highlightedIndex = idx !== -1 ? idx : 0
      } else {
        this.highlightedIndex = 0
      }
    }

    // ทุกครั้งที่ Filter เปลี่ยน ต้อง Reset การ Render เป็น Batch แรกเสมอ
    this.resetRender()
  }

  /**
   * ล้าง List และเริ่ม Render ใหม่จาก 0 ถึง Batch Size
   */
  resetRender() {
    this.optionsList.innerHTML = ''
    this.optionsList.scrollTop = 0
    this.renderedCount = 0
    this.renderNextBatch()
  }

  /**
   * Render ข้อมูลชุดถัดไป (Lazy Loading)
   */
  renderNextBatch() {
    if (this.isLoading || this.hasError) return

    // ถ้า Render ครบหมดแล้ว ให้หยุด
    if (this.renderedCount >= this.filteredOptions.length) {
      this.loadMoreIndicator.classList.add('hidden')
      return
    }

    // คำนวณขอบเขตที่จะ Render เพิ่ม
    const nextCount = Math.min(
      this.renderedCount + this.config.batchSize,
      this.filteredOptions.length,
    )
    const batch = this.filteredOptions.slice(this.renderedCount, nextCount)

    const fragment = document.createDocumentFragment()

    batch.forEach((opt, i) => {
      const actualIndex = this.renderedCount + i // Index จริงใน filteredOptions
      const isSelected = this.selectedValues.includes(String(opt.value))
      const isHighlighted = actualIndex === this.highlightedIndex

      const li = document.createElement('li')
      li.dataset.index = actualIndex // เก็บ Index อ้างอิง

      li.className = `flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer text-sm mb-1 transition-colors duration-150`
      // เอฟเฟกต์ Fade In (Optional: ปิดได้ถ้าต้องการความเร็วสูงสุด)
      // li.classList.add('list-item-anim');

      if (isHighlighted) li.classList.add('bg-emerald-100', 'text-emerald-700')
      else li.classList.add('text-slate-600', 'hover:bg-slate-100')

      if (isSelected) {
        li.classList.add('bg-emerald-50', 'text-emerald-700')
        if (!isHighlighted) li.classList.remove('text-slate-600')
      }

      li.innerHTML = `
        <div class="flex items-center gap-3 pointer-events-none">
            ${opt.icon ? `<div class="w-6 flex justify-center text-lg ${isSelected ? 'text-emerald-500' : 'text-slate-400'}">${opt.icon}</div>` : ''}
            <div class="flex flex-col">
                <span class="leading-tight">${opt.label}</span>
                ${opt.subtitle ? `<span class="text-[11px] mt-0.5 opacity-50">${opt.subtitle}</span>` : ''}
            </div>
        </div>
        ${isSelected ? '<i class="fa-solid fa-check text-emerald-500 text-xs pointer-events-none"></i>' : ''}`
      fragment.appendChild(li)
    })

    this.optionsList.appendChild(fragment)
    this.renderedCount = nextCount

    // เช็คว่าต้องโชว์ Loading More ไหม
    if (this.renderedCount < this.filteredOptions.length) {
      this.loadMoreIndicator.classList.remove('hidden')
    } else {
      this.loadMoreIndicator.classList.add('hidden')
    }
  }

  updateHighlightUI(prevIndex, newIndex) {
    const items = this.optionsList.children

    // เราต้องหา DOM Element ที่ตรงกับ Index (เนื่องจากเราไม่ได้ Render ทั้งหมด)
    // การใช้ children[index] อาจจะไม่ตรงถ้าเรามีการ scroll และ DOM เปลี่ยนแปลง
    // วิธีที่ปลอดภัยคือ querySelector ตาม dataset.index

    const prevItem = this.optionsList.querySelector(
      `li[data-index="${prevIndex}"]`,
    )
    if (prevItem) {
      prevItem.classList.remove('bg-emerald-100', 'text-emerald-700')
      prevItem.classList.add('text-slate-600', 'hover:bg-slate-100')
    }

    const newItem = this.optionsList.querySelector(
      `li[data-index="${newIndex}"]`,
    )
    if (newItem) {
      newItem.classList.remove('text-slate-600', 'hover:bg-slate-100')
      newItem.classList.add('bg-emerald-100', 'text-emerald-700')
      // Auto scroll to highlighted item logic could be added here
    }
  }

  selectOption(option) {
    const val = String(option.value)
    if (this.config.multiple) {
      if (this.selectedValues.includes(val)) this.removeValue(val)
      else this.selectedValues.push(val)
      this.input.value = ''
      this.filterOptions('', val)
      this.adjustInputWidth()
    } else {
      if (this.selectedValues.includes(val)) {
        this.removeValue(val)
        this.input.focus()
      } else {
        this.selectedValues = [val]
        this.input.value = ''
        this.toggleDropdown(false)
        this.input.blur()
      }
    }
    this.updateUI()
    this.triggerChange()
    if (this.config.multiple) this.input.focus()
  }

  removeValue(val) {
    if (this.isLoading) return
    this.selectedValues = this.selectedValues.filter((v) => v !== val)
    this.updateUI()

    // Re-render เฉพาะส่วนที่จำเป็น (ในที่นี้ Reset เพื่อความง่ายในการ Sync State)
    this.resetRender()

    this.triggerChange()
    this.adjustInputWidth()
  }

  updateUI() {
    const existingChips = Array.from(
      this.inputContent.querySelectorAll('.chip'),
    )
    const existingValues = existingChips.map((c) => c.dataset.value)

    existingChips.forEach((chip) => {
      if (!this.selectedValues.includes(chip.dataset.value)) {
        const left = chip.offsetLeft
        const top = chip.offsetTop
        chip.style.position = 'absolute'
        chip.style.left = `${left}px`
        chip.style.top = `${top}px`
        chip.classList.add('chip-exit')
        chip.addEventListener('animationend', () => chip.remove())
      }
    })

    this.selectedValues.forEach((val) => {
      if (!existingValues.includes(val)) {
        // ต้องหาจาก this.options ทั้งหมด ไม่ใช่แค่ filteredOptions
        const opt = this.options.find((o) => String(o.value) === val)
        if (opt) {
          const chip = this.createChipElement(opt, val)
          this.inputContent.insertBefore(chip, this.input)
        }
      }
    })

    if (this.selectedValues.length > 0) {
      if (!this.config.multiple) {
        this.input.style.width = '1px'
        this.input.style.padding = '0'
        this.input.style.minWidth = '1px'
        this.input.placeholder = ''
      } else {
        this.input.style.padding = ''
        this.input.style.minWidth = '50px'
        this.input.placeholder = ''
        this.adjustInputWidth()
      }
    } else {
      this.input.placeholder = this.config.placeholder
      this.input.style.width = ''
      this.input.style.padding = ''
      this.input.style.minWidth = '50px'
      this.adjustInputWidth()
    }
  }

  createChipElement(opt, val) {
    const chip = document.createElement('div')
    chip.dataset.value = val
    chip.className = `chip chip-enter flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-emerald-50 text-emerald-700 rounded-sm text-xs border border-emerald-100 select-none whitespace-nowrap transition-all`
    chip.innerHTML = `
          <span>${opt.label}</span>
          <div class="hover:bg-emerald-200/50 rounded-sm p-0.5 cursor-pointer transition-colors flex items-center justify-center w-4 h-4">
              <i class="fa-solid fa-xmark text-[10px]"></i>
          </div>`

    chip.querySelector('div').addEventListener('click', (e) => {
      e.stopPropagation()
      this.removeValue(val)
      this.input.focus()
    })
    return chip
  }

  handleKeyDown(e) {
    if (this.isLoading) return
    const maxIndex = this.filteredOptions.length - 1
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (this.optionsList.classList.contains('hidden'))
          this.toggleDropdown(true)
        const nextIndex = Math.min(this.highlightedIndex + 1, maxIndex)

        // ถ้าเลื่อนลงไปเจอ item ที่ยังไม่ได้ Render (Infinite Scroll)
        if (nextIndex >= this.renderedCount) {
          this.renderNextBatch()
        }

        this.updateHighlightUI(this.highlightedIndex, nextIndex)
        this.highlightedIndex = nextIndex

        // Scroll to view
        const item = this.optionsList.querySelector(
          `li[data-index="${nextIndex}"]`,
        )
        if (item) item.scrollIntoView({ block: 'nearest' })

        break
      case 'ArrowUp':
        e.preventDefault()
        const prevIndex = Math.max(this.highlightedIndex - 1, 0)
        this.updateHighlightUI(this.highlightedIndex, prevIndex)
        this.highlightedIndex = prevIndex

        const prevItem = this.optionsList.querySelector(
          `li[data-index="${prevIndex}"]`,
        )
        if (prevItem) prevItem.scrollIntoView({ block: 'nearest' })

        break
      case 'Enter':
        e.preventDefault()
        if (
          this.highlightedIndex >= 0 &&
          this.filteredOptions[this.highlightedIndex]
        )
          this.selectOption(this.filteredOptions[this.highlightedIndex])
        break
      case 'Tab':
        this.toggleDropdown(false)
        break
      case 'Backspace':
        if (this.input.value === '' && this.selectedValues.length > 0)
          this.removeValue(this.selectedValues[this.selectedValues.length - 1])
        break
      case 'Escape':
        this.toggleDropdown(false)
        this.input.blur()
        break
    }
  }

  triggerChange() {
    if (this.config.onSelectionChange)
      this.config.onSelectionChange(this.selectedValues)
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
