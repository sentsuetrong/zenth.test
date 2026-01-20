<!DOCTYPE html>
<html lang="th">

<head>
  <meta charset="UTF-8">
  <title>Test Chunk Upload</title>
  <style>
    body {
      font-family: sans-serif;
      padding: 20px;
    }

    .upload-box {
      border: 2px dashed #ccc;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
    }

    #progress-container {
      display: none;
      margin-top: 20px;
    }

    #progress-bar {
      width: 0%;
      height: 20px;
      background-color: #4CAF50;
      transition: width 0.2s;
    }

    .log {
      margin-top: 10px;
      color: #555;
      font-size: 0.9em;
    }
  </style>
</head>

<body>

  <h2>ทดสอบระบบ Upload แบบ Chunk (Resumable.js)</h2>

  <div class="upload-box" id="drop-target">
    <p>ลากไฟล์มาวางที่นี่ หรือ</p>
    <button id="browse-btn">เลือกไฟล์</button>
  </div>

  <div id="progress-container">
    Status: <span id="status-text">Waiting...</span>
    <div style="border: 1px solid #ddd; width: 100%;">
      <div id="progress-bar"></div>
    </div>
  </div>

  <div class="log" id="debug-log"></div>

  <script src="https://cdn.jsdelivr.net/npm/resumablejs@1.1.0/resumable.min.js"></script>

  <script>
    // 1. ตั้งค่า Resumable
    var r = new Resumable({
      target: '<?= base_url('admin/upload/chunk') ?>', // URL ที่เราทำไว้
      chunkSize: 1 * 1000 * 1000, // หั่นทีละ 1MB (เพื่อทดสอบ)
      simultaneousUploads: 3,
      testChunks: false, // ไม่ต้อง test GET ก่อนส่ง POST (เพื่อความง่ายตอนนี้)
      throttleProgressCallbacks: 1,
      // สำคัญ! ส่ง CSRF Token ไปด้วย ไม่งั้น CI4 จะ Block
      query: {
        '<?= csrf_token() ?>': '<?= csrf_hash() ?>'
      }
    });

    // 2. ผูกปุ่มเข้ากับ Resumable
    if (!r.support) {
      alert("Browser ของคุณไม่รองรับการ Upload แบบนี้");
    } else {
      r.assignBrowse(document.getElementById('browse-btn'));
      r.assignDrop(document.getElementById('drop-target'));
    }

    // 3. จัดการ Events ต่างๆ
    r.on('fileAdded', function(file) {
      document.getElementById('progress-container').style.display = 'block';
      document.getElementById('status-text').innerText = 'กำลังเตรียมไฟล์...';
      log('File Added: ' + file.fileName);
      r.upload(); // เริ่มอัปโหลดทันทีเมื่อเลือกไฟล์
    });

    r.on('fileProgress', function(file) {
      var percent = Math.floor(file.progress() * 100);
      document.getElementById('progress-bar').style.width = percent + '%';
      document.getElementById('status-text').innerText = 'Uploading... ' + percent + '%';
    });

    r.on('fileSuccess', function(file, message) {
      document.getElementById('status-text').innerText = 'เสร็จสมบูรณ์! (Completed)';
      document.getElementById('progress-bar').style.backgroundColor = '#2196F3';
      log('Success: Server ตอบกลับว่า ' + message);
    });

    r.on('fileError', function(file, message) {
      document.getElementById('status-text').innerText = 'เกิดข้อผิดพลาด';
      document.getElementById('progress-bar').style.backgroundColor = 'red';
      log('Error: ' + message);
    });

    function log(msg) {
      var d = new Date();
      var time = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
      document.getElementById('debug-log').innerHTML += "<div>[" + time + "] " + msg + "</div>";
    }
  </script>
</body>

</html>