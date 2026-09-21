import urllib.request
import re
import json

def analyze_cookieswap():
    req = urllib.request.Request('https://cookieswap.fun', headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        title = re.findall(r'<title>(.*?)</title>', html)
        print("CookieSwap Title:", title)
        links = re.findall(r'href=["\']([^"\']+)["\']', html)
        print("CookieSwap Links:", links)
    except Exception as e:
        print("CookieSwap error:", e)

def analyze_cookoven():
    req = urllib.request.Request('https://cookoven.xyz', headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        print("Cookoven HTML length:", len(html))
    except Exception as e:
        print("Cookoven error:", e)

if __name__ == "__main__":
    analyze_cookieswap()
    analyze_cookoven()
