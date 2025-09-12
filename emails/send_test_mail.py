# ...existing code...
from email_utils import send_alert_email
import os

to = os.environ.get('TEST_TO') or 'your.account@gmail.com'
send_alert_email(to, 'TEST ALERT [HIGH]', 'This is a test alert generated for UI testing.', '<b>This is a test</b>')
print('sent')
# ...existing code...