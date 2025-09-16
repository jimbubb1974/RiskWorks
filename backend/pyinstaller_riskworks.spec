# PyInstaller spec for RiskWorks (one-file build)

import os
from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

hiddenimports = collect_submodules('passlib.handlers.bcrypt')

frontend_src = os.path.join('app', 'static', 'frontend')

a = Analysis(
    ['run_launcher.py'],
    pathex=['.'],
    binaries=[],
    datas=[(frontend_src, 'app/static/frontend')],
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='RiskWorks',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    version='scripts/riskworks_version_info.txt',
    manifest='scripts/riskworks_manifest.xml',
)
