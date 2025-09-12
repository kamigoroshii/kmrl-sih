# ...existing code...
import os
import imaplib
import email
import json
import datetime
import sys
import socket
from email.header import decode_header

IMAP_HOST = os.environ.get('IMAP_HOST', 'imap.gmail.com')
IMAP_PORT = int(os.environ.get('IMAP_PORT', '993'))
IMAP_USER = os.environ.get('IMAP_USER')
IMAP_PASS = os.environ.get('IMAP_PASS')
MAILBOX = os.environ.get('IMAP_MAILBOX', 'INBOX')
OUT_FILE = os.path.join(os.path.dirname(__file__), 'alerts.json')
MAX_FETCH = int(os.environ.get('FETCH_MAX', '50'))  # fetch only last N messages

def decode_text(h):
    if not h:
        return ''
    parts = decode_header(h)
    s = ''
    for part, enc in parts:
        try:
            if isinstance(part, bytes):
                s += part.decode(enc or 'utf-8', errors='ignore')
            else:
                s += part
        except Exception:
            s += str(part)
    return s

def get_body(msg):
    try:
        if msg.is_multipart():
            for part in msg.walk():
                ctype = part.get_content_type()
                disp = part.get_content_disposition()
                if ctype == 'text/plain' and (disp is None or disp == 'inline'):
                    return part.get_payload(decode=True).decode(errors='ignore')
            for part in msg.walk():
                if part.get_content_type() == 'text/html':
                    return part.get_payload(decode=True).decode(errors='ignore')
        else:
            return msg.get_payload(decode=True).decode(errors='ignore')
    except Exception:
        return ''
    return ''

def fetch():
    if not (IMAP_USER and IMAP_PASS):
        print('Missing IMAP_USER / IMAP_PASS', file=sys.stderr)
        return

    print(f'Connecting to {IMAP_HOST}:{IMAP_PORT} as {IMAP_USER}')
    try:
        with imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT) as M:
            M.login(IMAP_USER, IMAP_PASS)
            M.select(MAILBOX)
            typ, data = M.search(None, 'UNSEEN')
            if typ != 'OK':
                print('IMAP search failed:', typ, data)
                return
            ids = data[0].split() if data and data[0] else []
            print('Found', len(ids), 'UNSEEN messages')

            if not ids:
                print('No unseen messages found.')
                return

            # take only the last MAX_FETCH ids to avoid long runs
            selected = ids[-MAX_FETCH:]
            alerts = []

            # fetch newest first
            for num in reversed(selected):
                try:
                    typ2, msg_data = M.fetch(num, '(RFC822)')
                    if typ2 != 'OK' or not msg_data or not msg_data[0]:
                        continue
                    raw = msg_data[0][1]
                    msg = email.message_from_bytes(raw)
                    subject = decode_text(msg.get('Subject'))
                    from_ = decode_text(msg.get('From'))
                    date_ = msg.get('Date') or datetime.datetime.utcnow().isoformat()
                    body = get_body(msg) or ''
                    priority = 'High' if '[HIGH]' in (subject or '').upper() else 'General'
                    alerts.append({
                        'id': num.decode() if isinstance(num, bytes) else str(num),
                        'subject': subject,
                        'from': from_,
                        'date': date_,
                        'body': body,
                        'priority': priority
                    })
                    # mark seen so it won't be fetched next time
                    M.store(num, '+FLAGS', '\\Seen')
                except Exception as e:
                    print('Error fetching message', num, e)

            # merge with existing alerts (prepend new)
            existing = []
            if os.path.exists(OUT_FILE):
                try:
                    with open(OUT_FILE, 'r', encoding='utf-8') as f:
                        existing = json.load(f)
                except Exception:
                    existing = []

            # keep newest first, dedupe by id
            combined = alerts + existing
            seen_ids = set()
            deduped = []
            for a in combined:
                if a.get('id') in seen_ids:
                    continue
                seen_ids.add(a.get('id'))
                deduped.append(a)

            deduped = deduped[:200]
            with open(OUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(deduped, f, ensure_ascii=False, indent=2)

            print(f'Fetched {len(alerts)} messages and saved to {OUT_FILE}')
    except socket.gaierror as e:
        print('DNS/connection error:', e, file=sys.stderr)
    except imaplib.IMAP4.error as e:
        print('IMAP error:', e, file=sys.stderr)
    except Exception as e:
        print('Unexpected error:', e, file=sys.stderr)

if __name__ == '__main__':
    fetch()
# ...existing code...