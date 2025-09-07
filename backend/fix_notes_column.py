#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_engine
from sqlalchemy import text

def main():
    try:
        print("Connecting to database...")
        engine = get_engine()
        with engine.connect() as conn:
            print("Checking if notes column exists...")
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'risks' AND column_name = 'notes'
            """))
            
            if result.fetchone():
                print("Notes column already exists")
            else:
                print("Adding notes column...")
                conn.execute(text("ALTER TABLE risks ADD COLUMN notes TEXT"))
                conn.commit()
                print("Notes column added successfully")
                
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
