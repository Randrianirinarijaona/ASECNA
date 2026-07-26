"""
Modèle Pydantic de base qui expose automatiquement ses champs en camelCase
en JSON (isActive, createdAt, avatarInitials...) tout en gardant du
snake_case propre côté Python.

Pourquoi : app/types/index.ts (frontend) définit User avec des champs
camelCase (isActive, createdAt, lastLogin, avatarInitials), alors que
api.service.ts envoie parfois des payloads snake_case (is_active) pour les
PATCH. C'est une incohérence du frontend d'origine. Plutôt que de la
reproduire, on standardise ici : l'API répond TOUJOURS en camelCase (aligné
sur types.ts), et accepte les deux formats en entrée grâce à
`populate_by_name=True`. Voir aussi frontend_updates/api.service.ts pour la
correction du payload d'update utilisateur.
"""
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
