# ...existing code...
import smtplib, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465'))
SMTP_USER = os.environ.get('SMTP_USER')  # usually same as IMAP_USER
SMTP_PASS = os.environ.get('SMTP_PASS')

def send_alert_email(to_email, subject, body, html=None):
    if not (SMTP_USER and SMTP_PASS):
        raise RuntimeError('SMTP_USER / SMTP_PASS not set')
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = SMTP_USER
    msg['To'] = to_email
    part1 = MIMEText(body, 'plain', 'utf-8')
    msg.attach(part1)
    if html:
        msg.attach(MIMEText(html, 'html', 'utf-8'))

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [to_email], msg.as_string())
# ...existing code...