"""Offline regression tests for compiled APK payload isolation."""
import importlib.util
import stat
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

    def test_second_supabase_project_in_entry_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d)
            with zipfile.ZipFile(apk) as z:
                files = {n: z.read(n) for n in z.namelist()}
            files[audit.REQUIRED[0]] += b'<script>const other="https://bbbbbbbbbbbbbbbbbbbb.supabase.co"</script>'
            with zipfile.ZipFile(apk, "w") as z:
                for name, data in files.items():
                    z.writestr(name, data)
            with self.assertRaisesRegex(ValueError, "unexpected Supabase project endpoint"):
                audit.verify(apk)

    def test_second_supabase_project_in_other_asset_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {
                "assets/public/config.json": b'{"url":"https://bbbbbbbbbbbbbbbbbbbb.supabase.co"}'
            })
            with self.assertRaisesRegex(ValueError, "unexpected Supabase project endpoint"):
                audit.verify(apk)

    def test_second_supabase_project_in_native_metadata_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {
                "META-INF/backend.txt": b"https://cccccccccccccccccccc.supabase.co"
            })
            with self.assertRaisesRegex(ValueError, "unexpected Supabase project endpoint"):
                audit.verify(apk)

    def test_second_supabase_project_across_stream_boundary_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            url = b"https://dddddddddddddddddddd.supabase.co"
            payload = b"x" * (1024 * 1024 - 12) + url
            apk = self.make_apk(d, {"assets/public/large.txt": payload})
            with self.assertRaisesRegex(ValueError, "unexpected Supabase project endpoint"):
                audit.verify(apk)

    def test_scheme_relative_supabase_endpoint_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {
                "assets/public/config.json": b'{"url":"//bbbbbbbbbbbbbbbbbbbb.supabase.co"}'
            })
            with self.assertRaisesRegex(ValueError, "unexpected Supabase project endpoint"):
                audit.verify(apk)

    def test_websocket_supabase_endpoint_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {
                "assets/public/socket.js": b'const url="wss://cccccccccccccccccccc.supabase.co/realtime";'
            })
            with self.assertRaisesRegex(ValueError, "unexpected Supabase project endpoint"):
                audit.verify(apk)

    def test_allowlisted_project_with_deceptive_hostname_suffix_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {
                "assets/public/redirect.js": b'const url="https://aaaaaaaaaaaaaaaaaaaa.supabase.co.attacker.example/auth";'
            })
            with self.assertRaisesRegex(ValueError, "deceptive Supabase hostname"):
                audit.verify(apk)

    def test_scheme_relative_deceptive_hostname_suffix_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {
                "assets/public/redirect.js": b'const url="//aaaaaaaaaaaaaaaaaaaa.supabase.company/path";'
            })
            with self.assertRaisesRegex(ValueError, "deceptive Supabase hostname"):
                audit.verify(apk)

    def test_allowlisted_project_with_userinfo_redirect_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {
                "assets/public/redirect.js": b'const url="https://aaaaaaaaaaaaaaaaaaaa.supabase.co@attacker.example/auth";'
            })
            with self.assertRaisesRegex(ValueError, "deceptive Supabase hostname"):
                audit.verify(apk)

    def test_websocket_userinfo_redirect_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {
                "assets/public/socket.js": b'const url="wss://aaaaaaaaaaaaaaaaaaaa.supabase.co@attacker.example/realtime";'
            })
            with self.assertRaisesRegex(ValueError, "deceptive Supabase hostname"):
                audit.verify(apk)

    def test_non_supabase_host_allowed(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {"assets/public/readme.txt": b"https://example.org"})
            audit.verify(apk)

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


    def test_duplicate_entry_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d)
            with zipfile.ZipFile(apk, "a") as z:
                import warnings
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", UserWarning)
                    z.writestr(audit.REQUIRED[0], b"duplicate")
            with self.assertRaisesRegex(ValueError, "duplicate archive entry"):
                audit.verify(apk)

    def test_traversal_entry_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {"assets/public/../secret.txt": b"test"})
            with self.assertRaisesRegex(ValueError, "unsafe or duplicate archive entry"):
                audit.verify(apk)

    def test_live_ref_in_native_manifest_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {"AndroidManifest.xml": b"<manifest>" + audit.LIVE_REF.encode() + b"</manifest>"})
            with self.assertRaisesRegex(ValueError, "AndroidManifest.xml"):
                audit.verify(apk)

    def test_live_ref_in_native_metadata_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {"META-INF/kinfolk-config": b"backend=" + audit.LIVE_REF.encode()})
            with self.assertRaisesRegex(ValueError, "META-INF/kinfolk-config"):
                audit.verify(apk)

    def test_windows_drive_prefix_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d, {"C:/private/config.json": b"unsafe"})
            with self.assertRaisesRegex(ValueError, "unsafe or duplicate archive entry"):
                audit.verify(apk)

    def test_symlink_entry_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.make_apk(d)
            link = zipfile.ZipInfo("assets/public/link")
            link.create_system = 3
            link.external_attr = (stat.S_IFLNK | 0o777) << 16
            with zipfile.ZipFile(apk, "a") as z:
                z.writestr(link, b"../../private")
            with self.assertRaisesRegex(ValueError, "symlink entry"):
                audit.verify(apk)

if __name__ == "__main__":
    unittest.main()
