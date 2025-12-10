<?php

if (!defined('VITE_BASE_URL')) define('VITE_BASE_URL', 'http://localhost:5173');

if (!function_exists('vite')) {
  function vite(string $entry_points)
  {
    $is_dev = getenv('CI_ENVIRONMENT') === 'development';
    $is_main = strpos($entry_points, 'main.js') !== false;

    if ($is_dev && check_vite_server()) {
      if (!$is_main)
        return '<script type="module" src="' . VITE_BASE_URL . '/' . $entry_points . '"></script>';

      return <<<HTML

      <script type="module" src="{VITE_BASE_URL}/@vite/client"></script>
      <script type="module" src="{VITE_BASE_URL}/{$entry_points}"></script>

HTML;
    }

    return load_manifest_assets($entry_points);
  }
}

if (!function_exists('check_vite_server')) {
  function check_vite_server()
  {
    $handle = @fsockopen('localhost', 5173, $errno, $errstr, 1);
    if ($handle) {
      fclose($handle);
      return true;
    }
    return false;
  }
}

if (!function_exists('load_manifest_assets')) {
  function load_manifest_assets(string $entry_points)
  {
    $manifest_path = FCPATH . 'dist/.vite/manifest.json';
    if (!file_exists($manifest_path)) return '';
    $manifest = json_decode(file_get_contents($manifest_path), true);

    if ((strpos($entry_points, '.scss') !== false) || (strpos($entry_points, '.css') !== false)) {
      if (isset($manifest[$entry_points])) {
        return '<link rel="stylesheet" href="' . base_url('dist/' . $manifest[$entry_points]['file']) . '">';
      }
    }

    if (isset($manifest[$entry_points])) {
      $file = $manifest[$entry_points]['file'];
      $css_files = $manifest[$entry_points]['css'] ?? [];
      $html = '<script type="module" src="' . base_url('dist/' . $file) . '"></script>';
      foreach ($css_files as $css) {
        $html .= '<link rel="stylesheet" href="' . base_url('dist/' . $css) . '">';
      }
      return $html;
    }

    return '';
  }
}

if (!function_exists('load_manifest_resources')) {
  function load_manifest_resources(string $entry_point): string
  {
    $is_dev = getenv('CI_ENVIRONMENT') === 'development';

    $output_directory = 'static';
    $manifest_path = FCPATH . $output_directory . '/.vite/manifest.json';
    if (!file_exists($manifest_path)) return '';
    $manifest = json_decode(file_get_contents($manifest_path), true);

    $html = [];

    if ($manifest[$entry_point]) {
      $file = $manifest[$entry_point]['file'];
      $css_files = $manifest[$entry_point]['css'] ?? [];
      $resource_path = ($is_dev ? VITE_BASE_URL : base_url($output_directory));
      set_resource_template($html, $resource_path . '/' . $file);
      foreach ($css_files as $css) {
        set_resource_template($html, $resource_path . '/' . $css);
      }
    }

    return implode('', $html);
  }
}

if (!function_exists('set_resource_template')) {
  function set_resource_template(array &$html, string $resource_path)
  {
    if (strpos($resource_path, '.scss') !== false || strpos($resource_path, '.css') !== false) {
      $html[] = '<link rel="stylesheet" href="' . $resource_path . '">';
    } else if (strpos($resource_path, '.js') !== false) {
      $html[] = '<script type="module" src="' . $resource_path . '"></script>';
    }
  }
}
