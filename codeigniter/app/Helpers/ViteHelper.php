<?php

if (!class_exists('Vite')) {
  class Vite
  {
    private string $host = 'localhost';
    private int $port = 5173;
    private array $html = [];

    private static ?Vite $instance = null;
    protected ?array $manifest = null;

    public string $output_directory = 'static';

    private function __construct()
    {
      $this->loadManifest();
    }

    public static function getInstance(): Vite
    {
      return self::$instance ?? new self();
    }

    public function loadManifest()
    {
      if (!$this->isDev()) return;
      $manifest_path = FCPATH . $this->output_directory . '/.vite/manifest.json';
      $this->manifest = json_decode(file_get_contents($manifest_path), true);
    }

    public function render(string $entry_point, bool $clear_html = false): string
    {
      $html = $this->html;
      if ($clear_html) $this->html = [];

      return implode('', $html);
    }

    public function resource_template(array &$html, string $resource_path)
    {
      if (strpos($resource_path, '.scss') !== false || strpos($resource_path, '.css') !== false) {
        $html[] = '<link rel="stylesheet" href="' . $resource_path . '">';
      } else if (strpos($resource_path, '.js') !== false) {
        $html[] = '<script type="module" src="' . $resource_path . '"></script>';
      }
    }

    public function setOutputDirectory(string $path)
    {
      $this->output_directory = $path;
    }

    public function isDev()
    {
      return getenv('CI_ENVIRONMENT') === 'development';
    }

    public function isMain(string $file_path)
    {
      return ($this->manifest[$file_path]['name'] ?? '') === 'main';
    }

    public function isViteDevServerOnline()
    {
      $handle = @fsockopen($this->host, $this->port, $error_code, $error_message, 1);
      if ($handle) {
        fclose($handle);
        return true;
      }
      return false;
    }
  }
}
