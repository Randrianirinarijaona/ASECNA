class Airport(Base):
    __tablename__ = "airports"

    iata = Column(String(10), primary_key=True)
    name = Column(String(100), nullable=False)
    latitude = Column(DECIMAL(10,6), nullable=False)
    longitude = Column(DECIMAL(10,6), nullable=False)
    is_technical_point = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, onupdate=func.now())