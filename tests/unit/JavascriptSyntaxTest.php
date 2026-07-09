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
        $jsFile = ROOTPATH . 'assets/js/main.js';
        
        $this->assertFileExists($jsFile, "Javascript file main.js must exist");

        // Execute node --check to validate syntax
        $output = [];
        $returnCode = 0;
        exec("node --check " . escapeshellarg($jsFile) . " 2>&1", $output, $returnCode);

        $outputStr = implode("\n", $output);
        $this->assertSame(0, $returnCode, "Javascript syntax check failed:\n{$outputStr}");
    }
}
