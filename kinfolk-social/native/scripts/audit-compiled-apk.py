#!/usr/bin/env python3
"""Audit the compiled offline Android APK, including non-JS web assets.

This checks package contents only. It does not prove backend or device behavior.
"""
import sys
import re
import stat
import zipfile
from pathlib import Path

LIVE_REF = "zojajuzmfjpvubzibzgg"
CI_REF = "aaaaaaaaaaaaaaaaaaaa"
ALPHA_REF = "viantpfagtbgyyzavmtv"
ROOT = "assets/public/"
REQUIRED = (
    ROOT + "index.html",
    ROOT + "kinfolk-supabase-sdk.js",
    ROOT + "kinfolk-reels159.js",
    ROOT + "kinfolk-communities.js",
    ROOT + "kinfolk-preview-isolation.js",
)

def verify(apk: Path, connected_alpha: bool = False) -> None:
    expected_ref = ALPHA_REF if connected_alpha else CI_REF
    if not apk.is_file() or apk.stat().st_size == 0:
        raise ValueError("Compiled Android debug APK missing or empty")
    with zipfile.ZipFile(apk) as archive:
        entries = archive.infolist()
        names = set()
        for info in entries:
            name = info.filename
            parts = name.replace(chr(92), "/").split("/")
            if (name in names or name.startswith("/") or ".." in parts
                    or chr(92) in name or (parts[0] and parts[0].endswith(":"))):
                raise ValueError("Compiled APK has unsafe or duplicate archive entry: " + name)
            # APK entries must be regular files or directories, never symlinks.
            mode = (info.external_attr >> 16) & 0xFFFF
            if info.create_system == 3 and stat.S_IFMT(mode) == stat.S_IFLNK:
                raise ValueError("Compiled APK contains symlink entry: " + name)
            names.add(name)
        missing = set(REQUIRED) - names
        if missing:
            raise ValueError("Compiled APK missing main Kinfolk modules: " + ", ".join(sorted(missing)))
        index = archive.read(REQUIRED[0]).decode("utf-8")
        if "window.KINFOLK_NATIVE_ALPHA=true;" not in index:
            raise ValueError("Compiled APK missing native startup marker")
        if "https://" + expected_ref + ".supabase.co" not in index:
            raise ValueError("Compiled APK is not bound to the expected isolated backend")
        if 'src="/kinfolk-supabase-sdk.js"' not in index:
            raise ValueError("Compiled APK does not load bundled Supabase SDK")
        if "cdn.jsdelivr.net/npm/@supabase/supabase-js" in index:
            raise ValueError("Compiled APK still requires remote Supabase SDK")
        # Scan the entire APK, including native manifests, resources, and metadata.
        # A live backend reference outside assets/public is still a leak.
        # Stream each entry to avoid loading large assets into memory.
        needle = LIVE_REF.encode("ascii")
        endpoint_pattern = re.compile(rb"(?:(?:https?|wss?):)?//([a-z0-9-]+)\.supabase\.co((?:[a-z0-9-]|\.[a-z0-9-])[a-z0-9.-]*|@[a-z0-9.-]+|:[^/@\s?#]*@[a-z0-9.-]+)?", re.I)
        endpoints = set()
        for info in archive.infolist():
            if info.is_dir():
                continue
            with archive.open(info) as stream:
                tail = b""
                while chunk := stream.read(1024 * 1024):
                    combined = tail + chunk
                    if needle in combined:
                        raise ValueError("Shared live backend reference embedded in compiled APK: " + info.filename)
                    # Scan HTTP, WebSocket and scheme-relative project URLs across every entry. Retain enough bytes
                    # to catch endpoints split across adjacent stream chunks.
                    for match in endpoint_pattern.finditer(combined):
                        if match.group(2):
                            raise ValueError("Compiled APK contains deceptive Supabase hostname: " + info.filename)
                        endpoints.add(match.group(1).decode("ascii").lower())
                    tail = combined[-255:]
        if endpoints != {expected_ref}:
            raise ValueError("Compiled APK contains unexpected Supabase project endpoint")
        if len(archive.read(REQUIRED[1])) < 10000:
            raise ValueError("Compiled APK Supabase SDK is unexpectedly small")
    print("PASS compiled APK modules, " + ("connected alpha" if connected_alpha else "offline synthetic") + " backend, and whole-archive live-reference isolation")

if __name__ == "__main__":
    try:
        args = sys.argv[1:]
        connected_alpha = "--connected-alpha" in args
        args = [arg for arg in args if arg != "--connected-alpha"]
        if len(args) > 1:
            raise ValueError("Usage: audit-compiled-apk.py [--connected-alpha] [apk-path]")
        verify(Path(args[0] if args else "android/app/build/outputs/apk/debug/app-debug.apk"), connected_alpha=connected_alpha)
    except (ValueError, OSError, UnicodeError, zipfile.BadZipFile) as error:
        print("FAIL compiled APK audit:", error, file=sys.stderr)
        sys.exit(1)
