import os
from jose import jwt
from dotenv import load_dotenv

load_dotenv()
secret = os.getenv("SUPABASE_JWT_SECRET", "f308724d-1bc6-4355-9a66-39de6e9a4f1b")
print("Secret:", secret)

token = jwt.encode({'sub': "123"}, secret, algorithm='HS256')
try:
    decoded = jwt.decode(token, secret, algorithms=["HS256"])
    print("Success:", decoded)
except Exception as e:
    print("Decode failed:", type(e), e)
