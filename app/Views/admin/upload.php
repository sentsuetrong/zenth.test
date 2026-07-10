<?= $this->extend('layouts/moph-db/main') ?>

<?= $this->section('content') ?>

<!-- Sidebar: Folder Navigation Tree & Navigation -->
<aside id="sidebar-left" class="custom-scrollbar gpu-accelerated fixed top-15 max-w-80 w-full h-[calc(100vh-60px)] bg-white border-r border-gray-200 -translate-x-full lg:translate-x-0 shadow-xl lg:shadow-none flex flex-col justify-between overflow-y-auto overflow-x-hidden z-20 transition-all duration-350">
  <div class="p-4 flex flex-col flex-grow min-h-0">
    <!-- Sidebar Toggle Header (Fold/Expand) -->
    <div class="flex justify-between items-center mb-4 border-b border-slate-100 shrink-0">
      <div class="fm-sidebar-title flex items-center space-x-2">
        <div class="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
          <i class="fa-solid fa-layer-group text-sm"></i>
        </div>
        <span class="text-sm font-bold text-emerald-800 uppercase tracking-wider select-none">เมนูระบบ</span>
      </div>
      <button id="fm-sidebar-toggle-btn" class="p-1.5 hover:bg-slate-100 rounded text-gray-400 hover:text-gray-650 transition cursor-pointer flex items-center justify-center shrink-0" title="พับเมนูนำทาง">
        <i class="fa-solid fa-angles-left text-xs" id="fm-sidebar-toggle-icon"></i>
      </button>
    </div>

    <!-- Main Navigation Menus -->
    <div class="space-y-1 mb-6 shrink-0" id="sidebar-nav-menu">
      <button data-tab="dashboard" class="w-full flex items-center px-3 py-2 text-sm font-semibold text-emerald-800 bg-emerald-50 rounded-lg transition fm-nav-item cursor-pointer">
        <i class="fa-solid fa-chart-pie text-emerald-600 mr-2.5 text-center w-5"></i>
        <span class="fm-menu-text">แดชบอร์ดสถิติ</span>
      </button>
      <button data-tab="files" class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-slate-50 hover:text-gray-800 rounded-lg transition fm-nav-item cursor-pointer">
        <i class="fa-solid fa-folder-open text-slate-400 mr-2.5 text-center w-5"></i>
        <span class="fm-menu-text">จัดการคลังไฟล์</span>
      </button>
      <button data-tab="settings" class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-slate-50 hover:text-gray-800 rounded-lg transition fm-nav-item cursor-pointer">
        <i class="fa-solid fa-sliders text-slate-400 mr-2.5 text-center w-5"></i>
        <span class="fm-menu-text">ตั้งค่าระบบ</span>
      </button>
    </div>

    <!-- Folder tree (Accordion) section -->
    <div class="flex flex-col flex-grow min-h-0" id="sidebar-folder-tree-section">
      <div class="flex justify-between items-center mb-2 shrink-0">
        <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider select-none">
          โครงสร้างคลังไฟล์
        </h3>
      </div>
      <div class="space-y-1 overflow-y-auto max-h-[350px] custom-scrollbar pl-0.5" id="sidebar-folder-tree">
        <div class="animate-pulse flex space-x-3 p-3">
          <div class="flex-1 space-y-2">
            <div class="h-2.5 bg-slate-200 rounded w-full"></div>
            <div class="h-2.5 bg-slate-200 rounded w-4/5"></div>
            <div class="h-2.5 bg-slate-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Sidebar Footer -->
  <div class="p-2 border-t border-gray-200 text-center text-xs text-gray-400 shrink-0" id="sidebar-footer-info">
    <img
      class="w-48 pb-2 mx-auto"
      src="<?= base_url('/assets/Logo-LAD-OPS-MOPH.png') ?>"
      alt="Logo">
    <p>
      ©<?= date('Y') + 543 ?>&nbsp;<?= isset($system_name) ? $system_name : 'ระบบคลังข้อมูลกฎหมาย' ?>
      <br><?= isset($agency_short_name) ? esc($agency_short_name) : '' ?>
    </p>
  </div>
</aside>

<!-- Main Wrapper -->
<div id="main-wrapper" class="min-h-screen lg:ml-80 pt-15 flex flex-col transition-all duration-350">
  <main class="p-6 space-y-6">
    <!-- Header Page -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-800 flex items-center" id="fm-main-title">
        <i class="fa-solid fa-chart-pie text-emerald-600 mr-2.5"></i>
        <span>แดชบอร์ดสรุปสถิติคลังไฟล์</span>
      </h1>
    </div>

    <!-- Dropzone Area -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6" id="fm-upload-box-wrapper">
      <!-- Dropzone Header with Title and Storage Toggle (Space Optimization) -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
        <div class="flex items-center space-x-2.5">
          <div class="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
            <i class="fa-solid fa-cloud-arrow-up text-base"></i>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-800">อัปโหลดเอกสารใหม่</h3>
            <p class="text-[11px] text-gray-400">ลากวางไฟล์ที่นี่ หรือเลือกอัปโหลดลงโฟลเดอร์ปัจจุบัน</p>
          </div>
        </div>
        
        <!-- Actions Button Container -->
        <div class="flex items-center space-x-3">
          <!-- Folder Upload Button Trigger -->
          <button id="fm-folder-upload-btn" class="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 transition cursor-pointer" title="เลือกทั้งโฟลเดอร์เพื่ออัปโหลด">
            <i class="fa-solid fa-folder-plus text-xs"></i>
            <span>อัปโหลดโฟลเดอร์</span>
          </button>
          <input type="file" id="fm-folder-upload-input" webkitdirectory directory multiple class="hidden">

          <!-- Storage Option Toggle integrated here -->
          <div class="flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 select-none">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="fm-storage-toggle" class="sr-only peer" checked>
              <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              <span class="ml-2 text-xs font-semibold text-gray-700" id="fm-storage-label">จัดเก็บลงฐานข้อมูล (DB Storage)</span>
            </label>
          </div>
        </div>
      </div>

      <div id="fm-dropzone" class="dropzone border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/20 hover:bg-emerald-50/10">
        <div class="dz-message flex flex-col items-center justify-center space-y-2">
          <div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xl shadow-sm">
            <i class="fa-solid fa-upload"></i>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-800">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่ออัปโหลด</p>
            <p class="text-[10px] text-gray-450 mt-0.5" id="fm-upload-hint">รองรับขนาดไฟล์อัปโหลดสูงสุด 10MB ต่อชิ้นส่วน (Chunk Size: 512KB)</p>
          </div>
        </div>
      </div>

      <!-- Modern Uploading Queue List -->
      <div id="fm-upload-queue"></div>
    </div>

    <!-- Hidden CSRF Inputs for FileManager AJAX usage -->
    <input type="hidden" name="<?= csrf_token() ?>" value="<?= csrf_hash() ?>" id="fm-csrf">

    <!-- FileManager Container -->
    <div id="file-manager-root"></div>
  </main>
</div>

<!-- PDF Preview Modal -->
<div id="pdf-preview-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm opacity-0 hidden transition-opacity duration-300 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[calc(100vh-80px)] flex flex-col overflow-hidden transform scale-95 transition-transform duration-300" id="pdf-modal-card">
    <!-- Modal Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
      <div class="flex items-center space-x-2.5 min-w-0 flex-grow mr-4">
        <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-500 flex-shrink-0" id="pdf-preview-icon-wrapper">
          <i class="fa-solid fa-file-pdf" id="pdf-preview-icon"></i>
        </div>
        <h3 class="text-base font-bold text-gray-800 truncate max-w-[200px] xs:max-w-xs sm:max-w-md md:max-w-xl flex-grow min-w-0" id="pdf-preview-title">แสดงตัวอย่างไฟล์</h3>
      </div>
      <div class="flex items-center space-x-2 flex-shrink-0">
        <!-- More Actions Dropdown for Preview File -->
        <div class="relative inline-block text-left" id="pdf-preview-actions-container">
          <button id="pdf-preview-more-actions" class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer flex items-center space-x-1">
            <i class="fa-solid fa-ellipsis-vertical text-sm"></i>
          </button>
          <div id="pdf-preview-dropdown-menu" class="fm-dropdown-menu absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-1 hidden z-50 text-left">
            <!-- Dynamically populated from JS -->
          </div>
        </div>
        <button id="pdf-preview-close" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>
    </div>
    <!-- Modal Body (Dynamic media view) -->
    <div class="flex-grow bg-slate-100 relative flex items-center justify-center overflow-hidden">
      <!-- PDF Iframe -->
      <iframe src="" class="w-full h-full border-none hidden" id="pdf-preview-iframe"></iframe>
      
      <!-- Image Preview -->
      <img src="" class="max-w-full max-h-full object-contain hidden" id="media-preview-image" alt="ตัวอย่างรูปภาพ" />
      
      <!-- Video Preview -->
      <video controls class="max-w-full max-h-full hidden" id="media-preview-video"></video>
      
      <!-- Audio Preview -->
      <div class="w-full max-w-lg p-6 bg-white rounded-2xl shadow-lg border border-slate-100 text-center hidden flex flex-col items-center justify-center space-y-4" id="media-preview-audio-container">
        <div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 text-2xl animate-bounce mx-auto">
          <i class="fa-solid fa-music"></i>
        </div>
        <audio controls class="w-full mx-auto" id="media-preview-audio"></audio>
      </div>

      <div class="absolute inset-0 flex items-center justify-center bg-slate-100 text-gray-500 pointer-events-none" id="pdf-preview-loader">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-emerald-600 mr-2.5"></i>
        <span>กำลังโหลดตัวอย่างไฟล์...</span>
      </div>
    </div>
  </div>
</div>

<!-- Dropzone resources -->
<link rel="stylesheet" href="https://unpkg.com/dropzone@5/dist/min/dropzone.min.css" />
<script src="https://unpkg.com/dropzone@5/dist/min/dropzone.min.js"></script>

<script>
  Dropzone.autoDiscover = false;

  document.addEventListener('DOMContentLoaded', function() {
    // 1. Initialize File Manager
    const fm = new FileManager('file-manager-root', {
      listUrl: '<?= site_url("admin/upload/list-json") ?>',
      createFolderUrl: '<?= site_url("admin/upload/create-folder") ?>',
      deleteFileUrl: '<?= site_url("admin/upload/delete-file") ?>'
    });

    // Storage Toggle handler
    const storageToggle = document.getElementById('fm-storage-toggle');
    const storageLabel = document.getElementById('fm-storage-label');
    storageToggle.addEventListener('change', function() {
      storageLabel.textContent = this.checked ? 'จัดเก็บลงฐานข้อมูล (DB Storage)' : 'จัดเก็บทางกายภาพบนเซิร์ฟเวอร์ (Physical Storage)';
    });

    // Custom modern preview progress template
    const previewTemplate = `
      <div class="dz-preview dz-file-preview bg-slate-50/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-100 shadow-sm transition hover:shadow-md">
        <div class="flex items-center space-x-3 truncate">
          <div class="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500 text-lg shrink-0">
            <i class="fa-solid fa-file-pdf"></i>
          </div>
          <div class="truncate">
            <span class="text-sm font-semibold text-gray-800 block truncate" data-dz-name></span>
            <span class="text-xs text-gray-400 mt-0.5" data-dz-size></span>
          </div>
        </div>
        <div class="flex-grow max-w-md w-full">
          <div class="flex justify-between items-center text-xs text-gray-500 mb-1.5">
            <span class="font-medium text-emerald-600 animate-pulse dz-upload-status">กำลังอัปโหลดชิ้นส่วน...</span>
            <span class="font-mono font-semibold dz-upload-percentage">0%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-300 animate-pulse dz-upload-bar" style="width: 0%"></div>
          </div>
        </div>
        <div class="shrink-0 flex items-center">
          <button data-dz-remove class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer" title="ยกเลิกอัปโหลด">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    `;

    // 2. Initialize Dropzone
    const myDropzone = new Dropzone("#fm-dropzone", {
      url: "<?= base_url('admin/upload/chunk') ?>",
      method: "post",
      paramName: "file",
      acceptedFiles: "<?= esc($allowed_extensions_list ?? '.pdf') ?>",
      maxFilesize: 20480, // Limit Frontend (เช่น 20GB)
      chunking: true,
      forceChunking: true,
      chunkSize: 512 * 1024, // 512KB chunks for shared hosting DB limit safety
      parallelChunkUploads: false,
      retryChunks: true,
      retryChunksLimit: 3,
      previewsContainer: "#fm-upload-queue",
      previewTemplate: previewTemplate,

      init: function() {
        this.on("sending", function(file, xhr, formData) {
          // Append CSRF Token dynamically
          formData.append("<?= csrf_token() ?>", "<?= csrf_hash() ?>");
          
          // Append current folder container ID if active
          if (fm.currentFolderId) {
            formData.append("parent_id", fm.currentFolderId);
          }

          // Append storage type from selection
          const storageTypeVal = storageToggle.checked ? 'database' : 'physical';
          formData.append("storage_type", storageTypeVal);

          // Append relative path if file is part of a folder upload
          const relativePath = file.fullPath || file.webkitRelativePath || '';
          if (relativePath) {
            formData.append("relative_path", relativePath);
          }
        });

        this.on("uploadprogress", function(file, progress, bytesSent) {
          // Update our custom progress bar and text percentage
          if (file.previewElement) {
            const bar = file.previewElement.querySelector('.dz-upload-bar');
            const percentText = file.previewElement.querySelector('.dz-upload-percentage');
            if (bar) bar.style.width = progress + '%';
            if (percentText) percentText.textContent = Math.round(progress) + '%';
          }
        });

        this.on("success", function(file, response) {
          if (response.status === 'completed') {
            if (file.previewElement) {
              const statusText = file.previewElement.querySelector('.dz-upload-status');
              const bar = file.previewElement.querySelector('.dz-upload-bar');
              if (statusText) {
                statusText.classList.remove('text-emerald-600', 'animate-pulse');
                statusText.classList.add('text-emerald-500');
                statusText.textContent = 'เสร็จสิ้น';
              }
              if (bar) {
                bar.classList.remove('animate-pulse');
              }
            }

            showToast(`อัปโหลดไฟล์ "${file.name}" เรียบร้อยแล้ว!`, 'success');
            
            // Refresh FileManager list
            fm.refresh();

            // Clear preview card after success delay
            setTimeout(() => {
              myDropzone.removeFile(file);
            }, 2000);
          }
        });

        this.on("error", function(file, message) {
          console.error("Upload error:", message);
          if (file.previewElement) {
            const statusText = file.previewElement.querySelector('.dz-upload-status');
            if (statusText) {
              statusText.classList.remove('text-emerald-600', 'animate-pulse');
              statusText.classList.add('text-red-500');
              statusText.textContent = 'ล้มเหลว';
            }
          }
          showToast(`ไม่สามารถอัปโหลดไฟล์ "${file.name}" ได้!`, 'danger');
        });
      }
    });

    // 3. Register Dropzone in FileManager
    fm.registerDropzone(myDropzone);

    // 4. Folder Upload Trigger Click
    const folderUploadBtn = document.getElementById('fm-folder-upload-btn');
    const folderUploadInput = document.getElementById('fm-folder-upload-input');
    if (folderUploadBtn && folderUploadInput) {
      folderUploadBtn.addEventListener('click', function() {
        folderUploadInput.click();
      });
      
      folderUploadInput.addEventListener('change', function(e) {
        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          // Preserve webkitRelativePath in dropzone file object
          file.fullPath = file.webkitRelativePath;
          myDropzone.addFile(file);
        }
        // Clear input value so selecting the same folder again fires change event
        folderUploadInput.value = '';
      });
    }
  });
</script>

<?= $this->endSection() ?>