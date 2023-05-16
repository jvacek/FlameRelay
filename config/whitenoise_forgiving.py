from logging import getLogger

from whitenoise.storage import CompressedManifestStaticFilesStorage

logger = getLogger(__name__)


class ErrorSquashingStorage(CompressedManifestStaticFilesStorage):
    def hashed_name(self, name, content=None, filename=None):
        try:
            result = super().hashed_name(name, content, filename)
        except ValueError:
            logger.warning(f"ErrorSquashingStorage: Missing file: {name}")
            # When the file is missing, let's forgive and ignore that.
            result = name
        return result
