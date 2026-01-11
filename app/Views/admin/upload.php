<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>

<body>
  <link rel="stylesheet" href="https://unpkg.com/dropzone@5/dist/min/dropzone.min.css" />
  <script src="https://unpkg.com/dropzone@5/dist/min/dropzone.min.js"></script>

  <div class="card">
    <div class="card-header">อัปโหลดไฟล์ (รองรับไฟล์ขนาดใหญ่)</div>
    <div class="card-body">
      <form action="/admin/upload/process" class="dropzone" id="myFileDropzone">
        <div class="dz-message">
          คลิกหรือลากไฟล์มาวางเพื่ออัปโหลด
        </div>
      </form>
    </div>
  </div>

  <script>
    Dropzone.autoDiscover = false;

    let myDropzone = new Dropzone("#myFileDropzone", {
      url: "<?= base_url('admin/upload/chunk') ?>",
      method: "post",
      paramName: "file",
      maxFilesize: 20480, // Limit Frontend (เช่น 20GB)

      // --- Configuration สำคัญที่ตกลงกัน ---
      chunking: true,
      forceChunking: true, // บังคับ Chunk เสมอเพื่อให้ Logic หลังบ้านเป็นแบบเดียว
      chunkSize: 921600, // 9.216 * 100000 B => 900KiB
      parallelChunkUploads: false, // False = ส่งทีละชิ้น (Sequential) ลดภาระ DB Lock
      retryChunks: true, // เน็ตหลุด ให้ลองใหม่
      retryChunksLimit: 3,
      // -------------------------------------

      init: function() {
        // ส่ง CSRF Token (ถ้าเปิดใช้ใน CI4)
        this.on("sending", function(file, xhr, formData) {
          formData.append("<?= csrf_token() ?>", "<?= csrf_hash() ?>");
          // formData.append("container_id", "123"); // ส่ง ID โฟลเดอร์
        });

        this.on("success", function(file, response) {
          if (response.status === 'completed') {
            console.log("File Completed ID:", response.file_id);
          }
        });

        this.on("queuecomplete", function() {
          alert("การอัปโหลดเสร็จสิ้นทั้งหมด");
        });

        this.on("error", function(file, message) {
          console.error("Error:", message);
        });
      }
    });
  </script>
</body>

</html>