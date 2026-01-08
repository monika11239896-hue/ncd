install dependencies
pip install -r requirements.txt


cd ncd_tool/backend
uvicorn app.main:app --reload


run Sql commands:
cd ncd_tool/backend
sqlite3 ncd.db
.tables              -- list tables

.schema ecu_t        -- see table structure


SELECT * FROM ecu_t;
SELECT * FROM channel_t;
.quit

