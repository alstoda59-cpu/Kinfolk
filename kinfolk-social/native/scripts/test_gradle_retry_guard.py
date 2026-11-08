"""Regression checks for Recovery519 Gradle retry classification (synthetic logs)."""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
WORKFLOWS = [
    ROOT / ".github/workflows/kinfolk-alpha-security-regressions.yml",
    ROOT / ".github/workflows/kinfolk-alpha-native.yml",
]
TRANSPORT = r"Server returned HTTP response code: (429|500|502|503|504)|SocketTimeoutException|Read timed out|Connect timed out"
BUILD_FAILURE = r"^FAILURE: Build failed|^> Task .* FAILED|^.*Compilation failed"


def should_retry(log, attempt=1):
    return attempt < 3 and not re.search(BUILD_FAILURE, log, re.M) and bool(re.search(TRANSPORT, log))


class GradleRetryGuardTests(unittest.TestCase):
    def test_transport_failure_retries(self):
        self.assertTrue(should_retry("Server returned HTTP response code: 504"))
        self.assertTrue(should_retry("java.net.SocketTimeoutException"))

    def test_compilation_failure_never_retries_even_with_prior_504(self):
        log = "Server returned HTTP response code: 504\n> Task :app:compileDebugJavaWithJavac FAILED\nFAILURE: Build failed"
        self.assertFalse(should_retry(log))

    def test_non_transport_failure_does_not_retry(self):
        self.assertFalse(should_retry("Could not find dependency"))

    def test_third_attempt_is_terminal(self):
        self.assertFalse(should_retry("Server returned HTTP response code: 504", 3))

    def test_both_workflows_include_failure_guard(self):
        for path in WORKFLOWS:
            with self.subTest(path=path.name):
                data = path.read_text()
                self.assertIn("grep -Eq '^FAILURE: Build failed|^> Task .* FAILED|^.*Compilation failed'", data)
                self.assertIn("result=${PIPESTATUS[0]}", data)


if __name__ == "__main__":
    unittest.main()
