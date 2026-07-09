<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
class FileDeleteAuthTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    protected function setUp(): void
    {
        parent::setUp();
        \Config\Services::reset();

        // Mock Settings service to bypass Database settings lookup
        $settingsMock = $this->getMockBuilder(\CodeIgniter\Settings\Settings::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['get'])
            ->getMock();
        $settingsMock->method('get')->willReturnCallback(function($key) {
            $defaults = [
                'Auth.sessionConfig' => [
                    'field' => 'active_at',
                ],
                'Auth.recordActiveInterval' => 300,
                'date_format' => 'be',
                'allowed_extensions' => 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg,gif,webp,mp4,webm,mp3,wav,ogg',
                'max_file_size' => '10',
                'max_multiple_upload' => '10',
                'default_storage_type' => 'database',
                'system_name' => 'ระบบคลังไฟล์',
                'agency_short_name' => 'กองกฎหมาย',
            ];
            return $defaults[$key] ?? null;
        });
        \Config\Services::injectMock('settings', $settingsMock);
    }

    public function testDeleteFileWithoutAuthRedirectsToLogin(): void
    {
        // Arrange: Mock Shield Auth session authenticator to return loggedIn() -> false
        $sessionMock = $this->getMockBuilder(\CodeIgniter\Shield\Authentication\Authenticators\Session::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['loggedIn'])
            ->getMock();
        $sessionMock->method('loggedIn')->willReturn(false);

        $authMock = $this->getMockBuilder(\CodeIgniter\Shield\Auth::class)
            ->setConstructorArgs([config('Auth')])
            ->onlyMethods(['getAuthenticator'])
            ->addMethods(['loggedIn'])
            ->getMock();
        $authMock->method('getAuthenticator')->willReturn($sessionMock);
        $authMock->method('loggedIn')->willReturn(false);

        \Config\Services::injectMock('auth', $authMock);

        // Act: Request to delete a file without auth session
        $result = $this->post('admin/upload/delete-file', [
            'uuid' => '00000000-0000-0000-0000-000000000000'
        ]);

        // Assert: Filter intercepts and redirects to login page (302)
        $result->assertStatus(302);
        $result->assertRedirect();
    }

    public function testDeleteFileWithAuthBypassesFilterAndFailsOnFileNotFound(): void
    {
        // Arrange: Mock User Entity to be active/not banned
        $userMock = $this->getMockBuilder(\CodeIgniter\Shield\Entities\User::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['isBanned', 'isActivated'])
            ->getMock();
        $userMock->method('isBanned')->willReturn(false);
        $userMock->method('isActivated')->willReturn(true);

        // Mock Shield session authenticator to return loggedIn() -> true, return mock user, and mock recordActiveDate() to do nothing
        $sessionMock = $this->getMockBuilder(\CodeIgniter\Shield\Authentication\Authenticators\Session::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['loggedIn', 'getUser', 'recordActiveDate'])
            ->getMock();
        $sessionMock->method('loggedIn')->willReturn(true);
        $sessionMock->method('getUser')->willReturn($userMock);
        $sessionMock->method('recordActiveDate'); // Do nothing (void return type)

        // Mock Auth service
        $authMock = $this->getMockBuilder(\CodeIgniter\Shield\Auth::class)
            ->setConstructorArgs([config('Auth')])
            ->onlyMethods(['getAuthenticator'])
            ->addMethods(['loggedIn'])
            ->getMock();
        $authMock->method('getAuthenticator')->willReturn($sessionMock);
        $authMock->method('loggedIn')->willReturn(true);

        \Config\Services::injectMock('auth', $authMock);

        // Act: Request to delete a non-existent file UUID
        $result = $this->post('admin/upload/delete-file', [
            'uuid' => 'ffffffff-ffff-ffff-ffff-ffffffffffff'
        ]);

        // Assert: Bypassed filter, but failed in controller because file is not found (400)
        $result->assertStatus(400);
        $result->assertJSONFragment(['messages' => ['error' => 'ไม่พบไฟล์ที่ต้องการลบ']]);
    }
}
