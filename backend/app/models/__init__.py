"""
Regroupe tous les modèles pour que Base.metadata les connaisse (utilisé par
Alembic pour l'autogénération des migrations, et par create_all en dev).
"""
from app.models.user import User, RoleEnum  # noqa: F401
from app.models.airport import Airport  # noqa: F401
from app.models.network import (  # noqa: F401
    NetworkItem,
    NetworkSubParameter,
    NetworkCategoryEnum,
    ItemStatusEnum,
    SubParamStatusEnum,
)
from app.models.link import (  # noqa: F401
    NetworkLink,
    LinkParameter,
    LinkParameterValue,
    AirportLocalParameter,
    AirportLocalParameterValue,
)
from app.models.log import ActivityLog  # noqa: F401
