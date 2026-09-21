import urllib.request
import re

for chunk in ['30f0049e104dfeb4', 'dda12c75e308c8e1', 'c295c1a9d6f48277', '288e35f838c43643', '9f0a3cacf9055b6a', 'fa9e19574f03dec3', '507fb2a7804a9460']:
    url = f'https://cookieswap.fun/_next/static/chunks/{chunk}.js?dpl=dpl_5HqLU2L4p6EyLqNVivWXJ1JU7eaK'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        js = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        # check for searchParams.get or getQuery or query
        matches = re.findall(r'(\w+)\.get\([\'"]([^\'"]+)[\'"]\)', js)
        if matches:
            print(f"=== {chunk} get() calls ===")
            for m in matches:
                if any(k in m[1].lower() for k in ['mint', 'token', 'input', 'output', 'address', 'pair', 'pool', 'tab', 'swap']):
                    print("  found query/param:", m)
    except Exception as e:
        print(f"Error {chunk}:", e)
