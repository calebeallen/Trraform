
import textwrap
import subprocess

LOCAL = True

DB_NAME = "available-plots"
D0_PLOT_COUNT = 16 #34998
INSERT_BATCH_SIZE = 16

def runQuery(query: str):

    with open("q.sql", "w") as file:

        file.write(query)
        file.close()

    command = ["npx", "wrangler", "d1", "execute", DB_NAME]

    if LOCAL:

        command.append("--local")

    command.append("--file=./q.sql")

    try:

        return subprocess.run(command, capture_output=True, text=True, check=True).stdout
    
    except subprocess.CalledProcessError as e:
        
        return e.stderr

runQuery(textwrap.dedent("""
    DROP TABLE IF EXISTS AvailablePlots;
    CREATE TABLE IF NOT EXISTS AvailablePlots (
        id INTEGER PRIMARY KEY,
        available BOOLEAN NOT NULL DEFAULT 1,
        depth INTEGER DEFAULT NULL
    );
    CREATE INDEX idx_available_depth ON AvailablePlots (available, depth);
"""))

print("Table created")

inserts = []
total = 0

def insert():
    
    global inserts
    global total
    runQuery(f"INSERT INTO AvailablePlots (id, depth) VALUES {','.join(inserts)}")
    total += len(inserts)
    print(f"Inserted into table ({total} / {D0_PLOT_COUNT})")
    inserts = []
    
for i in range(1, D0_PLOT_COUNT + 1):

    inserts.append(f"({i},0)")

    if len(inserts) == INSERT_BATCH_SIZE:

        insert()

if inserts:

    insert()

print(runQuery(textwrap.dedent("""
WITH first_set AS (
    SELECT * FROM AvailablePlots WHERE available = 1 AND depth = 0 ORDER BY RANDOM() LIMIT 10
),
second_set AS (
    SELECT * FROM AvailablePlots WHERE available = 1 AND depth = 1 ORDER BY RANDOM() LIMIT 10
)
SELECT * FROM first_set
UNION ALL
SELECT * FROM second_set;
""")))