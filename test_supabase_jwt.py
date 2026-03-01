import requests
import os
from pprint import pprint
from dotenv import load_dotenv
from jose import jwt

load_dotenv()
jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

# the user's dashboard is failing because Supabase uses HS256 by default but 
# the header says "alg": "HS256". 
print(f"Secret: {jwt_secret}")

