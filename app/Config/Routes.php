<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('admin', static function (RouteCollection $routes) {
  $routes->get('upload', 'FileController::index');
  $routes->post('upload/chunk', 'FileController::upload');
});

$routes->group('moph-db', static function (RouteCollection $routes) {
  $routes->get('mou', 'MouController::index');
});

service('auth')->routes($routes);
