import requests
from bs4 import BeautifulSoup
import os
from urllib.parse import urljoin, urlparse
from collections import deque
from fpdf import FPDF

START_URL = "https://arrowsight.com/"
DOMAIN = urlparse(START_URL).netloc
MAX_PAGES = 50

visited = set()
to_visit = deque([START_URL])
all_text = []

headers = {"User-Agent": "Mozilla/5.0"}

while to_visit and len(visited) < MAX_PAGES:
    url = to_visit.popleft()
    if url in visited:
        continue
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            continue
        soup = BeautifulSoup(response.content, "html.parser")
        # Extract visible text
        texts = soup.stripped_strings
        page_text = f"URL: {url}\n" + "\n".join(texts)
        all_text.append(page_text)
        visited.add(url)
        # Find new internal links
        for link in soup.find_all("a", href=True):
            href = link.get("href")
            if not isinstance(href, str):
                continue
            abs_url = urljoin(url, href)
            parsed = urlparse(abs_url)
            if parsed.netloc == DOMAIN and abs_url not in visited and abs_url not in to_visit:
                if parsed.scheme in ("http", "https"):
                    to_visit.append(abs_url)
    except Exception as e:
        continue  # Skip pages that cause errors

# Save all text to a .txt file
with open("arrowsight_content.txt", "w", encoding="utf-8") as f:
    f.write("\n\n".join(all_text))

# Step 3: Create PDF from text
pdf = FPDF()
pdf.add_page()
pdf.set_auto_page_break(auto=True, margin=15)

font_path = "tools/DejaVuSans.ttf"
try:
    if os.path.exists(font_path):
        pdf.add_font("DejaVu", "", font_path, uni=True)
        pdf.set_font("DejaVu", size=12)
        use_unicode = True
    else:
        raise FileNotFoundError
except Exception:
    pdf.set_font("Arial", size=12)
    use_unicode = False

with open("arrowsight_content.txt", "r", encoding="utf-8") as file:
    lines = file.readlines()
    for line in lines:
        if not use_unicode:
            line = line.encode("latin-1", "replace").decode("latin-1")
        pdf.multi_cell(0, 10, line)

pdf.output("arrowsight_data.pdf")
