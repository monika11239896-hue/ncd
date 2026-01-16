from dataclasses import dataclass
import typing
from sqlalchemy import Column, Integer, String, Float, Boolean,CheckConstraint, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import pytz
from pydantic import BaseModel
from typing import List
from sqlalchemy import Table
import json

IST = pytz.timezone("Asia/Kolkata")

def ist_now():
    return datetime.now(IST)


class Metadata(Base):
    __tablename__ = "metadata_t"

    id = Column(Integer, primary_key=True)
    fileName = Column(String(50), nullable=False)
    version = Column(String(10))
    author = Column(String(20))
    created_at = Column(DateTime, default=ist_now)

    channels = relationship("Channel", back_populates="metadata_p", cascade="all, delete")


ecu_channel = Table(
    "ecu_channel_t",
    Base.metadata,
    Column("ecu_id", ForeignKey("ecu_t.ecu_id", ondelete="CASCADE"), primary_key=True),
    Column("channel_id", ForeignKey("channel_t.channel_id", ondelete="CASCADE"), primary_key=True),
)
class Channel(Base):
    __tablename__ = "channel_t"

    channel_id = Column(Integer, primary_key=True)
    channel_name = Column(String(50), nullable=False)

    metadata_id = Column(Integer, ForeignKey("metadata_t.id"), nullable=False)

    metadata_p = relationship("Metadata", back_populates="channels")
    ecus = relationship("ECU", secondary=ecu_channel, back_populates="channels")


class ECU(Base):
    __tablename__ = "ecu_t"

    ecu_id = Column(Integer, primary_key=True)
    ecu_name = Column(String(50), unique=True, nullable=False)

    channels = relationship("Channel", secondary=ecu_channel, back_populates="ecus")
    messages = relationship(
        "Message",
        secondary="msg_ecu_channel_t",
        back_populates="ecus",
        overlaps="msg_ecu_channels"
    )

    msg_ecu_channels = relationship(
        "MsgEcuChannel",
        back_populates="ecu",
        cascade="all, delete-orphan",
        passive_deletes=True,
        overlaps="messages"
    )


class Message(Base):
    __tablename__ = "messages_t"

    message_id = Column(Integer, primary_key=True, autoincrement=False)
    name = Column(String(255), nullable=False)
    length = Column(Integer, nullable=False)
    is_extended = Column(Boolean, default=False)
    send_type = Column(String(10))
    cycle_time = Column(Integer)
    comment = Column(Text)
    # channel_id = Column(
    #     Integer,
    #     ForeignKey("channel_t.channel_id", ondelete="CASCADE"),
    #     nullable=False
    # )
    #ecus = relationship("ECU", secondary="msg_ecu_channel_t", back_populates="messages")
    signals = relationship("Signal", back_populates="message", cascade="all, delete")
    #msg_ecu_channels = relationship("MsgEcuChannel", back_populates="message",  passive_deletes=True) 
    ecus = relationship(
        "ECU",
        secondary="msg_ecu_channel_t",
        back_populates="messages",
        overlaps="msg_ecu_channels"
    )

    msg_ecu_channels = relationship(
        "MsgEcuChannel",
        back_populates="message",
        passive_deletes=True,
        overlaps="ecus"
    )

class MsgEcuChannel(Base):
    __tablename__ = "msg_ecu_channel_t"

    message_id = Column(Integer, ForeignKey("messages_t.message_id"), primary_key=True, index=True)
    ecu_id = Column(
                Integer,
                ForeignKey("ecu_t.ecu_id", ondelete="CASCADE"),
                primary_key=True, index=True
    )
    channel_id = Column(Integer, ForeignKey("channel_t.channel_id", ondelete="CASCADE"))
    tx_rx_info = Column(
        Integer,
        CheckConstraint("tx_rx_info IN (0, 1)", name="tx_rx_check"),
        nullable=False
    )
    # ecu = relationship("ECU", back_populates="msg_ecu_channels")
    # message = relationship("Message", back_populates="msg_ecu_channels")
    ecu = relationship(
        "ECU",
        back_populates="msg_ecu_channels",
        overlaps="messages,ecus"
    )

    message = relationship(
        "Message",
        back_populates="msg_ecu_channels",
        overlaps="messages,ecus"
    )

class Signal(Base):
    __tablename__ = "signals_t"

    signal_id = Column(Integer, primary_key=True, index=True)
    sig_name = Column(String(255), nullable=False)
    start_bit = Column(Integer)
    length = Column(Integer)

    is_signed = Column(Boolean, default=False)
    is_float = Column(Boolean, default=False)
    is_multiplexed = Column(Boolean, default=False)
    multiplex_val = Column(String(50))

    endianness = Column(String(20), nullable=False)
    factor = Column(Float, default=1.0)
    offset = Column(Float, default=0.0)
    min_value = Column(Float)
    max_value = Column(Float)

    initial_value = Column(String(50))
    unit = Column(String(64))
    comment = Column(Text)
    value_desc = Column(Text)  # JSON stored as TEXT

    message_id = Column(Integer, ForeignKey("messages_t.message_id"), nullable=False)
    message = relationship("Message", back_populates="signals")


class SignalReceiverECU(Base):
    __tablename__ = "signal_receiverecu_t"

    ecu_id = Column(Integer, ForeignKey("ecu_t.ecu_id", ondelete="CASCADE"), primary_key=True)
    signal_id = Column(Integer, ForeignKey("signals_t.signal_id", ondelete="CASCADE"), primary_key=True)
    message_id = Column(Integer, ForeignKey("messages_t.message_id", ondelete="CASCADE"))

class AttributeValue(Base):
    __tablename__ = "attribute_value_t"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50))

    ecu_id = Column(Integer, ForeignKey("ecu_t.ecu_id", ondelete="CASCADE"), nullable=True)
    message_id = Column(Integer, ForeignKey("messages_t.message_id", ondelete="CASCADE"), nullable=True)
    signal_id = Column(Integer, ForeignKey("signals_t.signal_id", ondelete="CASCADE"), nullable=True)

    int_value = Column(Integer)
    float_value = Column(Float)
    string_value = Column(Text)

    __table_args__ = (
        CheckConstraint(
            "(ecu_id IS NOT NULL) + "
            "(message_id IS NOT NULL) + "
            "(signal_id IS NOT NULL) = 1",
            name="only_one_parent"
        ),
    )

class ECUOut(BaseModel):
    ecu_id: int
    ecu_name: str

    class Config:
        from_attributes = True

class ChannelOut(BaseModel):
    channel_id: int
    channel_name: str
    metadata_id: int
    ecus: List[ECUOut]

    class Config:
        from_attributes = True

@dataclass
class ResponseModel:
    success: bool
    message: str
    data: typing.Any = None
    