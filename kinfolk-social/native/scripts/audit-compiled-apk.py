#!/usr/bin/env python3
"""Inspect the compiled APK, not just its pre-Gradle www directory.

Offline-only check: no Supabase requests, accounts, or device installation.
"""
import sys
import zipfile
from pathlib import Path

LIVE_REF = "zojajuzmfjpvubzibzgg"
CI_REF = "aaaaaaaaaaaaaaaaaaaa"
REQUIRED = (
    "assets/public/index.html",
    "assets/public/kinfolk-supabase-sdk.js",
    "assets/public/kinfolk-reels159.js",
    "assets/public/kinfolk-communities.js",
    "assets/public/kinfolk-preview-isolation.js",
)

def verify(apk: Path) -> None:
    if not apk.is_file() or apk.stat().st_size == 0:
        raise ValueError("Compiled Android debug APK missing or empty")
    with zipfile.ZipFile(apk) as archive:
        names = set(archive.namelist())
        missing = set(REQUIRED) - names
        if missing:
            raise ValueError("Compiled APK missing main Kinfolk modules: " + ", ".join(sorted(missing)))
        index = archive.read(REQUIRED[0]).decode("utf-8")
        if "window.KINFOLK_NATIVE_ALPHA=true;" not in index:
            raise ValueError("Compiled APK missing native startup marker")
        if "https://" + CI_REF + ".supabase.co" not in index:
            raise ValueError("Compiled APK is not bound to the offline synthetic backend")
        if "src=\"/kinfolk-supabase-sdk.js\"" not in index:
            raise ValueError("Compiled APK does not load bundled Supabase SDK")
        if "cdn.jsdelivr.net/npm/@supabase/supabase-js" in index:
            raise ValueError("Compiled APK still requires remote Supabase SDK")
        for name in names:
            if not name.startswith("assets/public/") or not name.endswith((".js", ".html")):
                continue
            data = archive.read(name)
            if LIVE_REF.encode() in data:
                raise ValueError("Shared live backend reference embedded in compiled APK: " + name)
        if len(archive.read(REQUIRED[1])) < 10000:
            raise ValueError("Compiled APK Supabase SDK is unexpectedly small")
    print("PASS compiled APK embedded Kinfolk modules, offline backend, and live-reference isolation")

if __name__ == "__main__":
    try:
        verify(Path(sys.argv[1] if len(sys.argv) > 1 else "android/app/build/outputs/apk/debug/app-debug.apk"))
    except (ValueError, OSError, zipfile.BadZipFile) as error:
        print("FAIL compiled APK audit:", error, file=sys.stderr)
        sys.exit(1)
