<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'SPAController::index');

$routes->group('api/v1', ['namespace' => 'App\Controllers\Api\V1'], static function (RouteCollection $routes) {
  $routes->get('test', 'TestController::index');
  $routes->post('auth/register', 'AuthController::register'); // สมัครสมาชิก
  $routes->post('auth/login', 'AuthController::login');       // ล็อกอินรับ Token

  $routes->group('', ['filter' => 'tokens'], function ($routes) {

    $routes->get('auth/me', 'AuthController::me');      // ดูข้อมูลตัวเอง
    $routes->post('auth/logout', 'AuthController::logout'); // ออกจากระบบ

    // ต่อไปถ้ามี routes อื่นๆ ที่ต้องล็อกอิน ให้ใส่ในนี้
    // $routes->resource('products', 'ProductController');
  });
});

$routes->group('admin', static function (RouteCollection $routes) {
  $routes->get('upload', 'FileController::index');
  $routes->post('upload/chunk', 'FileController::upload');
});

$routes->group('moph-db', static function (RouteCollection $routes) {
  $routes->get('mou', 'MouController::index');
});

$routes->group('moph-db', ['namespace' => '\App\Controllers\MophDB'], static function (RouteCollection $routes) {
  $routes->get('laws', 'LawsController::index');
});

// service('auth')->routes($routes);
$routes->get('(:any)', 'SPAController::index');
