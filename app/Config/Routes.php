<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('admin', static function (RouteCollection $routes) {
  $routes->get('upload', 'FileController::index');
  $routes->post('upload/chunk', 'FileController::upload');

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
});

$routes->group('moph-db', ['namespace' => 'App\Controllers\MophDB'], static function (RouteCollection $routes) {
  $routes->get('laws', 'LawsController::index');
  $routes->get('laws/search', 'LawsController::search');
  $routes->get('laws/(:num)', 'LawsController::show/$1');
});

service('auth')->routes($routes);
