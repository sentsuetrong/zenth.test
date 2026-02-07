<?php

namespace App\Controllers\API\V1;

class TestController extends ApiController
{
    public function index()
    {
        $data = [
            'status'  => 'success',
            'message' => 'API V1 is working!',
            'data'    => [
                'framework' => 'CodeIgniter 4',
                'frontend'  => 'Vue 3 + Vite',
                'time'      => date('Y-m-d H:i:s')
            ]
        ];

        // respond($data, $statusCode) เป็น method จาก ResourceController
        return $this->respond($data, 200);
    }
}
