from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "mysql+pymysql://root:password@localhost/monprojet"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine)