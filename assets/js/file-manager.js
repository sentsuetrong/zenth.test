class FileManager{constructor(t,s={}){this.container=document.getElementById(t),this.container&&(this.config={listUrl:"/admin/upload/list-json",createFolderUrl:"/admin/upload/create-folder",deleteFileUrl:"/admin/upload/delete-file",batchMoveUrl:"/admin/upload/batch-move",batchDeleteUrl:"/admin/upload/batch-delete",batchDownloadUrl:"/admin/upload/batch-download",renameFolderUrl:"/admin/upload/rename-folder",renameFileUrl:"/admin/upload/rename-file",deleteFolderUrl:"/admin/upload/delete-folder",...s},this.currentFolderId=null,this.searchTerm="",this.page=1,this.sortBy="name",this.sortDir="asc",this.fileTypeFilter="all",this.dateRangeFilter="all",this.startDateFilter="",this.endDateFilter="",this.activeTab="dashboard",this.folders=[],this.all_folders=[],this.files=[],this.path=[],this.pager={},this.settings={},this.dashboardStats=null,this.dropzone=null,this.selectedFileUuids=new Set,this.selectedFolderIds=new Set,this._lastFolderId=void 0,this._lastSearchTerm=void 0,this._lastActiveTab=void 0,this.previewOpenedFromUrl=!1,this.init())}init(){this.loadParamsFromURL(),this.currentFolderId&&(this.activeTab="files"),this.renderSkeleton(),this.cacheElements(),this.bindEvents(),this.applySidebarFoldedState(),this.fetchData(),window.addEventListener("popstate",()=>{this.previewOpenedFromUrl=!1,this.loadParamsFromURL(),this.fetchData()})}registerDropzone(t){this.dropzone=t}setCookie(t,s,a=365){const r=new Date;r.setTime(r.getTime()+a*24*60*60*1e3);const l="expires="+r.toUTCString();document.cookie=t+"="+encodeURIComponent(s)+";"+l+";path=/;SameSite=Strict"}getCookie(t){const s=t+"=",r=decodeURIComponent(document.cookie).split(";");for(let l=0;l<r.length;l++){let n=r[l];for(;n.charAt(0)==" ";)n=n.substring(1);if(n.indexOf(s)==0)return n.substring(s.length,n.length)}return""}loadParamsFromURL(){const t=new URLSearchParams(window.location.search);this.currentFolderId=t.get("folder")||null,this.searchTerm=t.get("q")||"",this.page=parseInt(t.get("page"))||1,this.sortBy=t.get("sort")||"name",this.sortDir=t.get("order")||"asc"}updateURLParams(){const t=new URLSearchParams;this.currentFolderId&&t.set("folder",this.currentFolderId),this.searchTerm&&t.set("q",this.searchTerm),this.page>1&&t.set("page",this.page),this.sortBy!=="name"&&t.set("sort",this.sortBy),this.sortDir!=="asc"&&t.set("order",this.sortDir);const s=`${window.location.pathname}${t.toString()?"?"+t.toString():""}`;window.history.historyToken=null,window.history.pushState({},"",s)}clearSelection(){this.selectedFileUuids.clear(),this.selectedFolderIds.clear();const t=document.getElementById("fm-select-all");t&&(t.checked=!1),this.renderFloatingBar()}updateMasterCheckboxState(){const t=this.container.querySelectorAll(".fm-file-select, .fm-folder-select");if(t.length===0)return;const s=Array.from(t).every(r=>r.checked),a=document.getElementById("fm-select-all");a&&(a.checked=s)}async fetchData(){(this._lastFolderId!==this.currentFolderId||this._lastSearchTerm!==this.searchTerm||this._lastActiveTab!==this.activeTab)&&(this.clearSelection(),this._lastFolderId=this.currentFolderId,this._lastSearchTerm=this.searchTerm,this._lastActiveTab=this.activeTab),this.showLoading();try{const t=new URLSearchParams;this.currentFolderId&&t.set("folder",this.currentFolderId),this.searchTerm&&t.set("q",this.searchTerm),t.set("page",this.page),this.sortBy&&t.set("sort",this.sortBy),this.sortDir&&t.set("order",this.sortDir),this.fileTypeFilter&&this.fileTypeFilter!=="all"&&t.set("file_type",this.fileTypeFilter),this.dateRangeFilter&&this.dateRangeFilter!=="all"&&t.set("date_range",this.dateRangeFilter),this.startDateFilter&&t.set("start_date",this.startDateFilter),this.endDateFilter&&t.set("end_date",this.endDateFilter);const a=await(await fetch(`${this.config.listUrl}?${t.toString()}`)).json();if(a.status==="success"){this.folders=a.folders||[],this.files=a.files||[],this.path=a.path||[],this.pager=a.pager||{},this.all_folders=a.all_folders||[],this.dashboardStats=a.dashboard_stats||null,this.settings=a.settings||{},this.renderContent();const r=new CustomEvent("fm-loaded",{detail:{folderId:this.currentFolderId}});document.dispatchEvent(r)}else throw new Error(a.message||"Error fetching files")}catch(t){console.error(t),this.showError()}}showLoading(){this.listContent.innerHTML=`
      <tr>
        <td colspan="5" class="py-16 text-center">
          <div class="flex flex-col items-center justify-center text-gray-500">
            <i class="fa-solid fa-circle-notch fa-spin text-3xl text-emerald-600 mb-3"></i>
            <p class="text-sm">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E04\u0E25\u0E31\u0E07\u0E44\u0E1F\u0E25\u0E4C...</p>
          </div>
        </td>
      </tr>
    `,this.pagination.innerHTML=""}showError(){this.listContent.innerHTML=`
      <tr>
        <td colspan="5" class="py-16 text-center">
          <div class="flex flex-col items-center justify-center text-red-500">
            <i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
            <p class="text-sm font-medium">\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E1F\u0E25\u0E4C</p>
            <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition cursor-pointer">\u0E42\u0E2B\u0E25\u0E14\u0E43\u0E2B\u0E21\u0E48</button>
          </div>
        </td>
      </tr>
    `,this.pagination.innerHTML=""}renderSkeleton(){this.container.innerHTML=`
      <div class="flex flex-col space-y-6">
        <!-- Top Row: Breadcrumbs & New Folder -->
        <div class="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm shrink-0" id="fm-breadcrumbs-row">
          <nav id="fm-breadcrumbs" class="flex items-center space-x-2 text-sm text-gray-500 font-medium overflow-x-auto whitespace-nowrap py-1">
          </nav>
          <button id="fm-btn-new-folder" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs hover:shadow-md transition shrink-0 font-semibold cursor-pointer">
            <i class="fa-solid fa-folder-plus mr-1.5"></i> \u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E43\u0E2B\u0E21\u0E48
          </button>
        </div>

        <!-- Search & Advanced Filters Container -->
        <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm shrink-0" id="fm-search-row">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="relative flex-grow">
              <input type="text" id="fm-search" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E1F\u0E25\u0E4C \u0E2B\u0E23\u0E37\u0E2D\u0E0A\u0E37\u0E48\u0E2D\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C..." class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none transition">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400 text-xs"></i>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
              <button id="fm-btn-advanced-toggle" class="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-655 rounded-lg text-xs hover:bg-slate-100 hover:text-slate-800 transition font-semibold cursor-pointer flex items-center">
                <i class="fa-solid fa-sliders mr-1.5 text-slate-400"></i> \u0E04\u0E49\u0E19\u0E2B\u0E32\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07
              </button>
              <button id="fm-btn-clear-search" class="px-3 py-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs hover:bg-rose-100 transition font-semibold cursor-pointer flex items-center">
                <i class="fa-solid fa-rotate-right mr-1.5"></i> \u0E25\u0E49\u0E32\u0E07\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07
              </button>
            </div>
          </div>

          <!-- Advanced Search Panel Accordion -->
          <div id="fm-advanced-search-panel" class="hidden border-t border-slate-100 pt-3 transition-all duration-300">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- File Type Filter -->
              <div>
                <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E44\u0E1F\u0E25\u0E4C</label>
                <select id="fm-filter-type" class="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                  <option value="all">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 (All Types)</option>
                  <option value="pdf">\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 PDF</option>
                  <option value="document">\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D (Word/Text)</option>
                  <option value="spreadsheet">\u0E15\u0E32\u0E23\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 (Excel/CSV)</option>
                  <option value="image">\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E (Images)</option>
                  <option value="video">\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D (Videos)</option>
                  <option value="audio">\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E2A\u0E35\u0E22\u0E07 (Audio)</option>
                </select>
              </div>

              <!-- Date Modified Filter -->
              <div>
                <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">\u0E41\u0E01\u0E49\u0E44\u0E02\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14</label>
                <select id="fm-filter-date" class="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                  <option value="all">\u0E17\u0E38\u0E01\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32</option>
                  <option value="today">\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49 (Today)</option>
                  <option value="week">\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C\u0E19\u0E35\u0E49 (This Week)</option>
                  <option value="month">\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49 (This Month)</option>
                  <option value="year">\u0E1B\u0E35\u0E19\u0E35\u0E49 (This Year)</option>
                  <option value="last_year">\u0E1B\u0E35\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32 (Last Year)</option>
                  <option value="custom">\u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E2D\u0E07...</option>
                </select>
              </div>

              <!-- Custom Date Range -->
              <div id="fm-custom-date-container" class="hidden col-span-1">
                <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">\u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32</label>
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
            <span id="fm-results-summary-text">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23...</span>
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
                    \u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 <span id="fm-sort-icon-name" class="font-mono text-xs"></span>
                  </th>
                  <th class="px-6 py-4 text-sm font-semibold text-gray-600 w-[1%] whitespace-nowrap hidden sm:table-cell cursor-pointer select-none" id="fm-th-size">
                    \u0E02\u0E19\u0E32\u0E14 <span id="fm-sort-icon-size" class="font-mono text-xs"></span>
                  </th>
                  <th class="px-6 py-4 text-sm font-semibold text-gray-600 w-[1%] whitespace-nowrap hidden md:table-cell cursor-pointer select-none" id="fm-th-updated">
                    \u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14 <span id="fm-sort-icon-updated" class="font-mono text-xs"></span>
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
    `}cacheElements(){this.breadcrumbs=document.getElementById("fm-breadcrumbs"),this.searchField=document.getElementById("fm-search"),this.btnNewFolder=document.getElementById("fm-btn-new-folder"),this.listContent=document.getElementById("fm-list-content"),this.pagination=document.getElementById("fm-pagination"),this.btnAdvancedToggle=document.getElementById("fm-btn-advanced-toggle"),this.btnClearSearch=document.getElementById("fm-btn-clear-search"),this.advancedPanel=document.getElementById("fm-advanced-search-panel"),this.resultsSummaryText=document.getElementById("fm-results-summary-text"),this.filterType=document.getElementById("fm-filter-type"),this.filterDate=document.getElementById("fm-filter-date"),this.customDateContainer=document.getElementById("fm-custom-date-container"),this.filterStartDate=document.getElementById("fm-filter-start-date"),this.filterEndDate=document.getElementById("fm-filter-end-date"),this.dashboardContainer=document.getElementById("fm-dashboard-container"),this.filesTableContainer=document.getElementById("fm-files-table-container"),this.settingsContainer=document.getElementById("fm-settings-container"),this.searchField&&(this.searchField.value=this.searchTerm)}bindEvents(){this.breadcrumbs&&this.breadcrumbs.addEventListener("click",e=>{const o=e.target.closest(".fm-breadcrumb-item");o&&(e.preventDefault(),this.currentFolderId=o.dataset.id||null,this.page=1,this.searchTerm="",this.searchField&&(this.searchField.value=""),this.updateURLParams(),this.fetchData())});let t;this.searchField.addEventListener("input",e=>{this.searchTerm=e.target.value,this.page=1,clearTimeout(t),t=setTimeout(()=>{this.updateURLParams(),this.fetchData()},300)}),this.btnNewFolder.addEventListener("click",()=>{const e=prompt("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E43\u0E2B\u0E21\u0E48:");e&&e.trim()&&this.createFolder(e.trim())});const s=document.getElementById("fm-sidebar-toggle-btn");s&&s.addEventListener("click",()=>{const e=this.getCookie("fm_sidebar_folded")==="1";this.setCookie("fm_sidebar_folded",e?"0":"1"),this.applySidebarFoldedState()});const a=document.getElementById("sidebar-nav-menu");a&&a.addEventListener("click",e=>{const o=e.target.closest(".fm-nav-item");if(o){e.preventDefault();const h=o.dataset.tab;this.activeTab=h,document.querySelectorAll(".fm-nav-item").forEach(c=>{c.classList.remove("bg-emerald-50","text-emerald-800","font-semibold"),c.classList.add("text-gray-600","hover:bg-slate-50","hover:text-gray-800")}),o.classList.add("bg-emerald-50","text-emerald-800","font-semibold"),o.classList.remove("text-gray-600","hover:bg-slate-50","hover:text-gray-800"),this.getCookie("fm_sidebar_folded")==="1"&&document.querySelectorAll(".fm-nav-item").forEach(c=>{c.dataset.tab===h?c.classList.remove("hidden"):c.classList.add("hidden")}),h==="settings"?this.renderSettingsForm():(this.currentFolderId=null,this.updateURLParams()),this.fetchData()}}),this.btnAdvancedToggle&&this.btnAdvancedToggle.addEventListener("click",()=>{this.advancedPanel.classList.contains("hidden")?(this.advancedPanel.classList.remove("hidden"),this.btnAdvancedToggle.classList.add("bg-slate-200","border-slate-300","text-slate-900")):(this.advancedPanel.classList.add("hidden"),this.btnAdvancedToggle.classList.remove("bg-slate-200","border-slate-300","text-slate-900"))}),this.btnClearSearch&&this.btnClearSearch.addEventListener("click",()=>{this.searchTerm="",this.fileTypeFilter="all",this.dateRangeFilter="all",this.startDateFilter="",this.endDateFilter="",this.searchField&&(this.searchField.value=""),this.filterType&&(this.filterType.value="all"),this.filterDate&&(this.filterDate.value="all"),this.filterStartDate&&(this.filterStartDate.value=""),this.filterEndDate&&(this.filterEndDate.value=""),this.customDateContainer&&this.customDateContainer.classList.add("hidden"),this.updateURLParams(),this.fetchData()}),this.filterType&&this.filterType.addEventListener("change",e=>{this.fileTypeFilter=e.target.value,this.page=1,this.fetchData()}),this.filterDate&&this.filterDate.addEventListener("change",e=>{this.dateRangeFilter=e.target.value,this.dateRangeFilter==="custom"?this.customDateContainer.classList.remove("hidden"):(this.customDateContainer.classList.add("hidden"),this.startDateFilter="",this.endDateFilter="",this.filterStartDate&&(this.filterStartDate.value=""),this.filterEndDate&&(this.filterEndDate.value=""),this.page=1,this.fetchData())}),this.filterStartDate&&this.filterStartDate.addEventListener("change",e=>{this.startDateFilter=e.target.value,this.page=1,this.fetchData()}),this.filterEndDate&&this.filterEndDate.addEventListener("change",e=>{this.endDateFilter=e.target.value,this.page=1,this.fetchData()}),this.container.addEventListener("change",e=>{if(e.target.id==="fm-select-all"){const o=e.target.checked;this.container.querySelectorAll(".fm-file-select, .fm-folder-select").forEach(i=>{if(i.checked=o,i.classList.contains("fm-file-select")){const c=i.dataset.uuid;o?this.selectedFileUuids.add(c):this.selectedFileUuids.delete(c)}else if(i.classList.contains("fm-folder-select")){const c=i.dataset.id;o?this.selectedFolderIds.add(c):this.selectedFolderIds.delete(c)}}),this.renderFloatingBar()}else if(e.target.classList.contains("fm-file-select")){const o=e.target.dataset.uuid;e.target.checked?this.selectedFileUuids.add(o):this.selectedFileUuids.delete(o),this.updateMasterCheckboxState(),this.renderFloatingBar()}else if(e.target.classList.contains("fm-folder-select")){const o=e.target.dataset.id;e.target.checked?this.selectedFolderIds.add(o):this.selectedFolderIds.delete(o),this.updateMasterCheckboxState(),this.renderFloatingBar()}});const r=document.getElementById("fm-th-name"),l=document.getElementById("fm-th-size"),n=document.getElementById("fm-th-updated");r&&r.addEventListener("click",()=>{this.sortBy==="name"?this.sortDir=this.sortDir==="asc"?"desc":"asc":(this.sortBy="name",this.sortDir="asc"),this.page=1,this.updateURLParams(),this.fetchData()}),l&&l.addEventListener("click",()=>{this.sortBy==="size"?this.sortDir=this.sortDir==="asc"?"desc":"asc":(this.sortBy="size",this.sortDir="asc"),this.page=1,this.updateURLParams(),this.fetchData()}),n&&n.addEventListener("click",()=>{this.sortBy==="updated"?this.sortDir=this.sortDir==="asc"?"desc":"asc":(this.sortBy="updated",this.sortDir="asc"),this.page=1,this.updateURLParams(),this.fetchData()}),this.listContent.addEventListener("click",e=>{const o=e.target.closest(".fm-dropdown-trigger");if(o){e.preventDefault(),e.stopPropagation();const p=o.nextElementSibling,v=p.classList.contains("hidden");if(document.querySelectorAll(".fm-dropdown-menu").forEach(_=>{_.classList.add("hidden"),_.style.position="",_.style.top="",_.style.left="",_.style.right="",_.style.zIndex=""}),v){p.style.position="fixed",p.style.visibility="hidden",p.classList.remove("hidden");const _=p.offsetHeight||220;p.classList.add("hidden"),p.style.visibility="",p.classList.remove("hidden");const D=o.getBoundingClientRect();p.style.position="fixed",p.style.zIndex="9999";const T=window.innerHeight-D.bottom,k=D.top;T<_&&k>T?p.style.top=`${D.top-_-4}px`:p.style.top=`${D.bottom+4}px`,p.style.left=`${D.right-192}px`;const I=p.getBoundingClientRect();I.left<0?p.style.left="8px":I.right>window.innerWidth&&(p.style.left=`${window.innerWidth-I.width-8}px`)}return}const h=e.target.closest(".fm-folder-item");if(h){e.preventDefault(),this.currentFolderId=h.dataset.id,this.page=1,this.searchTerm="",this.searchField&&(this.searchField.value=""),this.updateURLParams(),this.fetchData();return}const i=e.target.closest(".fm-action-copy-link");if(i){e.preventDefault(),e.stopPropagation();const p=i.dataset.encodedUuid,v=i.dataset.filename||"",_=i.dataset.folderId!==void 0?i.dataset.folderId:this.currentFolderId||"",D=v.split(".").pop().toLowerCase(),T=["pdf","png","jpg","jpeg","gif","webp","mp4","webm","mp3","wav","ogg"].includes(D);let k="",I="";T?(k=`${window.location.origin}${window.location.pathname}?folder=${_}&preview_file=${p}&preview_name=${encodeURIComponent(v)}`,I="\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E41\u0E0A\u0E23\u0E4C\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27!"):(k=`${window.location.origin}/moph-db/file/download/${p}`,I="\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27!"),this.copyToClipboard(k).then(P=>{P?showToast(I,"success"):alert("\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E44\u0E14\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E14\u0E49\u0E27\u0E22\u0E15\u0E19\u0E40\u0E2D\u0E07: "+k)});return}const c=e.target.closest(".fm-action-copy-folder-link");if(c){e.preventDefault(),e.stopPropagation();const p=c.dataset.id,v=`${window.location.origin}/admin/upload/batch-download?folder_ids[]=${p}`;this.copyToClipboard(v).then(_=>{_?showToast("\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27!","success"):alert("\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E44\u0E14\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E14\u0E49\u0E27\u0E22\u0E15\u0E19\u0E40\u0E2D\u0E07: "+v)});return}const L=e.target.closest(".fm-action-copy-hash");if(L){e.preventDefault(),e.stopPropagation();const p=L.dataset.hash;p?this.copyToClipboard(p).then(v=>{v?showToast("\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E04\u0E48\u0E32 Hash (SHA-256) \u0E41\u0E25\u0E49\u0E27!","success"):alert("\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E04\u0E48\u0E32 Hash \u0E44\u0E14\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34")}):alert("\u0E44\u0E1F\u0E25\u0E4C\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E48\u0E32 Hash");return}const b=e.target.closest(".fm-btn-copy-hash");if(b){e.preventDefault(),e.stopPropagation();const p=b.dataset.hash;this.copyToClipboard(p).then(v=>{v?showToast("\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E04\u0E48\u0E32 Hash \u0E41\u0E25\u0E49\u0E27!","success"):alert("\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E04\u0E48\u0E32 Hash \u0E44\u0E14\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34")});return}const E=e.target.closest(".fm-btn-rename-folder");if(E){e.preventDefault(),e.stopPropagation();const p=E.dataset.name,v=prompt("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E43\u0E2B\u0E21\u0E48:",p);v&&v.trim()&&v.trim()!==p&&this.renameFolder(E.dataset.id,v.trim());return}const f=e.target.closest(".fm-btn-rename-file");if(f){e.preventDefault(),e.stopPropagation();const p=f.dataset.name,v=prompt("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E1F\u0E25\u0E4C\u0E43\u0E2B\u0E21\u0E48:",p);v&&v.trim()&&v.trim()!==p&&this.renameFile(f.dataset.uuid,v.trim());return}const y=e.target.closest(".fm-btn-move-file");if(y){e.preventDefault(),e.stopPropagation(),this.openMoveModal([y.dataset.uuid],[]);return}const u=e.target.closest(".fm-btn-move-folder");if(u){e.preventDefault(),e.stopPropagation(),this.openMoveModal([],[u.dataset.id]);return}const S=e.target.closest(".fm-btn-delete-folder");if(S){e.preventDefault(),e.stopPropagation(),confirm("\u0E04\u0E38\u0E13\u0E41\u0E19\u0E48\u0E43\u0E08\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E19\u0E35\u0E49\u0E41\u0E25\u0E30\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E25\u0E39\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E14\u0E49\u0E32\u0E19\u0E43\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E16\u0E32\u0E27\u0E23? \u0E01\u0E32\u0E23\u0E25\u0E1A\u0E08\u0E30\u0E25\u0E49\u0E32\u0E07\u0E44\u0E1F\u0E25\u0E4C\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E14\u0E49\u0E27\u0E22!")&&this.deleteFolder(S.dataset.id);return}const w=e.target.closest(".fm-btn-delete-file");if(w){e.preventDefault(),e.stopPropagation(),confirm("\u0E04\u0E38\u0E13\u0E41\u0E19\u0E48\u0E43\u0E08\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E44\u0E1F\u0E25\u0E4C\u0E19\u0E35\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E16\u0E32\u0E27\u0E23? \u0E01\u0E32\u0E23\u0E25\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E44\u0E14\u0E49")&&this.deleteFile(w.dataset.uuid);return}const F=e.target.closest(".fm-btn-preview");if(F){e.preventDefault(),e.stopPropagation();const p=this.files.find(v=>v.encoded_uuid===F.dataset.encodedUuid);this.openPreviewModal(p||F.dataset.encodedUuid,F.dataset.filename);return}const B=e.target.closest(".fm-action-preview");if(B){e.preventDefault(),e.stopPropagation(),document.querySelectorAll(".fm-dropdown-menu").forEach(v=>v.classList.add("hidden"));const p=this.files.find(v=>v.encoded_uuid===B.dataset.encodedUuid);this.openPreviewModal(p||B.dataset.encodedUuid,B.dataset.filename);return}const $=e.target.closest(".fm-action-go-to-location");if($){e.preventDefault(),e.stopPropagation(),this.currentFolderId=$.dataset.containerId||null,this.page=1,this.searchTerm="",this.searchField&&(this.searchField.value=""),this.activeTab="files",this.updateURLParams(),this.fetchData();return}const C=e.target.closest(".fm-action-download-folder");if(C){e.preventDefault(),e.stopPropagation(),this.downloadFolder(C.dataset.id);return}});const m=document.getElementById("pdf-preview-actions-container");m&&m.addEventListener("click",e=>{const o=e.target.closest(".fm-action-copy-link");if(o){e.preventDefault(),e.stopPropagation(),document.querySelectorAll(".fm-dropdown-menu").forEach(F=>F.classList.add("hidden"));const b=o.dataset.encodedUuid,E=o.dataset.filename||"",f=o.dataset.folderId!==void 0?o.dataset.folderId:this.currentFolderId||"",y=E.split(".").pop().toLowerCase(),u=["pdf","png","jpg","jpeg","gif","webp","mp4","webm","mp3","wav","ogg"].includes(y);let S="",w="";u?(S=`${window.location.origin}${window.location.pathname}?folder=${f}&preview_file=${b}&preview_name=${encodeURIComponent(E)}`,w="\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E41\u0E0A\u0E23\u0E4C\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27!"):(S=`${window.location.origin}/moph-db/file/download/${b}`,w="\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27!"),this.copyToClipboard(S).then(F=>{F?showToast(w,"success"):alert("\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E44\u0E14\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34")});return}const h=e.target.closest(".fm-action-copy-hash");if(h){e.preventDefault(),e.stopPropagation(),document.querySelectorAll(".fm-dropdown-menu").forEach(E=>E.classList.add("hidden"));const b=h.dataset.hash;b?this.copyToClipboard(b).then(E=>{E?showToast("\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E04\u0E48\u0E32 Hash (SHA-256) \u0E41\u0E25\u0E49\u0E27!","success"):alert("\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E44\u0E14\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34")}):alert("\u0E44\u0E1F\u0E25\u0E4C\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E48\u0E32 Hash");return}const i=e.target.closest(".fm-btn-rename-file");if(i){e.preventDefault(),e.stopPropagation(),document.querySelectorAll(".fm-dropdown-menu").forEach(f=>f.classList.add("hidden"));const b=i.dataset.name,E=prompt("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E1F\u0E25\u0E4C\u0E43\u0E2B\u0E21\u0E48:",b);E&&E.trim()&&E.trim()!==b&&this.renameFile(i.dataset.uuid,E.trim());return}const c=e.target.closest(".fm-btn-move-file");if(c){e.preventDefault(),e.stopPropagation(),document.querySelectorAll(".fm-dropdown-menu").forEach(b=>b.classList.add("hidden")),this.openMoveModal([c.dataset.uuid],[]);return}const L=e.target.closest(".fm-btn-delete-file");if(L){if(e.preventDefault(),e.stopPropagation(),document.querySelectorAll(".fm-dropdown-menu").forEach(b=>b.classList.add("hidden")),confirm("\u0E04\u0E38\u0E13\u0E41\u0E19\u0E48\u0E43\u0E08\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E44\u0E1F\u0E25\u0E4C\u0E19\u0E35\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E16\u0E32\u0E27\u0E23? \u0E01\u0E32\u0E23\u0E25\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E44\u0E14\u0E49")){this.deleteFile(L.dataset.uuid);const b=document.getElementById("pdf-preview-close");b&&b.click()}return}});const g=document.getElementById("pdf-preview-more-actions");g&&g.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation();const o=document.getElementById("pdf-preview-dropdown-menu");if(o){const h=o.classList.contains("hidden");document.querySelectorAll(".fm-dropdown-menu").forEach(i=>{i!==o&&i.classList.add("hidden")}),h?(o.classList.remove("hidden"),o.style.position="absolute",o.style.top="100%",o.style.right="0",o.style.left="auto",o.style.zIndex="50"):o.classList.add("hidden")}}),document.addEventListener("click",e=>{!e.target.closest(".fm-dropdown-trigger")&&!e.target.closest("#pdf-preview-more-actions")&&document.querySelectorAll(".fm-dropdown-menu").forEach(o=>{o.classList.add("hidden"),o.style.position="",o.style.top="",o.style.left="",o.style.right="",o.style.zIndex=""})}),window.addEventListener("scroll",()=>{document.querySelectorAll(".fm-dropdown-menu").forEach(e=>{e.classList.add("hidden"),e.style.position="",e.style.top="",e.style.left="",e.style.right="",e.style.zIndex=""})},{passive:!0});const x=document.getElementById("fm-table-container");x&&x.addEventListener("scroll",()=>{document.querySelectorAll(".fm-dropdown-menu").forEach(e=>{e.classList.add("hidden"),e.style.position="",e.style.top="",e.style.left="",e.style.right="",e.style.zIndex=""})},{passive:!0});const d=document.getElementById("sidebar-folder-tree");d&&d.addEventListener("click",e=>{const o=e.target.closest(".fm-folder-toggle-btn");if(o){e.preventDefault(),e.stopPropagation();const f=o.closest("[data-id]"),y=f?f.dataset.id:null;if(y){const u=d.querySelector(`#sidebar-folder-children-${y}`),S=o.querySelector("i");let w=[];try{w=JSON.parse(this.getCookie("fm_expanded_folders")||"[]")}catch{w=[]}u&&(u.classList.contains("hidden")?(u.classList.remove("hidden"),S&&(S.classList.remove("fa-chevron-right"),S.classList.add("fa-chevron-down")),w.includes(String(y))||w.push(String(y))):(u.classList.add("hidden"),S&&(S.classList.remove("fa-chevron-down"),S.classList.add("fa-chevron-right")),w=w.filter(F=>F!==String(y)))),this.setCookie("fm_expanded_folders",JSON.stringify(w),30)}return}const h=e.target.closest(".fm-sidebar-folder");if(h){e.preventDefault(),this.currentFolderId=h.dataset.id||null,this.page=1,this.searchTerm="",this.searchField&&(this.searchField.value=""),this.activeTab="files",document.querySelectorAll(".fm-nav-item").forEach(S=>{S.classList.remove("bg-emerald-50","text-emerald-800","font-semibold"),S.classList.add("text-gray-600","hover:bg-slate-50","hover:text-gray-800")});const f=document.querySelector('.fm-nav-item[data-tab="files"]');f&&(f.classList.add("bg-emerald-50","text-emerald-800","font-semibold"),f.classList.remove("text-gray-600","hover:bg-slate-50","hover:text-gray-800")),this.updateURLParams(),this.fetchData();const y=document.getElementById("sidebar-left"),u=document.getElementById("sidebar-backdrop");y&&window.innerWidth<1024&&(y.classList.remove("translate-x-0","shadow-2xl"),y.classList.add("-translate-x-full"),u&&u.classList.add("hidden"));return}const i=e.target.closest(".fm-btn-rename-folder");if(i){e.preventDefault(),e.stopPropagation(),document.querySelectorAll(".fm-dropdown-menu").forEach(u=>u.classList.add("hidden"));const f=i.dataset.name,y=prompt("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E43\u0E2B\u0E21\u0E48:",f);y&&y.trim()&&y.trim()!==f&&this.renameFolder(i.dataset.id,y.trim());return}const c=e.target.closest(".fm-btn-move-folder");if(c){e.preventDefault(),e.stopPropagation(),document.querySelectorAll(".fm-dropdown-menu").forEach(f=>f.classList.add("hidden")),this.openMoveModal([],[c.dataset.id]);return}const L=e.target.closest(".fm-action-download-folder");if(L){e.preventDefault(),e.stopPropagation(),document.querySelectorAll(".fm-dropdown-menu").forEach(f=>f.classList.add("hidden")),this.downloadFolder(L.dataset.id);return}const b=e.target.closest(".fm-btn-delete-folder");if(b){e.preventDefault(),e.stopPropagation(),document.querySelectorAll(".fm-dropdown-menu").forEach(f=>f.classList.add("hidden")),confirm("\u0E04\u0E38\u0E13\u0E41\u0E19\u0E48\u0E43\u0E08\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E19\u0E35\u0E49\u0E41\u0E25\u0E30\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E25\u0E39\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E14\u0E49\u0E32\u0E19\u0E43\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E16\u0E32\u0E27\u0E23?")&&this.deleteFolder(b.dataset.id);return}const E=e.target.closest(".fm-dropdown-trigger");if(E){e.preventDefault(),e.stopPropagation();const f=E.nextElementSibling,y=f.classList.contains("hidden");if(document.querySelectorAll(".fm-dropdown-menu").forEach(u=>{u.classList.add("hidden"),u.style.position="",u.style.top="",u.style.left="",u.style.right="",u.style.zIndex=""}),y){f.classList.remove("hidden");const u=E.getBoundingClientRect();f.style.position="fixed",f.style.zIndex="9999";const S=160,w=window.innerHeight-u.bottom,F=u.top;w<S&&F>w?f.style.top=`${u.top-S-4}px`:f.style.top=`${u.bottom+4}px`,f.style.left=`${u.right-160}px`}return}})}renderContent(){document.querySelectorAll(".fm-nav-item").forEach(i=>{i.classList.remove("bg-emerald-50","text-emerald-800","font-semibold"),i.classList.add("text-gray-600","hover:bg-slate-50","hover:text-gray-800")});const t=document.querySelector(`.fm-nav-item[data-tab="${this.activeTab}"]`);t&&(t.classList.add("bg-emerald-50","text-emerald-800","font-semibold"),t.classList.remove("text-gray-600","hover:bg-slate-50","hover:text-gray-800"));const s=document.getElementById("fm-main-title");if(s){let i="fa-chart-pie",c="\u0E41\u0E14\u0E0A\u0E1A\u0E2D\u0E23\u0E4C\u0E14\u0E2A\u0E23\u0E38\u0E1B\u0E2A\u0E16\u0E34\u0E15\u0E34\u0E04\u0E25\u0E31\u0E07\u0E44\u0E1F\u0E25\u0E4C";this.activeTab==="files"?(i="fa-folder-tree",c="\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E04\u0E25\u0E31\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E2B\u0E25\u0E31\u0E01"):this.activeTab==="settings"&&(i="fa-sliders",c="\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E25\u0E31\u0E07\u0E44\u0E1F\u0E25\u0E4C"),s.innerHTML=`<i class="fa-solid ${i} text-emerald-600 mr-2.5 text-base"></i><span>${c}</span>`}const a=document.getElementById("fm-breadcrumbs-row"),r=document.getElementById("fm-search-row"),l=document.getElementById("fm-upload-box-wrapper");if(this.activeTab==="settings"){l&&l.classList.add("hidden"),a&&a.classList.add("hidden"),r&&r.classList.add("hidden"),this.dashboardContainer.classList.add("hidden"),this.filesTableContainer.classList.add("hidden"),this.settingsContainer.classList.remove("hidden");return}this.settingsContainer.classList.add("hidden"),this.activeTab==="dashboard"&&this.currentFolderId===null&&!this.searchTerm?(a&&a.classList.remove("hidden"),r&&r.classList.remove("hidden"),this.dashboardContainer.classList.remove("hidden"),this.filesTableContainer.classList.remove("hidden"),this.renderDashboard()):(a&&a.classList.remove("hidden"),r&&r.classList.remove("hidden"),this.dashboardContainer.classList.add("hidden"),this.filesTableContainer.classList.remove("hidden")),l&&(l.classList.remove("hidden"),this.activeTab==="dashboard"&&this.currentFolderId===null&&!this.searchTerm?this.dashboardContainer.parentNode&&this.dashboardContainer.parentNode.insertBefore(l,this.dashboardContainer.nextSibling):a&&a.parentNode&&a.parentNode.insertBefore(l,a)),this.renderBreadcrumbs(),this.renderSidebarTree(),this.updateSortIcons(),this.updateMasterCheckboxState();const n=!!this.searchTerm||this.fileTypeFilter&&this.fileTypeFilter!=="all"||this.dateRangeFilter&&this.dateRangeFilter!=="all",m=document.getElementById("fm-results-summary");if(m)if(n){if(m.classList.remove("hidden"),this.resultsSummaryText){const i=this.folders.length,c=this.files.length,L=this.pager.total||i+c;this.resultsSummaryText.textContent=`\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ${L} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 (\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C: ${i}, \u0E44\u0E1F\u0E25\u0E4C: ${c})`}}else m.classList.add("hidden");if(!(this.page===1&&this.folders.length>0)&&this.files.length===0){this.listContent.innerHTML=`
        <tr>
          <td colspan="5" class="px-6 py-16 text-center text-gray-400">
            <i class="fa-solid fa-folder-open text-5xl mb-4 text-gray-250 block mx-auto"></i>
            <span class="text-xs font-semibold text-gray-500">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A</span>
          </td>
        </tr>
      `,this.pagination.innerHTML="";return}const x=!!this.searchTerm;let d="";this.page===1&&this.folders.forEach(i=>{const c=this.selectedFolderIds.has(String(i.id))||this.selectedFolderIds.has(Number(i.id));d+=`
          <tr class="hover:bg-slate-50/50 transition">
            <td class="pl-6 py-4 w-[1%] whitespace-nowrap text-center">
              <input type="checkbox" class="fm-folder-select rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" data-id="${i.id}" ${c?"checked":""}>
            </td>
            <td class="px-6 py-4 cursor-pointer fm-folder-item" data-id="${i.id}">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 text-base shrink-0">
                  <i class="fa-solid fa-folder"></i>
                </div>
                <div class="flex flex-col min-w-0 flex-grow">
                  <span class="text-sm font-semibold text-gray-800 truncate max-w-xs md:max-w-md" title="${this.escapeHtml(i.name)}">${this.escapeHtml(i.name)}</span>
                  <div class="flex items-center space-x-2 text-[10px] text-gray-400 mt-1 select-none">
                    <span class="inline-flex items-center" title="\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E22\u0E48\u0E2D\u0E22"><i class="fa-solid fa-folder text-slate-400 text-[9px] mr-1"></i> ${i.subfolder_count||0}</span>
                    <span class="text-gray-300">\u2022</span>
                    <span class="inline-flex items-center" title="\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23"><i class="fa-solid fa-file text-slate-400 text-[9px] mr-1"></i> ${i.file_count||0}</span>
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 w-[1%] whitespace-nowrap text-xs text-gray-500 hidden sm:table-cell select-none">-</td>
            <td class="px-6 py-4 w-[1%] whitespace-nowrap text-xs text-gray-500 hidden md:table-cell select-none">${this.formatDate(i.updated_at)}</td>
            <td class="px-6 py-4 w-[1%] whitespace-nowrap text-right space-x-1.5 overflow-visible">
              <div class="relative inline-block text-left">
                <button class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition fm-dropdown-trigger cursor-pointer" title="\u0E40\u0E21\u0E19\u0E39\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23">
                  <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
                </button>
                <div class="fm-dropdown-menu absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-1 hidden z-50 text-left">
                  <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50">\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B</div>
                  
                  ${x?`
                  <button class="w-full flex items-center px-4 py-2 text-xs text-emerald-600 hover:bg-emerald-50 transition fm-action-go-to-location" data-container-id="${i.parent_id||""}">
                    <i class="fa-solid fa-arrow-right-to-bracket mr-2.5 text-emerald-500 w-4 text-center"></i> \u0E44\u0E1B\u0E22\u0E31\u0E07\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C
                  </button>
                  `:""}

                  <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-download-folder" data-id="${i.id}">
                    <i class="fa-solid fa-file-zipper mr-2.5 text-slate-400 w-4 text-center"></i> \u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C (Zip)
                  </button>
                  <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-copy-folder-link" data-id="${i.id}">
                    <i class="fa-solid fa-share-nodes mr-2.5 text-slate-400 w-4 text-center"></i> \u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14
                  </button>

                  <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50 mt-1">\u0E41\u0E01\u0E49\u0E44\u0E02</div>
                  <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-rename-folder" data-id="${i.id}" data-name="${this.escapeHtml(i.name)}">
                    <i class="fa-solid fa-pen mr-2.5 text-slate-400 w-4 text-center"></i> \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D
                  </button>
                  <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-move-folder" data-id="${i.id}">
                    <i class="fa-solid fa-arrows-up-down-left-right mr-2.5 text-slate-400 w-3.5 text-center"></i> \u0E22\u0E49\u0E32\u0E22\u0E44\u0E1B\u0E22\u0E31\u0E07...
                  </button>
                  
                  <div class="border-t border-gray-100 my-1"></div>
                  <button class="w-full flex items-center px-4 py-2 text-xs text-red-655 hover:bg-red-50 transition fm-btn-delete-folder" data-id="${i.id}">
                    <i class="fa-solid fa-trash-can mr-2.5 w-4 text-center"></i> \u0E25\u0E1A\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C
                  </button>
                </div>
              </div>
            </td>
          </tr>
        `}),this.files.forEach(i=>{const c=i.mime_type==="application/pdf",L=c?"fa-file-pdf text-red-500":"fa-file-lines text-blue-500",b=c?"bg-red-50":"bg-blue-50",f=i.storage_type==="physical"?'<span class="inline-flex items-center text-[9px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded mr-2 shrink-0 select-none" title="\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A\u0E41\u0E1A\u0E1A\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F\u0E40\u0E27\u0E2D\u0E23\u0E4C (Physical)"><i class="fa-solid fa-server mr-1"></i> Physical</span>':'<span class="inline-flex items-center text-[9px] font-semibold text-fuchsia-600 bg-fuchsia-50 px-1.5 py-0.5 rounded mr-2 shrink-0 select-none" title="\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A\u0E41\u0E1A\u0E1A\u0E0A\u0E34\u0E49\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 (DB Chunks)"><i class="fa-solid fa-database mr-1"></i> DB Storage</span>',y=c||this.isMediaFile(i.filename),u=this.selectedFileUuids.has(i.uuid);d+=`
        <tr class="hover:bg-slate-50/50 transition">
          <td class="pl-6 py-4 w-[1%] whitespace-nowrap text-center">
            <input type="checkbox" class="fm-file-select rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" data-uuid="${i.uuid}" ${u?"checked":""}>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 ${b} rounded-lg flex items-center justify-center text-base shrink-0">
                <i class="fa-solid ${L}"></i>
              </div>
              <div class="flex flex-col min-w-0 flex-grow">
                <span class="text-sm font-semibold text-gray-800 truncate max-w-xs md:max-w-md lg:max-w-xl" title="${this.escapeHtml(i.filename)}">${this.escapeHtml(i.filename)}</span>
                <div class="flex items-center mt-1 min-w-0 text-[10px] text-gray-400 select-none">
                  ${f}
                  ${i.file_hash?`<button class="text-gray-400 hover:text-gray-600 cursor-pointer fm-btn-copy-hash shrink-0 mr-2" data-hash="${i.file_hash}" title="\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E04\u0E48\u0E32 Hash"><i class="fa-solid fa-copy text-[9px]"></i></button>`:""}
                  <span class="inline-flex items-center mr-2" title="\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E02\u0E49\u0E32\u0E0A\u0E21"><i class="fa-solid fa-eye mr-1 text-slate-400 text-[9px]"></i> ${i.view_count||0}</span>
                  <span class="text-gray-300 mr-2">\u2022</span>
                  <span class="inline-flex items-center" title="\u0E08\u0E33\u0E19\u0E27\u0E19\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14"><i class="fa-solid fa-download mr-1 text-slate-400 text-[9px]"></i> ${i.download_count||0}</span>
                </div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 w-[1%] whitespace-nowrap text-xs text-gray-650 hidden sm:table-cell">${i.formatted_size}</td>
          <td class="px-6 py-4 w-[1%] whitespace-nowrap text-xs text-gray-500 hidden md:table-cell select-none">${this.formatDate(i.updated_at)}</td>
          <td class="px-6 py-4 w-[1%] whitespace-nowrap text-right space-x-1.5 overflow-visible">
            ${c?`
            <button class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition fm-btn-preview cursor-pointer" data-encoded-uuid="${i.encoded_uuid}" data-filename="${this.escapeHtml(i.filename)}" title="\u0E1E\u0E23\u0E35\u0E27\u0E34\u0E27\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07">
              <i class="fa-solid fa-eye text-xs"></i>
            </button>
            `:""}
            <div class="relative inline-block text-left">
              <button class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition fm-dropdown-trigger cursor-pointer" title="\u0E40\u0E21\u0E19\u0E39\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23">
                <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
              </button>
              <div class="fm-dropdown-menu absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-1 hidden z-50 text-left">
                <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50">\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B</div>
                ${c?`
                <button class="w-full flex items-center px-4 py-2 text-xs text-emerald-600 hover:bg-emerald-50 transition fm-action-preview" data-encoded-uuid="${i.encoded_uuid}" data-filename="${this.escapeHtml(i.filename)}">
                  <i class="fa-solid fa-eye mr-2.5 text-emerald-500 w-4 text-center"></i> \u0E14\u0E39\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 PDF
                </button>
                `:""}
                <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-copy-link" data-encoded-uuid="${i.encoded_uuid}" data-filename="${this.escapeHtml(i.filename)}" data-folder-id="${i.container_id||""}">
                  <i class="fa-solid fa-share-nodes mr-2.5 text-slate-400 w-4 text-center"></i> \u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C
                </button>
                <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-copy-hash" data-hash="${i.file_hash||""}">
                  <i class="fa-solid fa-hashtag mr-2.5 text-slate-400 w-4 text-center"></i> \u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E04\u0E48\u0E32 Hash
                </button>
                <a href="/moph-db/file/download/${i.encoded_uuid}" class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition">
                  <i class="fa-solid fa-download mr-2.5 text-slate-400 w-4 text-center"></i> \u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E1F\u0E25\u0E4C
                </a>
                
                <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50 mt-1">\u0E41\u0E01\u0E49\u0E44\u0E02</div>
                <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-rename-file" data-uuid="${i.uuid}" data-name="${this.escapeHtml(i.filename)}">
                  <i class="fa-solid fa-pen mr-2.5 text-slate-400 w-4 text-center"></i> \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D
                </button>
                <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-move-file" data-uuid="${i.uuid}">
                  <i class="fa-solid fa-arrows-up-down-left-right mr-2.5 text-slate-400 w-4 text-center"></i> \u0E22\u0E49\u0E32\u0E22\u0E44\u0E1B\u0E22\u0E31\u0E07...
                </button>
                
                <div class="border-t border-gray-100 my-1"></div>
                <button class="w-full flex items-center px-4 py-2 text-xs text-red-650 hover:bg-red-50 transition fm-btn-delete-file" data-uuid="${i.uuid}">
                  <i class="fa-solid fa-trash-can mr-2.5 w-4 text-center"></i> \u0E25\u0E1A\u0E44\u0E1F\u0E25\u0E4C
                </button>
              </div>
            </div>
          </td>
        </tr>
      `}),this.listContent.innerHTML=d,this.renderPagination();const e=new URLSearchParams(window.location.search),o=e.get("preview_file"),h=e.get("preview_name")||"";if(o&&!this.previewOpenedFromUrl){this.previewOpenedFromUrl=!0;const i=this.files.find(c=>c.encoded_uuid===o);i?this.openPreviewModal(i):this.openPreviewModal(o,h)}this.renderFloatingBar()}renderSidebarTree(){const t=document.getElementById("sidebar-folder-tree");if(!t)return;let s=[];const a=this.getCookie("fm_expanded_folders")!==null&&this.getCookie("fm_expanded_folders")!=="";try{s=JSON.parse(this.getCookie("fm_expanded_folders")||"[]")}catch{s=[]}const r=this.all_folders.filter(m=>m.parent_id===null||m.parent_id===""||m.parent_id===0||m.parent_id==="0");let l=`
      <a href="?folder=" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-slate-50 rounded-lg transition ${!this.currentFolderId&&this.activeTab==="files"?"bg-emerald-50 text-emerald-800 font-semibold":""}" data-folder-root>
        <i class="fa-solid fa-house-chimney text-emerald-600 mr-2.5 text-xs"></i> \u0E04\u0E25\u0E31\u0E07\u0E44\u0E1F\u0E25\u0E4C\u0E2B\u0E25\u0E31\u0E01
      </a>
    `;const n=(m,g=0)=>{let x="";return m.forEach(d=>{const e=this.all_folders.filter(i=>parseInt(i.parent_id)===parseInt(d.id)),o=parseInt(this.currentFolderId)===parseInt(d.id),h=a?s.includes(String(d.id)):g<=1;x+=`
          <div class="flex flex-col transition" data-id="${d.id}">
            <div class="group flex items-center justify-between w-full hover:bg-slate-50/70 rounded-md transition py-1 pr-1 pl-1 relative">
              <div class="flex items-center min-w-0 flex-grow cursor-pointer fm-sidebar-folder" data-id="${d.id}">
                ${e.length>0?`
                  <button class="p-1 hover:bg-slate-100 rounded text-gray-400 hover:text-gray-600 transition shrink-0 fm-folder-toggle-btn mr-1">
                    <i class="fa-solid ${h?"fa-chevron-down":"fa-chevron-right"} text-[8px] transition-transform duration-200"></i>
                  </button>
                `:'<span class="w-5 shrink-0"></span>'}
                <i class="fa-solid fa-folder text-amber-500 mr-1.5 shrink-0 text-xs"></i>
                <span class="truncate text-xs text-gray-700 font-medium ${o?"text-emerald-850 font-bold":""}" title="${this.escapeHtml(d.name)}">
                  ${this.escapeHtml(d.name)}
                </span>
              </div>
              <div class="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition shrink-0 ml-1 relative">
                <button class="p-1 text-gray-450 hover:text-gray-650 hover:bg-gray-200 rounded transition fm-dropdown-trigger cursor-pointer" title="\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C">
                  <i class="fa-solid fa-ellipsis-vertical text-[9px]"></i>
                </button>
                <div class="fm-dropdown-menu absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1 hidden z-50 text-left">
                  <button class="w-full flex items-center px-3 py-1.5 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-rename-folder" data-id="${d.id}" data-name="${this.escapeHtml(d.name)}">
                    <i class="fa-solid fa-pen mr-2 text-slate-400 w-3.5 text-center"></i> \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D
                  </button>
                  <button class="w-full flex items-center px-3 py-1.5 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-move-folder" data-id="${d.id}">
                    <i class="fa-solid fa-arrows-up-down-left-right mr-2 text-slate-400 w-3.5 text-center"></i> \u0E22\u0E49\u0E32\u0E22\u0E44\u0E1B\u0E22\u0E31\u0E07...
                  </button>
                  <button class="w-full flex items-center px-3 py-1.5 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-download-folder" data-id="${d.id}">
                    <i class="fa-solid fa-file-zipper mr-2 text-slate-400 w-3.5 text-center"></i> \u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14 Zip
                  </button>
                  <div class="border-t border-gray-100 my-1"></div>
                  <button class="w-full flex items-center px-3 py-1.5 text-xs text-red-650 hover:bg-red-50 transition fm-btn-delete-folder" data-id="${d.id}">
                    <i class="fa-solid fa-trash-can mr-2 w-3.5 text-center"></i> \u0E25\u0E1A\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C
                  </button>
                </div>
              </div>
            </div>
            ${e.length>0?`
              <div id="sidebar-folder-children-${d.id}" class="fm-folder-children border-l border-slate-200/60 ml-[18px] pl-1.5 mb-1 mt-0.5 ${h?"":"hidden"}" data-parent-id="${d.id}">
                ${n(e,g+1)}
              </div>
            `:""}
          </div>
        `}),x};l+=n(r,0),t.innerHTML=l}updateSortIcons(){const t=document.getElementById("fm-sort-icon-name"),s=document.getElementById("fm-sort-icon-size");if(!t||!s)return;t.innerHTML="",s.innerHTML="";const a=this.sortDir==="asc"?" \u25B2":" \u25BC";this.sortBy==="name"?t.innerHTML=`<span class="text-emerald-600 font-bold">${a}</span>`:this.sortBy==="size"&&(s.innerHTML=`<span class="text-emerald-600 font-bold">${a}</span>`)}renderBreadcrumbs(){let t=`
      <a href="?folder=" class="fm-breadcrumb-item hover:text-emerald-600 transition" data-id="">
        <i class="fa-solid fa-house-chimney text-xs mr-1"></i> \u0E04\u0E25\u0E31\u0E07\u0E44\u0E1F\u0E25\u0E4C\u0E2B\u0E25\u0E31\u0E01
      </a>
    `;this.path.forEach((s,a)=>{t+=`
        <span class="text-gray-300 text-xs">/</span>
        <a href="?folder=${s.id}" class="fm-breadcrumb-item hover:text-emerald-600 transition truncate max-w-40" data-id="${s.id}">
          ${this.escapeHtml(s.name)}
        </a>
      `}),this.breadcrumbs.innerHTML=t}renderPagination(){if(!this.pager||this.pager.pageCount<=1){this.pagination.innerHTML=`<span class="text-xs text-gray-500 font-medium">\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ${this.pager.total||0} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</span>`;return}const{currentPage:t,pageCount:s,hasPrevious:a,hasNext:r}=this.pager;let l=`
      <span class="text-xs text-gray-500 font-medium">\u0E2B\u0E19\u0E49\u0E32 ${t} \u0E08\u0E32\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ${s} \u0E2B\u0E19\u0E49\u0E32</span>
      <div class="flex items-center space-x-1">
        <button id="fm-pg-prev" class="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold rounded-lg transition cursor-pointer" ${a?"":'disabled style="opacity: 0.5; cursor: not-allowed;"'}>
          \u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32
        </button>
        <button id="fm-pg-next" class="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold rounded-lg transition cursor-pointer" ${r?"":'disabled style="opacity: 0.5; cursor: not-allowed;"'}>
          \u0E16\u0E31\u0E14\u0E44\u0E1B
        </button>
      </div>
    `;this.pagination.innerHTML=l;const n=document.getElementById("fm-pg-prev"),m=document.getElementById("fm-pg-next");n&&a&&n.addEventListener("click",()=>{this.page--,this.updateURLParams(),this.fetchData()}),m&&r&&m.addEventListener("click",()=>{this.page++,this.updateURLParams(),this.fetchData()})}renderFloatingBar(){const t=this.selectedFileUuids.size+this.selectedFolderIds.size;let s=document.getElementById("fm-floating-bar");if(t===0){this.removeFloatingBar();return}s||(s=document.createElement("div"),s.id="fm-floating-bar",s.className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-100/40 text-black rounded-2xl px-6 py-4 flex items-center justify-between space-x-6 shadow-2xl transition-all duration-300 translate-y-20 opacity-0 z-40 w-max max-w-[90vw]",s.innerHTML=`
        <div class="flex items-center space-x-3 shrink-0">
          <div class="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow">
            <span id="fm-bar-count">0</span>
          </div>
          <span class="text-sm tracking-wide">\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E27\u0E49</span>
        </div>
        <div class="flex items-center space-x-2 flex-nowrap shrink-0">
          <button id="fm-bar-btn-download" class="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-black text-xs font-semibold rounded-lg transition border border-slate-200 cursor-pointer whitespace-nowrap">
            <i class="fa-solid fa-file-zipper mr-1.5 text-emerald-400"></i> \u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14
          </button>
          <button id="fm-bar-btn-move" class="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-black text-xs font-semibold rounded-lg transition border border-slate-200 cursor-pointer whitespace-nowrap">
            <i class="fa-solid fa-arrows-up-down-left-right mr-1.5 text-slate-400"></i> \u0E22\u0E49\u0E32\u0E22\u0E44\u0E1B\u0E22\u0E31\u0E07...
          </button>
          <button id="fm-bar-btn-delete" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap">
            <i class="fa-solid fa-trash-can mr-1.5"></i> \u0E25\u0E1A
          </button>
        </div>
      `,document.body.appendChild(s),requestAnimationFrame(()=>{s.classList.remove("translate-y-20","opacity-0")}),document.getElementById("fm-bar-btn-download").addEventListener("click",()=>this.handleBatchDownload()),document.getElementById("fm-bar-btn-move").addEventListener("click",()=>{const a=Array.from(this.selectedFileUuids),r=Array.from(this.selectedFolderIds);this.openMoveModal(a,r)}),document.getElementById("fm-bar-btn-delete").addEventListener("click",()=>this.handleBatchDelete())),document.getElementById("fm-bar-count").textContent=t}removeFloatingBar(){const t=document.getElementById("fm-floating-bar");t&&(t.classList.add("translate-y-20","opacity-0"),setTimeout(()=>t.remove(),300))}getDescendantIds(t){let s=[parseInt(t)];return this.all_folders.filter(r=>parseInt(r.parent_id)===parseInt(t)).forEach(r=>{s=s.concat(this.getDescendantIds(r.id))}),s}openMoveModal(t=[],s=[]){if(t.length===0&&s.length===0)return;let a=[];s.forEach(n=>{a=a.concat(this.getDescendantIds(n))});let r='<option value="">[ \u0E04\u0E25\u0E31\u0E07\u0E44\u0E1F\u0E25\u0E4C\u0E2B\u0E25\u0E31\u0E01 / Root ]</option>';this.all_folders.forEach(n=>{a.includes(parseInt(n.id))||(r+=`<option value="${n.id}">${this.escapeHtml(n.name)}</option>`)});const l=document.createElement("div");l.className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300",l.innerHTML=`
      <div class="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full transform scale-95 transition-transform duration-300">
        <h3 class="text-base font-bold text-gray-800 mb-2 flex items-center">
          <i class="fa-solid fa-arrows-up-down-left-right text-emerald-600 mr-2"></i>
          \u0E22\u0E49\u0E32\u0E22\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07
        </h3>
        <p class="text-xs text-gray-400 mb-4">\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 (${t.length+s.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)</p>
        <select id="fm-move-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none mb-6">
          ${r}
        </select>
        <div class="flex items-center justify-end space-x-2">
          <button id="fm-move-btn-cancel" class="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition cursor-pointer">\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
          <button id="fm-move-btn-confirm" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer">\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E32\u0E23\u0E22\u0E49\u0E32\u0E22</button>
        </div>
      </div>
    `,document.body.appendChild(l),l.querySelector("#fm-move-btn-confirm").addEventListener("click",async()=>{const n=l.querySelector("#fm-move-select").value;await this.batchMove(t,s,n),l.remove()}),l.querySelector("#fm-move-btn-cancel").addEventListener("click",()=>{l.remove()})}async batchMove(t,s,a){try{const r=new FormData;t.forEach(m=>r.append("uuids[]",m)),s.forEach(m=>r.append("folder_ids[]",m)),a&&r.append("target_folder_id",a),r.append(this.getCsrfName(),this.getCsrfHash());const l=await fetch(this.config.batchMoveUrl,{method:"POST",body:r}),n=await l.json();if(l.ok&&n.status==="success")showToast("\u0E22\u0E49\u0E32\u0E22\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27!","success"),this.clearSelection(),this.fetchData();else throw new Error(n.message||"Error moving items")}catch(r){console.error(r),alert(r.message||"\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E22\u0E49\u0E32\u0E22\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")}}async handleBatchDelete(){const t=Array.from(this.selectedFileUuids),s=Array.from(this.selectedFolderIds);if(!(t.length===0&&s.length===0)&&confirm("\u0E04\u0E38\u0E13\u0E41\u0E19\u0E48\u0E43\u0E08\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E16\u0E32\u0E27\u0E23?"))try{const a=new FormData;t.forEach(n=>a.append("uuids[]",n)),s.forEach(n=>a.append("folder_ids[]",n)),a.append(this.getCsrfName(),this.getCsrfHash());const r=await fetch(this.config.batchDeleteUrl,{method:"POST",body:a}),l=await r.json();if(r.ok&&l.status==="success")showToast("\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27!","success"),this.clearSelection(),this.fetchData();else throw new Error(l.message||"Error deleting items")}catch(a){console.error(a),alert(a.message||"\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")}}handleBatchDownload(){const t=Array.from(this.selectedFileUuids),s=Array.from(this.selectedFolderIds);if(t.length===0&&s.length===0)return;const a=document.createElement("form");a.method="POST",a.action=this.config.batchDownloadUrl,a.target="_blank";const r=document.createElement("input");r.type="hidden",r.name=this.getCsrfName(),r.value=this.getCsrfHash(),a.appendChild(r),t.forEach(l=>{const n=document.createElement("input");n.type="hidden",n.name="uuids[]",n.value=l,a.appendChild(n)}),s.forEach(l=>{const n=document.createElement("input");n.type="hidden",n.name="folders[]",n.value=l,a.appendChild(n)}),document.body.appendChild(a),a.submit(),document.body.removeChild(a),this.clearSelection(),this.renderFloatingBar(),this.updateMasterCheckboxState()}openPreviewModal(t,s=""){let a=null,r="";typeof t=="object"&&t!==null?(a=t,r=a.encoded_uuid,s=a.filename):(r=t,a=this.files.find(w=>w.encoded_uuid===r)||{encoded_uuid:r,filename:s,file_hash:"",uuid:"",mime_type:"application/pdf"});const l=document.getElementById("pdf-preview-modal"),n=document.getElementById("pdf-modal-card"),m=document.getElementById("pdf-preview-title"),g=document.getElementById("pdf-preview-loader"),x=document.getElementById("pdf-preview-dropdown-menu"),d=document.getElementById("pdf-preview-iframe"),e=document.getElementById("media-preview-image"),o=document.getElementById("media-preview-video"),h=document.getElementById("media-preview-audio-container"),i=document.getElementById("media-preview-audio"),c=document.getElementById("pdf-preview-icon-wrapper"),L=document.getElementById("pdf-preview-icon");if(!l)return;const b=new URLSearchParams(window.location.search);b.set("preview_file",r),b.set("preview_name",s);const E=`${window.location.pathname}?${b.toString()}`;window.history.replaceState({},"",E),m.textContent=s,m.title=s,g.classList.remove("hidden"),d&&d.classList.add("hidden"),e&&e.classList.add("hidden"),o&&o.classList.add("hidden"),h&&(h.classList.add("hidden"),h.classList.remove("flex")),d&&(d.src=""),e&&(e.src=""),o&&(o.src=""),i&&(i.src="");const f=`/moph-db/file/download/${r}?preview=1`,y=s.split(".").pop().toLowerCase();["jpg","jpeg","png","gif","webp"].includes(y)&&e?(e.src=f,e.classList.remove("hidden"),g.classList.add("hidden"),c&&(c.className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 flex-shrink-0"),L&&(L.className="fa-solid fa-file-image")):["mp4","webm"].includes(y)&&o?(o.src=f,o.classList.remove("hidden"),g.classList.add("hidden"),c&&(c.className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 flex-shrink-0"),L&&(L.className="fa-solid fa-file-video")):["mp3","wav","ogg"].includes(y)&&h&&i?(i.src=f,h.classList.remove("hidden"),h.classList.add("flex"),g.classList.add("hidden"),c&&(c.className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 flex-shrink-0"),L&&(L.className="fa-solid fa-file-audio")):d&&(d.src=f,d.classList.remove("hidden"),c&&(c.className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-500 flex-shrink-0"),L&&(L.className="fa-solid fa-file-pdf"),d.onload=()=>{g.classList.add("hidden")}),x&&(a.uuid?x.innerHTML=`
          <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50">\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B</div>
          <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-copy-link" data-encoded-uuid="${a.encoded_uuid}" data-filename="${this.escapeHtml(a.filename)}" data-folder-id="${a.container_id||""}">
            <i class="fa-solid fa-share-nodes mr-2.5 text-slate-400 w-4 text-center"></i> \u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C
          </button>
          <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-copy-hash" data-hash="${a.file_hash||""}">
            <i class="fa-solid fa-hashtag mr-2.5 text-slate-400 w-4 text-center"></i> \u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E04\u0E48\u0E32 Hash
          </button>
          <a href="/moph-db/file/download/${a.encoded_uuid}" class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition">
            <i class="fa-solid fa-download mr-2.5 text-slate-400 w-4 text-center"></i> \u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E1F\u0E25\u0E4C
          </a>
          
          <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50 mt-1">\u0E41\u0E01\u0E49\u0E44\u0E02</div>
          <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-rename-file" data-uuid="${a.uuid}" data-name="${this.escapeHtml(a.filename)}">
            <i class="fa-solid fa-pen mr-2.5 text-slate-400 w-4 text-center"></i> \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D
          </button>
          <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-btn-move-file" data-uuid="${a.uuid}">
            <i class="fa-solid fa-arrows-up-down-left-right mr-2.5 text-slate-400 w-4 text-center"></i> \u0E22\u0E49\u0E32\u0E22\u0E44\u0E1B\u0E22\u0E31\u0E07...
          </button>
          
          <div class="border-t border-gray-100 my-1"></div>
          <button class="w-full flex items-center px-4 py-2 text-xs text-red-650 hover:bg-red-50 transition fm-btn-delete-file" data-uuid="${a.uuid}">
            <i class="fa-solid fa-trash-can mr-2 w-4 text-center"></i> \u0E25\u0E1A\u0E44\u0E1F\u0E25\u0E4C
          </button>
        `:x.innerHTML=`
          <div class="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-50 bg-gray-50/50">\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B</div>
          <button class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition fm-action-copy-link" data-encoded-uuid="${a.encoded_uuid}">
            <i class="fa-solid fa-share-nodes mr-2.5 text-slate-400 w-4 text-center"></i> \u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C
          </button>
          <a href="/moph-db/file/download/${a.encoded_uuid}" class="w-full flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition">
            <i class="fa-solid fa-download mr-2.5 text-slate-400 w-4 text-center"></i> \u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E1F\u0E25\u0E4C
          </a>
        `),l.classList.remove("hidden"),requestAnimationFrame(()=>{l.classList.remove("opacity-0"),n.classList.remove("scale-95")});const u=()=>{const w=new URLSearchParams(window.location.search);w.delete("preview_file"),w.delete("preview_name");const F=`${window.location.pathname}${w.toString()?"?"+w.toString():""}`;window.history.replaceState({},"",F),this.previewOpenedFromUrl=!1,l.classList.add("opacity-0"),n.classList.add("scale-95"),setTimeout(()=>{l.classList.add("hidden"),d&&(d.src=""),e&&(e.src=""),o&&(o.src=""),i&&(i.src=""),x&&x.classList.add("hidden")},300),document.getElementById("pdf-preview-close").removeEventListener("click",u),l.removeEventListener("click",S)},S=w=>{w.target===l&&u()};document.getElementById("pdf-preview-close").addEventListener("click",u),l.addEventListener("click",S)}async renameFile(t,s){try{const a=new FormData;a.append("uuid",t),a.append("name",s),a.append(this.getCsrfName(),this.getCsrfHash());const l=await(await fetch(this.config.renameFileUrl,{method:"POST",body:a})).json();if(l.status==="success")showToast("\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27!","success"),this.fetchData();else throw new Error(l.message||"Error renaming file")}catch(a){console.error(a),alert(a.message||"\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E1F\u0E25\u0E4C")}}async deleteFolder(t){try{const s=new FormData;s.append("folder_id",t),s.append(this.getCsrfName(),this.getCsrfHash());const r=await(await fetch(this.config.deleteFolderUrl,{method:"POST",body:s})).json();if(r.status==="success")showToast("\u0E25\u0E1A\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E41\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E25\u0E39\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27!","success"),this.fetchData();else throw new Error(r.message||"Error deleting folder")}catch(s){console.error(s),alert(s.message||"\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C")}}async copyToClipboard(t){if(navigator.clipboard&&window.isSecureContext)try{return await navigator.clipboard.writeText(t),!0}catch{}const s=document.createElement("textarea");s.value=t,s.style.position="fixed",s.style.left="-999999px",s.style.top="-999999px",document.body.appendChild(s),s.focus(),s.select();try{const a=document.execCommand("copy");return s.remove(),a}catch{return s.remove(),!1}}async createFolder(t){try{const s=new FormData;s.append("name",t),this.currentFolderId&&s.append("parent_id",this.currentFolderId),s.append(this.getCsrfName(),this.getCsrfHash());const r=await(await fetch(this.config.createFolderUrl,{method:"POST",body:s})).json();if(r.status==="success")showToast("\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27!","success"),this.fetchData();else throw new Error(r.message||"Error creating folder")}catch(s){console.error(s),alert(s.message||"\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C")}}async deleteFile(t){try{const s=new FormData;s.append("uuid",t),s.append(this.getCsrfName(),this.getCsrfHash());const r=await(await fetch(this.config.deleteFileUrl,{method:"POST",body:s})).json();if(r.status==="success")showToast("\u0E25\u0E1A\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27!","success"),this.fetchData();else throw new Error(r.message||"Error deleting file")}catch(s){console.error(s),alert(s.message||"\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E44\u0E1F\u0E25\u0E4C")}}getCsrfName(){const t=document.querySelector('input[type="hidden"][name^="csrf_"]');return t?t.name:"csrf_test_name"}getCsrfHash(){const t=document.querySelector('input[type="hidden"][name^="csrf_"]');return t?t.value:""}escapeHtml(t){const s={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return String(t).replace(/[&<>"']/g,function(a){return s[a]})}refresh(){this.fetchData()}applySidebarFoldedState(){const t=this.getCookie("fm_sidebar_folded")==="1",s=document.getElementById("sidebar-left"),a=document.getElementById("main-wrapper"),r=document.getElementById("fm-sidebar-toggle-btn"),l=document.getElementById("fm-sidebar-toggle-icon");!s||!a||(t?(s.classList.remove("max-w-80","w-full"),s.classList.add("max-w-[76px]","w-[76px]"),a.classList.remove("lg:ml-80"),a.classList.add("lg:ml-[76px]"),l&&(l.className="fa-solid fa-angles-right text-xs"),r&&(r.title="\u0E02\u0E22\u0E32\u0E22\u0E40\u0E21\u0E19\u0E39\u0E19\u0E33\u0E17\u0E32\u0E07"),document.querySelectorAll(".fm-sidebar-title, .fm-menu-text, #sidebar-folder-tree-section, #sidebar-footer-info").forEach(n=>{n.classList.add("hidden")}),document.querySelectorAll(".fm-nav-item").forEach(n=>{n.dataset.tab===this.activeTab?n.classList.remove("hidden"):n.classList.add("hidden")})):(s.classList.add("max-w-80","w-full"),s.classList.remove("max-w-[76px]","w-[76px]"),a.classList.add("lg:ml-80"),a.classList.remove("lg:ml-[76px]"),l&&(l.className="fa-solid fa-angles-left text-xs"),r&&(r.title="\u0E1E\u0E31\u0E1A\u0E40\u0E21\u0E19\u0E39\u0E19\u0E33\u0E17\u0E32\u0E07"),document.querySelectorAll(".fm-sidebar-title, .fm-menu-text, #sidebar-folder-tree-section, #sidebar-footer-info").forEach(n=>{n.classList.remove("hidden")}),document.querySelectorAll(".fm-nav-item").forEach(n=>{n.classList.remove("hidden")})))}formatDate(t){if(!t)return"-";const s=t.replace(" ","T"),a=new Date(s);if(isNaN(a.getTime()))return t;const r=String(a.getDate()).padStart(2,"0"),n=["\u0E21.\u0E04.","\u0E01.\u0E1E.","\u0E21\u0E35.\u0E04.","\u0E40\u0E21.\u0E22.","\u0E1E.\u0E04.","\u0E21\u0E34.\u0E22.","\u0E01.\u0E04.","\u0E2A.\u0E04.","\u0E01.\u0E22.","\u0E15.\u0E04.","\u0E1E.\u0E22.","\u0E18.\u0E04."][a.getMonth()];let m=a.getFullYear();(this.settings&&this.settings.date_format||"be")==="be"&&(m+=543);const x=String(a.getHours()).padStart(2,"0"),d=String(a.getMinutes()).padStart(2,"0");return`${r} ${n} ${m} ${x}:${d} \u0E19.`}isMediaFile(t){if(!t)return!1;const s=t.split(".").pop().toLowerCase();return["png","jpg","jpeg","gif","webp","mp4","webm","mp3","wav","ogg"].includes(s)}downloadFolder(t){const s=document.createElement("form");s.method="POST",s.action=this.config.batchDownloadUrl,s.target="_blank";const a=document.createElement("input");a.type="hidden",a.name=this.getCsrfName(),a.value=this.getCsrfHash(),s.appendChild(a);const r=document.createElement("input");r.type="hidden",r.name="folders[]",r.value=t,s.appendChild(r),document.body.appendChild(s),s.submit(),document.body.removeChild(s)}renderDashboard(){if(!this.dashboardStats){this.dashboardContainer.innerHTML=`
        <div class="bg-white rounded-xl border border-gray-105 shadow-sm p-6 text-center text-gray-400">
          <i class="fa-solid fa-chart-line text-4xl mb-3 text-gray-200 block mx-auto animate-pulse"></i>
          <span>\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E16\u0E34\u0E15\u0E34\u0E23\u0E30\u0E1A\u0E1A...</span>
        </div>
      `;return}const t=this.dashboardStats,s=t.storage_distribution||{},a=t.total_files?Math.round(s.database_count/t.total_files*100):0,r=t.total_files?Math.round(s.physical_count/t.total_files*100):0;let l="";t.top_downloaded&&t.top_downloaded.length>0?t.top_downloaded.forEach((m,g)=>{l+=`
          <div class="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition">
            <div class="flex items-center space-x-3 min-w-0">
              <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-bold text-xs shrink-0 select-none">
                #${g+1}
              </div>
              <div class="truncate">
                <span class="text-xs font-semibold text-gray-800 block truncate" title="${this.escapeHtml(m.filename)}">${this.escapeHtml(m.filename)}</span>
                <span class="text-[10px] text-gray-450 mt-0.5 block">${m.formatted_size} \u2022 ${m.storage_type==="database"?"DB":"Physical"}</span>
              </div>
            </div>
            <div class="flex items-center space-x-3 shrink-0">
              <span class="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <i class="fa-solid fa-download mr-1"></i> ${m.download_count||0}
              </span>
            </div>
          </div>
        `}):l='<div class="p-6 text-center text-gray-400 text-xs">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E16\u0E34\u0E15\u0E34\u0E01\u0E32\u0E23\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E1F\u0E25\u0E4C</div>';let n="";t.recent_logs&&t.recent_logs.length>0?t.recent_logs.forEach(m=>{const g=m.replace("[AUDIT]","").trim();n+=`
          <div class="flex items-start space-x-2.5 p-2.5 hover:bg-slate-50 border-b border-slate-50/60 last:border-b-0 transition text-[11px]">
            <div class="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-655 shrink-0 mt-0.5">
              <i class="fa-solid fa-clock-rotate-left text-[9px]"></i>
            </div>
            <span class="text-gray-650 leading-relaxed">${this.escapeHtml(g)}</span>
          </div>
        `}):n='<div class="p-6 text-center text-gray-400 text-xs">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E02\u0E13\u0E30\u0E19\u0E35\u0E49</div>',this.dashboardContainer.innerHTML=`
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
        <!-- Card 1: Total Files -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition">
          <div class="space-y-1">
            <div class="flex items-center text-xs font-bold text-slate-400 uppercase">
              <span>\u0E08\u0E33\u0E19\u0E27\u0E19\u0E44\u0E1F\u0E25\u0E4C\u0E2A\u0E30\u0E2A\u0E21</span>
              <div class="relative ml-1 group/tooltip">
                <i class="fa-regular fa-circle-question cursor-pointer text-gray-400 hover:text-gray-600"></i>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50">
                  \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23/\u0E44\u0E1F\u0E25\u0E4C\u0E21\u0E35\u0E40\u0E14\u0E35\u0E22\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07\u0E23\u0E30\u0E1A\u0E1A \u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E16\u0E31\u0E07\u0E02\u0E22\u0E30
                </div>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-800">${t.total_files||0}</p>
          </div>
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg group-hover:scale-105 transition">
            <i class="fa-solid fa-file-invoice"></i>
          </div>
        </div>

        <!-- Card 2: Storage Size -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition">
          <div class="space-y-1">
            <div class="flex items-center text-xs font-bold text-slate-400 uppercase">
              <span>\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E23\u0E27\u0E21</span>
              <div class="relative ml-1 group/tooltip">
                <i class="fa-regular fa-circle-question cursor-pointer text-gray-400 hover:text-gray-600"></i>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50">
                  \u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E02\u0E2D\u0E07\u0E44\u0E1F\u0E25\u0E4C\u0E17\u0E35\u0E48\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A\u0E08\u0E23\u0E34\u0E07\u0E1A\u0E19\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E41\u0E25\u0E30\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E14\u0E34\u0E1A
                </div>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-800">${t.formatted_total_size}</p>
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
                <span class="font-mono text-gray-600">${s.database_count||0} \u0E44\u0E1F\u0E25\u0E4C (${s.formatted_database_size})</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-fuchsia-500 h-full rounded-full" style="width: ${a}%"></div>
              </div>
            </div>

            <!-- Physical info -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="font-medium text-sky-700 flex items-center"><i class="fa-solid fa-server mr-1 text-[10px]"></i> Physical Storage</span>
                <span class="font-mono text-gray-600">${s.physical_count||0} \u0E44\u0E1F\u0E25\u0E4C (${s.formatted_physical_size})</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-sky-500 h-full rounded-full" style="width: ${r}%"></div>
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
              <i class="fa-solid fa-fire text-amber-500 mr-2"></i> \u0E44\u0E1F\u0E25\u0E4C\u0E22\u0E2D\u0E14\u0E19\u0E34\u0E22\u0E21
            </h3>
          </div>
          <div class="space-y-2.5">
            ${l}
          </div>
        </div>

        <!-- Recent Audit Log activities -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 class="text-xs font-bold text-gray-800 flex items-center">
              <i class="fa-solid fa-shield-halved text-emerald-600 mr-2"></i> \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E27\u0E32\u0E21\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22\u0E23\u0E30\u0E1A\u0E1A
            </h3>
          </div>
          <div class="divide-y divide-slate-50 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
            ${n}
          </div>
        </div>
      </div>
    `}renderSettingsForm(){const t={settings_mode:"system",system_name:"\u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E25\u0E31\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E0E\u0E2B\u0E21\u0E32\u0E22\u0E41\u0E25\u0E30\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E27\u0E32\u0E21\u0E23\u0E48\u0E27\u0E21\u0E21\u0E37\u0E2D",system_name_en:"MoU - MOPH Database",agency_short_name:"\u0E01\u0E2D\u0E07\u0E01\u0E0E\u0E2B\u0E21\u0E32\u0E22 \u0E2A\u0E1B.\u0E2A\u0E18.",date_format:"be",default_storage_type:"database",max_file_size:10,chunk_size:512,max_multiple_upload:10,allowed_extensions:"pdf,doc,docx,xls,xlsx,png,jpg,jpeg,gif,webp,mp4,webm,mp3,wav,ogg"};this.customSettings||(this.customSettings={...this.settings});const s=this.settings.settings_mode==="system";this.settingsContainer.innerHTML=`
      <div class="flex flex-col space-y-5">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-base font-bold text-gray-800 flex items-center">
            <i class="fa-solid fa-sliders text-emerald-600 mr-2.5"></i>
            \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E25\u0E31\u0E07\u0E44\u0E1F\u0E25\u0E4C
          </h2>
          <p class="text-xs text-gray-400 mt-0.5">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E04\u0E48\u0E32\u0E1E\u0E32\u0E23\u0E32\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E2B\u0E25\u0E31\u0E01\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E25\u0E31\u0E07\u0E44\u0E1F\u0E25\u0E4C\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A\u0E0A\u0E34\u0E49\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25</p>
        </div>

        <form id="fm-settings-form" class="space-y-4 max-w-2xl select-none">
          <!-- Settings Mode Toggler -->
          <div class="flex items-center bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 select-none">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="fm-settings-mode-toggle" name="settings_mode" value="system" class="sr-only peer" ${s?"checked":""}>
              <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              <span class="ml-3 text-xs font-bold text-gray-800" id="fm-settings-mode-label">
                ${s?"\u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A (System Defaults)":"\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E40\u0E2D\u0E07 (Custom Configuration)"}
              </span>
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- System Name -->
            <div class="space-y-1 col-span-1">
              <label class="block text-xs font-bold text-gray-600">\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E30\u0E1A\u0E1A\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22</label>
              <input type="text" name="system_name" value="${this.escapeHtml(this.settings.system_name||"")}" class="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            </div>

            <!-- System Name (English) -->
            <div class="space-y-1 col-span-1">
              <label class="block text-xs font-bold text-gray-600">\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E30\u0E1A\u0E1A\u0E20\u0E32\u0E29\u0E32\u0E2D\u0E31\u0E07\u0E01\u0E24\u0E29</label>
              <input type="text" name="system_name_en" value="${this.escapeHtml(this.settings.system_name_en||"")}" class="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            </div>

            <!-- Agency Short Name -->
            <div class="space-y-1 col-span-1">
              <label class="block text-xs font-bold text-gray-600">\u0E0A\u0E37\u0E48\u0E2D\u0E22\u0E48\u0E2D\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19</label>
              <input type="text" name="agency_short_name" value="${this.escapeHtml(this.settings.agency_short_name||"")}" class="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Date Format -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-600">\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E27\u0E31\u0E19\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25</label>
              <div id="settings-date-format-select"></div>
              <input type="hidden" name="date_format" id="settings-date-format-value" value="${this.settings.date_format||"be"}">
            </div>

            <!-- Default Storage Type -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-600">\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E41\u0E2B\u0E25\u0E48\u0E07\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A</label>
              <div id="settings-storage-type-select"></div>
              <input type="hidden" name="default_storage_type" id="settings-storage-type-value" value="${this.settings.default_storage_type||"database"}">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Max Upload File Size -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-600">\u0E02\u0E19\u0E32\u0E14\u0E44\u0E1F\u0E25\u0E4C\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E15\u0E48\u0E2D\u0E44\u0E1F\u0E25\u0E4C (MB)</label>
              <input type="number" name="max_file_size" value="${parseInt(this.settings.max_file_size||10)}" min="1" class="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            </div>

            <!-- Chunk Size -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-600">\u0E02\u0E19\u0E32\u0E14\u0E0A\u0E34\u0E49\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E41\u0E1A\u0E48\u0E07\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14 (KB)</label>
              <input type="number" name="chunk_size" value="${parseInt(this.settings.chunk_size||512)}" min="64" max="10240" class="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            </div>

            <!-- Max Multiple Upload Limit -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-600">\u0E08\u0E33\u0E19\u0E27\u0E19\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E1F\u0E25\u0E4C\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E01\u0E31\u0E19\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14</label>
              <input type="number" name="max_multiple_upload" value="${parseInt(this.settings.max_multiple_upload||10)}" min="1" class="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            </div>
          </div>

          <!-- Allowed Extensions -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-gray-600">\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25\u0E44\u0E1F\u0E25\u0E4C\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15</label>
            <div id="settings-extensions-select"></div>
            <input type="hidden" name="allowed_extensions" id="settings-extensions-value" value="${this.settings.allowed_extensions||"pdf"}">
          </div>

          <!-- Save Button -->
          <div class="pt-3">
            <button type="submit" id="settings-save-btn" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow hover:shadow-md transition cursor-pointer">
              <i class="fa-solid fa-floppy-disk mr-1.5"></i> \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32
            </button>
          </div>
        </form>
      </div>
    `,this.dateFormatSelect=new SmartSelect("settings-date-format-select",[{value:"be",label:"\u0E1E\u0E38\u0E17\u0E18\u0E28\u0E31\u0E01\u0E23\u0E32\u0E0A (\u0E1B\u0E35 \u0E1E.\u0E28.)"},{value:"ce",label:"\u0E04\u0E23\u0E34\u0E2A\u0E15\u0E4C\u0E28\u0E31\u0E01\u0E23\u0E32\u0E0A (\u0E1B\u0E35 \u0E04.\u0E28.)"}],{multiple:!1,selected:s?t.date_format:this.settings.date_format||"be",onSelectionChange:g=>{const x=g[0]||"be",d=document.getElementById("settings-date-format-value");d&&(d.value=x)}}),this.defaultStorageSelect=new SmartSelect("settings-storage-type-select",[{value:"database",label:"\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A\u0E43\u0E19\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 (DB Storage)"},{value:"physical",label:"\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A\u0E1A\u0E19\u0E14\u0E34\u0E2A\u0E01\u0E4C\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F\u0E40\u0E27\u0E2D\u0E23\u0E4C (Physical Storage)"}],{multiple:!1,selected:s?t.default_storage_type:this.settings.default_storage_type||"database",onSelectionChange:g=>{const x=g[0]||"database",d=document.getElementById("settings-storage-type-value");d&&(d.value=x)}});const a=(s?t.allowed_extensions:this.settings.allowed_extensions||"pdf").split(",").map(g=>g.trim()).filter(Boolean);this.allowedExtensionsSelect=new SmartSelect("settings-extensions-select",[],{mode:"tags",multiple:!0,placeholder:"\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25\u0E44\u0E1F\u0E25\u0E4C\u0E41\u0E25\u0E49\u0E27\u0E01\u0E14 Enter...",selected:a,onSelectionChange:g=>{const x=g.join(","),d=document.getElementById("settings-extensions-value");d&&(d.value=x)}});const r=document.getElementById("fm-settings-mode-toggle"),l=document.getElementById("fm-settings-mode-label"),n=g=>{l.textContent=g?"\u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A (System Defaults)":"\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E40\u0E2D\u0E07 (Custom Configuration)";const x=document.getElementById("fm-settings-form");if(!x)return;const d=x.querySelectorAll('input[name][type="text"]:not(#fm-settings-mode-toggle), input[name][type="number"]');if(g){if(d.forEach(i=>{this.customSettings[i.name]=i.value}),this.allowedExtensionsSelect&&(this.customSettings.allowed_extensions=this.allowedExtensionsSelect.getValues().join(",")),d.forEach(i=>{i.value=t[i.name],i.disabled=!0,i.classList.add("bg-slate-50","cursor-not-allowed")}),this.dateFormatSelect&&(this.dateFormatSelect.setValues(t.date_format),this.dateFormatSelect.setDisabled(!0)),this.defaultStorageSelect&&(this.defaultStorageSelect.setValues(t.default_storage_type),this.defaultStorageSelect.setDisabled(!0)),this.allowedExtensionsSelect){const i=t.allowed_extensions.split(",").map(c=>c.trim()).filter(Boolean);this.allowedExtensionsSelect.setValues(i),this.allowedExtensionsSelect.setDisabled(!0)}const e=document.getElementById("settings-date-format-value");e&&(e.value=t.date_format);const o=document.getElementById("settings-storage-type-value");o&&(o.value=t.default_storage_type);const h=document.getElementById("settings-extensions-value");h&&(h.value=t.allowed_extensions)}else{if(d.forEach(e=>{e.value=this.customSettings[e.name]!==void 0?this.customSettings[e.name]:t[e.name],e.disabled=!1,e.classList.remove("bg-slate-50","cursor-not-allowed")}),this.dateFormatSelect){const e=this.customSettings.date_format!==void 0?this.customSettings.date_format:t.date_format;this.dateFormatSelect.setValues(e),this.dateFormatSelect.setDisabled(!1);const o=document.getElementById("settings-date-format-value");o&&(o.value=e)}if(this.defaultStorageSelect){const e=this.customSettings.default_storage_type!==void 0?this.customSettings.default_storage_type:t.default_storage_type;this.defaultStorageSelect.setValues(e),this.defaultStorageSelect.setDisabled(!1);const o=document.getElementById("settings-storage-type-value");o&&(o.value=e)}if(this.allowedExtensionsSelect){const e=this.customSettings.allowed_extensions!==void 0?this.customSettings.allowed_extensions:t.allowed_extensions,o=e.split(",").map(i=>i.trim()).filter(Boolean);this.allowedExtensionsSelect.setValues(o),this.allowedExtensionsSelect.setDisabled(!1);const h=document.getElementById("settings-extensions-value");h&&(h.value=e)}}};r&&r.addEventListener("change",function(){n(this.checked)}),n(s);const m=document.getElementById("fm-settings-form");m&&m.addEventListener("submit",async g=>{g.preventDefault();try{const x=m.querySelectorAll("input:disabled, select:disabled");x.forEach(i=>i.disabled=!1);const d=new FormData(m),e=document.getElementById("fm-settings-mode-toggle").checked;d.set("settings_mode",e?"system":"custom"),e&&x.forEach(i=>{i.id!=="fm-settings-mode-toggle"&&(i.disabled=!0)}),d.append(this.getCsrfName(),this.getCsrfHash());const h=await(await fetch("/admin/settings/save",{method:"POST",body:d})).json();if(h.status==="success")showToast("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27! \u0E01\u0E33\u0E25\u0E31\u0E07\u0E23\u0E35\u0E42\u0E2B\u0E25\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A...","success"),this.fetchData(),setTimeout(()=>{window.location.reload()},1500);else throw new Error(h.message||"Error saving settings")}catch(x){console.error(x),alert(x.message||"\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E48\u0E32\u0E23\u0E30\u0E1A\u0E1A")}})}}
