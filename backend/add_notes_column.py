#!/usr/bin/env python3
"""
Script to manually add the notes column to the risks table
"""

from app.database import engine
from sqlalchemy import text

def add_notes_column():
    try:
        with engine.connect() as conn:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'risks' AND column_name = 'notes'
            """))
            
            if result.fetchone():
                print("Notes column already exists")
                return
            
            # Add the column
            conn.execute(text("ALTER TABLE risks ADD COLUMN notes TEXT"))
            conn.commit()
            print("Notes column added successfully")
            
    except Exception as e:
        print(f"Error adding notes column: {e}")

if __name__ == "__main__":
    add_notes_column()
