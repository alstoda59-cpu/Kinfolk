"""Offline regression tests for compiled APK payload isolation."""
import importlib.util
import tempfile
import unittest
import zipfile
from pathlib import Path

SCRIPT = Path(__file__).with_name("audit-compiled-apk.py")
spec = importlib.util.spec_from_file_location("apk_audit", SCRIPT)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class CompiledApkAuditTests(unittest.TestCase):
    def make_apk(self, root, extra=None):
        path = Path(root) / "app-debug.apk"
        files = {name: b"module" for name in audit.REQUIRED}
        files[audit.REQUIRED[0]] = (
            '<script>window.KINFOLK_NATIVE_ALPHA=true;</script>'
            '<script src="/kinfolk-supabase-sdk.js"></script>'
            'https://aaaaaaaaaaaaaaaaaaaa.supabase.co'
        ).encode()
        files[audit.REQUIRED[1]] = b"x" * 10001
        files.update(extra or {})
        with zipfile.ZipFile(path, "w") as z:
            for name, data in files.items():
                z.writestr(name, data)
        return path

    def test_valid_offline_apk(self):
        with tempfile.TemporaryDirectory() as d:
            audit.verify(self.make_apk(d))

    def test_live_ref_in_json_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {"assets/public/config.json": audit.LIVE_REF.encode()})
            with self.assertRaisesRegex(ValueError, "config.json"):
                audit.verify(apk)

    def test_live_ref_across_stream_boundary_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            payload = b"x" * (1024 * 1024 - 8) + audit.LIVE_REF.encode()
            apk = self.make_apk(d, {"assets/public/large.map": payload})
            with self.assertRaisesRegex(ValueError, "large.map"):
                audit.verify(apk)

    def test_missing_module_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d)
            with zipfile.ZipFile(apk) as z:
                files = {n: z.read(n) for n in z.namelist() if n != audit.REQUIRED[2]}
            with zipfile.ZipFile(apk, "w") as z:
                for n, data in files.items():
                    z.writestr(n, data)
            with self.assertRaisesRegex(ValueError, "missing main Kinfolk modules"):
                audit.verify(apk)

if __name__ == "__main__":
    unittest.main()
