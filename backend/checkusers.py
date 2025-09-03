from app.database import get_db
from app.models.user import User

def check_users():
    db = next(get_db())
    users = db.query(User).all()
    for user in users:
        print(f'ID: {user.id}, Email: {user.email}, Plain Password: {user.plain_password}')
    db.close()

if __name__ == "__main__":
    check_users()