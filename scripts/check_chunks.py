import urllib.request
import re

req = urllib.request.Request('https://cookieswap.fun', headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
scripts = re.findall(r'src=["\'](/_next/static/chunks/[^"\']+)["\']', html)
print("Scripts:", scripts)

for s in scripts:
    s_url = 'https://cookieswap.fun' + s
    try:
        s_req = urllib.request.Request(s_url, headers={'User-Agent': 'Mozilla/5.0'})
        js = urllib.request.urlopen(s_req).read().decode('utf-8')
        # find routes or tokens
        routes = re.findall(r'/(?:swap|pool|trade|liquidity|tokens)[a-zA-Z0-9_\-/]*', js)
        if routes:
            print(f"Routes in {s}:", set(routes))
        tokens = re.findall(r'[1-9A-HJ-NP-Za-km-z]{32,44}', js)
        if tokens:
            print(f"Token addresses found in {s}:", len(tokens))
    except Exception as e:
        print(f"Error reading {s}:", e)
