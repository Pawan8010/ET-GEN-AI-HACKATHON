"""Create the initial tenant, identity, document, RAG, and feedback schema."""

from alembic import op

from opsbrain_backend.db.base import Base
from opsbrain_backend.db import models  # noqa: F401


revision = "0001_platform_foundation"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    for table in Base.metadata.sorted_tables:
        table.create(bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()
    for table in reversed(Base.metadata.sorted_tables):
        table.drop(bind, checkfirst=True)
