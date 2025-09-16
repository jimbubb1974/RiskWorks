import os
import socket
import sys
import time
import threading
import webbrowser
import urllib.request
import urllib.error
from uvicorn import Config, Server
import app.main  # ensure PyInstaller collects the FastAPI app package


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main() -> None:
    port = os.environ.get("RISKWORKS_PORT")
    if port is None:
        port = str(find_free_port())

    env = os.environ.copy()
    env.setdefault("ENVIRONMENT", "development")
    env.setdefault("DATABASE_TYPE", "sqlite")
    env.setdefault("DATABASE_URL", f"sqlite:///./risk_platform.db")

    # Configure and start Uvicorn in-process to avoid recursive launcher spawns
    config = Config(
        "app.main:app",
        host="127.0.0.1",
        port=int(port),
        log_level="info",
        log_config=None,  # avoid dictConfig that expects a TTY stream
        reload=False,
        env_file=None,
    )
    server = Server(config)

    def open_when_ready() -> None:
        base = f"http://127.0.0.1:{port}"
        health = f"{base}/health"
        deadline = time.monotonic() + 8.0
        while time.monotonic() < deadline:
            try:
                with urllib.request.urlopen(health, timeout=0.6) as _:
                    break
            except (urllib.error.URLError, TimeoutError):
                time.sleep(0.2)
        try:
            webbrowser.open(f"{base}/app")
        except Exception:
            pass

    opener = threading.Thread(target=open_when_ready, daemon=True)
    opener.start()

    # Run server (blocking)
    try:
        # Set any env needed for the app before running
        os.environ.update(env)
        server.run()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()



