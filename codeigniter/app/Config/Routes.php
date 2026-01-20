<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('admin', [], function (RouteCollection $routes) {
  //$routes->post('upload/chunk', 'FileUploadController::uploadChunk');
  $routes->get('upload', 'DropzoneUploadController::index');
  $routes->post('upload/chunk', 'DropzoneUploadController::upload');
});

$routes->get('admin/test-upload', 'FileUploadController::testPage');

service('auth')->routes($routes);
