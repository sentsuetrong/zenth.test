<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', fn() => 'hello world');
$routes->get('/', 'Home::index');

service('auth')->routes($routes);
