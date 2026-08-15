"""Load settings for the active environment.

Set ``SETTINGS_MODULE`` to ``config.settings.production`` in production.
Defaults to local settings.
"""

from __future__ import annotations

import importlib
import os

os.environ.setdefault("SETTINGS_MODULE", "config.settings.local")

settings = importlib.import_module(os.environ["SETTINGS_MODULE"]).settings
