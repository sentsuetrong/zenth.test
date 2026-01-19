<script>
  document.addEventListener('DOMContentLoaded', function() {
    showItemId("<?= $result === null ? 'null' : esc($result->mou->id, 'js') ?>")
  })
</script>

</body>

</html>