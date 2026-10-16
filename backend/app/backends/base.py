"""Pluggable reconstruction interface. Every backend implements this."""
from abc import ABC, abstractmethod
from typing import Callable


class ReconBackend(ABC):
    name: str = "base"

    @abstractmethod
    def start_session(self, scan_id: str, options: dict):
        ...

    @abstractmethod
    def add_frame(self, image_bytes: bytes, timestamp: int):
        """Returns dict with optional points update + progress."""
        ...

    @abstractmethod
    def get_point_cloud_update(self):
        ...

    @abstractmethod
    def finalize(self) -> str:
        """Returns path to final .glb file."""
        ...

    def coverage(self) -> float:
        return 0.0
