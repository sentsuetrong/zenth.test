<script>
  document.addEventListener('DOMContentLoaded', function() {
    showItem("<?= isset($result) && is_object($result) ? esc($result->mou->id, 'js') : 'null' ?>")

    const lawsTypes = [{
        value: '1',
        label: 'พระราชบัญญัติ'
      },
      {
        value: '2',
        label: 'พระราชกฤษฎีกา'
      },
      {
        value: '3',
        label: 'ระเบียบ'
      },
      {
        value: '4',
        label: 'ประกาศ'
      },
      {
        value: '5',
        label: 'กฎกระทรวง'
      },
    ];

    new SmartSelect('laws-type', lawsTypes, {
      multiple: true,
      selected: ['1', '2'],
    });

    const lawsStatus = [{
        value: '1',
        label: 'มีผลบังคับใช้งาน'
      },
      {
        value: '2',
        label: 'ยกเลิกบังคับใช้'
      },
    ];

    new SmartSelect('laws-status', lawsStatus, {
      multiple: false,
      selected: '1'
    });
  })
</script>

</body>

</html>