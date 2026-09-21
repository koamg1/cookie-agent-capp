import urllib.request
import re

for chunk in ['30f0049e104dfeb4', 'dda12c75e308c8e1', 'c295c1a9d6f48277', '288e35f838c43643', '9f0a3cacf9055b6a']:
    url = f'https://cookieswap.fun/_next/static/chunks/{chunk}.js?dpl=dpl_5HqLU2L4p6EyLqNVivWXJ1JU7eaK'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        js = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        print(f"=== {chunk} ===")
        # search for inputMint, outputMint, swap, or url params
        params = re.findall(r'(?:inputMint|outputMint|from|to|token|mint)[a-zA-Z0-9_]*', js)
        if params:
            print("  params:", set(params[:10]))
        # search for paths/urls
        urls = re.findall(r'https?://[a-zA-Z0-9./?=_-]+', js)
        if urls:
            print("  urls:", set(urls[:5]))
    except Exception as e:
        print(f"Error {chunk}:", e)
