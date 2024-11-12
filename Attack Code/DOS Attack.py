import requests
import threading

def send_request():
    try:
        response = requests.get("http://localhost:3000")
        print(f"Status: {response.status_code}, Response Time: {response.elapsed.total_seconds()}s")
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")

threads = []
for _ in range(100000000): 
    thread = threading.Thread(target=send_request)
    threads.append(thread)
    thread.start()

for thread in threads:
    thread.join()