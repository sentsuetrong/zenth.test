class FileManager {
  constructor(containerId, config = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.config = {
      listUrl: '/admin/upload/list-json',
      createFolderUrl: '/admin/upload/create-folder',
      deleteFileUrl: '/admin/upload/delete-file',
      batchMoveUrl: '/admin/upload/batch-move',
      batchDeleteUrl: '/admin/upload/batch-delete',
      batchDownloadUrl: '/admin/upload/batch-download',
      renameFolderUrl: '/admin/upload/rename-folder',
      renameFileUrl: '/admin/upload/rename-file',
      deleteFolderUrl: '/admin/upload/delete-folder',
      ...config
    };

    // States
    this.currentFolderId = null;
    this.searchTerm = '';
    this.page = 1;
    this.sortBy = 'name';
    this.sortDir = 'asc';

    // Advanced search filters
    this.fileTypeFilter = 'all';
    this.dateRangeFilter = 'all';
    this.startDateFilter = '';
    this.endDateFilter = '';

    // SPA active tab ('dashboard', 'files', 'settings')
    this.activeTab = 'dashboard'; 

    this.folders = [];
    this.all_folders = []; // For move targets and sidebar tree
    this.files = [];
    this.path = [];
    this.pager = {};
    this.settings = {}; // Dynamic settings from DB
    this.dashboardStats = null; // Dynamic stats from DB
    this.dropzone = null; // Dynamic Dropzone reference

    // Persistent Selection State Across Pagination
    this.selectedFileUuids = new Set();
    this.selectedFolderIds = new Set();
    this._lastFolderId = undefined;
    this._lastSearchTerm = undefined;
    this._lastActiveTab = undefined;
    this.previewOpenedFromUrl = false;

    this.init();
  }

  init() {
    this.loadParamsFromURL();
    
    // If folder parameter is active in URL, default active tab should be 'files' manager instead of dashboard
    if (this.currentFolderId) {
      this.activeTab = 'files';
    }

    this.renderSkeleton();
    this.cacheElements();
    this.bindEvents();
    
    // Apply folded state on load from cookie
    this.applySidebarFoldedState();
    
    this.fetchData();

    window.addEventListener('popstate', () => {
      this.previewOpenedFromUrl = false;
      this.loadParamsFromURL();
      this.fetchData();
    });
  }

  registerDropzone(dz) {
    this.dropzone = dz;
  }

  // Cookie Helpers
  setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;SameSite=Strict";
  }

  getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(cname) == 0) {
        return c.substring(cname.length, c.length);
      }
    }
    return "";
  }

  loadParamsFromURL() {
    const params = new URLSearchParams(window.location.search);
    this.currentFolderId = params.get('folder') || null;
    this.searchTerm = params.get('q') || '';
    this.page = parseInt(params.get('page')) || 1;
    this.sortBy = params.get('sort') || 'name';
    this.sortDir = params.get('order') || 'asc';
  }

  updateURLParams() {
    const params = new URLSearchParams();
    if (this.currentFolderId) params.set('folder', this.currentFolderId);
    if (this.searchTerm) params.set('q', this.searchTerm);
    if (this.page > 1) params.set('page', this.page);
    if (this.sortBy !== 'name') params.set('sort', this.sortBy);
    if (this.sortDir !== 'asc') params.set('order', this.sortDir);

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.historyToken = null; // reset
    window.history.pushState({}, '', newUrl);
  }

  clearSelection() {
    this.selectedFileUuids.clear();
    this.selectedFolderIds.clear();
    const selectAllCheckbox = document.getElementById('fm-select-all');
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    this.renderFloatingBar();
  }

  updateMasterCheckboxState() {
    const checkboxes = this.container.querySelectorAll('.fm-file-select, .fm-folder-select');
    if (checkboxes.length === 0) return;
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const selectAllCheckbox = document.getElementById('fm-select-all');
    if (selectAllCheckbox) selectAllCheckbox.checked = allChecked;
  }

  async fetchData() {
    // Clear selection if folder, search term or active tab has changed
    if (this._lastFolderId !== this.currentFolderId || this._lastSearchTerm !== this.searchTerm || this._lastActiveTab !== this.activeTab) {
      this.clearSelection();
      this._lastFolderId = this.currentFolderId;
      this._lastSearchTerm = this.searchTerm;
      this._lastActiveTab = this.activeTab;
    }

    this.showLoading();
    try {
      const params = new URLSearchParams();
      if (this.currentFolderId) params.set('folder', this.currentFolderId);
      if (this.searchTerm) params.set('q', this.searchTerm);
      params.set('page', this.page);
      
      if (this.sortBy) params.set('sort', this.sortBy);
      if (this.sortDir) params.set('order', this.sortDir);

      if (this.fileTypeFilter && this.fileTypeFilter !== 'all') params.set('file_type', this.fileTypeFilter);
      if (this.dateRangeFilter && this.dateRangeFilter !== 'all') params.set('date_range', this.dateRangeFilter);
      if (this.startDateFilter) params.set('start_date', this.startDateFilter);
      if (this.endDateFilter) params.set('end_date', this.endDateFilter);

      const response = await fetch(`${this.config.listUrl}?${params.toString()}`);
      const data = await response.json();

      if (data.status === 'success') {
        this.folders = data.folders || [];
        this.files = data.files || [];
        this.path = data.path || [];
        this.pager = data.pager || {};
        this.all_folders = data.all_folders || [];
        this.dashboardStats = data.dashboard_stats || null;
        this.settings = data.settings || {};
        
        this.renderContent();
        
        const event = new CustomEvent('fm-loaded', { detail: { folderId: this.currentFolderId } });
        document.dispatchEvent(event);
      } else {
        throw new Error(data.message || 'Error fetching files');
      }
    } catch (err) {
      console.error(err);
      this.showError();
    }
  }

  showLoading() {
    this.listContent.innerHTML = `
      <tr>
        <td colspan="5" class="py-16 text-center">
          <div class="flex flex-col items-center justify-center text-gray-500">
            <i class="fa-solid fa-circle-notch fa-spin text-3xl text-emerald-600 mb-3"></i>
            <p class="text-sm">กำลังโหลดข้อมูลคลังไฟล์...</p>
          </div>
        </td>
      </tr>
    `;
    this.pagination.innerHTML = '';
  }

  showError() {
    this.listContent.innerHTML = `
      <tr>
        <td colspan="5" class="py-16 text-center">
          <div class="flex flex-col items-center justify-center text-red-500">
            <i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
            <p class="text-sm font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูลไฟล์</p>
            <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition cursor-pointer">โหลดใหม่</button>
          </div>
        </td>
      </tr>
    `;
    this.pagination.innerHTML = '';
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <div class="flex flex-col space-y-6">
        <!-- Top Row: Breadcrumbs & New Folder -->
        <div class="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm shrink-0" id="fm-breadcrumbs-row">
          <nav id="fm-breadcrumbs" class="flex items-center space-x-2 text-sm text-gray-500 font-medium overflow-x-auto whitespace-nowrap py-1">
          </nav>
          <button id="fm-btn-new-folder" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs hover:shadow-md transition shrink-0 font-semibold cursor-pointer">
            <i class="fa-solid fa-folder-plus mr-1.5"></i> โฟลเดอร์ใหม่
          </button>
        </div>

        <!-- Search & Advanced Filters Container -->
        <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm shrink-0" id="fm-search-row">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="relative flex-grow">
              <input type="text" id="fm-search" placeholder="ค้นหาชื่อไฟล์ หรือชื่อโฟลเดอร์..." class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none transition">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400 text-xs"></i>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
              <button id="fm-btn-advanced-toggle" class="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-655 rounded-lg text-xs hover:bg-slate-100 hover:text-slate-800 transition font-semibold cursor-pointer flex items-center">
                <i class="fa-solid fa-sliders mr-1.5 text-slate-400"></i> ค้นหาขั้นสูง
              </button>
              <button id="fm-btn-clear-search" class="px-3 py-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs hover:bg-rose-100 transition font-semibold cursor-pointer flex items-center">
                <i class="fa-solid fa-rotate-right mr-1.5"></i> ล้างตัวกรอง
              </button>
            </div>
          </div>

          <!-- Advanced Search Panel Accordion -->
          <div id="fm-advanced-search-panel" class="hidden border-t border-slate-100 pt-3 transition-all duration-300">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- File Type Filter -->
              <div>
                <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">ประเภทไฟล์</label>
                <select id="fm-filter-type" class="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                  <option value="all">ทั้งหมด (All Types)</option>
                  <option value="pdf">เอกสาร PDF</option>
                  <option value="document">เอกสารคู่มือ (Word/Text)</option>
                  <option value="spreadsheet">ตารางข้อมูล (Excel/CSV)</option>
                  <option value="image">รูปภาพ (Images)</option>
                  <option value="video">วิดีโอ (Videos)</option>
                  <option value="audio">ไฟล์เสียง (Audio)</option>
                </select>
              </div>

              <!-- Date Modified Filter -->
              <div>
                <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">แก้ไขล่าสุด</label>
                <select id="fm-filter-date" class="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                  <option value="all">ทุกช่วงเวลา</option>
                  <option value="today">วันนี้ (Today)</option>
                  <option value="week">สัปดาห์นี้ (This Week)</option>
                  <option value="month">เดือนนี้ (This Month)</option>
                  <option value="year">ปีนี้ (This Year)</option>
                  <option value="last_year">ปีก่อนหน้า (Last Year)</option>
                  <option value="custom">ระบุช่วงเวลาเอง...</option>
                </select>
              </div>

              <!-- Custom Date Range -->
              <div id="fm-custom-date-container" class="hidden col-span-1">
                <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">ระบุช่วงเวลา</label>
                <div class="flex items-center space-x-2">
                  <input type="date" id="fm-filter-start-date" class="w-full p-1.5 border border-slate-200 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                  <span class="text-gray-400 text-xs">-</span>
                  <input type="date" id="fm-filter-end-date" class="w-full p-1.5 border border-slate-200 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                </div>
              </div>
            </div>
          </div>
          
          <!-- Results Count Summary -->
          <div id="fm-results-summary" class="text-xs font-semibold text-slate-500 mt-1 select-none flex items-center space-x-2">
            <i class="fa-solid fa-list-check text-[10px] text-emerald-500"></i>
            <span id="fm-results-summary-text">กำลังโหลดรายการ...</span>
          </div>
        </div>

        <!-- Dashboard View Container -->
        <div id="fm-dashboard-container" class="space-y-6"></div>

        <!-- File List Table View Container (Manage Files) -->
        <div id="fm-files-table-container" class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px] flex flex-col justify-between hidden">
          <div class="overflow-x-auto flex-grow relative" id="fm-table-container">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="pl-6 py-4 w-[1%] whitespace-nowrap text-center">
                    <input type="checkbox" id="fm-select-all" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer">
                  </th>
                  <th class="px-6 py-4 text-sm font-semibold text-gray-600 cursor-pointer select-none" id="fm-th-name">
                    ชื่อรายการ <span id="fm-sort-icon-name" class="font-mono text-xs"></span>
                  </th>
                  <th class="px-6 py-4 text-sm font-semibold text-gray-600 w-[1%] whitespace-nowrap hidden sm:table-cell cursor-pointer select-none" id="fm-th-size">
                    ขนาด <span id="fm-sort-icon-size" class="font-mono text-xs"></span>
                  </th>
                  <th class="px-6 py-4 text-sm font-semibold text-gray-600 w-[1%] whitespace-nowrap hidden md:table-cell cursor-pointer select-none" id="fm-th-updated">
                    ปรับปรุงล่าสุด <span id="fm-sort-icon-updated" class="font-mono text-xs"></span>
                  </th>
                  <th class="px-6 py-4 text-sm font-semibold text-gray-600 w-[1%] whitespace-nowrap text-right"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100" id="fm-list-content">
              </tbody>
            </table>
          </div>
          <div id="fm-pagination" class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          </div>
        </div>

        <!-- Settings View Container -->
        <div id="fm-settings-container" class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6 hidden">
        </div>
      </div>
    `;
  }

  cacheElements() {
    this.breadcrumbs = document.getElementById('fm-breadcrumbs');
    this.searchField = document.getElementById('fm-search');
    this.btnNewFolder = document.getElementById('fm-btn-new-folder');
    this.listContent = document.getElementById('fm-list-content');
    this.pagination = document.getElementById('fm-pagination');

    this.btnAdvancedToggle = document.getElementById('fm-btn-advanced-toggle');
    this.btnClearSearch = document.getElementById('fm-btn-clear-search');
    this.advancedPanel = document.getElementById('fm-advanced-search-panel');
    this.resultsSummaryText = document.getElementById('fm-results-summary-text');

    this.filterType = document.getElementById('fm-filter-type');
    this.filterDate = document.getElementById('fm-filter-date');
    this.customDateContainer = document.getElementById('fm-custom-date-container');
    this.filterStartDate = document.getElementById('fm-filter-start-date');
    this.filterEndDate = document.getElementById('fm-filter-end-date');

    this.dashboardContainer = document.getElementById('fm-dashboard-container');
    this.filesTableContainer = document.getElementById('fm-files-table-container');
    this.settingsContainer = document.getElementById('fm-settings-container');
    
    if (this.searchField) {
      this.searchField.value = this.searchTerm;
    }
  }

  bindEvents() {
    // Breadcrumbs Navigation Click Handler (SPA redirection)
    if (this.breadcrumbs) {
      this.breadcrumbs.addEventListener('click', (e) => {
        const item = e.target.closest('.fm-breadcrumb-item');
        if (item) {
          e.preventDefault();
          this.currentFolderId = item.dataset.id || null;
          this.page = 1;
          this.searchTerm = '';
          if (this.searchField) this.searchField.value = '';
          this.updateURLParams();
          this.fetchData();
        }
      });
    }

    let debounceTimer;
    this.searchField.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.page = 1;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.updateURLParams();
        this.fetchData();
      }, 300);
    });

    this.btnNewFolder.addEventListener('click', () => {
      const folderName = prompt('กรุณากรอกชื่อโฟลเดอร์ใหม่:');
      if (folderName && folderName.trim()) {
        this.createFolder(folderName.trim());
      }
    });

    // 1. Sidebar Toggle (Fold/Expand)
    const sidebarToggleBtn = document.getElementById('fm-sidebar-toggle-btn');
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', () => {
        const isFolded = this.getCookie('fm_sidebar_folded') === '1';
        this.setCookie('fm_sidebar_folded', isFolded ? '0' : '1');
        this.applySidebarFoldedState();
      });
    }

    // 2. Sidebar Navigation Menus switching
    const navMenu = document.getElementById('sidebar-nav-menu');
    if (navMenu) {
      navMenu.addEventListener('click', (e) => {
        const btn = e.target.closest('.fm-nav-item');
        if (btn) {
          e.preventDefault();
          const tab = btn.dataset.tab;
          
          this.activeTab = tab;
          
          document.querySelectorAll('.fm-nav-item').forEach(b => {
            b.classList.remove('bg-emerald-50', 'text-emerald-800', 'font-semibold');
            b.classList.add('text-gray-600', 'hover:bg-slate-50', 'hover:text-gray-800');
          });
          btn.classList.add('bg-emerald-50', 'text-emerald-800', 'font-semibold');
          btn.classList.remove('text-gray-600', 'hover:bg-slate-50', 'hover:text-gray-800');

          const isFolded = this.getCookie('fm_sidebar_folded') === '1';
          if (isFolded) {
            document.querySelectorAll('.fm-nav-item').forEach(b => {
              if (b.dataset.tab === tab) {
                b.classList.remove('hidden');
              } else {
                b.classList.add('hidden');
              }
            });
          }

          if (tab === 'settings') {
            this.renderSettingsForm();
          } else {
            this.currentFolderId = null;
            this.updateURLParams();
          }

          this.fetchData();
        }
      });
    }

    // 3. Advanced Search Accordion toggling
    if (this.btnAdvancedToggle) {
      this.btnAdvancedToggle.addEventListener('click', () => {
        const isHidden = this.advancedPanel.classList.contains('hidden');
        if (isHidden) {
          this.advancedPanel.classList.remove('hidden');
          this.btnAdvancedToggle.classList.add('bg-slate-200', 'border-slate-300', 'text-slate-900');
        } else {
          this.advancedPanel.classList.add('hidden');
          this.btnAdvancedToggle.classList.remove('bg-slate-200', 'border-slate-300', 'text-slate-900');
        }
      });
    }

    // 4. Clear Search and Filters
    if (this.btnClearSearch) {
      this.btnClearSearch.addEventListener('click', () => {
        this.searchTerm = '';
        this.fileTypeFilter = 'all';
        this.dateRangeFilter = 'all';
        this.startDateFilter = '';
        this.endDateFilter = '';

        if (this.searchField) this.searchField.value = '';
        if (this.filterType) this.filterType.value = 'all';
        if (this.filterDate) this.filterDate.value = 'all';
        if (this.filterStartDate) this.filterStartDate.value = '';
        if (this.filterEndDate) this.filterEndDate.value = '';
        if (this.customDateContainer) this.customDateContainer.classList.add('hidden');

        this.updateURLParams();
        this.fetchData();
      });
    }

    // 5. Change listeners for filters
    if (this.filterType) {
      this.filterType.addEventListener('change', (e) => {
        this.fileTypeFilter = e.target.value;
        this.page = 1;
        this.fetchData();
      });
    }

    if (this.filterDate) {
      this.filterDate.addEventListener('change', (e) => {
        this.dateRangeFilter = e.target.value;
        if (this.dateRangeFilter === 'custom') {
          this.customDateContainer.classList.remove('hidden');
        } else {
          this.customDateContainer.classList.add('hidden');
          this.startDateFilter = '';
          this.endDateFilter = '';
          if (this.filterStartDate) this.filterStartDate.value = '';
          if (this.filterEndDate) this.filterEndDate.value = '';
          this.page = 1;
          this.fetchData();
        }
      });
    }

    if (this.filterStartDate) {
      this.filterStartDate.addEventListener('change', (e) => {
        this.startDateFilter = e.target.value;
        this.page = 1;
        this.fetchData();
      });
    }

    if (this.filterEndDate) {
      this.filterEndDate.addEventListener('change', (e) => {
        this.endDateFilter = e.target.value;
        this.page = 1;
        this.fetchData();
      });
    }

    // Master checkbox handler
    this.container.addEventListener('change', (e) => {
      if (e.target.id === 'fm-select-all') {
        const checked = e.target.checked;
        const checkboxes = this.container.querySelectorAll('.fm-file-select, .fm-folder-select');
        checkboxes.forEach(cb => {
          cb.checked = checked;
          if (cb.classList.contains('fm-file-select')) {
            const uuid = cb.dataset.uuid;
            if (checked) this.selectedFileUuids.add(uuid);
            else this.selectedFileUuids.delete(uuid);
          } else if (cb.classList.contains('fm-folder-select')) {
            const id = cb.dataset.id;
            if (checked) this.selectedFolderIds.add(id);
            else this.selectedFolderIds.delete(id);
          }
        });
        this.renderFloatingBar();
      } else if (e.target.classList.contains('fm-file-select')) {
        const uuid = e.target.dataset.uuid;
        if (e.target.checked) {
          this.selectedFileUuids.add(uuid);
        } else {
          this.selectedFileUuids.delete(uuid);
        }
        this.updateMasterCheckboxState();
        this.renderFloatingBar();
      } else if (e.target.classList.contains('fm-folder-select')) {
        const id = e.target.dataset.id;
        if (e.target.checked) {
          this.selectedFolderIds.add(id);
        } else {
          this.selectedFolderIds.delete(id);
        }
        this.updateMasterCheckboxState();
        this.renderFloatingBar();
      }
    });

    // Sorting event bindings
    const thName = document.getElementById('fm-th-name');
    const thSize = document.getElementById('fm-th-size');
    const thUpdated = document.getElementById('fm-th-updated');

    if (thName) {
      thName.addEventListener('click', () => {
        if (this.sortBy === 'name') {
          this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortBy = 'name';
          this.sortDir = 'asc';
        }
        this.page = 1;
        this.updateURLParams();
        this.fetchData();
      });
    }

    if (thSize) {
      thSize.addEventListener('click', () => {
        if (this.sortBy === 'size') {
          this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortBy = 'size';
          this.sortDir = 'asc';
        }
        this.page = 1;
        this.updateURLParams();
        this.fetchData();
      });
    }

    if (thUpdated) {
      thUpdated.addEventListener('click', () => {
        if (this.sortBy === 'updated') {
          this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortBy = 'updated';
          this.sortDir = 'asc';
        }
        this.page = 1;
        this.updateURLParams();
        this.fetchData();
      });
    }

    // Dropdown toggling & Action handlers delegation
    this.listContent.addEventListener('click', (e) => {
      // 1. Toggle Action Dropdown
      const trigger = e.target.closest('.fm-dropdown-trigger');
      if (trigger) {
        e.preventDefault();
        e.stopPropagation();
        const menu = trigger.nextElementSibling;
        const isHidden = menu.classList.contains('hidden');
        document.querySelectorAll('.fm-dropdown-menu').forEach(m => {
          m.classList.add('hidden');
          m.style.position = '';
          m.style.top = '';
          m.style.left = '';
          m.style.right = '';
          m.style.zIndex = '';
        });
        if (isHidden) {
          // Pre-calculate height of menu to determine position
          menu.style.position = 'fixed';
          menu.style.visibility = 'hidden';
          menu.classList.remove('hidden');
          const menuHeight = menu.offsetHeight || 220; // fallback to 220px if not rendered yet
          menu.classList.add('hidden');
          menu.style.visibility = '';

          menu.classList.remove('hidden');
          
          // Position fixed to viewport to escape parent overflow: hidden
          const rect = trigger.getBoundingClientRect();
          menu.style.position = 'fixed';
          menu.style.zIndex = '9999';
          
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          
          if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
            // Position above
            menu.style.top = `${rect.top - menuHeight - 4}px`;
          } else {
            // Position below
            menu.style.top = `${rect.bottom + 4}px`;
          }
          
          menu.style.left = `${rect.right - 192}px`; // w-48 is 192px
          
          // Keep dropdown within viewport boundaries
          const menuRect = menu.getBoundingClientRect();
          if (menuRect.left < 0) {
            menu.style.left = '8px';
          } else if (menuRect.right > window.innerWidth) {
            menu.style.left = `${window.innerWidth - menuRect.width - 8}px`;
          }
        }
        return;
      }

      // 2. Folder Navigation click
      const folderLink = e.target.closest('.fm-folder-item');
      if (folderLink) {
        e.preventDefault();
        this.currentFolderId = folderLink.dataset.id;
        this.page = 1;
        this.searchTerm = '';
        if (this.searchField) this.searchField.value = '';
        this.updateURLParams();
        this.fetchData();
        return;
      }

      // 3. Row Actions dropdown: Copy Link
      const copyLinkBtn = e.target.closest('.fm-action-copy-link');
      if (copyLinkBtn) {
        e.preventDefault();
        e.stopPropagation();
        const encodedUuid = copyLinkBtn.dataset.encodedUuid;
        const filename = copyLinkBtn.dataset.filename || '';
        const folderId = copyLinkBtn.dataset.folderId !== undefined ? copyLinkBtn.dataset.folderId : (this.currentFolderId || '');
        
        const ext = filename.split('.').pop().toLowerCase();
        const isPreviewable = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'mp3', 'wav', 'ogg'].includes(ext);
        
        let shareUrl = '';
        let toastMsg = '';
        if (isPreviewable) {
          shareUrl = `${window.location.origin}${window.location.pathname}?folder=${folderId}&preview_file=${encodedUuid}&preview_name=${encodeURIComponent(filename)}`;
          toastMsg = 'คัดลอกลิงก์แชร์ตัวอย่างไฟล์เรียบร้อยแล้ว!';
        } else {
          shareUrl = `${window.location.origin}/moph-db/file/download/${encodedUuid}`;
          toastMsg = 'คัดลอกลิงก์ดาวน์โหลดไฟล์เรียบร้อยแล้ว!';
        }

        this.copyToClipboard(shareUrl).then((success) => {
          if (success) {
            showToast(toastMsg, 'success');
          } else {
            alert('ไม่สามารถคัดลอกได้อัตโนมัติ กรุณาคัดลอกด้วยตนเอง: ' + shareUrl);
          }
        });
        return;
      }

      // 3b. Row Actions dropdown: Copy Folder Link
      const copyFolderLinkBtn = e.target.closest('.fm-action-copy-folder-link');
      if (copyFolderLinkBtn) {
        e.preventDefault();
        e.stopPropagation();
        const folderId = copyFolderLinkBtn.dataset.id;
        const downloadUrl = `${window.location.origin}/admin/upload/batch-download?folder_ids[]=${folderId}`;
        this.copyToClipboard(downloadUrl).then((success) => {
          if (success) {
            showToast('คัดลอกลิงก์ดาวน์โหลดโฟลเดอร์เรียบร้อยแล้ว!', 'success');
          } else {
            alert('ไม่สามารถคัดลอกได้อัตโนมัติ กรุณาคัดลอกด้วยตนเอง: ' + downloadUrl);
          }
        });
        return;
      }

      // 4. Row Actions dropdown: Copy Hash
      const copyHashBtn = e.target.closest('.fm-action-copy-hash');
      if (copyHashBtn) {
        e.preventDefault();
        e.stopPropagation();
        const hash = copyHashBtn.dataset.hash;
        if (hash) {
          this.copyToClipboard(hash).then((success) => {
            if (success) {
              showToast('คัดลอกค่า Hash (SHA-256) แล้ว!', 'success');
            } else {
              alert('ไม่สามารถคัดลอกค่า Hash ได้อัตโนมัติ');
            }
          });
        } else {
          alert('ไฟล์นี้ไม่มีค่า Hash');
        }
        return;
      }

      // 5. Quick Copy Hash button
      const copyHashBtnQuick = e.target.closest('.fm-btn-copy-hash');
      if (copyHashBtnQuick) {
        e.preventDefault();
        e.stopPropagation();
        const hash = copyHashBtnQuick.dataset.hash;
        this.copyToClipboard(hash).then((success) => {
          if (success) {
            showToast('คัดลอกค่า Hash แล้ว!', 'success');
          } else {
            alert('ไม่สามารถคัดลอกค่า Hash ได้อัตโนมัติ');
          }
        });
        return;
      }

      // 6. Row Actions dropdown: Rename Folder
      const renameFolderBtn = e.target.closest('.fm-btn-rename-folder');
      if (renameFolderBtn) {
        e.preventDefault();
        e.stopPropagation();
        const currentName = renameFolderBtn.dataset.name;
        const newName = prompt('กรุณากรอกชื่อโฟลเดอร์ใหม่:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
          this.renameFolder(renameFolderBtn.dataset.id, newName.trim());
        }
        return;
      }

      // 7. Row Actions dropdown: Rename File
      const renameFileBtn = e.target.closest('.fm-btn-rename-file');
      if (renameFileBtn) {
        e.preventDefault();
        e.stopPropagation();
        const currentName = renameFileBtn.dataset.name;
        const newName = prompt('กรุณากรอกชื่อไฟล์ใหม่:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
          this.renameFile(renameFileBtn.dataset.uuid, newName.trim());
        }
        return;
      }

      // 8. Row Actions dropdown: Move Single File/Folder
      const moveFileBtn = e.target.closest('.fm-btn-move-file');
      if (moveFileBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.openMoveModal([moveFileBtn.dataset.uuid], []);
        return;
      }
      const moveFolderBtn = e.target.closest('.fm-btn-move-folder');
      if (moveFolderBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.openMoveModal([], [moveFolderBtn.dataset.id]);
        return;
      }

      // 9. Row Actions dropdown: Delete Folder
      const deleteFolderBtn = e.target.closest('.fm-btn-delete-folder');
      if (deleteFolderBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโฟลเดอร์นี้และเอกสารลูกทั้งหมดด้านในอย่างถาวร? การลบจะล้างไฟล์ทั้งหมดออกจากเซิร์ฟเวอร์ด้วย!')) {
          this.deleteFolder(deleteFolderBtn.dataset.id);
        }
        return;
      }

      // 10. Row Actions dropdown: Delete File
      const deleteFileBtn = e.target.closest('.fm-btn-delete-file');
      if (deleteFileBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้อย่างถาวร? การลบไม่สามารถกู้คืนได้')) {
          this.deleteFile(deleteFileBtn.dataset.uuid);
        }
        return;
      }

      // 11. Preview PDF eye icon click
      const previewBtn = e.target.closest('.fm-btn-preview');
      if (previewBtn) {
        e.preventDefault();
        e.stopPropagation();
        const file = this.files.find(f => f.encoded_uuid === previewBtn.dataset.encodedUuid);
        this.openPreviewModal(file || previewBtn.dataset.encodedUuid, previewBtn.dataset.filename);
        return;
      }

      // 12. Row Actions dropdown: Preview PDF
      const actionPreviewBtn = e.target.closest('.fm-action-preview');
      if (actionPreviewBtn) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.fm-dropdown-menu').forEach(m => m.classList.add('hidden'));
        const file = this.files.find(f => f.encoded_uuid === actionPreviewBtn.dataset.encodedUuid);
        this.openPreviewModal(file || actionPreviewBtn.dataset.encodedUuid, actionPreviewBtn.dataset.filename);
        return;
      }

      // 13. Go to folder location (Search results)
      const gotoBtn = e.target.closest('.fm-action-go-to-location');
      if (gotoBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.currentFolderId = gotoBtn.dataset.containerId || null;
        this.page = 1;
        this.searchTerm = '';
        if (this.searchField) this.searchField.value = '';
        this.activeTab = 'files';
        this.updateURLParams();
        this.fetchData();
        return;
      }

      // 14. Download folder as ZIP
      const downloadFolderBtn = e.target.closest('.fm-action-download-folder');
      if (downloadFolderBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.downloadFolder(downloadFolderBtn.dataset.id);
        return;
      }
    });

    // Handle preview modal actions click event delegation (so rename/delete/copy buttons click inside preview header works)
    const previewActionsContainer = document.getElementById('pdf-preview-actions-container');
    if (previewActionsContainer) {
      previewActionsContainer.addEventListener('click', (e) => {
        // Trigger Copy Link
        const copyLinkBtn = e.target.closest('.fm-action-copy-link');
        if (copyLinkBtn) {
          e.preventDefault();
          e.stopPropagation();
          document.querySelectorAll('.fm-dropdown-menu').forEach(m => m.classList.add('hidden'));
          const encodedUuid = copyLinkBtn.dataset.encodedUuid;
          const filename = copyLinkBtn.dataset.filename || '';
          const folderId = copyLinkBtn.dataset.folderId !== undefined ? copyLinkBtn.dataset.folderId : (this.currentFolderId || '');
          
          const ext = filename.split('.').pop().toLowerCase();
          const isPreviewable = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'mp3', 'wav', 'ogg'].includes(ext);
          
          let shareUrl = '';
          let toastMsg = '';
          if (isPreviewable) {
            shareUrl = `${window.location.origin}${window.location.pathname}?folder=${folderId}&preview_file=${encodedUuid}&preview_name=${encodeURIComponent(filename)}`;
            toastMsg = 'คัดลอกลิงก์แชร์ตัวอย่างไฟล์เรียบร้อยแล้ว!';
          } else {
            shareUrl = `${window.location.origin}/moph-db/file/download/${encodedUuid}`;
            toastMsg = 'คัดลอกลิงก์ดาวน์โหลดไฟล์เรียบร้อยแล้ว!';
          }

          this.copyToClipboard(shareUrl).then((success) => {
            if (success) {
              showToast(toastMsg, 'success');
            } else {
              alert('ไม่สามารถคัดลอกได้อัตโนมัติ');
            }
          });
          return;
        }

        // Trigger Copy Hash
        const copyHashBtn = e.target.closest('.fm-action-copy-hash');
        if (copyHashBtn) {
          e.preventDefault();
          e.stopPropagation();
          document.querySelectorAll('.fm-dropdown-menu').forEach(m => m.classList.add('hidden'));
          const hash = copyHashBtn.dataset.hash;
          if (hash) {
            this.copyToClipboard(hash).then((success) => {
              if (success) {
                showToast('คัดลอกค่า Hash (SHA-256) แล้ว!', 'success');
              } else {
                alert('ไม่สามารถคัดลอกได้อัตโนมัติ');
              }
            });
          } else {
            alert('ไฟล์นี้ไม่มีค่า Hash');
          }
          return;
        }

        // Trigger Rename File
        const renameFileBtn = e.target.closest('.fm-btn-rename-file');
        if (renameFileBtn) {
          e.preventDefault();
          e.stopPropagation();
          document.querySelectorAll('.fm-dropdown-menu').forEach(m => m.classList.add('hidden'));
          const currentName = renameFileBtn.dataset.name;
          const newName = prompt('กรุณากรอกชื่อไฟล์ใหม่:', currentName);
          if (newName && newName.trim() && newName.trim() !== currentName) {
            this.renameFile(renameFileBtn.dataset.uuid, newName.trim());
          }
          return;
        }

        // Trigger Move File
        const moveFileBtn = e.target.closest('.fm-btn-move-file');
        if (moveFileBtn) {
          e.preventDefault();
          e.stopPropagation();
          document.querySelectorAll('.fm-dropdown-menu').forEach(m => m.classList.add('hidden'));
          this.openMoveModal([moveFileBtn.dataset.uuid], []);
          return;
        }

        // Trigger Delete File
        const deleteFileBtn = e.target.closest('.fm-btn-delete-file');
        if (deleteFileBtn) {
          e.preventDefault();
          e.stopPropagation();
          document.querySelectorAll('.fm-dropdown-menu').forEach(m => m.classList.add('hidden'));
          if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้อย่างถาวร? การลบไม่สามารถกู้คืนได้')) {
            this.deleteFile(deleteFileBtn.dataset.uuid);
            // Close preview modal too
            const closeBtn = document.getElementById('pdf-preview-close');
            if (closeBtn) closeBtn.click();
          }
          return;
        }
      });
    }

    // Toggle dropdown inside PDF preview modal
    const previewMoreActionsBtn = document.getElementById('pdf-preview-more-actions');
    if (previewMoreActionsBtn) {
      previewMoreActionsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const menu = document.getElementById('pdf-preview-dropdown-menu');
        if (menu) {
          const isHidden = menu.classList.contains('hidden');
          document.querySelectorAll('.fm-dropdown-menu').forEach(m => {
            if (m !== menu) m.classList.add('hidden');
          });
          if (isHidden) {
            menu.classList.remove('hidden');
            menu.style.position = 'absolute';
            menu.style.top = '100%';
            menu.style.right = '0';
            menu.style.left = 'auto';
            menu.style.zIndex = '50';
          } else {
            menu.classList.add('hidden');
          }
        }
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.fm-dropdown-trigger') && !e.target.closest('#pdf-preview-more-actions')) {
        document.querySelectorAll('.fm-dropdown-menu').forEach(menu => {
          menu.classList.add('hidden');
          menu.style.position = '';
          menu.style.top = '';
          menu.style.left = '';
          menu.style.right = '';
          menu.style.zIndex = '';
        });
      }
    });

    // Close dropdowns on scroll to prevent fixed position alignment bugs
    window.addEventListener('scroll', () => {
      document.querySelectorAll('.fm-dropdown-menu').forEach(menu => {
        menu.classList.add('hidden');
        menu.style.position = '';
        menu.style.top = '';
        menu.style.left = '';
        menu.style.right = '';
        menu.style.zIndex = '';
      });
    }, { passive: true });

    const tableContainer = document.getElementById('fm-table-container');
    if (tableContainer) {
      tableContainer.addEventListener('scroll', () => {
        document.querySelectorAll('.fm-dropdown-menu').forEach(menu => {
          menu.classList.add('hidden');
          menu.style.position = '';
          menu.style.top = '';
          menu.style.left = '';
          menu.style.right = '';
          menu.style.zIndex = '';
        });
      }, { passive: true });
    }

    // 13. Sidebar folder tree click delegation
    const sidebarTree = document.getElementById('sidebar-folder-tree');
    if (sidebarTree) {
      sidebarTree.addEventListener('click', (e) => {
        // Toggle chevron button click
        const toggleBtn = e.target.closest('.fm-folder-toggle-btn');
        if (toggleBtn) {
          e.preventDefault();
          e.stopPropagation();
          const folderDiv = toggleBtn.closest('[data-id]');
          const folderId = folderDiv ? folderDiv.dataset.id : null;
          if (folderId) {
            const childrenContainer = sidebarTree.querySelector(`#sidebar-folder-children-${folderId}`);
            const chevronIcon = toggleBtn.querySelector('i');
            
            // Read current expanded folders cookie
            let expandedFolders = [];
            try {
              expandedFolders = JSON.parse(this.getCookie('fm_expanded_folders') || '[]');
            } catch(err) { expandedFolders = []; }
            
            if (childrenContainer) {
              if (childrenContainer.classList.contains('hidden')) {
                childrenContainer.classList.remove('hidden');
                if (chevronIcon) {
                  chevronIcon.classList.remove('fa-chevron-right');
                  chevronIcon.classList.add('fa-chevron-down');
                }
                if (!expandedFolders.includes(String(folderId))) {
                  expandedFolders.push(String(folderId));
                }
              } else {
                childrenContainer.classList.add('hidden');
                if (chevronIcon) {
                  chevronIcon.classList.remove('fa-chevron-down');
                  chevronIcon.classList.add('fa-chevron-right');
                }
                expandedFolders = expandedFolders.filter(id => id !== String(folderId));
              }
            }
            // Save back to cookie
            this.setCookie('fm_expanded_folders', JSON.stringify(expandedFolders), 30);
          }
          return;
        }

        // Folder navigation click
        const sidebarNav = e.target.closest('.fm-sidebar-folder');
        if (sidebarNav) {
          e.preventDefault();
          this.currentFolderId = sidebarNav.dataset.id || null;
          this.page = 1;
          this.searchTerm = '';
          if (this.searchField) this.searchField.value = '';
          this.activeTab = 'files';

          document.querySelectorAll('.fm-nav-item').forEach(b => {
            b.classList.remove('bg-emerald-50', 'text-emerald-800', 'font-semibold');
            b.classList.add('text-gray-600', 'hover:bg-slate-50', 'hover:text-gray-800');
          });
          const filesNavBtn = document.querySelector('.fm-nav-item[data-tab="files"]');
          if (filesNavBtn) {
            filesNavBtn.classList.add('bg-emerald-50', 'text-emerald-800', 'font-semibold');
            filesNavBtn.classList.remove('text-gray-600', 'hover:bg-slate-50', 'hover:text-gray-800');
          }

          this.updateURLParams();
          this.fetchData();

          const sidebarEl = document.getElementById('sidebar-left');
          const backdropEl = document.getElementById('sidebar-backdrop');
          if (sidebarEl && window.innerWidth < 1024) {
            sidebarEl.classList.remove('translate-x-0', 'shadow-2xl');
            sidebarEl.classList.add('-translate-x-full');
            if (backdropEl) backdropEl.classList.add('hidden');
          }
          return;
        }

        // Folder dropdown click delegation for actions
        const renameFolderBtn = e.target.closest('.fm-btn-rename-folder');
        if (renameFolderBtn) {
          e.preventDefault();
          e.stopPropagation();
          document.querySelectorAll('.fm-dropdown-menu').forEach(menu => menu.classList.add('hidden'));
          const currentName = renameFolderBtn.dataset.name;
          const newName = prompt('กรุณากรอกชื่อโฟลเดอร์ใหม่:', currentName);
          if (newName && newName.trim() && newName.trim() !== currentName) {
            this.renameFolder(renameFolderBtn.dataset.id, newName.trim());
          }
          return;
        }

        const moveFolderBtn = e.target.closest('.fm-btn-move-folder');
        if (moveFolderBtn) {
          e.preventDefault();
          e.stopPropagation();
          document.querySelectorAll('.fm-dropdown-menu').forEach(menu => menu.classList.add('hidden'));
          this.openMoveModal([], [moveFolderBtn.dataset.id]);
          return;
        }

        const downloadZipFolderBtn = e.target.closest('.fm-action-download-folder');
        if (downloadZipFolderBtn) {
          e.preventDefault();
          e.stopPropagation();
          document.querySelectorAll('.fm-dropdown-menu').forEach(menu => menu.classList.add('hidden'));
          this.downloadFolder(downloadZipFolderBtn.dataset.id);
          return;
        }

        const deleteFolderBtn = e.target.closest('.fm-btn-delete-folder');
        if (deleteFolderBtn) {
          e.preventDefault();
          e.stopPropagation();
          document.querySelectorAll('.fm-dropdown-menu').forEach(menu => menu.classList.add('hidden'));
          if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโฟลเดอร์นี้และเอกสารลูกทั้งหมดด้านในอย่างถาวร?')) {
            this.deleteFolder(deleteFolderBtn.dataset.id);
          }
          return;
        }

        // Toggle Actions Dropdown inside Sidebar Tree
        const trigger = e.target.closest('.fm-dropdown-trigger');
        if (trigger) {
          e.preventDefault();
          e.stopPropagation();
          const menu = trigger.nextElementSibling;
          const isHidden = menu.classList.contains('hidden');
          document.querySelectorAll('.fm-dropdown-menu').forEach(m => {
            m.classList.add('hidden');
            m.style.position = '';
            m.style.top = '';
            m.style.left = '';
            m.style.right = '';
            m.style.zIndex = '';
          });
          if (isHidden) {
            menu.classList.remove('hidden');
            
            // Fixed position alignment for sidebar trigger to prevent cutting off
            const rect = trigger.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.zIndex = '9999';
            
            // Check if dropdown goes below viewport
            const menuHeight = 160; // Estimated height for folder dropdown
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
              menu.style.top = `${rect.top - menuHeight - 4}px`;
            } else {
              menu.style.top = `${rect.bottom + 4}px`;
            }
            
            menu.style.left = `${rect.right - 160}px`; // w-40 is 160px
          }
          return;
        }
      });
    }
  }

  renderContent() {
    // 1. Sync UI Tab Highlight Highlights
    document.querySelectorAll('.fm-nav-item').forEach(b => {
      b.classList.remove('bg-emerald-50', 'text-emerald-800', 'font-semibold');
      b.classList.add('text-gray-600', 'hover:bg-slate-50', 'hover:text-gray-800');
    });
    const activeNavBtn = document.querySelector(`.fm-nav-item[data-tab="${this.activeTab}"]`);
    if (activeNavBtn) {
      activeNavBtn.classList.add('bg-emerald-50', 'text-emerald-800', 'font-semibold');
      activeNavBtn.classList.remove('text-gray-600', 'hover:bg-slate-50', 'hover:text-gray-800');
    }

    // 2. Title update
    const mainTitle = document.getElementById('fm-main-title');
    if (mainTitle) {
      let titleIcon = 'fa-chart-pie';
      let titleText = 'แดชบอร์ดสรุปสถิติคลังไฟล์';
      if (this.activeTab === 'files') {
        titleIcon = 'fa-folder-tree';
        titleText = 'จัดการคลังข้อมูลเอกสารหลัก';
      } else if (this.activeTab === 'settings') {
        titleIcon = 'fa-sliders';
        titleText = 'ตั้งค่าระบบคลังไฟล์';
      }
      mainTitle.innerHTML = `<i class="fa-solid ${titleIcon} text-emerald-600 mr-2.5 text-base"></i><span>${titleText}</span>`;
    }

    // 3. Layout visibility toggles
    const breadcrumbsRow = document.getElementById('fm-breadcrumbs-row');
    const searchRow = document.getElementById('fm-search-row');
    const uploadWrapper = document.getElementById('fm-upload-box-wrapper');
    
    if (this.activeTab === 'settings') {
      if (uploadWrapper) uploadWrapper.classList.add('hidden');
      if (breadcrumbsRow) breadcrumbsRow.classList.add('hidden');
      if (searchRow) searchRow.classList.add('hidden');
      this.dashboardContainer.classList.add('hidden');
      this.filesTableContainer.classList.add('hidden');
      this.settingsContainer.classList.remove('hidden');
      return; // Skip table rendering
    }

    this.settingsContainer.classList.add('hidden');

    if (this.activeTab === 'dashboard' && this.currentFolderId === null && !this.searchTerm) {
      if (breadcrumbsRow) breadcrumbsRow.classList.remove('hidden');
      if (searchRow) searchRow.classList.remove('hidden');
      this.dashboardContainer.classList.remove('hidden');
      this.filesTableContainer.classList.remove('hidden');
      this.renderDashboard();
    } else {
      if (breadcrumbsRow) breadcrumbsRow.classList.remove('hidden');
      if (searchRow) searchRow.classList.remove('hidden');
      this.dashboardContainer.classList.add('hidden');
      this.filesTableContainer.classList.remove('hidden');
    }

    // Dynamic Dropzone repositioning and tab toggling
    if (uploadWrapper) {
      uploadWrapper.classList.remove('hidden');
      if (this.activeTab === 'dashboard' && this.currentFolderId === null && !this.searchTerm) {
        // Place uploadWrapper after dashboardContainer so statistics are above Dropzone
        if (this.dashboardContainer.parentNode) {
          this.dashboardContainer.parentNode.insertBefore(uploadWrapper, this.dashboardContainer.nextSibling);
        }
      } else {
        // Place uploadWrapper before breadcrumbsRow
        if (breadcrumbsRow && breadcrumbsRow.parentNode) {
          breadcrumbsRow.parentNode.insertBefore(uploadWrapper, breadcrumbsRow);
        }
      }
    }

    // Render breadcrumbs & sidebar tree
    this.renderBreadcrumbs();
    this.renderSidebarTree();
    this.updateSortIcons();
    
    // Sync current page select all check state
    this.updateMasterCheckboxState();

    // Results summary label (Only show when search or advanced filters are active)
    const hasSearchOrFilters = !!this.searchTerm || (this.fileTypeFilter && this.fileTypeFilter !== 'all') || (this.dateRangeFilter && this.dateRangeFilter !== 'all');
    const resultsSummary = document.getElementById('fm-results-summary');
    if (resultsSummary) {
      if (hasSearchOrFilters) {
        resultsSummary.classList.remove('hidden');
        if (this.resultsSummaryText) {
          const foldersCount = this.folders.length;
          const filesCount = this.files.length;
          const totalCount = this.pager.total || (foldersCount + filesCount);
          this.resultsSummaryText.textContent = `พบข้อมูลทั้งหมด ${totalCount} รายการ (โฟลเดอร์: ${foldersCount}, ไฟล์: ${filesCount})`;
        }
      } else {
        resultsSummary.classList.add('hidden');
      }
    }

    const hasFoldersToRender = this.page === 1 && this.folders.length > 0;
    if (!hasFoldersToRender && this.files.length === 0) {
      this.listContent.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-16 text-center text-gray-400">
            <i class="fa-solid fa-folder-open text-5xl mb-4 text-gray-250 block mx-auto"></i>
            <span class="text-xs font-semibold text-gray-500">ไม่พบโฟลเดอร์หรือไฟล์เอกสารในระบบ</span>
          </td>
        </tr>
      `;
      this.pagination.innerHTML = '';
      return;
    }

    const isSearchMode = !!this.searchTerm;
    let html = '';

    // Render Folders (Only displayed on the first page of pagination)
    if (this.page === 1) {
      this.folders.forEach(folder => {
        const isFolderSelected = this.selectedFolderIds.has(String(folder.id)) || this.selectedFolderIds.has(Number(folder.id));
        html += `
          <tr class="hover:bg-slate-50/50 transition">
            <td class="pl-6 py-4 w-[1%] whitespace-nowrap text-center">
              <input type="checkbox" class="fm-folder-select rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" data-id="${folder.id}" ${isFolderSelected ? 'checked' : ''}>
            </td>
            <td class="px-6 py-4 cursor-pointer fm-folder-item" data-id="${folder.id}">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 text-base shrink-0">
                  <i class="fa-solid fa-folder"></i>
                </div>
                <div class="flex flex-col min-w-0 flex-grow">
                  <span class="text-sm font-semibold text-gray-800 truncate max-w-xs md:max-w-md" title="${this.escapeHtml(folder.name)}">${this.escapeHtml(folder.name)}</span>
                  <div class="flex items-center space-x-2 text-[10px] text-gray-400 mt-1 select-none">
                    <span class="inline-flex items-center" title="โฟลเดอร์ย่อย"><i class="fa-solid fa-folder text-slate-400 text-[9px] mr-1"></i> ${folder.subfolder_count || 0}</span>
                    <span class="text-gray-300">•</span>
                    <span class="inline-flex items-center" title="ไฟล์เอกสาร"><i class="fa-solid fa-file text-slate-400 text-[9px] mr-1"></i> ${folder.file_count || 0}</span>
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 w-[1%] whitespace-nowrap text-xs text-gray-500 hidden sm:table-cell select-none">-</td>
            <td class="px-6 py-4 w-[1%] whitespace-nowrap text-xs text-gray-500 hidden md:table-cell select-none">${this.formatDate(folder.updated_at)}</td>
            <td class="px-6 py-4 w-[1%] whitespace-nowrap text-right space-x-1.5 overflow-visible">
              <div class="relative inline-block text-left">
                <button class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition fm-dropdown-trigger cursor-pointer" title="เมนูจัดการ">
                  <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
                </button>
                <div class="fm-dropdown-menu absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-1 hidden z-50 text-left">
                  <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50">ทั่วไป</div>
                  
                  ${isSearchMode ? `
                  <button class="w-full flex items-center px-4 py-2 text-xs text-emerald-600 hover:bg-emerald-50 transition fm-action-go-to-location" data-container-id="${folder.parent_id || ''}">
                    <i class="fa-solid fa-arrow-right-to-bracket mr-2.5 text-emerald-500 w-4 text-center"></i> ไปยังที่อยู่โฟลเดอร์
                  </button>
                  ` : ''}

                  <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-download-folder" data-id="${folder.id}">
                    <i class="fa-solid fa-file-zipper mr-2.5 text-slate-400 w-4 text-center"></i> ดาวน์โหลดโฟลเดอร์ (Zip)
                  </button>
                  <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-copy-folder-link" data-id="${folder.id}">
                    <i class="fa-solid fa-share-nodes mr-2.5 text-slate-400 w-4 text-center"></i> คัดลอกลิงก์ดาวน์โหลด
                  </button>

                  <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50 mt-1">แก้ไข</div>
                  <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-rename-folder" data-id="${folder.id}" data-name="${this.escapeHtml(folder.name)}">
                    <i class="fa-solid fa-pen mr-2.5 text-slate-400 w-4 text-center"></i> เปลี่ยนชื่อ
                  </button>
                  <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-move-folder" data-id="${folder.id}">
                    <i class="fa-solid fa-arrows-up-down-left-right mr-2.5 text-slate-400 w-3.5 text-center"></i> ย้ายไปยัง...
                  </button>
                  
                  <div class="border-t border-gray-100 my-1"></div>
                  <button class="w-full flex items-center px-4 py-2 text-xs text-red-655 hover:bg-red-50 transition fm-btn-delete-folder" data-id="${folder.id}">
                    <i class="fa-solid fa-trash-can mr-2.5 w-4 text-center"></i> ลบโฟลเดอร์
                  </button>
                </div>
              </div>
            </td>
          </tr>
        `;
      });
    }

    // Render Files
    this.files.forEach(file => {
      const isPdf = file.mime_type === 'application/pdf';
      const fileIcon = isPdf ? 'fa-file-pdf text-red-500' : 'fa-file-lines text-blue-500';
      const fileBg = isPdf ? 'bg-red-50' : 'bg-blue-50';

      const isPhysical = file.storage_type === 'physical';
      const storageBadge = isPhysical 
        ? `<span class="inline-flex items-center text-[9px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded mr-2 shrink-0 select-none" title="จัดเก็บแบบเครื่องเซิร์ฟเวอร์ (Physical)"><i class="fa-solid fa-server mr-1"></i> Physical</span>`
        : `<span class="inline-flex items-center text-[9px] font-semibold text-fuchsia-600 bg-fuchsia-50 px-1.5 py-0.5 rounded mr-2 shrink-0 select-none" title="จัดเก็บแบบชิ้นส่วนฐานข้อมูล (DB Chunks)"><i class="fa-solid fa-database mr-1"></i> DB Storage</span>`;

      const canPreview = isPdf || this.isMediaFile(file.filename);
      const isFileSelected = this.selectedFileUuids.has(file.uuid);

      html += `
        <tr class="hover:bg-slate-50/50 transition">
          <td class="pl-6 py-4 w-[1%] whitespace-nowrap text-center">
            <input type="checkbox" class="fm-file-select rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" data-uuid="${file.uuid}" ${isFileSelected ? 'checked' : ''}>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 ${fileBg} rounded-lg flex items-center justify-center text-base shrink-0">
                <i class="fa-solid ${fileIcon}"></i>
              </div>
              <div class="flex flex-col min-w-0 flex-grow">
                <span class="text-sm font-semibold text-gray-800 truncate max-w-xs md:max-w-md lg:max-w-xl" title="${this.escapeHtml(file.filename)}">${this.escapeHtml(file.filename)}</span>
                <div class="flex items-center mt-1 min-w-0 text-[10px] text-gray-400 select-none">
                  ${storageBadge}
                  ${file.file_hash ? `<button class="text-gray-400 hover:text-gray-600 cursor-pointer fm-btn-copy-hash shrink-0 mr-2" data-hash="${file.file_hash}" title="คัดลอกค่า Hash"><i class="fa-solid fa-copy text-[9px]"></i></button>` : ''}
                  <span class="inline-flex items-center mr-2" title="จำนวนเข้าชม"><i class="fa-solid fa-eye mr-1 text-slate-400 text-[9px]"></i> ${file.view_count || 0}</span>
                  <span class="text-gray-300 mr-2">•</span>
                  <span class="inline-flex items-center" title="จำนวนดาวน์โหลด"><i class="fa-solid fa-download mr-1 text-slate-400 text-[9px]"></i> ${file.download_count || 0}</span>
                </div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 w-[1%] whitespace-nowrap text-xs text-gray-650 hidden sm:table-cell">${file.formatted_size}</td>
          <td class="px-6 py-4 w-[1%] whitespace-nowrap text-xs text-gray-500 hidden md:table-cell select-none">${this.formatDate(file.updated_at)}</td>
          <td class="px-6 py-4 w-[1%] whitespace-nowrap text-right space-x-1.5 overflow-visible">
            ${isPdf ? `
            <button class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition fm-btn-preview cursor-pointer" data-encoded-uuid="${file.encoded_uuid}" data-filename="${this.escapeHtml(file.filename)}" title="พรีวิวตัวอย่าง">
              <i class="fa-solid fa-eye text-xs"></i>
            </button>
            ` : ''}
            <div class="relative inline-block text-left">
              <button class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition fm-dropdown-trigger cursor-pointer" title="เมนูจัดการ">
                <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
              </button>
              <div class="fm-dropdown-menu absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-1 hidden z-50 text-left">
                <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50">ทั่วไป</div>
                ${isPdf ? `
                <button class="w-full flex items-center px-4 py-2 text-xs text-emerald-600 hover:bg-emerald-50 transition fm-action-preview" data-encoded-uuid="${file.encoded_uuid}" data-filename="${this.escapeHtml(file.filename)}">
                  <i class="fa-solid fa-eye mr-2.5 text-emerald-500 w-4 text-center"></i> ดูตัวอย่าง PDF
                </button>
                ` : ''}
                <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-copy-link" data-encoded-uuid="${file.encoded_uuid}" data-filename="${this.escapeHtml(file.filename)}" data-folder-id="${file.container_id || ''}">
                  <i class="fa-solid fa-share-nodes mr-2.5 text-slate-400 w-4 text-center"></i> คัดลอกลิงก์
                </button>
                <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-copy-hash" data-hash="${file.file_hash || ''}">
                  <i class="fa-solid fa-hashtag mr-2.5 text-slate-400 w-4 text-center"></i> คัดลอกค่า Hash
                </button>
                <a href="/moph-db/file/download/${file.encoded_uuid}" class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition">
                  <i class="fa-solid fa-download mr-2.5 text-slate-400 w-4 text-center"></i> ดาวน์โหลดไฟล์
                </a>
                
                <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50 mt-1">แก้ไข</div>
                <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-rename-file" data-uuid="${file.uuid}" data-name="${this.escapeHtml(file.filename)}">
                  <i class="fa-solid fa-pen mr-2.5 text-slate-400 w-4 text-center"></i> เปลี่ยนชื่อ
                </button>
                <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-move-file" data-uuid="${file.uuid}">
                  <i class="fa-solid fa-arrows-up-down-left-right mr-2.5 text-slate-400 w-4 text-center"></i> ย้ายไปยัง...
                </button>
                
                <div class="border-t border-gray-100 my-1"></div>
                <button class="w-full flex items-center px-4 py-2 text-xs text-red-650 hover:bg-red-50 transition fm-btn-delete-file" data-uuid="${file.uuid}">
                  <i class="fa-solid fa-trash-can mr-2.5 w-4 text-center"></i> ลบไฟล์
                </button>
              </div>
            </div>
          </td>
        </tr>
      `;
    });

    this.listContent.innerHTML = html;
    this.renderPagination();

    // Check for shareable preview file auto-open logic
    const params = new URLSearchParams(window.location.search);
    const previewFileUuid = params.get('preview_file');
    const previewName = params.get('preview_name') || '';
    if (previewFileUuid && !this.previewOpenedFromUrl) {
      this.previewOpenedFromUrl = true;
      const fileToPreview = this.files.find(f => f.encoded_uuid === previewFileUuid);
      if (fileToPreview) {
        this.openPreviewModal(fileToPreview);
      } else {
        // Fallback: Open preview modal directly using parameters passed in URL
        this.openPreviewModal(previewFileUuid, previewName);
      }
    }
    
    // Auto-update floating bar state based on current checkboxes (e.g. clear after delete)
    this.renderFloatingBar();
  }

  renderSidebarTree() {
    const sidebarContainer = document.getElementById('sidebar-folder-tree');
    if (!sidebarContainer) return;

    // Load expanded folders from cookie
    let expandedFolders = [];
    const hasExpandedCookie = this.getCookie('fm_expanded_folders') !== null && this.getCookie('fm_expanded_folders') !== '';
    try {
      expandedFolders = JSON.parse(this.getCookie('fm_expanded_folders') || '[]');
    } catch(err) { expandedFolders = []; }

    // Filter to root containers (parent_id is null, 0, or empty string)
    const rootFolders = this.all_folders.filter(f => f.parent_id === null || f.parent_id === "" || f.parent_id === 0 || f.parent_id === "0");
    
    let html = `
      <a href="?folder=" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-slate-50 rounded-lg transition ${!this.currentFolderId && this.activeTab === 'files' ? 'bg-emerald-50 text-emerald-800 font-semibold' : ''}" data-folder-root>
        <i class="fa-solid fa-house-chimney text-emerald-600 mr-2.5 text-xs"></i> คลังไฟล์หลัก
      </a>
    `;

    const buildTreeHTML = (folders, depth = 0) => {
      let subHtml = '';
      folders.forEach(folder => {
        const children = this.all_folders.filter(f => parseInt(f.parent_id) === parseInt(folder.id));
        const isActive = parseInt(this.currentFolderId) === parseInt(folder.id);
        const isExpanded = hasExpandedCookie 
          ? expandedFolders.includes(String(folder.id)) 
          : (depth <= 1);
        
        subHtml += `
          <div class="flex flex-col transition" data-id="${folder.id}">
            <div class="group flex items-center justify-between w-full hover:bg-slate-50/70 rounded-md transition py-1 pr-1 pl-1 relative">
              <div class="flex items-center min-w-0 flex-grow cursor-pointer fm-sidebar-folder" data-id="${folder.id}">
                ${children.length > 0 ? `
                  <button class="p-1 hover:bg-slate-100 rounded text-gray-400 hover:text-gray-600 transition shrink-0 fm-folder-toggle-btn mr-1">
                    <i class="fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[8px] transition-transform duration-200"></i>
                  </button>
                ` : '<span class="w-5 shrink-0"></span>'}
                <i class="fa-solid fa-folder text-amber-500 mr-1.5 shrink-0 text-xs"></i>
                <span class="truncate text-xs text-gray-700 font-medium ${isActive ? 'text-emerald-850 font-bold' : ''}" title="${this.escapeHtml(folder.name)}">
                  ${this.escapeHtml(folder.name)}
                </span>
              </div>
              <div class="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition shrink-0 ml-1 relative">
                <button class="p-1 text-gray-450 hover:text-gray-650 hover:bg-gray-200 rounded transition fm-dropdown-trigger cursor-pointer" title="จัดการโฟลเดอร์">
                  <i class="fa-solid fa-ellipsis-vertical text-[9px]"></i>
                </button>
                <div class="fm-dropdown-menu absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1 hidden z-50 text-left">
                  <button class="w-full flex items-center px-3 py-1.5 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-rename-folder" data-id="${folder.id}" data-name="${this.escapeHtml(folder.name)}">
                    <i class="fa-solid fa-pen mr-2 text-slate-400 w-3.5 text-center"></i> เปลี่ยนชื่อ
                  </button>
                  <button class="w-full flex items-center px-3 py-1.5 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-move-folder" data-id="${folder.id}">
                    <i class="fa-solid fa-arrows-up-down-left-right mr-2 text-slate-400 w-3.5 text-center"></i> ย้ายไปยัง...
                  </button>
                  <button class="w-full flex items-center px-3 py-1.5 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-download-folder" data-id="${folder.id}">
                    <i class="fa-solid fa-file-zipper mr-2 text-slate-400 w-3.5 text-center"></i> ดาวน์โหลด Zip
                  </button>
                  <div class="border-t border-gray-100 my-1"></div>
                  <button class="w-full flex items-center px-3 py-1.5 text-xs text-red-650 hover:bg-red-50 transition fm-btn-delete-folder" data-id="${folder.id}">
                    <i class="fa-solid fa-trash-can mr-2 w-3.5 text-center"></i> ลบโฟลเดอร์
                  </button>
                </div>
              </div>
            </div>
            ${children.length > 0 ? `
              <div id="sidebar-folder-children-${folder.id}" class="fm-folder-children border-l border-slate-200/60 ml-[18px] pl-1.5 mb-1 mt-0.5 ${isExpanded ? '' : 'hidden'}" data-parent-id="${folder.id}">
                ${buildTreeHTML(children, depth + 1)}
              </div>
            ` : ''}
          </div>
        `;
      });
      return subHtml;
    };

    html += buildTreeHTML(rootFolders, 0);
    sidebarContainer.innerHTML = html;
  }

  updateSortIcons() {
    const iconName = document.getElementById('fm-sort-icon-name');
    const iconSize = document.getElementById('fm-sort-icon-size');
    if (!iconName || !iconSize) return;

    iconName.innerHTML = '';
    iconSize.innerHTML = '';

    const dirIndicator = this.sortDir === 'asc' ? ' ▲' : ' ▼';
    if (this.sortBy === 'name') {
      iconName.innerHTML = `<span class="text-emerald-600 font-bold">${dirIndicator}</span>`;
    } else if (this.sortBy === 'size') {
      iconSize.innerHTML = `<span class="text-emerald-600 font-bold">${dirIndicator}</span>`;
    }
  }

  renderBreadcrumbs() {
    let html = `
      <a href="?folder=" class="fm-breadcrumb-item hover:text-emerald-600 transition" data-id="">
        <i class="fa-solid fa-house-chimney text-xs mr-1"></i> คลังไฟล์หลัก
      </a>
    `;

    this.path.forEach((folder, index) => {
      html += `
        <span class="text-gray-300 text-xs">/</span>
        <a href="?folder=${folder.id}" class="fm-breadcrumb-item hover:text-emerald-600 transition truncate max-w-40" data-id="${folder.id}">
          ${this.escapeHtml(folder.name)}
        </a>
      `;
    });

    this.breadcrumbs.innerHTML = html;
  }

  renderPagination() {
    if (!this.pager || this.pager.pageCount <= 1) {
      this.pagination.innerHTML = `<span class="text-xs text-gray-500 font-medium">แสดงผลทั้งหมด ${this.pager.total || 0} รายการ</span>`;
      return;
    }

    const { currentPage, pageCount, hasPrevious, hasNext } = this.pager;

    let paginationHtml = `
      <span class="text-xs text-gray-500 font-medium">หน้า ${currentPage} จากทั้งหมด ${pageCount} หน้า</span>
      <div class="flex items-center space-x-1">
        <button id="fm-pg-prev" class="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold rounded-lg transition cursor-pointer" ${!hasPrevious ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          ก่อนหน้า
        </button>
        <button id="fm-pg-next" class="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold rounded-lg transition cursor-pointer" ${!hasNext ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          ถัดไป
        </button>
      </div>
    `;

    this.pagination.innerHTML = paginationHtml;

    const btnPrev = document.getElementById('fm-pg-prev');
    const btnNext = document.getElementById('fm-pg-next');

    if (btnPrev && hasPrevious) {
      btnPrev.addEventListener('click', () => {
        this.page--;
        this.updateURLParams();
        this.fetchData();
      });
    }

    if (btnNext && hasNext) {
      btnNext.addEventListener('click', () => {
        this.page++;
        this.updateURLParams();
        this.fetchData();
      });
    }
  }

  renderFloatingBar() {
    const count = this.selectedFileUuids.size + this.selectedFolderIds.size;

    let bar = document.getElementById('fm-floating-bar');

    if (count === 0) {
      this.removeFloatingBar();
      return;
    }

    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'fm-floating-bar';
      bar.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-100/40 text-black rounded-2xl px-6 py-4 flex items-center justify-between space-x-6 shadow-2xl transition-all duration-300 translate-y-20 opacity-0 z-40 w-max max-w-[90vw]';
      bar.innerHTML = `
        <div class="flex items-center space-x-3 shrink-0">
          <div class="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow">
            <span id="fm-bar-count">0</span>
          </div>
          <span class="text-sm tracking-wide">รายการที่เลือกไว้</span>
        </div>
        <div class="flex items-center space-x-2 flex-nowrap shrink-0">
          <button id="fm-bar-btn-download" class="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-black text-xs font-semibold rounded-lg transition border border-slate-200 cursor-pointer whitespace-nowrap">
            <i class="fa-solid fa-file-zipper mr-1.5 text-emerald-400"></i> ดาวน์โหลด
          </button>
          <button id="fm-bar-btn-move" class="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-black text-xs font-semibold rounded-lg transition border border-slate-200 cursor-pointer whitespace-nowrap">
            <i class="fa-solid fa-arrows-up-down-left-right mr-1.5 text-slate-400"></i> ย้ายไปยัง...
          </button>
          <button id="fm-bar-btn-delete" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap">
            <i class="fa-solid fa-trash-can mr-1.5"></i> ลบ
          </button>
        </div>
      `;
      document.body.appendChild(bar);
      requestAnimationFrame(() => {
        bar.classList.remove('translate-y-20', 'opacity-0');
      });

      document.getElementById('fm-bar-btn-download').addEventListener('click', () => this.handleBatchDownload());
      document.getElementById('fm-bar-btn-move').addEventListener('click', () => {
        const selFiles = Array.from(this.selectedFileUuids);
        const selFolders = Array.from(this.selectedFolderIds);
        this.openMoveModal(selFiles, selFolders);
      });
      document.getElementById('fm-bar-btn-delete').addEventListener('click', () => this.handleBatchDelete());
    }

    document.getElementById('fm-bar-count').textContent = count;
  }

  removeFloatingBar() {
    const bar = document.getElementById('fm-floating-bar');
    if (bar) {
      bar.classList.add('translate-y-20', 'opacity-0');
      setTimeout(() => bar.remove(), 300);
    }
  }

  getDescendantIds(folderId) {
    let ids = [parseInt(folderId)];
    const children = this.all_folders.filter(f => parseInt(f.parent_id) === parseInt(folderId));
    children.forEach(child => {
      ids = ids.concat(this.getDescendantIds(child.id));
    });
    return ids;
  }

  openMoveModal(uuids = [], folderIds = []) {
    if (uuids.length === 0 && folderIds.length === 0) return;

    // Build loop prevention list: selected folders and all of their subfolders recursively
    let invalidFolderIds = [];
    folderIds.forEach(id => {
      invalidFolderIds = invalidFolderIds.concat(this.getDescendantIds(id));
    });

    let options = `<option value="">[ คลังไฟล์หลัก / Root ]</option>`;
    this.all_folders.forEach(folder => {
      const isInvalid = invalidFolderIds.includes(parseInt(folder.id));
      if (!isInvalid) {
        options += `<option value="${folder.id}">${this.escapeHtml(folder.name)}</option>`;
      }
    });

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full transform scale-95 transition-transform duration-300">
        <h3 class="text-base font-bold text-gray-800 mb-2 flex items-center">
          <i class="fa-solid fa-arrows-up-down-left-right text-emerald-600 mr-2"></i>
          ย้ายรายการไปยังโฟลเดอร์ปลายทาง
        </h3>
        <p class="text-xs text-gray-400 mb-4">เลือกตำแหน่งโฟลเดอร์สำหรับรายการที่เลือกทั้งหมด (${uuids.length + folderIds.length} รายการ)</p>
        <select id="fm-move-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none mb-6">
          ${options}
        </select>
        <div class="flex items-center justify-end space-x-2">
          <button id="fm-move-btn-cancel" class="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition cursor-pointer">ยกเลิก</button>
          <button id="fm-move-btn-confirm" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer">ยืนยันการย้าย</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#fm-move-btn-confirm').addEventListener('click', async () => {
      const targetId = modal.querySelector('#fm-move-select').value;
      await this.batchMove(uuids, folderIds, targetId);
      modal.remove();
    });

    modal.querySelector('#fm-move-btn-cancel').addEventListener('click', () => {
      modal.remove();
    });
  }

  async batchMove(uuids, folderIds, targetFolderId) {
    try {
      const formData = new FormData();
      uuids.forEach(uuid => formData.append('uuids[]', uuid));
      folderIds.forEach(id => formData.append('folder_ids[]', id));
      if (targetFolderId) formData.append('target_folder_id', targetFolderId);
      formData.append(this.getCsrfName(), this.getCsrfHash());

      const response = await fetch(this.config.batchMoveUrl, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        showToast('ย้ายตำแหน่งรายการเรียบร้อยแล้ว!', 'success');
        this.clearSelection();
        this.fetchData();
      } else {
        throw new Error(data.message || 'Error moving items');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'เกิดข้อผิดพลาดในการย้ายตำแหน่งรายการ');
    }
  }

  async handleBatchDelete() {
    const selFiles = Array.from(this.selectedFileUuids);
    const selFolders = Array.from(this.selectedFolderIds);

    if (selFiles.length === 0 && selFolders.length === 0) return;

    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการที่เลือกทั้งหมดอย่างถาวร?')) return;

    try {
      const formData = new FormData();
      selFiles.forEach(uuid => formData.append('uuids[]', uuid));
      selFolders.forEach(id => formData.append('folder_ids[]', id));
      formData.append(this.getCsrfName(), this.getCsrfHash());

      const response = await fetch(this.config.batchDeleteUrl, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        showToast('ลบรายการที่เลือกเรียบร้อยแล้ว!', 'success');
        this.clearSelection();
        this.fetchData();
      } else {
        throw new Error(data.message || 'Error deleting items');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'เกิดข้อผิดพลาดในการลบรายการ');
    }
  }

  handleBatchDownload() {
    const selFiles = Array.from(this.selectedFileUuids);
    const selFolders = Array.from(this.selectedFolderIds);

    if (selFiles.length === 0 && selFolders.length === 0) return;

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = this.config.batchDownloadUrl;
    form.target = '_blank';

    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = this.getCsrfName();
    csrfInput.value = this.getCsrfHash();
    form.appendChild(csrfInput);

    selFiles.forEach(uuid => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'uuids[]';
      input.value = uuid;
      form.appendChild(input);
    });

    selFolders.forEach(id => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'folders[]';
      input.value = id;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    // Clear selection after download
    this.clearSelection();
    this.renderFloatingBar();
    this.updateMasterCheckboxState();
  }

  openPreviewModal(fileOrUuid, filename = '') {
    let file = null;
    let encodedUuid = '';

    if (typeof fileOrUuid === 'object' && fileOrUuid !== null) {
      file = fileOrUuid;
      encodedUuid = file.encoded_uuid;
      filename = file.filename;
    } else {
      encodedUuid = fileOrUuid;
      file = this.files.find(f => f.encoded_uuid === encodedUuid) || {
        encoded_uuid: encodedUuid,
        filename: filename,
        file_hash: '',
        uuid: '',
        mime_type: 'application/pdf'
      };
    }

    const modal = document.getElementById('pdf-preview-modal');
    const card = document.getElementById('pdf-modal-card');
    const title = document.getElementById('pdf-preview-title');
    const loader = document.getElementById('pdf-preview-loader');
    const dropdownMenu = document.getElementById('pdf-preview-dropdown-menu');

    // Dynamic Preview Nodes
    const iframe = document.getElementById('pdf-preview-iframe');
    const image = document.getElementById('media-preview-image');
    const video = document.getElementById('media-preview-video');
    const audioContainer = document.getElementById('media-preview-audio-container');
    const audio = document.getElementById('media-preview-audio');
    const iconWrapper = document.getElementById('pdf-preview-icon-wrapper');
    const icon = document.getElementById('pdf-preview-icon');

    if (!modal) return;

    // Update browser address bar to include preview parameters dynamically
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('preview_file', encodedUuid);
    currentParams.set('preview_name', filename);
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    window.history.replaceState({}, '', newUrl);

    title.textContent = filename;
    title.title = filename;
    loader.classList.remove('hidden');

    // Reset and hide all media views first
    if (iframe) iframe.classList.add('hidden');
    if (image) image.classList.add('hidden');
    if (video) video.classList.add('hidden');
    if (audioContainer) {
      audioContainer.classList.add('hidden');
      audioContainer.classList.remove('flex');
    }

    if (iframe) iframe.src = '';
    if (image) image.src = '';
    if (video) video.src = '';
    if (audio) audio.src = '';

    const previewUrl = `/moph-db/file/download/${encodedUuid}?preview=1`;
    const ext = filename.split('.').pop().toLowerCase();

    // Check media file extension type
    if (['jpg','jpeg','png','gif','webp'].includes(ext) && image) {
      image.src = previewUrl;
      image.classList.remove('hidden');
      loader.classList.add('hidden');
      if (iconWrapper) iconWrapper.className = 'w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 flex-shrink-0';
      if (icon) icon.className = 'fa-solid fa-file-image';
    } else if (['mp4','webm'].includes(ext) && video) {
      video.src = previewUrl;
      video.classList.remove('hidden');
      loader.classList.add('hidden');
      if (iconWrapper) iconWrapper.className = 'w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 flex-shrink-0';
      if (icon) icon.className = 'fa-solid fa-file-video';
    } else if (['mp3','wav','ogg'].includes(ext) && audioContainer && audio) {
      audio.src = previewUrl;
      audioContainer.classList.remove('hidden');
      audioContainer.classList.add('flex');
      loader.classList.add('hidden');
      if (iconWrapper) iconWrapper.className = 'w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 flex-shrink-0';
      if (icon) icon.className = 'fa-solid fa-file-audio';
    } else if (iframe) {
      // Default to PDF iframe viewer
      iframe.src = previewUrl;
      iframe.classList.remove('hidden');
      if (iconWrapper) iconWrapper.className = 'w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-500 flex-shrink-0';
      if (icon) icon.className = 'fa-solid fa-file-pdf';
      iframe.onload = () => {
        loader.classList.add('hidden');
      };
    }

    // Populate actions dropdown menu dynamically inside preview modal
    if (dropdownMenu) {
      if (file.uuid) {
        dropdownMenu.innerHTML = `
          <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50">ทั่วไป</div>
          <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-copy-link" data-encoded-uuid="${file.encoded_uuid}" data-filename="${this.escapeHtml(file.filename)}" data-folder-id="${file.container_id || ''}">
            <i class="fa-solid fa-share-nodes mr-2.5 text-slate-400 w-4 text-center"></i> คัดลอกลิงก์
          </button>
          <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-copy-hash" data-hash="${file.file_hash || ''}">
            <i class="fa-solid fa-hashtag mr-2.5 text-slate-400 w-4 text-center"></i> คัดลอกค่า Hash
          </button>
          <a href="/moph-db/file/download/${file.encoded_uuid}" class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition">
            <i class="fa-solid fa-download mr-2.5 text-slate-400 w-4 text-center"></i> ดาวน์โหลดไฟล์
          </a>
          
          <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50 mt-1">แก้ไข</div>
          <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-rename-file" data-uuid="${file.uuid}" data-name="${this.escapeHtml(file.filename)}">
            <i class="fa-solid fa-pen mr-2.5 text-slate-400 w-4 text-center"></i> เปลี่ยนชื่อ
          </button>
          <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-move-file" data-uuid="${file.uuid}">
            <i class="fa-solid fa-arrows-up-down-left-right mr-2.5 text-slate-400 w-4 text-center"></i> ย้ายไปยัง...
          </button>
          
          <div class="border-t border-gray-100 my-1"></div>
          <button class="w-full flex items-center px-4 py-2 text-xs text-red-650 hover:bg-red-50 transition fm-btn-delete-file" data-uuid="${file.uuid}">
            <i class="fa-solid fa-trash-can mr-2 w-4 text-center"></i> ลบไฟล์
          </button>
        `;
      } else {
        dropdownMenu.innerHTML = `
          <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50">ทั่วไป</div>
          <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-copy-link" data-encoded-uuid="${file.encoded_uuid}">
            <i class="fa-solid fa-share-nodes mr-2.5 text-slate-400 w-4 text-center"></i> คัดลอกลิงก์
          </button>
          <a href="/moph-db/file/download/${file.encoded_uuid}" class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition">
            <i class="fa-solid fa-download mr-2.5 text-slate-400 w-4 text-center"></i> ดาวน์โหลดไฟล์
          </a>
        `;
      }
    }

    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
      modal.classList.remove('opacity-0');
      card.classList.remove('scale-95');
    });

    const closeHandler = () => {
      // Restore browser address bar and remove preview parameters
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.delete('preview_file');
      currentParams.delete('preview_name');
      const cleanUrl = `${window.location.pathname}${currentParams.toString() ? '?' + currentParams.toString() : ''}`;
      window.history.replaceState({}, '', cleanUrl);

      this.previewOpenedFromUrl = false; // Reset state flag

      modal.classList.add('opacity-0');
      card.classList.add('scale-95');
      setTimeout(() => {
        modal.classList.add('hidden');
        if (iframe) iframe.src = '';
        if (image) image.src = '';
        if (video) video.src = '';
        if (audio) audio.src = '';
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
      }, 300);

      document.getElementById('pdf-preview-close').removeEventListener('click', closeHandler);
      modal.removeEventListener('click', backdropClickHandler);
    };

    const backdropClickHandler = (e) => {
      if (e.target === modal) closeHandler();
    };

    document.getElementById('pdf-preview-close').addEventListener('click', closeHandler);
    modal.addEventListener('click', backdropClickHandler);
  }

  async renameFile(uuid, newName) {
    try {
      const formData = new FormData();
      formData.append('uuid', uuid);
      formData.append('name', newName);
      formData.append(this.getCsrfName(), this.getCsrfHash());

      const response = await fetch(this.config.renameFileUrl, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.status === 'success') {
        showToast('เปลี่ยนชื่อไฟล์เรียบร้อยแล้ว!', 'success');
        this.fetchData();
      } else {
        throw new Error(data.message || 'Error renaming file');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนชื่อไฟล์');
    }
  }

  async deleteFolder(folderId) {
    try {
      const formData = new FormData();
      formData.append('folder_id', folderId);
      formData.append(this.getCsrfName(), this.getCsrfHash());

      const response = await fetch(this.config.deleteFolderUrl, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.status === 'success') {
        showToast('ลบโฟลเดอร์และข้อมูลลูกทั้งหมดเรียบร้อยแล้ว!', 'success');
        this.fetchData();
      } else {
        throw new Error(data.message || 'Error deleting folder');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'เกิดข้อผิดพลาดในการลบโฟลเดอร์');
    }
  }

  async copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        // Fall back
      }
    }
    const textPath = document.createElement("textarea");
    textPath.value = text;
    textPath.style.position = "fixed";
    textPath.style.left = "-999999px";
    textPath.style.top = "-999999px";
    document.body.appendChild(textPath);
    textPath.focus();
    textPath.select();
    try {
      const successful = document.execCommand('copy');
      textPath.remove();
      return successful;
    } catch (err) {
      textPath.remove();
      return false;
    }
  }

  async createFolder(name) {
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (this.currentFolderId) formData.append('parent_id', this.currentFolderId);
      formData.append(this.getCsrfName(), this.getCsrfHash());

      const response = await fetch(this.config.createFolderUrl, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.status === 'success') {
        showToast('สร้างโฟลเดอร์เรียบร้อยแล้ว!', 'success');
        this.fetchData();
      } else {
        throw new Error(data.message || 'Error creating folder');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'เกิดข้อผิดพลาดในการสร้างโฟลเดอร์');
    }
  }

  async deleteFile(uuid) {
    try {
      const formData = new FormData();
      formData.append('uuid', uuid);
      formData.append(this.getCsrfName(), this.getCsrfHash());

      const response = await fetch(this.config.deleteFileUrl, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.status === 'success') {
        showToast('ลบไฟล์เรียบร้อยแล้ว!', 'success');
        this.fetchData();
      } else {
        throw new Error(data.message || 'Error deleting file');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'เกิดข้อผิดพลาดในการลบไฟล์');
    }
  }

  getCsrfName() {
    const meta = document.querySelector('input[type="hidden"][name^="csrf_"]');
    return meta ? meta.name : 'csrf_test_name';
  }

  getCsrfHash() {
    const meta = document.querySelector('input[type="hidden"][name^="csrf_"]');
    return meta ? meta.value : '';
  }

  escapeHtml(string) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(string).replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  refresh() {
    this.fetchData();
  }

  // -----------------------------------------------------------------
  // Antigravity Custom Helper Methods
  // -----------------------------------------------------------------

  applySidebarFoldedState() {
    const isFolded = this.getCookie('fm_sidebar_folded') === '1';
    const sidebar = document.getElementById('sidebar-left');
    const mainWrapper = document.getElementById('main-wrapper');
    const toggleBtn = document.getElementById('fm-sidebar-toggle-btn');
    const toggleIcon = document.getElementById('fm-sidebar-toggle-icon');

    if (!sidebar || !mainWrapper) return;

    if (isFolded) {
      sidebar.classList.remove('max-w-80', 'w-full');
      sidebar.classList.add('max-w-[76px]', 'w-[76px]');

      mainWrapper.classList.remove('lg:ml-80');
      mainWrapper.classList.add('lg:ml-[76px]');

      if (toggleIcon) {
        toggleIcon.className = 'fa-solid fa-angles-right text-xs';
      }
      if (toggleBtn) {
        toggleBtn.title = 'ขยายเมนูนำทาง';
      }

      // Hide sidebar content elements
      document.querySelectorAll('.fm-sidebar-title, .fm-menu-text, #sidebar-folder-tree-section, #sidebar-footer-info').forEach(el => {
        el.classList.add('hidden');
      });

      // Show ONLY active nav tab button, hide other nav buttons
      document.querySelectorAll('.fm-nav-item').forEach(b => {
        if (b.dataset.tab === this.activeTab) {
          b.classList.remove('hidden');
        } else {
          b.classList.add('hidden');
        }
      });
    } else {
      sidebar.classList.add('max-w-80', 'w-full');
      sidebar.classList.remove('max-w-[76px]', 'w-[76px]');

      mainWrapper.classList.add('lg:ml-80');
      mainWrapper.classList.remove('lg:ml-[76px]');

      if (toggleIcon) {
        toggleIcon.className = 'fa-solid fa-angles-left text-xs';
      }
      if (toggleBtn) {
        toggleBtn.title = 'พับเมนูนำทาง';
      }

      // Show sidebar content elements
      document.querySelectorAll('.fm-sidebar-title, .fm-menu-text, #sidebar-folder-tree-section, #sidebar-footer-info').forEach(el => {
        el.classList.remove('hidden');
      });

      // Show ALL nav tab buttons
      document.querySelectorAll('.fm-nav-item').forEach(b => {
        b.classList.remove('hidden');
      });
    }
  }

  formatDate(dateString) {
    if (!dateString) return '-';
    const cleanStr = dateString.replace(' ', 'T');
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) return dateString;

    const day = String(date.getDate()).padStart(2, '0');
    const monthNamesThai = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    const month = monthNamesThai[date.getMonth()];
    
    let year = date.getFullYear();
    const formatSetting = (this.settings && this.settings.date_format) || 'be';
    if (formatSetting === 'be') {
      year += 543;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year} ${hours}:${minutes} น.`;
  }

  isMediaFile(filename) {
    if (!filename) return false;
    const ext = filename.split('.').pop().toLowerCase();
    return ['png','jpg','jpeg','gif','webp','mp4','webm','mp3','wav','ogg'].includes(ext);
  }

  downloadFolder(folderId) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = this.config.batchDownloadUrl;
    form.target = '_blank';
    
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = this.getCsrfName();
    csrfInput.value = this.getCsrfHash();
    form.appendChild(csrfInput);

    const folderInput = document.createElement('input');
    folderInput.type = 'hidden';
    folderInput.name = 'folders[]';
    folderInput.value = folderId;
    form.appendChild(folderInput);
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  renderDashboard() {
    if (!this.dashboardStats) {
      this.dashboardContainer.innerHTML = `
        <div class="bg-white rounded-xl border border-gray-105 shadow-sm p-6 text-center text-gray-400">
          <i class="fa-solid fa-chart-line text-4xl mb-3 text-gray-200 block mx-auto animate-pulse"></i>
          <span>กำลังประมวลผลข้อมูลสถิติระบบ...</span>
        </div>
      `;
      return;
    }

    const stats = this.dashboardStats;
    const dist = stats.storage_distribution || {};

    const dbPct = stats.total_files ? Math.round((dist.database_count / stats.total_files) * 100) : 0;
    const physPct = stats.total_files ? Math.round((dist.physical_count / stats.total_files) * 100) : 0;

    let downloadsHtml = '';
    if (stats.top_downloaded && stats.top_downloaded.length > 0) {
      stats.top_downloaded.forEach((file, index) => {
        downloadsHtml += `
          <div class="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition">
            <div class="flex items-center space-x-3 min-w-0">
              <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-bold text-xs shrink-0 select-none">
                #${index + 1}
              </div>
              <div class="truncate">
                <span class="text-xs font-semibold text-gray-800 block truncate" title="${this.escapeHtml(file.filename)}">${this.escapeHtml(file.filename)}</span>
                <span class="text-[10px] text-gray-450 mt-0.5 block">${file.formatted_size} • ${file.storage_type === 'database' ? 'DB' : 'Physical'}</span>
              </div>
            </div>
            <div class="flex items-center space-x-3 shrink-0">
              <span class="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <i class="fa-solid fa-download mr-1"></i> ${file.download_count || 0}
              </span>
            </div>
          </div>
        `;
      });
    } else {
      downloadsHtml = `<div class="p-6 text-center text-gray-400 text-xs">ยังไม่มีสถิติการดาวน์โหลดไฟล์</div>`;
    }

    let logsHtml = '';
    if (stats.recent_logs && stats.recent_logs.length > 0) {
      stats.recent_logs.forEach(log => {
        const cleaned = log.replace('[AUDIT]', '').trim();
        logsHtml += `
          <div class="flex items-start space-x-2.5 p-2.5 hover:bg-slate-50 border-b border-slate-50/60 last:border-b-0 transition text-[11px]">
            <div class="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-655 shrink-0 mt-0.5">
              <i class="fa-solid fa-clock-rotate-left text-[9px]"></i>
            </div>
            <span class="text-gray-650 leading-relaxed">${this.escapeHtml(cleaned)}</span>
          </div>
        `;
      });
    } else {
      logsHtml = `<div class="p-6 text-center text-gray-400 text-xs">ไม่พบประวัติการใช้งานในระบบขณะนี้</div>`;
    }

    this.dashboardContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
        <!-- Card 1: Total Files -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition">
          <div class="space-y-1">
            <div class="flex items-center text-xs font-bold text-slate-400 uppercase">
              <span>จำนวนไฟล์สะสม</span>
              <div class="relative ml-1 group/tooltip">
                <i class="fa-regular fa-circle-question cursor-pointer text-gray-400 hover:text-gray-600"></i>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50">
                  จำนวนเอกสาร/ไฟล์มีเดียทั้งหมดในคลังระบบ ไม่รวมรายการที่อยู่ในถังขยะ
                </div>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-800">${stats.total_files || 0}</p>
          </div>
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg group-hover:scale-105 transition">
            <i class="fa-solid fa-file-invoice"></i>
          </div>
        </div>

        <!-- Card 2: Storage Size -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition">
          <div class="space-y-1">
            <div class="flex items-center text-xs font-bold text-slate-400 uppercase">
              <span>พื้นที่ใช้งานรวม</span>
              <div class="relative ml-1 group/tooltip">
                <i class="fa-regular fa-circle-question cursor-pointer text-gray-400 hover:text-gray-600"></i>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50">
                  พื้นที่รวมทั้งหมดของไฟล์ที่จัดเก็บจริงบนเซิร์ฟเวอร์และฐานข้อมูลดิบ
                </div>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-800">${stats.formatted_total_size}</p>
          </div>
          <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg group-hover:scale-105 transition">
            <i class="fa-solid fa-hdd"></i>
          </div>
        </div>

        <!-- Card 3: Storage ratio bar details -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div class="space-y-4 select-none">
            <!-- Database info -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="font-medium text-fuchsia-700 flex items-center"><i class="fa-solid fa-database mr-1 text-[10px]"></i> DB Storage</span>
                <span class="font-mono text-gray-600">${dist.database_count || 0} ไฟล์ (${dist.formatted_database_size})</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-fuchsia-500 h-full rounded-full" style="width: ${dbPct}%"></div>
              </div>
            </div>

            <!-- Physical info -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="font-medium text-sky-700 flex items-center"><i class="fa-solid fa-server mr-1 text-[10px]"></i> Physical Storage</span>
                <span class="font-mono text-gray-600">${dist.physical_count || 0} ไฟล์ (${dist.formatted_physical_size})</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-sky-500 h-full rounded-full" style="width: ${physPct}%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <!-- Top downloads -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 class="text-xs font-bold text-gray-800 flex items-center">
              <i class="fa-solid fa-fire text-amber-500 mr-2"></i> ไฟล์ยอดนิยม
            </h3>
          </div>
          <div class="space-y-2.5">
            ${downloadsHtml}
          </div>
        </div>

        <!-- Recent Audit Log activities -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 class="text-xs font-bold text-gray-800 flex items-center">
              <i class="fa-solid fa-shield-halved text-emerald-600 mr-2"></i> บันทึกความปลอดภัยระบบ
            </h3>
          </div>
          <div class="divide-y divide-slate-50 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
            ${logsHtml}
          </div>
        </div>
      </div>
    `;
  }

  renderSettingsForm() {
    this.settingsContainer.innerHTML = `
      <div class="flex flex-col space-y-5">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-base font-bold text-gray-800 flex items-center">
            <i class="fa-solid fa-sliders text-emerald-600 mr-2.5"></i>
            ตั้งค่าระบบคลังไฟล์
          </h2>
          <p class="text-xs text-gray-400 mt-0.5">จัดการค่าพารามิเตอร์หลักของระบบคลังไฟล์และการจัดเก็บชิ้นส่วนข้อมูล</p>
        </div>

        <form id="fm-settings-form" class="space-y-4 max-w-2xl select-none">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- System Name -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-600">ชื่อระบบภาษาไทย</label>
              <input type="text" name="system_name" value="${this.escapeHtml(this.settings.system_name || '')}" class="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            </div>

            <!-- Agency Short Name -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-600">ชื่อย่อหน่วยงาน</label>
              <input type="text" name="agency_short_name" value="${this.escapeHtml(this.settings.agency_short_name || '')}" class="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Date Format -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-600">รูปแบบวันเวลาที่แสดงผล</label>
              <select name="date_format" class="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                <option value="be" ${this.settings.date_format === 'be' ? 'selected' : ''}>พุทธศักราช (ปี พ.ศ. + 543)</option>
                <option value="ce" ${this.settings.date_format === 'ce' ? 'selected' : ''}>คริสต์ศักราช (ปี ค.ศ.)</option>
              </select>
            </div>

            <!-- Default Storage Type -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-600">ค่าเริ่มต้นแหล่งจัดเก็บ</label>
              <select name="default_storage_type" class="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                <option value="database" ${this.settings.default_storage_type === 'database' ? 'selected' : ''}>จัดเก็บในฐานข้อมูล (DB Storage)</option>
                <option value="physical" ${this.settings.default_storage_type === 'physical' ? 'selected' : ''}>จัดเก็บบนดิสก์เซิร์ฟเวอร์ (Physical Storage)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Max Upload File Size -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-600">ขนาดไฟล์สูงสุดต่อชิ้นส่วน (MB)</label>
              <input type="number" name="max_file_size" value="${parseInt(this.settings.max_file_size || 10)}" min="1" class="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            </div>

            <!-- Max Multiple Upload Limit -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-600">จำนวนอัปโหลดไฟล์พร้อมกันสูงสุด</label>
              <input type="number" name="max_multiple_upload" value="${parseInt(this.settings.max_multiple_upload || 10)}" min="1" class="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            </div>
          </div>

          <!-- Allowed Extensions -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-gray-600">นามสกุลไฟล์ที่ได้รับอนุญาต (คั่นด้วยเครื่องหมายจุลภาค)</label>
            <input type="text" name="allowed_extensions" value="${this.escapeHtml(this.settings.allowed_extensions || '')}" class="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" placeholder="pdf, docx, xlsx, png, mp4">
            <span class="text-[10px] text-gray-400 mt-1 block">ตัวอย่างนามสกุลสื่อมีเดียที่ระบบแนะนำ: pdf, doc, docx, xls, xlsx, png, jpg, jpeg, gif, webp, mp4, webm, mp3, wav, ogg</span>
          </div>

          <!-- Save Button -->
          <div class="pt-3">
            <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow hover:shadow-md transition cursor-pointer">
              <i class="fa-solid fa-floppy-disk mr-1.5"></i> บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      </div>
    `;

    const form = document.getElementById('fm-settings-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
          const formData = new FormData(form);
          formData.append(this.getCsrfName(), this.getCsrfHash());

          const response = await fetch('/admin/settings/save', {
            method: 'POST',
            body: formData
          });
          const data = await response.json();

          if (data.status === 'success') {
            showToast('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!', 'success');

            this.fetchData();
          } else {
            throw new Error(data.message || 'Error saving settings');
          }
        } catch(err) {
          console.error(err);
          alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกค่าระบบ');
        }
      });
    }
  }
}
