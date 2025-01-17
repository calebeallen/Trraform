
import textwrap
import subprocess

LOCAL = False

DB_NAME = "available-plots"
D0_PLOT_COUNT = 10 #34998
INSERT_BATCH_SIZE = 10

def runQuery(query: str):

    with open("q.sql", "w") as file:

        file.write(query)
        file.close()

    command = ["npx", "wrangler", "d1", "execute", DB_NAME, "--local" if LOCAL else "--remote", "--file=./q.sql"]

    try:

        return subprocess.run(command, capture_output=True, text=True, check=True).stdout
    
    except subprocess.CalledProcessError as e:
        
        return e.stderr

runQuery(textwrap.dedent("""
    DROP TABLE IF EXISTS AvailablePlots;
    CREATE TABLE IF NOT EXISTS AvailablePlots (
        plotId INTEGER PRIMARY KEY,
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
    runQuery(f"INSERT INTO AvailablePlots (plotId, depth) VALUES {', '.join(inserts)};")
    total += len(inserts)
    print(f"Inserted into table ({total} / {D0_PLOT_COUNT})")
    inserts = []
    
for i in range(1, D0_PLOT_COUNT + 1):

    inserts.append(f"({i},0)")

    if len(inserts) == INSERT_BATCH_SIZE:

        insert()

if inserts:

    insert()
