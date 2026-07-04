import os
import urllib.request
import urllib.parse
import json
from dotenv import load_dotenv

# Muat file .env dari folder root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

def send_telegram_message(message: str) -> bool:
    """
    Mengirim pesan notifikasi ke Telegram menggunakan Bot API secara sinkron tanpa library eksternal.
    """
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    
    if not bot_token or not chat_id:
        print("[Telegram Alert] Token atau Chat ID tidak disetel di env. Notifikasi dilewati.")
        return False
        
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }
    
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url, 
            data=data, 
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode())
            if res_data.get("ok"):
                print("[Telegram Alert] Berhasil mengirim notifikasi ke Telegram.")
                return True
            else:
                print(f"[Telegram Alert] Gagal mengirim: {res_data}")
                return False
    except Exception as e:
        print(f"[Telegram Alert] Terjadi kesalahan: {e}")
        return False
