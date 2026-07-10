<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;

/**
 * @internal
 */
class JavascriptSyntaxTest extends CIUnitTestCase
{
    public function testJavascriptSyntaxIsValid()
    {
        $jsFiles = [
            ROOTPATH . 'assets/js/main.js',
            ROOTPATH . 'assets/js/smart-select.js',
            ROOTPATH . 'assets/js/file-manager.js',
        ];
        
        foreach ($jsFiles as $jsFile) {
            $this->assertFileExists($jsFile, "Javascript file " . basename($jsFile) . " must exist");

            // Execute node --check to validate syntax
            $output = [];
            $returnCode = 0;
            exec("node --check " . escapeshellarg($jsFile) . " 2>&1", $output, $returnCode);

            $outputStr = implode("\n", $output);
            $this->assertSame(0, $returnCode, "Javascript syntax check failed for " . basename($jsFile) . ":\n{$outputStr}");
        }
    }
}
