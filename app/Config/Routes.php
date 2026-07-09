<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('admin', static function (RouteCollection $routes) {
  $routes->get('upload', 'FileController::index');
  $routes->post('upload/chunk', 'FileController::upload');
  $routes->get('upload/list-json', 'FileController::listJson');
  $routes->post('upload/create-folder', 'FileController::createFolder');
  $routes->post('upload/delete-file', 'FileController::deleteFile');
  $routes->post('upload/batch-download', 'FileController::batchDownload');
  $routes->post('upload/batch-move', 'FileController::batchMove');
  $routes->post('upload/batch-delete', 'FileController::batchDelete');
  $routes->post('upload/rename-folder', 'FileController::renameFolder');
  $routes->post('upload/rename-file', 'FileController::renameFile');
  $routes->post('upload/delete-folder', 'FileController::deleteFolder');

  // Settings Management API
  $routes->get('settings', 'FileController::getSettings');
  $routes->post('settings/save', 'FileController::saveSettings');

  // MOU Management
  $routes->group('mou', ['namespace' => 'App\Controllers\Admin'], static function (RouteCollection $routes) {
    $routes->get('/', 'MouController::index');
    $routes->get('new', 'MouController::new');
    $routes->post('create', 'MouController::create');
    $routes->get('edit/(:num)', 'MouController::edit/$1');
    $routes->post('update/(:num)', 'MouController::update/$1');
    $routes->get('delete/(:num)', 'MouController::delete/$1');
  });

  // Laws Management
  $routes->group('laws', ['namespace' => 'App\Controllers\Admin'], static function (RouteCollection $routes) {
    $routes->get('/', 'LawController::index');
    $routes->get('new', 'LawController::new');
    $routes->post('create', 'LawController::create');
    $routes->get('edit/(:num)', 'LawController::edit/$1');
    $routes->post('update/(:num)', 'LawController::update/$1');
    $routes->get('delete/(:num)', 'LawController::delete/$1');
  });
});

$routes->group('moph-db', static function (RouteCollection $routes) {
  $routes->get('mou', 'MouController::index');
  $routes->get('mou/(:num)', 'MouController::show/$1');
  $routes->get('file/download/(:any)', 'FileController::download/$1');
});

$routes->group('moph-db', ['namespace' => 'App\Controllers\MophDB'], static function (RouteCollection $routes) {
  $routes->get('laws', 'LawsController::index');
  $routes->get('laws/search', 'LawsController::search');
  $routes->get('laws/(:num)', 'LawsController::show/$1');
});

service('auth')->routes($routes);
