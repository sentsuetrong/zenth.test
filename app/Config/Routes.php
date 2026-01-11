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

service('auth')->routes($routes);
