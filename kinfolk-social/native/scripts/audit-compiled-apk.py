#!/usr/bin/env python3
"""Audit the compiled offline Android APK, including non-JS web assets.

This checks package contents only. It does not prove backend or device behavior.
"""
import sys
import zipfile
from pathlib import Path

LIVE_REF = "zojajuzmfjpvubzibzgg"
CI_REF = "aaaaaaaaaaaaaaaaaaaa"
ROOT = "assets/public/"
REQUIRED = (
    ROOT + "index.html",
    ROOT + "kinfolk-supabase-sdk.js",
    ROOT + "kinfolk-reels159.js",
    ROOT + "kinfolk-communities.js",
    ROOT + "kinfolk-preview-isolation.js",
)

def verify(apk: Path) -> None:
    if not apk.is_file() or apk.stat().st_size == 0:
        raise ValueError("Compiled Android debug APK missing or empty")
    with zipfile.ZipFile(apk) as archive:
        entries = archive.infolist()
        names = set()
        for info in entries:
            name = info.filename
            parts = name.replace(chr(92), "/").split("/")
            if name in names or name.startswith("/") or ".." in parts or chr(92) in name:
                raise ValueError("Compiled APK has unsafe or duplicate archive entry: " + name)
            names.add(name)
        missing = set(REQUIRED) - names
        if missing:
            raise ValueError("Compiled APK missing main Kinfolk modules: " + ", ".join(sorted(missing)))
        index = archive.read(REQUIRED[0]).decode("utf-8")
        if "window.KINFOLK_NATIVE_ALPHA=true;" not in index:
            raise ValueError("Compiled APK missing native startup marker")
        if "https://" + CI_REF + ".supabase.co" not in index:
            raise ValueError("Compiled APK is not bound to the offline synthetic backend")
        if 'src="/kinfolk-supabase-sdk.js"' not in index:
            raise ValueError("Compiled APK does not load bundled Supabase SDK")
        if "cdn.jsdelivr.net/npm/@supabase/supabase-js" in index:
            raise ValueError("Compiled APK still requires remote Supabase SDK")
        # Scan the entire APK, including native manifests, resources, and metadata.
        # A live backend reference outside assets/public is still a leak.
        # Stream each entry to avoid loading large assets into memory.
        needle = LIVE_REF.encode("ascii")
        for info in archive.infolist():
            if info.is_dir():
                continue
            with archive.open(info) as stream:
                tail = b""
                while chunk := stream.read(1024 * 1024):
                    combined = tail + chunk
                    if needle in combined:
                        raise ValueError("Shared live backend reference embedded in compiled APK: " + info.filename)
                    tail = combined[-(len(needle) - 1):]
        if len(archive.read(REQUIRED[1])) < 10000:
            raise ValueError("Compiled APK Supabase SDK is unexpectedly small")
    print("PASS compiled APK modules, offline backend, and full web-asset live-reference isolation")

if __name__ == "__main__":
    try:
        verify(Path(sys.argv[1] if len(sys.argv) > 1 else "android/app/build/outputs/apk/debug/app-debug.apk"))
    except (ValueError, OSError, UnicodeError, zipfile.BadZipFile) as error:
        print("FAIL compiled APK audit:", error, file=sys.stderr)
        sys.exit(1)
