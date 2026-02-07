<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

class SPAController extends BaseController
{
    public function index()
    {
        helper('vite');

        return view('spa_view');
    }
}
