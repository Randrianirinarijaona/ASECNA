from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from app.models.local_point import LocalTechnicalPoint, LocalTechnicalPointParameter, LocalTechnicalPointParameterValue


def _query():
    return select(LocalTechnicalPoint).options(selectinload(LocalTechnicalPoint.local_parameters).selectinload(LocalTechnicalPointParameter.values))


def list_for_airport(db: Session, airport_key: str) -> list[LocalTechnicalPoint]:
    return list(db.scalars(_query().where(LocalTechnicalPoint.parent_airport_key == airport_key)))


def get_point(db: Session, point_id: str) -> LocalTechnicalPoint | None:
    return db.scalar(_query().where(LocalTechnicalPoint.id == point_id))


def create_point(db: Session, airport_key: str, name: str, lat: float, lng: float) -> LocalTechnicalPoint:
    point = LocalTechnicalPoint(parent_airport_key=airport_key, name=name, lat=lat, lng=lng)
    db.add(point)
    db.commit()
    db.refresh(point)
    return point


def delete_point(db: Session, point: LocalTechnicalPoint) -> None:
    db.delete(point)
    db.commit()


def add_parameter(db: Session, point: LocalTechnicalPoint, name: str) -> LocalTechnicalPointParameter:
    param = LocalTechnicalPointParameter(point_id=point.id, name=name)
    db.add(param)
    db.commit()
    db.refresh(param)
    return param


def get_parameter(db: Session, param_id: str) -> LocalTechnicalPointParameter | None:
    return db.get(LocalTechnicalPointParameter, param_id)


def delete_parameter(db: Session, param: LocalTechnicalPointParameter) -> None:
    db.delete(param)
    db.commit()


def add_parameter_value(db: Session, param: LocalTechnicalPointParameter, name: str, text: str) -> LocalTechnicalPointParameterValue:
    value = LocalTechnicalPointParameterValue(parameter_id=param.id, name=name, text=text)
    db.add(value)
    db.commit()
    db.refresh(value)
    return value


def get_parameter_value(db: Session, value_id: str) -> LocalTechnicalPointParameterValue | None:
    return db.get(LocalTechnicalPointParameterValue, value_id)


def delete_parameter_value(db: Session, value: LocalTechnicalPointParameterValue) -> None:
    db.delete(value)
    db.commit()
