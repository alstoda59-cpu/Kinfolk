"""Regression checks for Recovery519 Gradle retry classification (synthetic logs)."""
import pathlib
import re
import subprocess
import textwrap
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[3]
WORKFLOWS = [
    ROOT / ".github/workflows/kinfolk-alpha-security-regressions.yml",
    ROOT / ".github/workflows/kinfolk-alpha-native.yml",
]
TRANSPORT = r"Server returned HTTP response code: (429|500|502|503|504)|SocketTimeoutException|Read timed out|Connect timed out"
BUILD_FAILURE = r"^> Task .* FAILED|^.*Compilation failed|^> Execution failed for task|^Execution failed for task"


def should_retry(log, attempt=1):
    return attempt < 3 and not re.search(BUILD_FAILURE, log, re.M) and bool(re.search(TRANSPORT, log))


class GradleRetryGuardTests(unittest.TestCase):
    def test_workflow_paths_resolve_from_repository_root(self):
        self.assertEqual(ROOT.name, "Kinfolk")
        for path in WORKFLOWS:
            with self.subTest(path=path.name):
                self.assertTrue(path.is_file(), f"Missing workflow fixture: {path}")

    def test_transport_failure_retries(self):
        self.assertTrue(should_retry("Server returned HTTP response code: 504"))
        self.assertTrue(should_retry("java.net.SocketTimeoutException"))

    def test_generic_gradle_failure_header_does_not_block_transport_retry(self):
        log = "FAILURE: Build failed with an exception.\nServer returned HTTP response code: 504"
        self.assertTrue(should_retry(log))

    def test_compilation_failure_never_retries_even_with_prior_504(self):
        log = "Server returned HTTP response code: 504\n> Task :app:compileDebugJavaWithJavac FAILED\nFAILURE: Build failed"
        self.assertFalse(should_retry(log))

    def test_gradle_task_exception_never_retries_with_prior_transport_error(self):
        log = "Server returned HTTP response code: 504\nExecution failed for task \u0027:app:compileDebugKotlin\u0027."
        self.assertFalse(should_retry(log))

    def test_gradle_indented_task_exception_is_terminal(self):
        log = "Server returned HTTP response code: 504\n> Execution failed for task \u0027:app:compileDebugKotlin\u0027."
        self.assertFalse(should_retry(log))

    def test_non_transport_failure_does_not_retry(self):
        self.assertFalse(should_retry("Could not find dependency"))

    def test_third_attempt_is_terminal(self):
        self.assertFalse(should_retry("Server returned HTTP response code: 504", 3))

    def test_gradle_retry_loop_parses_in_bash(self):
        """Check the real workflow shell, not just a copied regex fixture."""
        for path in WORKFLOWS:
            with self.subTest(path=path.name):
                source = path.read_text()
                match = re.search(
                    r"(?m)^          for attempt in 1 2 3; do\n(?:^          .*\n)*?^          done$",
                    source,
                )
                self.assertIsNotNone(match, "Gradle retry loop not found")
                script = textwrap.dedent(match.group(0))
                result = subprocess.run(
                    ["bash", "-n"], input=script, text=True, capture_output=True, check=False
                )
                self.assertEqual(result.returncode, 0, result.stderr)

    def test_workflow_retry_patterns_match_synthetic_classifier(self):
        """Test the real workflow regexes, not only their Python counterpart."""
        cases = [
            ("Server returned HTTP response code: 504", True),
            ("FAILURE: Build failed with an exception.\nServer returned HTTP response code: 504", True),
            ("Server returned HTTP response code: 504\n> Task :app:compileDebugKotlin FAILED", False),
            ("Server returned HTTP response code: 504\n> Execution failed for task ':app:compileDebugKotlin'.", False),
            ("Server returned HTTP response code: 504\nCompilation failed", False),
            ("Could not find dependency", False),
        ]
        for path in WORKFLOWS:
            source = path.read_text()
            guards = re.findall(r"grep -Eq '([^']+)' /tmp/kinfolk-gradle-build[.]log", source)
            self.assertEqual(len(guards), 2, f"Expected failure and transport guards in {path}")
            terminal, transport = guards
            for log, expected in cases:
                with self.subTest(workflow=path.name, log=log):
                    actual = bool(re.search(transport, log)) and not bool(re.search(terminal, log, re.M))
                    self.assertEqual(actual, expected)
                    self.assertEqual(actual, should_retry(log))

    def test_real_grep_classification_matches_synthetic_cases(self):
        """Exercise the exact grep -E commands used by GitHub Actions."""
        cases = [
            ("Server returned HTTP response code: 504", True),
            ("FAILURE: Build failed with an exception.\nServer returned HTTP response code: 504", True),
            ("Server returned HTTP response code: 504\n> Task :app:compileDebugKotlin FAILED", False),
            ("Server returned HTTP response code: 504\n> Execution failed for task ':app:compileDebugKotlin'.", False),
            ("Server returned HTTP response code: 504\nCompilation failed", False),
            ("Could not find dependency", False),
        ]
        for path in WORKFLOWS:
            source = path.read_text()
            guards = re.findall(r"grep -Eq '([^']+)' /tmp/kinfolk-gradle-build[.]log", source)
            self.assertEqual(len(guards), 2, f"Missing grep guards in {path}")
            terminal, transport = guards
            for log, expected in cases:
                with self.subTest(workflow=path.name, log=log):
                    terminal_match = subprocess.run(
                        ["grep", "-Eq", terminal], input=log, text=True, check=False
                    )
                    transport_match = subprocess.run(
                        ["grep", "-Eq", transport], input=log, text=True, check=False
                    )
                    self.assertIn(terminal_match.returncode, (0, 1))
                    self.assertIn(transport_match.returncode, (0, 1))
                    actual = transport_match.returncode == 0 and terminal_match.returncode != 0
                    self.assertEqual(actual, expected)
                    self.assertEqual(actual, should_retry(log))

    def test_both_workflows_include_failure_guard(self):
        for path in WORKFLOWS:
            with self.subTest(path=path.name):
                data = path.read_text()
                self.assertIn("grep -Eq '^> Task .* FAILED|^.*Compilation failed|^> Execution failed for task|^Execution failed for task\' /tmp/kinfolk-gradle-build.log", data)
                self.assertIn("result=${PIPESTATUS[0]}", data)


if __name__ == "__main__":
    unittest.main()
