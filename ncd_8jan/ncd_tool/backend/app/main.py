from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from . import models
from .database import Base, engine, SessionLocal
from .models import Metadata,ECU, Channel, Message, Signal, MsgEcuChannel, SignalReceiverECU, ChannelOut, ResponseModel
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.exc import SQLAlchemyError
import os
from fastapi import HTTPException, APIRouter

router_v1 = APIRouter(prefix="/api/v1")

# CREATE TABLES (ONLY THIS)
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "../frontend")

# Serve static files (CSS, JS)
app.mount(
    "/assets",
    StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")),
    name="assets"
)

# Homepage
@app.get("/")
def homepage():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/topology.html")
def topology_page():
    return FileResponse(os.path.join(FRONTEND_DIR, "topology.html"))

@app.get("/add-message.html")
def topology_page():
    return FileResponse(os.path.join(FRONTEND_DIR, "add-message.html"))

@app.get("/addSig.html")
def topology_page():
    return FileResponse(os.path.join(FRONTEND_DIR, "addSig.html"))

# Allow frontend JS to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router_v1.post("/metadata")
def create_metadata(data: dict, db: Session = Depends(get_db)):
    success = False
    message = "Failed to create Metadata"
    response_data  = None
    try:
        row = Metadata(
            fileName=data["fileName"],
            version=data.get("version"),
            author=data.get("author")
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        success=True
        message = "Successfully Metadata Created!!"
        response_data = {
            "id": row.id,
            "fileName": row.fileName
        }

    except SQLAlchemyError as e:
        db.rollback()
        message = "Database error occurred"
        data = str(e)

    except Exception as e:
        db.rollback()
        message = "Unexpected error occurred"
        data = str(e)
    finally:
        return ResponseModel(success, message, response_data );

@router_v1.get("/metadata")
def list_metadata(db: Session = Depends(get_db)):

    success = False
    message = "Failed to fetch metadata"
    data = None

    try:
        data = (
            db.query(Metadata)
            .order_by(Metadata.created_at.desc())
            .all()
        )

        success = True
        message = "Metadata fetched successfully"

    except SQLAlchemyError as e:
        message = "Database error occurred"
        data = str(e)

    except Exception as e:
        message = "Unexpected error occurred"
        data = str(e)

    finally:
        return ResponseModel(
            success=success,
            message=message,
            data=data
        ) 

@router_v1.delete("/metadata/{id}", status_code=200)
def delete_metadata(id: int, db: Session = Depends(get_db)):

    success = False
    message = "Failed to delete metadata"
    data = None

    try:
        row = db.query(Metadata).filter(Metadata.id == id).first()

        if not row:
            return ResponseModel(
                success=False,
                message="Metadata not found",
                data={"id": id}
            )
        

        db.delete(row)
        db.commit()

        success = True
        message = "Metadata deleted successfully"
        data = {"id": id}

    except SQLAlchemyError as e:
        db.rollback()
        message = "Database error occurred"
        data = str(e)

    except Exception as e:
        db.rollback()
        message = "Unexpected error occurred"
        data = str(e)

    finally:
        return ResponseModel(
            success=success,
            message=message,
            data=data
        )


@router_v1.get("/metadata/{id}")
def get_metadata(id: int, db: Session = Depends(get_db)):
    try:
        row = db.query(Metadata).filter(Metadata.id == id).first()

        if not row:
            raise HTTPException(status_code=404, detail="Metadata not found")

        data = {
            "id": row.id,
            "fileName": row.fileName,
            "version": row.version,
            "author": row.author,
            "created_at": row.created_at  # make sure this exists
        }

        return ResponseModel(
            True,
            "Successfully got Metadata.",
            data
        )

    except SQLAlchemyError as e:
        db.rollback()
        return ResponseModel(False, "Database error occurred", str(e))

    except Exception as e:
        return ResponseModel(False, "Unexpected error occurred", str(e))
    

@router_v1.post("/channels")
def create_channel(data: dict, db: Session = Depends(get_db)):

    success = False
    message = "Failed to create Can Channel"
    response_data  = None
    try:
        name = data.get("channel_name")
        metadata_id = data.get("metadata_id")
        ecu_ids = data.get("ecu_ids", [])

        if not name or not metadata_id:
            raise HTTPException(status_code=400, detail="Invalid data")

        channel = Channel(
            channel_name=name,
            metadata_id=metadata_id
        )

        if ecu_ids:
            ecus = db.query(ECU).filter(ECU.ecu_id.in_(ecu_ids)).all()
            channel.ecus = ecus

        db.add(channel)
        db.commit()
        db.refresh(channel)

        success = True
        message = "Successfully Can channel Created!"

    except SQLAlchemyError as e:
        db.rollback()
        message = "Database error occurred"
        response_data  = str(e)

    except Exception as e:
        db.rollback()
        message = "Unexpected error occurred"
        response_data  = str(e)
    finally:
        return ResponseModel(success, message, response_data )

@router_v1.get("/channels")
def list_channels(db: Session = Depends(get_db)):
    success = False
    message = "Failed to List Channels"
    data = None
    try:
        data = (
            db.query(Channel)
            .options(joinedload(Channel.ecus))
            .all()
        )
        success = True
        message = "Successfully get List of Channel"
    except SQLAlchemyError as e:
        db.rollback()
        message = "Database error occurred"
        data = str(e)

    except Exception as e:
        db.rollback()
        message = "Unexpected error occurred"
        data = str(e)
    finally:
        return  ResponseModel(success, message, data)


@router_v1.post("/ecus")
def create_ecu(data: dict, db: Session = Depends(get_db)):

    name = data.get("ecu_name")
    if not name:
        raise HTTPException(status_code=400, detail="ECU name required")

    exists = db.query(ECU).filter(ECU.ecu_name == name).first()
    if exists:
        raise HTTPException(status_code=409, detail="ECU already exists")

    try:
        ecu = ECU(ecu_name=name)
        db.add(ecu)
        db.commit()
        db.refresh(ecu)

        return ResponseModel(
            True,
            "ECU created successfully",
            {
                "ecu_id": ecu.ecu_id,
                "ecu_name": ecu.ecu_name
            }
        )

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")


@router_v1.get("/ecus")
def list_ecus(db: Session = Depends(get_db)):
    success = False
    message = "Failed to List ECUs"
    data = None
    try:
        data =  db.query(ECU).order_by(ECU.ecu_name).all()
        success = True
        message = "Successfully get the ECU List"
    except SQLAlchemyError as e:
        db.rollback()
        message = "Database error occurred"
        data = str(e)

    except Exception as e:
        db.rollback()
        message = "Unexpected error occurred"
        data = str(e)
    finally:
        return  ResponseModel(success, message, data)



@router_v1.post("/messages")
def create_message(data: dict, db: Session = Depends(get_db)):

    success = False
    message = "Failed to create message"
    response_data = None

    try:
        if not data.get("name") or not data.get("channel_id"):
            raise HTTPException(400, "Invalid data")

        msg = Message(
            name=data["name"],
            length=data["length"],
            is_extended=data.get("is_extended", False),
            send_type=data.get("send_type"),
            cycle_time=data.get("cycle_time"),
            comment=data.get("comment"),
            channel_id=data["channel_id"]
        )

        db.add(msg)
        db.commit()
        db.refresh(msg)
        success = True
        message = "Message created successfully"

        response_data = {
            "message_id": msg.message_id,
            "name": msg.name,
            "channel_id":msg.channel_id
        }

    except SQLAlchemyError as e:
        db.rollback()
        message = "Database error occurred"
        response_data = str(e)

    except Exception as e:
        db.rollback()
        message = "Unexpected error occurred"
        response_data = str(e)
    finally:
        return ResponseModel(success, message, response_data)



@router_v1.get("/messages")
def list_messages(db: Session = Depends(get_db)):

    success = False
    message = "Failed"
    data = None

    try:
        data = (
            db.query(Message)
            .all()
        )

        success = True
        message = "Data received successfully"

    except SQLAlchemyError as e:
        message = "Database error occurred"
        data = str(e)

    except Exception as e:
        message = "Data not received successfully"
        data = str(e)

    finally:
        return ResponseModel(success, message, data)


@router_v1.post("/signals")
def create_signals(payload: dict, db: Session = Depends(get_db)):
    
    success = False
    message = "Failed"
    response_data = None

    try:
        message_id = payload.get("message_id")
        signals = payload.get("signals", [])

        if not message_id or not signals:
            raise HTTPException(400, "message_id and signals required")

        for s in signals:
            if "sig_name" not in s or "endianness" not in s:
                raise HTTPException(400, "sig_name and endianness required")

            sig = Signal(
                sig_name=s["sig_name"],
                start_bit=s.get("start_bit"),
                length=s.get("length"),
                is_signed=s.get("is_signed", False),
                is_float=s.get("is_float", False),
                is_multiplexed=s.get("is_multiplexed"),
                multiplex_val=s.get("multiplex_val"),
                endianness=s["endianness"],
                factor=s.get("factor", 1.0),
                offset=s.get("offset", 0.0),
                min_value=s.get("min_value"),
                max_value=s.get("max_value"),
                initial_value=s.get("initial_value"),
                unit=s.get("unit"),
                comment=s.get("comment"),
                value_desc=s.get("value_desc"),
                message_id=message_id
            )

            db.add(sig)

        db.commit()
        success=True
        message = "Signals created successfully"

        return ResponseModel(success, message, None)

    except Exception as e:
        return ResponseModel(success, message, str(e))


@router_v1.post("/signals/{signal_id}/receivers")
def assign_signal_receivers(
    signal_id: int,
    data: dict,
    db: Session = Depends(get_db)
):
    success = False
    message = "Failed to assign signal receivers"
    response_data = None

    try:
        ecu_ids = data.get("ecu_ids", [])
        message_id = data.get("message_id")

        # 🔹 Validation
        if not ecu_ids or not message_id:
            return ResponseModel(
                success=False,
                message="Invalid data: ecu_ids and message_id are required",
                data=None
            )

        # 🔹 Create mappings
        for ecu_id in ecu_ids:
            mapping = SignalReceiverECU(
                ecu_id=ecu_id,
                signal_id=signal_id,
                message_id=message_id
            )
            db.add(mapping)

        db.commit()

        success = True
        message = "Signal receivers assigned successfully"
        response_data = {
            "signal_id": signal_id,
            "message_id": message_id,
            "ecu_ids": ecu_ids
        }

    except SQLAlchemyError as e:
        db.rollback()
        message = "Database error occurred"
        response_data = str(e)

    except Exception as e:
        db.rollback()
        message = "Unexpected error occurred"
        response_data = str(e)

    finally:
        return ResponseModel(
            success=success,
            message=message,
            data=response_data
        )

@router_v1.get("/metadata/{metadata_id}/channels")
def list_channels_for_metadata(metadata_id: int, db: Session = Depends(get_db)):
    success = False
    message = "Failed"
    data = None
    try:
        data =  (
            db.query(Channel)
            .filter(Channel.metadata_id == metadata_id)
            .all()
        )
        success = True
        message = "Successfully channel Listed"

    except SQLAlchemyError as e:
        message = "Database error occurred"
        data = str(e)

    except Exception as e:
        message = "Data not received successfully"
        data = str(e)

    finally:
        return ResponseModel(success, message, data)


@router_v1.delete("/channels/{channel_id}", status_code=200)
def delete_channel(channel_id: int, db: Session = Depends(get_db)):
    
    success = False
    data = None
    message = "Failed"
    try:

        channel = db.query(Channel).filter(
            Channel.channel_id == channel_id
        ).first()

        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")

        db.delete(channel)
        db.commit()

        data = channel
        success = True
        message = "Successfully channel Listed"

    except SQLAlchemyError as e:
        message = "Database error occurred"
        data = str(e)

    except Exception as e:
        message = "Data not received successfully"
        data = str(e)

    finally:
        return ResponseModel(success, message, data)
    
@router_v1.delete("/ecus/{ecu_id}", status_code=200)
def delete_ecu(ecu_id: int, db: Session = Depends(get_db)):
    try:
        ecu = db.query(ECU).filter(ECU.ecu_id == ecu_id).first()

        if not ecu:
            raise HTTPException(status_code=404, detail="ECU not found")

        # save minimal data before delete
        deleted_ecu_id = ecu.ecu_id
        deleted_ecu_name = ecu.ecu_name

        db.delete(ecu)
        db.commit()

        return ResponseModel(
            success=True,
            message="ECU deleted successfully",
            data={
                "ecu_id": deleted_ecu_id,
                "ecu_name": deleted_ecu_name
            }
        )

    except HTTPException:
        raise

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))    


@router_v1.post("/messages-with-signals")
def create_messages(payload: dict, db: Session = Depends(get_db)):

    try:
        messages = payload.get("messages", [])

        if not messages:
            raise HTTPException(400, "No messages provided")

        for msg_data in messages:

            # 1 Message
            msg = Message(
                name=msg_data["name"],
                length=msg_data["length"],
                is_extended=msg_data.get("isExtended", False),
                comment=msg_data.get("comment")
            )
            db.add(msg)
            db.flush()  # get message_id

            # 2️ TX mapping (sender ECU)
            tx_map = MsgEcuChannel(
                message_id=msg.message_id,
                ecu_id=int(msg_data["sender"]),
                channel_id=int(msg_data["canChannel"]),
                tx_rx_info=1  # TX
            )
            db.add(tx_map)

            # 3️ Signals
            for sig in msg_data.get("signals", []):

                signal = Signal(
                    sig_name=sig["sig_name"],
                    start_bit=sig.get("start_bit"),
                    length=sig.get("length"),
                    is_signed=sig.get("is_signed", False),
                    is_float=sig.get("is_float", False),
                    is_multiplexed=sig.get("is_multiplexed"),
                    multiplex_val=sig.get("multiplex_val"),
                    endianness=sig["endianness"],
                    factor=sig.get("factor", 1),
                    offset=sig.get("offset", 0),
                    min_value=sig.get("min_value"),
                    max_value=sig.get("max_value"),
                    initial_value=sig.get("initial_value"),
                    unit=sig.get("unit"),
                    comment=sig.get("comment"),
                    message_id=msg.message_id
                )
                db.add(signal)
                db.flush()  # get signal_id

                # 4️ Receiver ECU
                if sig.get("receiver_ecu"):
                    recv = SignalReceiverECU(
                        ecu_id=int(sig["receiver_ecu"]),
                        signal_id=signal.signal_id,
                        message_id=msg.message_id
                    )
                    db.add(recv)

        db.commit()
        return {"success": True, "message": "Messages saved successfully"}

    except Exception as e:
        db.rollback()
        return {"success": False, "message": "Database error", "data": str(e)}
    

@router_v1.get("/ecu_topology")
def get_topology(db: Session = Depends(get_db)):

    ecus = (
        db.query(ECU)
        .options(
            joinedload(ECU.msg_ecu_channels)
            .joinedload(MsgEcuChannel.message)
            .joinedload(Message.signals)
        )
        .all()
    )

    result = []

    for ecu in ecus:
        ecu_obj = {
            "ecu": ecu.ecu_name,
            "messages": []
        }

        for link in ecu.msg_ecu_channels:
            msg = link.message

            ecu_obj["messages"].append({
                "name": msg.name,
                "signals": [sig.sig_name for sig in msg.signals]
            })

        result.append(ecu_obj)

    return {
        "success": True,
        "data": result
    }


app.include_router(router_v1)


